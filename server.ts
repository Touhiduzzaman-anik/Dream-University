import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { and, desc, eq, ne, or } from 'drizzle-orm';
import { db } from './src/db/index.ts';
import {
  admissionRules,
  auditLogs,
  circulars,
  helpSettings,
  institutionRankings,
  institutions,
  otpVerifications,
  studentProfiles,
  users,
} from './src/db/schema.ts';
import { adminAuth } from './src/lib/firebase-admin.ts';
import {
  type AuthRequest,
  extractBearerToken,
  requireAdmin,
  requireAuth,
  requireRoles,
  resolveTokenToUser,
} from './src/middleware/auth.ts';
import { hashPassword, signSessionToken, verifyPassword } from './src/server/authCrypto.ts';
import {
  canModifyTargetAdmin,
  formatAdminAttribution,
  isValidInvitedAdminRole,
  normalizeAdminRole,
} from './src/server/adminRbac.ts';
import {
  deliverFourDigitOtp,
  generateFourDigitOtp,
  hashOtpCode,
  verifyOtpHash,
  type OtpPurpose,
} from './src/server/otpDelivery.ts';
import {
  extractAdmissionRulesFromCircular,
  generateGroundedRecommendations,
} from './src/server/geminiService.ts';
import { buildCircularPdfBase64 } from './src/server/pdfGenerator.ts';
import { ensureSeeded } from './src/server/seedData.ts';
import { buildMergedInstitutionRankings } from './src/data/universityRankings.ts';
import type { AdminRole } from './src/types/domain.ts';
import {
  type AcademicGroup,
  evaluateDeterministicEligibility,
  type RulePublicationStatus,
  type StudentAcademicInput,
} from './src/utils/eligibilityEngine.ts';
import { calculateDgmeMedicalGpaScore } from './src/utils/medicalScoring.ts';
import {
  isValidBangladeshPhone,
  isValidEmail,
  isValidFourDigitOtp,
  isValidGpa,
  isValidPassword,
  isValidZeroToFiveGpa,
  parseAndValidateAuthIdentifier,
} from './src/utils/validation.ts';
import { validateAvatarDataUrl } from './src/utils/avatarValidation.ts';
import { normalizeBoardName } from './src/data/bangladeshEducation.ts';
import {
  DEFAULT_HELP_SETTINGS,
  normalizeHelpSettingsRecord,
  sanitizeHelpSettingsPayload,
} from './src/utils/helpSettings.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function writeAuditLog(params: {
  actorUserId: number;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string | number;
  details?: Record<string, unknown>;
}) {
  await db.insert(auditLogs).values({
    actorUserId: params.actorUserId,
    actorEmail: params.actorEmail,
    actorRole: params.actorRole,
    action: params.action,
    entityType: params.entityType,
    entityId: String(params.entityId),
    details: params.details ?? {},
  });
}

function setSessionCookie(req: express.Request, res: express.Response, token: string) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] ?? '');
  const isHttps = req.secure || forwardedProto.includes('https');
  res.cookie('du_session', token, {
    httpOnly: true,
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function serializeAuthUser(userRow: {
  id: number;
  uid: string;
  email: string | null;
  fullName: string;
  phone: string | null;
  avatarUrl?: string | null;
  accountType: string;
  adminRole: string | null;
}) {
  return {
    id: userRow.id,
    uid: userRow.uid,
    email: userRow.email ?? null,
    fullName: userRow.fullName,
    phone: userRow.phone,
    avatarUrl: userRow.avatarUrl ?? null,
    accountType: userRow.accountType as 'student' | 'admin',
    adminRole: (userRow.adminRole as AdminRole | null) ?? null,
  };
}

async function findUserByAuthIdentifier(
  identifier: string,
  identifierType: 'email' | 'phone'
) {
  if (identifierType === 'email') {
    const rows = await db.select().from(users).where(eq(users.email, identifier)).limit(1);
    return rows[0] ?? null;
  }
  const rows = await db
    .select()
    .from(users)
    .where(or(eq(users.phone, identifier), eq(users.phone, `+88${identifier}`)))
    .limit(1);
  return rows[0] ?? null;
}

export function createApp(): express.Express {
  const app = express();

  app.use(express.json({ limit: '20mb' }));

  // Ensure initial seed runs lazily once on first API request (no eager startup DB probe)
  app.use('/api', async (_req, res, next) => {
    try {
      await ensureSeeded();
      next();
    } catch (error) {
      console.error('Database initialization error:', error);
      res.status(503).type('application/json').json({ error: 'Database service temporarily unavailable.' });
    }
  });

  // ---------------------------------------------------------------------------
  // 1. Authentication Routes (Student & Admin separated)
  // ---------------------------------------------------------------------------
  app.post('/api/auth/request-otp', async (req, res) => {
    try {
      const purpose = String(req.body?.purpose ?? '').trim() as OtpPurpose;
      if (!['register', 'reset_password'].includes(purpose)) {
        return res.status(400).json({
          error: '4-digit OTP verification is only used for new registration and password reset.',
        });
      }

      const parsed = parseAndValidateAuthIdentifier(String(req.body?.identifier ?? ''));
      if (parsed.ok === false) {
        return res.status(400).json({ error: parsed.error });
      }

      const existingUser = await findUserByAuthIdentifier(
        parsed.identifier,
        parsed.identifierType
      );

      let pendingFullName: string | null = null;
      let pendingPasswordHash: string | null = null;

      if (purpose === 'register') {
        const fullName = String(req.body?.fullName ?? '').trim();
        const password = String(req.body?.password ?? '');
        if (fullName.length < 2) {
          return res.status(400).json({ error: 'Full name must be at least 2 characters.' });
        }
        if (!isValidPassword(password)) {
          return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
        }
        if (existingUser) {
          return res.status(409).json({
            error:
              parsed.identifierType === 'email'
                ? 'An account with this email already exists.'
                : 'An account with this Bangladeshi mobile number already exists.',
          });
        }
        pendingFullName = fullName;
        pendingPasswordHash = hashPassword(password);
      } else {
        if (!existingUser || existingUser.accountType !== 'student') {
          return res.status(404).json({
            error: 'No student account found for this email or Bangladeshi mobile number.',
          });
        }
        if (!existingUser.isActive) {
          return res.status(403).json({ error: 'This account has been deactivated.' });
        }
      }

      // Expire prior active challenges for this identifier & purpose
      await db
        .update(otpVerifications)
        .set({ used: true })
        .where(
          and(
            eq(otpVerifications.identifier, parsed.identifier),
            eq(otpVerifications.purpose, purpose),
            eq(otpVerifications.used, false)
          )
        );

      const otp = generateFourDigitOtp();
      const otpHash = hashOtpCode(otp, parsed.identifier, purpose);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      const [challenge] = await db
        .insert(otpVerifications)
        .values({
          identifier: parsed.identifier,
          identifierType: parsed.identifierType,
          purpose,
          otpHash,
          pendingFullName,
          pendingPasswordHash,
          expiresAt,
          verified: false,
          used: false,
          attempts: 0,
        })
        .returning();

      let delivery;
      try {
        delivery = await deliverFourDigitOtp({
          identifier: parsed.identifier,
          identifierType: parsed.identifierType,
          otp,
          purpose,
        });
      } catch (deliveryError) {
        await db
          .update(otpVerifications)
          .set({ used: true })
          .where(eq(otpVerifications.id, challenge.id));
        console.error('OTP delivery error:', deliveryError);
        return res.status(502).json({
          error:
            parsed.identifierType === 'email'
              ? 'Unable to deliver verification code to your email inbox. Please try again.'
              : 'Unable to deliver verification SMS right now. Please try again.',
        });
      }

      res.json({
        challengeId: challenge.id,
        identifier: parsed.identifier,
        identifierType: parsed.identifierType,
        purpose,
        maskedDestination: parsed.maskedDestination,
        expiresInSeconds: 300,
        resendCooldownSeconds: 60,
        sentVia: delivery.sentVia,
        demoOtp: delivery.demoOtp,
        deliveryChannel: delivery.deliveryChannel,
      });
    } catch (error) {
      console.error('Request OTP error:', error);
      res.status(500).json({ error: 'Unable to send 4-digit verification OTP.' });
    }
  });

  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const challengeId = Number(req.body?.challengeId);
      const purpose = String(req.body?.purpose ?? '').trim() as OtpPurpose;
      const otp = String(req.body?.otp ?? '').trim();
      const parsed = parseAndValidateAuthIdentifier(String(req.body?.identifier ?? ''));

      if (
        !Number.isInteger(challengeId) ||
        challengeId <= 0 ||
        !['register', 'reset_password'].includes(purpose) ||
        parsed.ok === false ||
        !isValidFourDigitOtp(otp)
      ) {
        return res.status(400).json({ error: 'Please enter a valid 4-digit OTP code.' });
      }

      const rows = await db
        .select()
        .from(otpVerifications)
        .where(
          and(
            eq(otpVerifications.id, challengeId),
            eq(otpVerifications.identifier, parsed.identifier),
            eq(otpVerifications.purpose, purpose)
          )
        )
        .limit(1);

      const challenge = rows[0];
      if (!challenge || challenge.used) {
        return res.status(400).json({ error: 'OTP session is invalid or already used. Request a new code.' });
      }
      if (challenge.expiresAt.getTime() < Date.now()) {
        await db.update(otpVerifications).set({ used: true }).where(eq(otpVerifications.id, challenge.id));
        return res.status(400).json({ error: 'This 4-digit OTP has expired. Please request a new code.' });
      }
      if (challenge.attempts >= 5) {
        await db.update(otpVerifications).set({ used: true }).where(eq(otpVerifications.id, challenge.id));
        return res.status(429).json({ error: 'Too many invalid OTP attempts. Please request a new code.' });
      }

      const validOtp = verifyOtpHash(otp, parsed.identifier, purpose, challenge.otpHash);
      if (!validOtp) {
        const nextAttempts = challenge.attempts + 1;
        await db
          .update(otpVerifications)
          .set({ attempts: nextAttempts, used: nextAttempts >= 5 })
          .where(eq(otpVerifications.id, challenge.id));
        return res.status(400).json({
          error:
            nextAttempts >= 5
              ? 'Too many incorrect attempts. Please request a new 4-digit OTP.'
              : `Incorrect 4-digit OTP. ${5 - nextAttempts} attempts remaining.`,
        });
      }

      if (purpose === 'reset_password') {
        await db
          .update(otpVerifications)
          .set({ verified: true })
          .where(eq(otpVerifications.id, challenge.id));
        return res.json({
          ok: true,
          verified: true,
          challengeId: challenge.id,
        });
      }

      await db
        .update(otpVerifications)
        .set({ verified: true, used: true })
        .where(eq(otpVerifications.id, challenge.id));

      // purpose === 'register'
      const existing = await findUserByAuthIdentifier(parsed.identifier, parsed.identifierType);
      if (existing) {
        return res.status(409).json({ error: 'An account already exists for this email or mobile number.' });
      }
      if (!challenge.pendingFullName || !challenge.pendingPasswordHash) {
        return res.status(400).json({ error: 'Registration details missing. Please register again.' });
      }

      const uid = `local-${crypto.randomUUID()}`;
      const [created] = await db
        .insert(users)
        .values({
          uid,
          email: parsed.identifierType === 'email' ? parsed.identifier : null,
          phone: parsed.identifierType === 'phone' ? parsed.identifier : null,
          fullName: challenge.pendingFullName,
          passwordHash: challenge.pendingPasswordHash,
          accountType: 'student',
          adminRole: null,
          isActive: true,
        })
        .returning();

      await db.insert(studentProfiles).values({ userId: created.id }).onConflictDoNothing();

      const token = signSessionToken({
        userId: created.id,
        uid: created.uid,
        email: created.email,
        accountType: 'student',
        adminRole: null,
      });
      setSessionCookie(req, res, token);

      return res.status(201).json({
        token,
        user: serializeAuthUser(created),
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ error: 'Unable to verify 4-digit OTP.' });
    }
  });

  app.post('/api/auth/register', (_req, res) => {
    res.status(403).json({
      error: '4-digit OTP verification via /api/auth/request-otp and /api/auth/verify-otp is required.',
    });
  });

  function timingSafeEqualString(a: string, b: string): boolean {
    const hashA = crypto.createHash('sha256').update(a).digest();
    const hashB = crypto.createHash('sha256').update(b).digest();
    return crypto.timingSafeEqual(hashA, hashB);
  }

  async function tryAuthenticateEnvSuperAdmin(rawIdentifier: string, password: string) {
    const envAdminEmail = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
    const envAdminPassword = process.env.ADMIN_PASSWORD ?? '';
    const envAdminName = (process.env.ADMIN_NAME ?? '').trim() || 'Super Admin (Owner)';

    if (!envAdminEmail || !envAdminPassword || !password) {
      return null;
    }
    const normalizedInput = rawIdentifier.trim().toLowerCase();
    if (!normalizedInput || !timingSafeEqualString(normalizedInput, envAdminEmail)) {
      return null;
    }
    if (!timingSafeEqualString(password, envAdminPassword)) {
      return null;
    }

    const passwordHash = hashPassword(envAdminPassword);

    // Ensure no stale user retains super_admin if ADMIN_EMAIL changed
    await db
      .update(users)
      .set({ adminRole: 'admin', updatedAt: new Date() })
      .where(
        and(
          eq(users.accountType, 'admin'),
          eq(users.adminRole, 'super_admin'),
          ne(users.email, envAdminEmail)
        )
      );

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, envAdminEmail))
      .limit(1);

    if (existing[0]) {
      const [updated] = await db
        .update(users)
        .set({
          fullName: existing[0].fullName || envAdminName,
          passwordHash,
          accountType: 'admin',
          adminRole: 'super_admin',
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing[0].id))
        .returning();
      return updated;
    }

    const ownerUid = `admin-owner-${crypto
      .createHash('sha256')
      .update(envAdminEmail)
      .digest('hex')
      .slice(0, 12)}`;

    const [upserted] = await db
      .insert(users)
      .values({
        uid: ownerUid,
        email: envAdminEmail,
        fullName: envAdminName,
        passwordHash,
        accountType: 'admin',
        adminRole: 'super_admin',
        isActive: true,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          fullName: envAdminName,
          passwordHash,
          accountType: 'admin',
          adminRole: 'super_admin',
          isActive: true,
          updatedAt: new Date(),
        },
      })
      .returning();

    return upserted;
  }

  async function handleAdminPasswordLogin(req: express.Request, res: express.Response) {
    res.type('application/json');
    try {
      const email = String(req.body?.email ?? req.body?.identifier ?? '').trim().toLowerCase();
      const password = String(req.body?.password ?? '');

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const envSuperAdmin = await tryAuthenticateEnvSuperAdmin(email, password);
      if (envSuperAdmin) {
        const token = signSessionToken({
          userId: envSuperAdmin.id,
          uid: envSuperAdmin.uid,
          email: envSuperAdmin.email,
          accountType: 'admin',
          adminRole: 'super_admin',
        });
        setSessionCookie(req, res, token);
        return res.json({
          token,
          user: {
            ...serializeAuthUser(envSuperAdmin),
            accountType: 'admin',
            adminRole: 'super_admin',
          },
        });
      }

      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Valid administrator email and password are required.' });
      }

      const found = await db.select().from(users).where(eq(users.email, email)).limit(1);
      const userRow = found[0];
      if (!userRow || !verifyPassword(password, userRow.passwordHash)) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
      if (!userRow.isActive) {
        return res.status(403).json({ error: 'This account has been deactivated.' });
      }
      const normalizedRole = normalizeAdminRole(userRow.adminRole);
      if (userRow.accountType !== 'admin' || !normalizedRole) {
        return res.status(403).json({ error: 'Access denied: Administrator privileges required.' });
      }

      const token = signSessionToken({
        userId: userRow.id,
        uid: userRow.uid,
        email: userRow.email,
        accountType: 'admin',
        adminRole: normalizedRole,
      });
      setSessionCookie(req, res, token);

      return res.json({
        token,
        user: {
          ...serializeAuthUser(userRow),
          adminRole: normalizedRole,
        },
      });
    } catch (error) {
      console.error('Admin login error:', error);
      return res.status(500).json({ error: 'Authentication failed.' });
    }
  }

  app.post('/api/auth/login', async (req, res) => {
    res.type('application/json');
    try {
      const rawIdentifier = String(req.body?.identifier ?? req.body?.email ?? '').trim();
      const password = String(req.body?.password ?? '');

      if (!rawIdentifier) {
        return res
          .status(400)
          .json({ error: 'Please enter your Email Address or 11-digit Bangladeshi Mobile Number.' });
      }
      if (!password) {
        return res.status(400).json({ error: 'Password is required.' });
      }

      // Direct super_admin authentication via ADMIN_EMAIL / ADMIN_PASSWORD env variables
      const envSuperAdmin = await tryAuthenticateEnvSuperAdmin(rawIdentifier, password);
      if (envSuperAdmin) {
        const token = signSessionToken({
          userId: envSuperAdmin.id,
          uid: envSuperAdmin.uid,
          email: envSuperAdmin.email,
          accountType: 'admin',
          adminRole: 'super_admin',
        });
        setSessionCookie(req, res, token);
        return res.json({
          token,
          user: {
            ...serializeAuthUser(envSuperAdmin),
            accountType: 'admin',
            adminRole: 'super_admin',
          },
        });
      }

      const parsed = parseAndValidateAuthIdentifier(rawIdentifier);
      if (parsed.ok === false) {
        return res.status(400).json({ error: parsed.error });
      }

      const userRow = await findUserByAuthIdentifier(parsed.identifier, parsed.identifierType);
      if (!userRow || !verifyPassword(password, userRow.passwordHash)) {
        return res.status(401).json({
          error: 'Invalid email/mobile number or password.',
        });
      }
      if (!userRow.isActive) {
        return res.status(403).json({ error: 'This account has been deactivated.' });
      }

      if (userRow.accountType === 'admin') {
        const normalizedRole = normalizeAdminRole(userRow.adminRole);
        if (!normalizedRole) {
          return res.status(403).json({ error: 'Access denied: Administrator privileges required.' });
        }
        const token = signSessionToken({
          userId: userRow.id,
          uid: userRow.uid,
          email: userRow.email,
          accountType: 'admin',
          adminRole: normalizedRole,
        });
        setSessionCookie(req, res, token);
        return res.json({
          token,
          user: {
            ...serializeAuthUser(userRow),
            adminRole: normalizedRole,
          },
        });
      }

      const token = signSessionToken({
        userId: userRow.id,
        uid: userRow.uid,
        email: userRow.email,
        accountType: 'student',
        adminRole: null,
      });
      setSessionCookie(req, res, token);

      return res.json({
        token,
        user: serializeAuthUser(userRow),
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Unable to sign in right now.' });
    }
  });
  app.post('/api/auth/admin/login', (req, res) => void handleAdminPasswordLogin(req, res));

  app.post('/api/auth/firebase', async (req, res) => {
    try {
      const token = extractBearerToken(req) || String(req.body?.idToken ?? '');
      const portal = req.body?.portal === 'admin' ? 'admin' : 'student';
      if (!token) {
        return res.status(401).json({ error: 'Missing Firebase ID token.' });
      }

      const decoded = await adminAuth.verifyIdToken(token);
      const email = (decoded.email || '').toLowerCase();
      if (!email) {
        return res.status(400).json({ error: 'Google account email is required.' });
      }

      const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
      let userRow = existing[0];

      if (portal === 'admin') {
        if (!userRow || userRow.accountType !== 'admin' || !userRow.adminRole) {
          return res.status(403).json({
            error: 'No authorized administrator role is provisioned for this Google account.',
          });
        }
      } else if (!userRow) {
        const [inserted] = await db
          .insert(users)
          .values({
            uid: decoded.uid,
            email,
            fullName: decoded.name || email.split('@')[0] || 'Student',
            accountType: 'student',
            adminRole: null,
            isActive: true,
          })
          .onConflictDoUpdate({
            target: users.uid,
            set: { email, updatedAt: new Date() },
          })
          .returning();
        userRow = inserted;
        await db.insert(studentProfiles).values({ userId: userRow.id }).onConflictDoNothing();
      } else if (userRow.accountType === 'admin') {
        return res.status(403).json({ error: 'Administrator accounts must sign in via /admin/login.' });
      }

      if (!userRow.isActive) {
        return res.status(403).json({ error: 'Account is deactivated.' });
      }

      const sessionToken = signSessionToken({
        userId: userRow.id,
        uid: userRow.uid,
        email: userRow.email,
        accountType: userRow.accountType as 'student' | 'admin',
        adminRole: (userRow.adminRole as AdminRole | null) ?? null,
      });
      setSessionCookie(req, res, sessionToken);

      res.json({
        token: sessionToken,
        user: serializeAuthUser(userRow),
      });
    } catch (error) {
      console.error('Firebase auth exchange error:', error);
      res.status(401).json({ error: 'Failed to verify Google authentication token.' });
    }
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    // Backwards-compatible alias forwarding to 4-digit OTP flow
    req.body = { ...(req.body ?? {}), identifier: req.body?.identifier ?? req.body?.email, purpose: 'reset_password' };
    return res.status(400).json({
      error: 'Please use /api/auth/request-otp with purpose "reset_password".',
    });
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const challengeId = Number(req.body?.challengeId);
      const otp = String(req.body?.otp ?? '').trim();
      const newPassword = String(req.body?.newPassword ?? '');
      const confirmPassword = String(req.body?.confirmPassword ?? '');
      const parsed = parseAndValidateAuthIdentifier(String(req.body?.identifier ?? ''));

      if (
        !Number.isInteger(challengeId) ||
        challengeId <= 0 ||
        parsed.ok === false ||
        !isValidFourDigitOtp(otp) ||
        !isValidPassword(newPassword)
      ) {
        return res.status(400).json({ error: 'Invalid verification details or password.' });
      }
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'New password and confirmation password must match.' });
      }

      const rows = await db
        .select()
        .from(otpVerifications)
        .where(
          and(
            eq(otpVerifications.id, challengeId),
            eq(otpVerifications.identifier, parsed.identifier),
            eq(otpVerifications.purpose, 'reset_password')
          )
        )
        .limit(1);

      const challenge = rows[0];
      if (
        !challenge ||
        challenge.used ||
        !challenge.verified ||
        challenge.expiresAt.getTime() < Date.now() ||
        !verifyOtpHash(otp, parsed.identifier, 'reset_password', challenge.otpHash)
      ) {
        return res.status(400).json({
          error: '4-digit OTP verification is invalid or expired. Please request a new OTP.',
        });
      }

      const userRow = await findUserByAuthIdentifier(parsed.identifier, parsed.identifierType);
      if (!userRow || userRow.accountType !== 'student') {
        return res.status(404).json({ error: 'Student account not found.' });
      }

      const passwordHash = hashPassword(newPassword);
      await db
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, userRow.id));
      await db
        .update(otpVerifications)
        .set({ used: true })
        .where(eq(otpVerifications.id, challenge.id));

      res.json({ ok: true, message: 'Password updated successfully. You may now sign in.' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Unable to reset password.' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    const forwardedProto = String(req.headers['x-forwarded-proto'] ?? '');
    const isHttps = req.secure || forwardedProto.includes('https');
    res.clearCookie('du_session', {
      path: '/',
      httpOnly: true,
      sameSite: isHttps ? 'none' : 'lax',
      secure: isHttps,
    });
    res.json({ ok: true });
  });

  app.get('/api/auth/me', async (req, res) => {
    try {
      const token = extractBearerToken(req);
      const authUser = token ? await resolveTokenToUser(token) : null;
      if (!authUser) {
        return res.json({ user: null, profile: null });
      }
      let profile = null;
      if (authUser.accountType === 'student') {
        const profileRows = await db
          .select()
          .from(studentProfiles)
          .where(eq(studentProfiles.userId, authUser.id))
          .limit(1);
        profile = profileRows[0] ?? null;
      }
      res.json({ user: authUser, profile });
    } catch (error) {
      console.error('Auth me error:', error);
      res.json({ user: null, profile: null });
    }
  });

  // ---------------------------------------------------------------------------
  // 2. Public Institutions & Official PDF Viewer Routes
  // ---------------------------------------------------------------------------
  app.get('/api/institutions', async (_req, res) => {
    try {
      const allInsts = await db
        .select()
        .from(institutions)
        .where(eq(institutions.isActive, true))
        .orderBy(institutions.id);

      const allCirculars = await db
        .select({
          id: circulars.id,
          institutionId: circulars.institutionId,
          titleEn: circulars.titleEn,
          titleBn: circulars.titleBn,
          session: circulars.session,
          sourceUrl: circulars.sourceUrl,
          applicationDeadline: circulars.applicationDeadline,
          pdfFilename: circulars.pdfFilename,
          status: circulars.status,
          version: circulars.version,
        })
        .from(circulars)
        .where(eq(circulars.status, 'published'));

      const allRules = await db
        .select()
        .from(admissionRules)
        .where(and(eq(admissionRules.status, 'published'), eq(admissionRules.isVerified, true)));

      const result = allInsts.map((inst) => {
        const instCirculars = allCirculars.filter((c) => c.institutionId === inst.id);
        const instRules = allRules.filter((r) => r.institutionId === inst.id);
        return {
          ...inst,
          publishedCirculars: instCirculars,
          verifiedRules: instRules,
        };
      });

      res.json({ institutions: result });
    } catch (error) {
      console.error('Fetch institutions error:', error);
      res.status(500).json({ error: 'Failed to load institutions.' });
    }
  });

  app.get('/api/help-settings', async (_req, res) => {
    res.type('application/json');
    try {
      const rows = await db.select().from(helpSettings).where(eq(helpSettings.id, 1)).limit(1);
      const settings = rows[0]
        ? normalizeHelpSettingsRecord({
            ...rows[0],
            updatedAt: rows[0].updatedAt?.toISOString(),
          })
        : { ...DEFAULT_HELP_SETTINGS };
      res.json({ settings });
    } catch (error) {
      console.error('Fetch public help settings error:', error);
      res.json({ settings: { ...DEFAULT_HELP_SETTINGS } });
    }
  });

  app.get('/api/rankings', requireAuth, async (_req: AuthRequest, res) => {
    try {
      const [allInsts, customRows] = await Promise.all([
        db
          .select({
            code: institutions.code,
            nameEn: institutions.nameEn,
            nameBn: institutions.nameBn,
            category: institutions.category,
            institutionType: institutions.institutionType,
            institutionTypeBn: institutions.institutionTypeBn,
            establishedYear: institutions.establishedYear,
          })
          .from(institutions)
          .where(eq(institutions.isActive, true)),
        db.select().from(institutionRankings),
      ]);

      const rankings = buildMergedInstitutionRankings(allInsts, customRows);
      res.json({ rankings, total: rankings.length });
    } catch (error) {
      console.error('Fetch rankings error:', error);
      res.status(500).json({ error: 'Failed to load university rankings.' });
    }
  });

  app.get('/api/circulars/:id/pdf', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid circular ID.' });
      }

      const rows = await db.select().from(circulars).where(eq(circulars.id, id)).limit(1);
      const circular = rows[0];
      if (!circular) {
        return res.status(404).json({ error: 'Circular not found.' });
      }

      // Only serve non-published PDFs if caller is an authenticated admin
      if (circular.status !== 'published') {
        const token = extractBearerToken(req);
        const authUser = token ? await resolveTokenToUser(token) : null;
        if (!authUser || authUser.accountType !== 'admin' || !authUser.adminRole) {
          return res.status(403).json({ error: 'Unpublished circulars require administrator access.' });
        }
      }

      const base64 =
        circular.pdfBase64 ||
        buildCircularPdfBase64(circular.titleEn, [
          circular.rawCircularText || 'Official circular document pending PDF attachment.',
        ]);

      const pdfBuffer = Buffer.from(base64, 'base64');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${circular.pdfFilename || `circular-${circular.id}.pdf`}"`
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Serve PDF error:', error);
      res.status(500).json({ error: 'Failed to load PDF document.' });
    }
  });

  // ---------------------------------------------------------------------------
  // 3. Student Profile, Deterministic Eligibility & Grounded Gemini Recommender
  // ---------------------------------------------------------------------------
  const handleGetStudentProfile = async (req: AuthRequest, res: express.Response) => {
    try {
      const authUser = req.authUser!;
      const rows = await db
        .select()
        .from(studentProfiles)
        .where(eq(studentProfiles.userId, authUser.id))
        .limit(1);

      res.json({
        user: authUser,
        profile: rows[0] ?? null,
      });
    } catch (error) {
      console.error('Get student profile error:', error);
      res.status(500).json({ error: 'Failed to load student profile.' });
    }
  };

  const handleUpdateStudentProfile = async (req: AuthRequest, res: express.Response) => {
    try {
      const authUser = req.authUser!;
      const body = req.body ?? {};

      const fullName = body.fullName !== undefined ? String(body.fullName).trim() : authUser.fullName;
      const phone = body.phone !== undefined ? String(body.phone).trim() : authUser.phone;

      if (fullName.length < 2) {
        return res.status(400).json({ error: 'Full name must be at least 2 characters.' });
      }
      if (phone && !isValidBangladeshPhone(phone)) {
        return res.status(400).json({ error: 'Invalid Bangladesh phone number.' });
      }

      const sscGpa = body.sscGpa !== undefined && body.sscGpa !== '' && body.sscGpa !== null ? Number(body.sscGpa) : null;
      const hscGpa = body.hscGpa !== undefined && body.hscGpa !== '' && body.hscGpa !== null ? Number(body.hscGpa) : null;
      const sscGpaWithoutFourth =
        body.sscGpaWithoutFourth !== undefined &&
        body.sscGpaWithoutFourth !== '' &&
        body.sscGpaWithoutFourth !== null
          ? Number(body.sscGpaWithoutFourth)
          : null;
      const hscGpaWithoutFourth =
        body.hscGpaWithoutFourth !== undefined &&
        body.hscGpaWithoutFourth !== '' &&
        body.hscGpaWithoutFourth !== null
          ? Number(body.hscGpaWithoutFourth)
          : null;

      if (sscGpa !== null && !isValidZeroToFiveGpa(sscGpa)) {
        return res.status(400).json({ error: 'SSC GPA (With 4th Subject) must be between 0.00 and 5.00.' });
      }
      if (hscGpa !== null && !isValidZeroToFiveGpa(hscGpa)) {
        return res.status(400).json({ error: 'HSC GPA (With 4th Subject) must be between 0.00 and 5.00.' });
      }
      if (sscGpaWithoutFourth !== null && !isValidZeroToFiveGpa(sscGpaWithoutFourth)) {
        return res.status(400).json({ error: 'SSC GPA (Without 4th Subject) must be between 0.00 and 5.00.' });
      }
      if (hscGpaWithoutFourth !== null && !isValidZeroToFiveGpa(hscGpaWithoutFourth)) {
        return res.status(400).json({ error: 'HSC GPA (Without 4th Subject) must be between 0.00 and 5.00.' });
      }

      const rawGrades = (body.subjectGrades ?? {}) as Record<string, unknown>;
      const subjectGrades: Record<string, number> = {};
      for (const [subj, val] of Object.entries(rawGrades)) {
        if (val === '' || val === null || val === undefined) continue;
        const num = Number(val);
        if (!isValidZeroToFiveGpa(num)) {
          return res.status(400).json({ error: `Subject GPA for ${subj} must be between 0.00 and 5.00.` });
        }
        subjectGrades[subj] = num;
      }

      const selectedSubjects = Array.isArray(body.selectedSubjects)
        ? body.selectedSubjects.map((s: unknown) => String(s).trim()).filter(Boolean)
        : [];

      let nextAvatarUrl: string | null | undefined = undefined;
      if (body.avatarUrl !== undefined) {
        if (body.avatarUrl === null || String(body.avatarUrl).trim() === '') {
          nextAvatarUrl = null;
        } else {
          const avatarCheck = validateAvatarDataUrl(String(body.avatarUrl));
          if (avatarCheck.ok === false) {
            return res.status(400).json({ error: avatarCheck.error });
          }
          nextAvatarUrl = String(body.avatarUrl).trim();
        }
      }

      const [updatedUser] = await db
        .update(users)
        .set({
          fullName,
          phone: phone || null,
          ...(nextAvatarUrl !== undefined ? { avatarUrl: nextAvatarUrl } : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.id, authUser.id))
        .returning();

      const profileValues = {
        userId: authUser.id,
        sscBoard: body.sscBoard ? normalizeBoardName(String(body.sscBoard)) : null,
        sscYear: body.sscYear ? Number(body.sscYear) : null,
        sscGroup: body.sscGroup ? String(body.sscGroup) : null,
        sscGpa,
        sscGpaWithoutFourth,
        hscBoard: body.hscBoard ? normalizeBoardName(String(body.hscBoard)) : null,
        hscYear: body.hscYear ? Number(body.hscYear) : null,
        hscGroup: body.hscGroup ? String(body.hscGroup) : null,
        hscGpa,
        hscGpaWithoutFourth,
        fourthSubjectCode: body.fourthSubjectCode ? String(body.fourthSubjectCode).trim() : null,
        selectedSubjects,
        subjectGrades,
        isSecondTimer: Boolean(body.isSecondTimer),
        preferredSubject: body.preferredSubject ? String(body.preferredSubject).trim() : null,
        preferredCity: body.preferredCity ? String(body.preferredCity).trim() : null,
        collegeName: body.collegeName ? String(body.collegeName).trim() : null,
        tuitionBudgetBdt:
          body.tuitionBudgetBdt !== undefined && body.tuitionBudgetBdt !== ''
            ? Math.max(0, Number(body.tuitionBudgetBdt))
            : null,
        updatedAt: new Date(),
      };

      const [saved] = await db
        .insert(studentProfiles)
        .values(profileValues)
        .onConflictDoUpdate({
          target: studentProfiles.userId,
          set: profileValues,
        })
        .returning();

      res.json({
        user: updatedUser ? serializeAuthUser(updatedUser) : { ...authUser, fullName, phone: phone || null },
        profile: saved,
      });
    } catch (error) {
      console.error('Update student profile error:', error);
      res.status(500).json({ error: 'Failed to save student academic profile.' });
    }
  };

  app.get('/api/student/profile', requireAuth, handleGetStudentProfile);
  app.get('/api/auth/profile', requireAuth, handleGetStudentProfile);
  app.put('/api/student/profile', requireAuth, handleUpdateStudentProfile);
  app.put('/api/auth/profile', requireAuth, handleUpdateStudentProfile);

  app.post('/api/student/avatar', requireAuth, async (req: AuthRequest, res) => {
    try {
      const authUser = req.authUser!;
      const rawAvatar = req.body?.avatarUrl;

      let nextAvatarUrl: string | null = null;
      if (rawAvatar !== null && rawAvatar !== undefined && String(rawAvatar).trim() !== '') {
        const avatarCheck = validateAvatarDataUrl(String(rawAvatar));
        if (avatarCheck.ok === false) {
          return res.status(400).json({ error: avatarCheck.error });
        }
        nextAvatarUrl = String(rawAvatar).trim();
      }

      const [updated] = await db
        .update(users)
        .set({ avatarUrl: nextAvatarUrl, updatedAt: new Date() })
        .where(eq(users.id, authUser.id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: 'User account not found.' });
      }

      res.json({ user: serializeAuthUser(updated) });
    } catch (error) {
      console.error('Update student avatar error:', error);
      res.status(500).json({ error: 'Failed to save profile picture.' });
    }
  });

  function parseAcademicOverrideInput(
    rawOverride: Record<string, unknown>
  ): { ok: true; input: StudentAcademicInput } | { ok: false; error: string } {
    const parsed: StudentAcademicInput = {};
    if (rawOverride.sscGpa !== undefined && rawOverride.sscGpa !== '' && rawOverride.sscGpa !== null) {
      const val = Number(rawOverride.sscGpa);
      if (!isValidZeroToFiveGpa(val)) {
        return { ok: false, error: 'SSC GPA (With 4th Subject) must be between 0.00 and 5.00.' };
      }
      parsed.sscGpa = val;
    }
    if (
      rawOverride.sscGpaWithoutFourth !== undefined &&
      rawOverride.sscGpaWithoutFourth !== '' &&
      rawOverride.sscGpaWithoutFourth !== null
    ) {
      const val = Number(rawOverride.sscGpaWithoutFourth);
      if (!isValidZeroToFiveGpa(val)) {
        return { ok: false, error: 'SSC GPA (Without 4th Subject) must be between 0.00 and 5.00.' };
      }
      parsed.sscGpaWithoutFourth = val;
    }
    if (rawOverride.hscGpa !== undefined && rawOverride.hscGpa !== '' && rawOverride.hscGpa !== null) {
      const val = Number(rawOverride.hscGpa);
      if (!isValidZeroToFiveGpa(val)) {
        return { ok: false, error: 'HSC GPA (With 4th Subject) must be between 0.00 and 5.00.' };
      }
      parsed.hscGpa = val;
    }
    if (
      rawOverride.hscGpaWithoutFourth !== undefined &&
      rawOverride.hscGpaWithoutFourth !== '' &&
      rawOverride.hscGpaWithoutFourth !== null
    ) {
      const val = Number(rawOverride.hscGpaWithoutFourth);
      if (!isValidZeroToFiveGpa(val)) {
        return { ok: false, error: 'HSC GPA (Without 4th Subject) must be between 0.00 and 5.00.' };
      }
      parsed.hscGpaWithoutFourth = val;
    }
    if (typeof rawOverride.sscBoard === 'string' && rawOverride.sscBoard.trim()) {
      parsed.sscBoard = normalizeBoardName(rawOverride.sscBoard);
    }
    if (typeof rawOverride.hscBoard === 'string' && rawOverride.hscBoard.trim()) {
      parsed.hscBoard = normalizeBoardName(rawOverride.hscBoard);
    }
    if (
      rawOverride.sscGroup === 'Science' ||
      rawOverride.sscGroup === 'Commerce' ||
      rawOverride.sscGroup === 'Humanities'
    ) {
      parsed.sscGroup = rawOverride.sscGroup;
    }
    if (
      rawOverride.hscGroup === 'Science' ||
      rawOverride.hscGroup === 'Commerce' ||
      rawOverride.hscGroup === 'Humanities'
    ) {
      parsed.hscGroup = rawOverride.hscGroup;
    }
    if (rawOverride.sscYear !== undefined && rawOverride.sscYear !== '' && rawOverride.sscYear !== null) {
      const yr = Number(rawOverride.sscYear);
      if (!Number.isInteger(yr) || yr < 2015 || yr > 2027) {
        return { ok: false, error: 'SSC Passing Year must be between 2015 and 2027.' };
      }
      parsed.sscYear = yr;
    }
    if (rawOverride.hscYear !== undefined && rawOverride.hscYear !== '' && rawOverride.hscYear !== null) {
      const yr = Number(rawOverride.hscYear);
      if (!Number.isInteger(yr) || yr < 2018 || yr > 2027) {
        return { ok: false, error: 'HSC Passing Year must be between 2018 and 2027.' };
      }
      parsed.hscYear = yr;
    }
    if (typeof rawOverride.isSecondTimer === 'boolean') {
      parsed.isSecondTimer = rawOverride.isSecondTimer;
    }
    if (typeof rawOverride.fourthSubjectCode === 'string' && rawOverride.fourthSubjectCode.trim()) {
      parsed.fourthSubjectCode = rawOverride.fourthSubjectCode.trim();
    }
    if (Array.isArray(rawOverride.selectedSubjects)) {
      parsed.selectedSubjects = rawOverride.selectedSubjects
        .map((s) => String(s).trim())
        .filter(Boolean);
    }
    if (rawOverride.subjectGrades && typeof rawOverride.subjectGrades === 'object') {
      const grades: Record<string, number> = {};
      for (const [subj, gradeVal] of Object.entries(rawOverride.subjectGrades as Record<string, unknown>)) {
        if (gradeVal === '' || gradeVal === null || gradeVal === undefined) continue;
        const num = Number(gradeVal);
        if (!isValidZeroToFiveGpa(num)) {
          return { ok: false, error: `Subject GPA for ${subj} must be between 0.00 and 5.00.` };
        }
        grades[subj] = num;
      }
      parsed.subjectGrades = grades;
    }
    return { ok: true, input: parsed };
  }

  async function evaluateAllEligibilityRules(
    studentInput: StudentAcademicInput,
    categoryFilter?: string,
    categoriesFilter?: string[]
  ) {
    const allInsts = await db.select().from(institutions).where(eq(institutions.isActive, true));
    const allCirculars = await db
      .select({
        id: circulars.id,
        titleEn: circulars.titleEn,
        titleBn: circulars.titleBn,
        session: circulars.session,
        sourceUrl: circulars.sourceUrl,
        applicationDeadline: circulars.applicationDeadline,
        status: circulars.status,
      })
      .from(circulars);
    const allRules = await db.select().from(admissionRules);

    const instMap = new Map(allInsts.map((i) => [i.id, i]));
    const circularMap = new Map(allCirculars.map((c) => [c.id, c]));
    const categoriesSet =
      Array.isArray(categoriesFilter) && categoriesFilter.length > 0
        ? new Set(categoriesFilter)
        : null;

    const evaluations = [];
    for (const ruleRow of allRules) {
      const inst = instMap.get(ruleRow.institutionId);
      const circ = circularMap.get(ruleRow.circularId);
      if (!inst || !circ) continue;
      if (categoriesSet && !categoriesSet.has(inst.category)) continue;
      if (!categoriesSet && categoryFilter && categoryFilter !== 'all' && inst.category !== categoryFilter) {
        continue;
      }
      if (circ.status === 'archived' || circ.status === 'expired') continue;

      const evalResult = evaluateDeterministicEligibility(studentInput, {
        id: String(ruleRow.id),
        institutionId: String(inst.id),
        programName: ruleRow.programName,
        status: ruleRow.status as RulePublicationStatus,
        isVerified: ruleRow.isVerified,
        source: {
          circularTitle: circ.titleEn,
          session: circ.session,
          officialUrl: circ.sourceUrl,
          pageReference: ruleRow.pageReference ?? undefined,
        },
        gpaMode: (ruleRow.gpaMode as 'with_fourth' | 'without_fourth') ?? 'with_fourth',
        minSscGpa: ruleRow.minSscGpa ?? undefined,
        minHscGpa: ruleRow.minHscGpa ?? undefined,
        minCombinedGpa: ruleRow.minCombinedGpa ?? undefined,
        minSscGpaWithoutFourth: ruleRow.minSscGpaWithoutFourth ?? undefined,
        minHscGpaWithoutFourth: ruleRow.minHscGpaWithoutFourth ?? undefined,
        minCombinedGpaWithoutFourth: ruleRow.minCombinedGpaWithoutFourth ?? undefined,
        allowedGroups: (ruleRow.allowedGroups ?? []) as AcademicGroup[],
        allowedBoards: ruleRow.allowedBoards ?? [],
        allowedSscYears: ruleRow.allowedSscYears ?? [],
        allowedHscYears: ruleRow.allowedHscYears ?? [],
        allowsSecondTimer: ruleRow.allowsSecondTimer,
        requiredSubjectMinGpa: ruleRow.requiredSubjectMinGpa ?? {},
      });

      const medicalScoreBreakdown =
        inst.category === 'medical' ? calculateDgmeMedicalGpaScore(studentInput) : null;

      evaluations.push({
        ruleId: ruleRow.id,
        circularId: circ.id,
        institutionId: inst.id,
        institutionCode: inst.code,
        institutionNameEn: inst.nameEn,
        institutionNameBn: inst.nameBn,
        institutionType: inst.institutionType,
        institutionTypeBn: inst.institutionTypeBn,
        category: inst.category,
        city: inst.city,
        estimatedTotalCostBdt: inst.estimatedTotalCostBdt,
        programName: ruleRow.programName,
        applicationDeadline: circ.applicationDeadline,
        pdfUrl: `/api/circulars/${circ.id}/pdf`,
        evaluation: medicalScoreBreakdown
          ? { ...evalResult, medicalScoreBreakdown }
          : evalResult,
      });
    }

    return evaluations;
  }

  async function computeAllStudentEligibility(
    userId: number,
    categoryFilter?: string,
    overrideInput?: StudentAcademicInput,
    categoriesFilter?: string[]
  ) {
    const profileRows = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .limit(1);
    const profile = profileRows[0];

    const studentInput: StudentAcademicInput = overrideInput
      ? overrideInput
      : profile
      ? {
          sscGpa: profile.sscGpa ?? undefined,
          sscGpaWithoutFourth: profile.sscGpaWithoutFourth ?? undefined,
          hscGpa: profile.hscGpa ?? undefined,
          hscGpaWithoutFourth: profile.hscGpaWithoutFourth ?? undefined,
          sscBoard: profile.sscBoard ?? undefined,
          hscBoard: profile.hscBoard ?? undefined,
          sscGroup: (profile.sscGroup as AcademicGroup | null) ?? undefined,
          sscYear: profile.sscYear ?? undefined,
          hscYear: profile.hscYear ?? undefined,
          hscGroup: (profile.hscGroup as AcademicGroup | null) ?? undefined,
          isSecondTimer: profile.isSecondTimer,
          fourthSubjectCode: profile.fourthSubjectCode ?? undefined,
          selectedSubjects:
            Array.isArray(profile.selectedSubjects) && profile.selectedSubjects.length > 0
              ? profile.selectedSubjects
              : undefined,
          subjectGrades: profile.subjectGrades ?? {},
        }
      : {};

    const evaluations = await evaluateAllEligibilityRules(
      studentInput,
      categoryFilter,
      categoriesFilter
    );
    return { profile, evaluations };
  }

  const handleAuthenticatedEligibilityCheck = async (req: AuthRequest, res: express.Response) => {
    try {
      const category = typeof req.body?.category === 'string' ? req.body.category : 'all';
      const categories = Array.isArray(req.body?.categories)
        ? req.body.categories.map((c: unknown) => String(c))
        : undefined;
      const rawInput = (req.body?.input ?? req.body?.overrideInput ?? {}) as Record<string, unknown>;
      const parsed = parseAcademicOverrideInput(rawInput);
      if (parsed.ok === false) {
        return res.status(400).json({ error: parsed.error });
      }
      const evaluations = await evaluateAllEligibilityRules(parsed.input, category, categories);
      res.json({ evaluations });
    } catch (error) {
      console.error('Eligibility check error:', error);
      res.status(500).json({ error: 'Failed to evaluate admission eligibility.' });
    }
  };

  app.post('/api/eligibility', requireAuth, handleAuthenticatedEligibilityCheck);
  app.post('/api/public/eligibility', requireAuth, handleAuthenticatedEligibilityCheck);

  app.post('/api/public/best-for-u', requireAuth, async (req: AuthRequest, res) => {
    try {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const lang = body.lang === 'bn' ? 'bn' : 'en';
      const parsed = parseAcademicOverrideInput(body);
      if (parsed.ok === false) {
        return res.status(400).json({ error: parsed.error });
      }

      const evaluations = await evaluateAllEligibilityRules(parsed.input, 'all');
      const eligibleEvaluations = evaluations.filter((item) => item.evaluation.status === 'Eligible');

      const eligibleCandidates = eligibleEvaluations.map((item) => ({
        ruleId: item.ruleId,
        institutionId: item.institutionId,
        institutionCode: item.institutionCode,
        institutionNameEn: item.institutionNameEn,
        institutionNameBn: item.institutionNameBn,
        institutionType: item.institutionType,
        city: item.city,
        programName: item.programName,
        estimatedTotalCostBdt: item.estimatedTotalCostBdt,
        circularTitle: item.evaluation.source?.circularTitle || item.institutionNameEn,
        sourceUrl: item.evaluation.source?.officialUrl || '',
      }));

      const tuitionBudgetRaw = body.tuitionBudgetBdt;
      const tuitionBudgetBdt =
        tuitionBudgetRaw !== undefined && tuitionBudgetRaw !== '' && tuitionBudgetRaw !== null
          ? Number(tuitionBudgetRaw)
          : null;

      const aiResult = await generateGroundedRecommendations({
        studentSummary: {
          sscGpa: parsed.input.sscGpa ?? null,
          hscGpa: parsed.input.hscGpa ?? null,
          hscGroup: parsed.input.hscGroup ?? null,
          preferredSubject: body.preferredSubject ? String(body.preferredSubject).trim() : null,
          preferredCity: body.preferredCity ? String(body.preferredCity).trim() : null,
          tuitionBudgetBdt:
            tuitionBudgetBdt !== null && Number.isFinite(tuitionBudgetBdt) ? tuitionBudgetBdt : null,
        },
        eligibleCandidates,
        lang,
      });

      res.json({
        eligibleCount: eligibleCandidates.length,
        totalEvaluated: evaluations.length,
        summary: aiResult.summary,
        recommendations: aiResult.recommendations,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to generate Best for U advice.';
      console.error('Best for U recommendation error:', error);
      res.status(500).json({ error: msg });
    }
  });

  app.post('/api/student/eligibility', requireAuth, async (req: AuthRequest, res) => {
    try {
      const category = typeof req.body?.category === 'string' ? req.body.category : 'all';
      const categories = Array.isArray(req.body?.categories)
        ? req.body.categories.map((c: unknown) => String(c))
        : undefined;
      const rawOverride = req.body?.overrideInput as Record<string, unknown> | undefined;
      let overrideInput: StudentAcademicInput | undefined;

      if (rawOverride && typeof rawOverride === 'object') {
        const parsed = parseAcademicOverrideInput(rawOverride);
        if (parsed.ok === false) {
          return res.status(400).json({ error: parsed.error });
        }
        overrideInput = parsed.input;
      }

      const data = await computeAllStudentEligibility(
        req.authUser!.id,
        category,
        overrideInput,
        categories
      );
      res.json(data);
    } catch (error) {
      console.error('Eligibility evaluation error:', error);
      res.status(500).json({ error: 'Failed to evaluate admission eligibility.' });
    }
  });

  app.post('/api/student/recommendations', requireAuth, async (req: AuthRequest, res) => {
    try {
      const lang = req.body?.lang === 'bn' ? 'bn' : 'en';
      const { profile, evaluations } = await computeAllStudentEligibility(req.authUser!.id);

      const eligibleCandidates = evaluations
        .filter((item) => item.evaluation.status === 'Eligible')
        .map((item) => ({
          ruleId: item.ruleId,
          institutionId: item.institutionId,
          institutionCode: item.institutionCode,
          institutionNameEn: item.institutionNameEn,
          institutionNameBn: item.institutionNameBn,
          institutionType: item.institutionType,
          city: item.city,
          programName: item.programName,
          estimatedTotalCostBdt: item.estimatedTotalCostBdt,
          circularTitle: item.evaluation.source?.circularTitle || item.institutionNameEn,
          sourceUrl: item.evaluation.source?.officialUrl || '',
        }));

      const aiResult = await generateGroundedRecommendations({
        studentSummary: {
          sscGpa: profile?.sscGpa,
          hscGpa: profile?.hscGpa,
          hscGroup: profile?.hscGroup,
          preferredSubject: profile?.preferredSubject,
          preferredCity: profile?.preferredCity,
          tuitionBudgetBdt: profile?.tuitionBudgetBdt,
        },
        eligibleCandidates,
        lang,
      });

      res.json({
        eligibleCount: eligibleCandidates.length,
        summary: aiResult.summary,
        recommendations: aiResult.recommendations,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to generate recommendations.';
      console.error('Gemini recommendation error:', error);
      res.status(500).json({ error: msg });
    }
  });

  // ---------------------------------------------------------------------------
  // 4. Admin Console Routes (Strict Two-Tier RBAC: super_admin & admin)
  // ---------------------------------------------------------------------------
  app.get(
    '/api/admin/overview',
    requireAuth,
    requireRoles('super_admin', 'admin'),
    async (_req: AuthRequest, res) => {
      try {
        const allInsts = await db.select().from(institutions);
        const allCirculars = await db.select().from(circulars);
        const allUsers = await db.select().from(users);
        const logs = await db
          .select()
          .from(auditLogs)
          .orderBy(desc(auditLogs.createdAt))
          .limit(20);

        const universitiesExcludingMedical = allInsts.filter(
          (i) => i.institutionType !== 'Medical College'
        ).length;
        const registeredStudents = allUsers.filter((u) => u.accountType === 'student').length;
        const pendingReviews = allCirculars.filter(
          (c) => c.status === 'under_review' || c.status === 'ai_extracted'
        ).length;
        const activeSessions = new Set(
          allCirculars.filter((c) => c.status === 'published').map((c) => c.session)
        ).size;
        const expiredCirculars = allCirculars.filter(
          (c) => c.status === 'expired' || c.status === 'archived'
        ).length;

        res.json({
          stats: {
            totalInstitutions: allInsts.length,
            universitiesExcludingMedical,
            uploadedCirculars: allCirculars.length,
            registeredStudents,
            pendingReviews,
            activeSessions,
            expiredCirculars,
          },
          recentActivities: logs,
        });
      } catch (error) {
        console.error('Admin overview error:', error);
        res.status(500).json({ error: 'Failed to load admin overview.' });
      }
    }
  );

  app.get(
    '/api/admin/institutions',
    requireAuth,
    requireRoles('super_admin', 'admin'),
    async (_req, res) => {
      const list = await db.select().from(institutions).orderBy(institutions.id);
      res.json({ institutions: list });
    }
  );

  app.post(
    '/api/admin/institutions',
    requireAuth,
    requireRoles('super_admin', 'admin'),
    async (req: AuthRequest, res) => {
      try {
        const b = req.body ?? {};
        const code = String(b.code ?? '').trim().toUpperCase();
        const nameEn = String(b.nameEn ?? '').trim();
        const nameBn = String(b.nameBn ?? nameEn).trim();
        const category = String(b.category ?? 'public');
        const institutionType = String(b.institutionType ?? 'Public University');
        const city = String(b.city ?? 'Dhaka').trim();
        const updatedBy = formatAdminAttribution(req.authUser!);

        if (!code || !nameEn) {
          return res.status(400).json({ error: 'Institution code and name are required.' });
        }

        const perCredit = b.perCreditFeeBdt ? Number(b.perCreditFeeBdt) : null;
        const totalCredits = b.totalCredits ? Number(b.totalCredits) : null;
        const semesterFee = b.semesterFeeBdt ? Number(b.semesterFeeBdt) : null;
        const admissionFee = b.admissionFeeBdt ? Number(b.admissionFeeBdt) : null;
        const estimatedTotal =
          perCredit && totalCredits
            ? Math.round(perCredit * totalCredits + (semesterFee ?? 0) * 8 + (admissionFee ?? 0))
            : null;

        const [created] = await db
          .insert(institutions)
          .values({
            code,
            nameEn,
            nameBn,
            shortNoteEn: String(b.shortNoteEn || `${nameEn} undergraduate admission profile.`),
            shortNoteBn: String(b.shortNoteBn || `${nameBn} স্নাতক ভর্তি তথ্য।`),
            locationEn: String(b.locationEn || city),
            locationBn: String(b.locationBn || city),
            city,
            category,
            institutionType,
            institutionTypeBn: String(b.institutionTypeBn || institutionType),
            officialWebsite: String(b.officialWebsite || 'https://ugc.gov.bd'),
            imageUrl: b.imageUrl ? String(b.imageUrl).trim() : null,
            imageAltEn: `${nameEn} campus view`,
            imageAltBn: `${nameBn} ক্যাম্পাস`,
            programsEn: Array.isArray(b.programsEn) ? b.programsEn : ['Undergraduate Track'],
            programsBn: Array.isArray(b.programsBn) ? b.programsBn : ['স্নাতক প্রোগ্রাম'],
            perCreditFeeBdt: perCredit,
            totalCredits,
            semesterFeeBdt: semesterFee,
            admissionFeeBdt: admissionFee,
            estimatedTotalCostBdt: estimatedTotal,
            updatedBy,
          })
          .returning();

        await writeAuditLog({
          actorUserId: req.authUser!.id,
          actorEmail: req.authUser!.email || req.authUser!.uid,
          actorRole: req.authUser!.adminRole!,
          action: 'INSTITUTION_CREATED',
          entityType: 'institution',
          entityId: created.id,
          details: { code: created.code, nameEn: created.nameEn, updatedBy },
        });

        res.status(201).json({ institution: created });
      } catch (error: unknown) {
        console.error('Create institution error:', error);
        res.status(500).json({ error: 'Failed to create institution (ensure code is unique).' });
      }
    }
  );

  app.put(
    '/api/admin/institutions/:id',
    requireAuth,
    requireRoles('super_admin', 'admin'),
    async (req: AuthRequest, res) => {
      try {
        const instId = Number(req.params.id);
        if (!Number.isInteger(instId) || instId <= 0) {
          return res.status(400).json({ error: 'Invalid institution ID.' });
        }

        const existingRows = await db
          .select()
          .from(institutions)
          .where(eq(institutions.id, instId))
          .limit(1);
        const existing = existingRows[0];
        if (!existing) {
          return res.status(404).json({ error: 'Institution not found.' });
        }

        const b = req.body ?? {};
        const updatedBy = formatAdminAttribution(req.authUser!);
        const perCredit =
          b.perCreditFeeBdt !== undefined
            ? b.perCreditFeeBdt !== null && b.perCreditFeeBdt !== ''
              ? Number(b.perCreditFeeBdt)
              : null
            : existing.perCreditFeeBdt;
        const totalCredits =
          b.totalCredits !== undefined
            ? b.totalCredits !== null && b.totalCredits !== ''
              ? Number(b.totalCredits)
              : null
            : existing.totalCredits;
        const semesterFee =
          b.semesterFeeBdt !== undefined
            ? b.semesterFeeBdt !== null && b.semesterFeeBdt !== ''
              ? Number(b.semesterFeeBdt)
              : null
            : existing.semesterFeeBdt;
        const admissionFee =
          b.admissionFeeBdt !== undefined
            ? b.admissionFeeBdt !== null && b.admissionFeeBdt !== ''
              ? Number(b.admissionFeeBdt)
              : null
            : existing.admissionFeeBdt;

        const estimatedTotal =
          perCredit && totalCredits
            ? Math.round(perCredit * totalCredits + (semesterFee ?? 0) * 8 + (admissionFee ?? 0))
            : existing.estimatedTotalCostBdt;

        const [updated] = await db
          .update(institutions)
          .set({
            nameEn: b.nameEn ? String(b.nameEn).trim() : existing.nameEn,
            nameBn: b.nameBn ? String(b.nameBn).trim() : existing.nameBn,
            shortNoteEn: b.shortNoteEn !== undefined ? String(b.shortNoteEn).trim() : existing.shortNoteEn,
            shortNoteBn: b.shortNoteBn !== undefined ? String(b.shortNoteBn).trim() : existing.shortNoteBn,
            category: b.category ? String(b.category) : existing.category,
            institutionType: b.institutionType ? String(b.institutionType) : existing.institutionType,
            institutionTypeBn: b.institutionTypeBn
              ? String(b.institutionTypeBn)
              : existing.institutionTypeBn,
            city: b.city ? String(b.city).trim() : existing.city,
            locationEn: b.locationEn ? String(b.locationEn).trim() : existing.locationEn,
            locationBn: b.locationBn ? String(b.locationBn).trim() : existing.locationBn,
            officialWebsite: b.officialWebsite
              ? String(b.officialWebsite).trim()
              : existing.officialWebsite,
            programsEn: Array.isArray(b.programsEn) ? b.programsEn : existing.programsEn,
            programsBn: Array.isArray(b.programsBn) ? b.programsBn : existing.programsBn,
            perCreditFeeBdt: perCredit,
            totalCredits,
            semesterFeeBdt: semesterFee,
            admissionFeeBdt: admissionFee,
            estimatedTotalCostBdt: estimatedTotal,
            updatedBy,
          })
          .where(eq(institutions.id, instId))
          .returning();

        await writeAuditLog({
          actorUserId: req.authUser!.id,
          actorEmail: req.authUser!.email || req.authUser!.uid,
          actorRole: req.authUser!.adminRole!,
          action: 'INSTITUTION_UPDATED',
          entityType: 'institution',
          entityId: instId,
          details: { code: updated.code, nameEn: updated.nameEn, updatedBy },
        });

        res.json({ institution: updated });
      } catch (error) {
        console.error('Update institution error:', error);
        res.status(500).json({ error: 'Failed to update institution record.' });
      }
    }
  );

  app.get(
    '/api/admin/rankings',
    requireAuth,
    requireRoles('super_admin', 'admin'),
    async (_req, res) => {
      try {
        const [allInsts, customRows] = await Promise.all([
          db
            .select({
              code: institutions.code,
              nameEn: institutions.nameEn,
              nameBn: institutions.nameBn,
              category: institutions.category,
              institutionType: institutions.institutionType,
              institutionTypeBn: institutions.institutionTypeBn,
              establishedYear: institutions.establishedYear,
            })
            .from(institutions)
            .where(eq(institutions.isActive, true)),
          db.select().from(institutionRankings),
        ]);

        const rankings = buildMergedInstitutionRankings(allInsts, customRows);
        const attributionByCode = new Map(
          customRows.map((row) => [row.institutionCode.toUpperCase(), row.updatedBy ?? null])
        );

        res.json({
          rankings: rankings.map((r) => ({
            ...r,
            updatedBy: attributionByCode.get(r.code.toUpperCase()) ?? null,
          })),
        });
      } catch (error) {
        console.error('Fetch admin rankings error:', error);
        res.status(500).json({ error: 'Failed to load university rankings.' });
      }
    }
  );

  app.put(
    '/api/admin/rankings/:code',
    requireAuth,
    requireRoles('super_admin', 'admin'),
    async (req: AuthRequest, res) => {
      try {
        const institutionCode = String(req.params.code ?? '').trim().toUpperCase();
        if (!institutionCode) {
          return res.status(400).json({ error: 'Institution code is required.' });
        }

        const instRows = await db
          .select({ code: institutions.code, nameEn: institutions.nameEn })
          .from(institutions)
          .where(eq(institutions.code, institutionCode))
          .limit(1);
        if (!instRows[0]) {
          return res.status(404).json({ error: 'Institution code not found.' });
        }

        const b = req.body ?? {};
        const qsGlobal2026 = String(b.qsGlobal2026 ?? 'N/R').trim() || 'N/R';
        const theGlobal2026 = String(b.theGlobal2026 ?? 'N/R').trim() || 'N/R';
        const bangladeshStandingEn = String(b.bangladeshStandingEn ?? '').trim();
        const bangladeshStandingBn = String(b.bangladeshStandingBn ?? bangladeshStandingEn).trim();
        const sourceCitation = String(b.sourceCitation ?? '').trim();
        const sourceUrl = String(b.sourceUrl ?? '').trim();

        if (!bangladeshStandingEn || !sourceCitation || !sourceUrl) {
          return res.status(400).json({
            error: 'Bangladesh standing, source citation, and official source URL are required.',
          });
        }

        const qsRankScore =
          b.qsRankScore !== undefined && b.qsRankScore !== null && b.qsRankScore !== ''
            ? Number(b.qsRankScore)
            : null;
        const theRankScore =
          b.theRankScore !== undefined && b.theRankScore !== null && b.theRankScore !== ''
            ? Number(b.theRankScore)
            : null;
        const qsAsiaRankScore =
          b.qsAsiaRankScore !== undefined && b.qsAsiaRankScore !== null && b.qsAsiaRankScore !== ''
            ? Number(b.qsAsiaRankScore)
            : null;
        const citationYear =
          b.citationYear !== undefined && b.citationYear !== null && b.citationYear !== ''
            ? Number(b.citationYear)
            : 2026;

        const updatedBy = formatAdminAttribution(req.authUser!);

        const [saved] = await db
          .insert(institutionRankings)
          .values({
            institutionCode,
            qsGlobal2026,
            theGlobal2026,
            qsRankScore: qsRankScore !== null && Number.isFinite(qsRankScore) ? qsRankScore : null,
            theRankScore: theRankScore !== null && Number.isFinite(theRankScore) ? theRankScore : null,
            qsAsiaRankScore:
              qsAsiaRankScore !== null && Number.isFinite(qsAsiaRankScore) ? qsAsiaRankScore : null,
            bangladeshStandingEn,
            bangladeshStandingBn,
            sourceCitation,
            citationYear: Number.isInteger(citationYear) ? citationYear : 2026,
            sourceUrl,
            updatedBy,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: institutionRankings.institutionCode,
            set: {
              qsGlobal2026,
              theGlobal2026,
              qsRankScore: qsRankScore !== null && Number.isFinite(qsRankScore) ? qsRankScore : null,
              theRankScore: theRankScore !== null && Number.isFinite(theRankScore) ? theRankScore : null,
              qsAsiaRankScore:
                qsAsiaRankScore !== null && Number.isFinite(qsAsiaRankScore) ? qsAsiaRankScore : null,
              bangladeshStandingEn,
              bangladeshStandingBn,
              sourceCitation,
              citationYear: Number.isInteger(citationYear) ? citationYear : 2026,
              sourceUrl,
              updatedBy,
              updatedAt: new Date(),
            },
          })
          .returning();

        await writeAuditLog({
          actorUserId: req.authUser!.id,
          actorEmail: req.authUser!.email || req.authUser!.uid,
          actorRole: req.authUser!.adminRole!,
          action: 'RANKING_UPDATED',
          entityType: 'institution_ranking',
          entityId: institutionCode,
          details: {
            institutionCode,
            qsGlobal2026,
            theGlobal2026,
            updatedBy,
          },
        });

        res.json({ ranking: saved });
      } catch (error) {
        console.error('Update ranking error:', error);
        res.status(500).json({ error: 'Failed to update university ranking.' });
      }
    }
  );

  app.get(
    '/api/admin/circulars',
    requireAuth,
    requireRoles('super_admin', 'admin'),
    async (_req, res) => {
      try {
        const allCirculars = await db
          .select({
            id: circulars.id,
            institutionId: circulars.institutionId,
            titleEn: circulars.titleEn,
            titleBn: circulars.titleBn,
            session: circulars.session,
            sourceUrl: circulars.sourceUrl,
            applicationDeadline: circulars.applicationDeadline,
            pdfFilename: circulars.pdfFilename,
            rawCircularText: circulars.rawCircularText,
            status: circulars.status,
            version: circulars.version,
            reviewNotes: circulars.reviewNotes,
            updatedBy: circulars.updatedBy,
            publishedAt: circulars.publishedAt,
            createdAt: circulars.createdAt,
            updatedAt: circulars.updatedAt,
          })
          .from(circulars)
          .orderBy(desc(circulars.updatedAt));

        const allInsts = await db.select().from(institutions);
        const allRules = await db.select().from(admissionRules);
        const instMap = new Map(allInsts.map((i) => [i.id, i]));

        const enriched = allCirculars.map((c) => ({
          ...c,
          pdfUrl: `/api/circulars/${c.id}/pdf`,
          institution: instMap.get(c.institutionId) ?? null,
          rules: allRules.filter((r) => r.circularId === c.id),
        }));

        res.json({ circulars: enriched });
      } catch (error) {
        console.error('Fetch admin circulars error:', error);
        res.status(500).json({ error: 'Failed to fetch circulars.' });
      }
    }
  );

  app.post(
    '/api/admin/circulars',
    requireAuth,
    requireRoles('super_admin', 'admin'),
    async (req: AuthRequest, res) => {
      try {
        const b = req.body ?? {};
        const institutionId = Number(b.institutionId);
        const titleEn = String(b.titleEn ?? '').trim();
        const titleBn = String(b.titleBn ?? titleEn).trim();
        const session = String(b.session ?? '2025-2026').trim();
        const sourceUrl = String(b.sourceUrl ?? '').trim();
        const applicationDeadline = b.applicationDeadline ? String(b.applicationDeadline) : null;
        const rawCircularText = b.rawCircularText ? String(b.rawCircularText) : null;
        const pdfFilename = b.pdfFilename ? String(b.pdfFilename) : 'uploaded-circular.pdf';
        let pdfBase64 = b.pdfBase64 ? String(b.pdfBase64) : null;
        const updatedBy = formatAdminAttribution(req.authUser!);

        if (pdfBase64 && pdfBase64.includes(',')) {
          pdfBase64 = pdfBase64.split(',')[1];
        }
        if (!pdfBase64 && rawCircularText) {
          pdfBase64 = buildCircularPdfBase64(titleEn, rawCircularText.split('\n'));
        }

        if (!Number.isInteger(institutionId) || !titleEn || !sourceUrl) {
          return res.status(400).json({
            error: 'Institution, circular title, and official source URL are required.',
          });
        }

        const [created] = await db
          .insert(circulars)
          .values({
            institutionId,
            titleEn,
            titleBn,
            session,
            sourceUrl,
            applicationDeadline,
            pdfFilename,
            pdfBase64,
            rawCircularText,
            status: 'draft',
            version: 1,
            uploadedByUserId: req.authUser!.id,
            updatedBy,
          })
          .returning();

        await writeAuditLog({
          actorUserId: req.authUser!.id,
          actorEmail: req.authUser!.email || req.authUser!.uid,
          actorRole: req.authUser!.adminRole!,
          action: 'CIRCULAR_UPLOADED',
          entityType: 'circular',
          entityId: created.id,
          details: { titleEn: created.titleEn, pdfFilename: created.pdfFilename, updatedBy },
        });

        res.status(201).json({ circular: created });
      } catch (error) {
        console.error('Upload circular error:', error);
        res.status(500).json({ error: 'Failed to upload circular.' });
      }
    }
  );

  app.put(
    '/api/admin/circulars/:id',
    requireAuth,
    requireRoles('super_admin', 'admin'),
    async (req: AuthRequest, res) => {
      try {
        const circularId = Number(req.params.id);
        const existingRows = await db
          .select()
          .from(circulars)
          .where(eq(circulars.id, circularId))
          .limit(1);
        const existing = existingRows[0];
        if (!existing) {
          return res.status(404).json({ error: 'Circular not found.' });
        }

        const b = req.body ?? {};
        const updatedBy = formatAdminAttribution(req.authUser!);
        const nextVersion = existing.version + 1;

        const [updated] = await db
          .update(circulars)
          .set({
            titleEn: b.titleEn ? String(b.titleEn).trim() : existing.titleEn,
            titleBn: b.titleBn ? String(b.titleBn).trim() : existing.titleBn,
            session: b.session ? String(b.session).trim() : existing.session,
            sourceUrl: b.sourceUrl ? String(b.sourceUrl).trim() : existing.sourceUrl,
            applicationDeadline:
              b.applicationDeadline !== undefined
                ? b.applicationDeadline
                  ? String(b.applicationDeadline)
                  : null
                : existing.applicationDeadline,
            reviewNotes:
              b.reviewNotes !== undefined
                ? b.reviewNotes
                  ? String(b.reviewNotes).trim()
                  : null
                : existing.reviewNotes,
            version: nextVersion,
            updatedBy,
            updatedAt: new Date(),
          })
          .where(eq(circulars.id, circularId))
          .returning();

        await writeAuditLog({
          actorUserId: req.authUser!.id,
          actorEmail: req.authUser!.email || req.authUser!.uid,
          actorRole: req.authUser!.adminRole!,
          action: 'CIRCULAR_UPDATED',
          entityType: 'circular',
          entityId: circularId,
          details: { titleEn: updated.titleEn, version: nextVersion, updatedBy },
        });

        res.json({ circular: updated });
      } catch (error) {
        console.error('Update circular metadata error:', error);
        res.status(500).json({ error: 'Failed to update circular metadata.' });
      }
    }
  );

  app.post(
    '/api/admin/circulars/:id/extract',
    requireAuth,
    requireRoles('super_admin', 'admin'),
    async (req: AuthRequest, res) => {
      try {
        const circularId = Number(req.params.id);
        const circRows = await db
          .select()
          .from(circulars)
          .where(eq(circulars.id, circularId))
          .limit(1);
        const circular = circRows[0];
        if (!circular) {
          return res.status(404).json({ error: 'Circular not found.' });
        }

        const instRows = await db
          .select()
          .from(institutions)
          .where(eq(institutions.id, circular.institutionId))
          .limit(1);
        const instName = instRows[0]?.nameEn || 'Bangladesh University';
        const updatedBy = formatAdminAttribution(req.authUser!);

        const extractedCandidates = await extractAdmissionRulesFromCircular({
          institutionName: instName,
          circularTitle: circular.titleEn,
          session: circular.session,
          pdfBase64: circular.pdfBase64,
          rawText: circular.rawCircularText,
        });

        await db
          .delete(admissionRules)
          .where(and(eq(admissionRules.circularId, circular.id), eq(admissionRules.isVerified, false)));

        const insertedRules = [];
        for (const candidate of extractedCandidates) {
          const [r] = await db
            .insert(admissionRules)
            .values({
              circularId: circular.id,
              institutionId: circular.institutionId,
              programName: candidate.programName,
              minSscGpa: candidate.minSscGpa ?? null,
              minHscGpa: candidate.minHscGpa ?? null,
              minCombinedGpa: candidate.minCombinedGpa ?? null,
              allowedGroups: candidate.allowedGroups,
              allowedHscYears: candidate.allowedHscYears,
              allowsSecondTimer: candidate.allowsSecondTimer,
              requiredSubjectMinGpa: candidate.requiredSubjectMinGpa,
              pageReference: candidate.pageReference,
              status: 'ai_extracted',
              isVerified: false,
              version: circular.version,
              updatedBy,
            })
            .returning();
          insertedRules.push(r);
        }

        await db
          .update(circulars)
          .set({ status: 'ai_extracted', updatedBy, updatedAt: new Date() })
          .where(eq(circulars.id, circular.id));

        await writeAuditLog({
          actorUserId: req.authUser!.id,
          actorEmail: req.authUser!.email || req.authUser!.uid,
          actorRole: req.authUser!.adminRole!,
          action: 'GEMINI_RULES_EXTRACTED',
          entityType: 'circular',
          entityId: circular.id,
          details: { extractedCount: insertedRules.length, updatedBy },
        });

        res.json({ rules: insertedRules });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Gemini extraction failed.';
        console.error('Gemini circular extraction error:', error);
        res.status(500).json({ error: msg });
      }
    }
  );

  app.put(
    '/api/admin/rules/:id',
    requireAuth,
    requireRoles('super_admin', 'admin'),
    async (req: AuthRequest, res) => {
      try {
        const ruleId = Number(req.params.id);
        const existingRows = await db
          .select()
          .from(admissionRules)
          .where(eq(admissionRules.id, ruleId))
          .limit(1);
        const existing = existingRows[0];
        if (!existing) {
          return res.status(404).json({ error: 'Admission rule not found.' });
        }

        const b = req.body ?? {};
        const nextVersion = existing.version + 1;
        const updatedBy = formatAdminAttribution(req.authUser!);

        const [updated] = await db
          .update(admissionRules)
          .set({
            programName: b.programName ? String(b.programName).trim() : existing.programName,
            gpaMode:
              b.gpaMode === 'without_fourth' || b.gpaMode === 'with_fourth'
                ? b.gpaMode
                : existing.gpaMode,
            minSscGpa: b.minSscGpa !== undefined && b.minSscGpa !== '' ? Number(b.minSscGpa) : null,
            minHscGpa: b.minHscGpa !== undefined && b.minHscGpa !== '' ? Number(b.minHscGpa) : null,
            minCombinedGpa:
              b.minCombinedGpa !== undefined && b.minCombinedGpa !== '' ? Number(b.minCombinedGpa) : null,
            minSscGpaWithoutFourth:
              b.minSscGpaWithoutFourth !== undefined && b.minSscGpaWithoutFourth !== ''
                ? Number(b.minSscGpaWithoutFourth)
                : existing.minSscGpaWithoutFourth,
            minHscGpaWithoutFourth:
              b.minHscGpaWithoutFourth !== undefined && b.minHscGpaWithoutFourth !== ''
                ? Number(b.minHscGpaWithoutFourth)
                : existing.minHscGpaWithoutFourth,
            minCombinedGpaWithoutFourth:
              b.minCombinedGpaWithoutFourth !== undefined && b.minCombinedGpaWithoutFourth !== ''
                ? Number(b.minCombinedGpaWithoutFourth)
                : existing.minCombinedGpaWithoutFourth,
            allowedGroups: Array.isArray(b.allowedGroups) ? b.allowedGroups : existing.allowedGroups,
            allowedBoards: Array.isArray(b.allowedBoards) ? b.allowedBoards : existing.allowedBoards,
            allowedSscYears: Array.isArray(b.allowedSscYears)
              ? b.allowedSscYears.map(Number).filter(Number.isInteger)
              : existing.allowedSscYears,
            allowedHscYears: Array.isArray(b.allowedHscYears)
              ? b.allowedHscYears.map(Number).filter(Number.isInteger)
              : existing.allowedHscYears,
            allowsSecondTimer:
              b.allowsSecondTimer !== undefined ? Boolean(b.allowsSecondTimer) : existing.allowsSecondTimer,
            requiredSubjectMinGpa:
              b.requiredSubjectMinGpa && typeof b.requiredSubjectMinGpa === 'object'
                ? b.requiredSubjectMinGpa
                : existing.requiredSubjectMinGpa,
            pageReference: b.pageReference ? String(b.pageReference) : existing.pageReference,
            version: nextVersion,
            updatedBy,
            updatedAt: new Date(),
          })
          .where(eq(admissionRules.id, ruleId))
          .returning();

        await db
          .update(circulars)
          .set({ updatedBy, updatedAt: new Date() })
          .where(eq(circulars.id, existing.circularId));

        await writeAuditLog({
          actorUserId: req.authUser!.id,
          actorEmail: req.authUser!.email || req.authUser!.uid,
          actorRole: req.authUser!.adminRole!,
          action: 'ADMISSION_RULE_EDITED',
          entityType: 'admission_rule',
          entityId: ruleId,
          details: { version: nextVersion, programName: updated.programName, updatedBy },
        });

        res.json({ rule: updated });
      } catch (error) {
        console.error('Update rule error:', error);
        res.status(500).json({ error: 'Failed to update admission rule.' });
      }
    }
  );

  app.post(
    '/api/admin/circulars/:id/workflow',
    requireAuth,
    requireRoles('super_admin', 'admin'),
    async (req: AuthRequest, res) => {
      try {
        const circularId = Number(req.params.id);
        const targetStatus = String(req.body?.status ?? '') as RulePublicationStatus;
        const reviewNotes = req.body?.reviewNotes ? String(req.body.reviewNotes).trim() : null;
        const role = req.authUser!.adminRole!;
        const updatedBy = formatAdminAttribution(req.authUser!);

        const validStatuses = new Set([
          'draft',
          'ai_extracted',
          'under_review',
          'published',
          'expired',
          'archived',
        ]);
        if (!validStatuses.has(targetStatus)) {
          return res.status(400).json({ error: 'Invalid workflow target status.' });
        }

        const existingRows = await db
          .select()
          .from(circulars)
          .where(eq(circulars.id, circularId))
          .limit(1);
        const existing = existingRows[0];
        if (!existing) {
          return res.status(404).json({ error: 'Circular not found.' });
        }

        const isVerified = targetStatus === 'published';
        const nextVersion = existing.version + 1;

        const [updatedCircular] = await db
          .update(circulars)
          .set({
            status: targetStatus,
            version: nextVersion,
            reviewNotes: reviewNotes ?? existing.reviewNotes,
            reviewedByUserId: req.authUser!.id,
            updatedBy,
            publishedAt: targetStatus === 'published' ? new Date() : existing.publishedAt,
            updatedAt: new Date(),
          })
          .where(eq(circulars.id, circularId))
          .returning();

        await db
          .update(admissionRules)
          .set({
            status: targetStatus,
            isVerified,
            version: nextVersion,
            updatedBy,
            updatedAt: new Date(),
          })
          .where(eq(admissionRules.circularId, circularId));

        await writeAuditLog({
          actorUserId: req.authUser!.id,
          actorEmail: req.authUser!.email || req.authUser!.uid,
          actorRole: role,
          action: `CIRCULAR_STATUS_${targetStatus.toUpperCase()}`,
          entityType: 'circular',
          entityId: circularId,
          details: {
            previousStatus: existing.status,
            targetStatus,
            reviewNotes,
            version: nextVersion,
            updatedBy,
          },
        });

        res.json({ circular: updatedCircular });
      } catch (error) {
        console.error('Workflow transition error:', error);
        res.status(500).json({ error: 'Failed to update circular workflow state.' });
      }
    }
  );

  // User Analytics & Student Directory (accessible to both super_admin and admin)
  app.get(
    '/api/admin/users',
    requireAuth,
    requireRoles('super_admin', 'admin'),
    async (_req: AuthRequest, res) => {
      try {
        const [studentUsers, profiles] = await Promise.all([
          db
            .select({
              id: users.id,
              email: users.email,
              fullName: users.fullName,
              phone: users.phone,
              accountType: users.accountType,
              adminRole: users.adminRole,
              isActive: users.isActive,
              createdAt: users.createdAt,
            })
            .from(users)
            .where(eq(users.accountType, 'student'))
            .orderBy(desc(users.createdAt)),
          db.select().from(studentProfiles),
        ]);

        const completedProfiles = profiles.filter(
          (p) => p.sscGpa !== null && p.hscGpa !== null
        ).length;
        const secondTimers = profiles.filter((p) => p.isSecondTimer).length;
        const groupCounts: Record<string, number> = {};
        for (const p of profiles) {
          const g = p.hscGroup || 'Unspecified';
          groupCounts[g] = (groupCounts[g] ?? 0) + 1;
        }

        res.json({
          users: studentUsers,
          analytics: {
            totalStudents: studentUsers.length,
            activeStudents: studentUsers.filter((u) => u.isActive).length,
            completedProfiles,
            secondTimers,
            groupCounts,
          },
        });
      } catch (error) {
        console.error('List student analytics error:', error);
        res.status(500).json({ error: 'Failed to load user analytics.' });
      }
    }
  );

  // Super Admin ONLY: List, Invite, Toggle, and Remove Admin Team Members
  app.get(
    '/api/admin/admins',
    requireAuth,
    requireRoles('super_admin'),
    async (_req: AuthRequest, res) => {
      try {
        const adminRows = await db
          .select({
            id: users.id,
            uid: users.uid,
            email: users.email,
            fullName: users.fullName,
            phone: users.phone,
            accountType: users.accountType,
            adminRole: users.adminRole,
            isActive: users.isActive,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          })
          .from(users)
          .where(eq(users.accountType, 'admin'))
          .orderBy(users.id);

        res.json({ admins: adminRows });
      } catch (error) {
        console.error('List admins error:', error);
        res.status(500).json({ error: 'Failed to load administrator team.' });
      }
    }
  );

  app.post(
    '/api/admin/admins',
    requireAuth,
    requireRoles('super_admin'),
    async (req: AuthRequest, res) => {
      try {
        const fullName = String(req.body?.fullName ?? '').trim();
        const email = String(req.body?.email ?? '').trim().toLowerCase();
        const temporaryPassword = String(
          req.body?.temporaryPassword ?? req.body?.password ?? ''
        );
        const requestedRole = req.body?.adminRole;

        if (!isValidInvitedAdminRole(requestedRole)) {
          return res.status(400).json({
            error: 'Invited administrators can only hold the "admin" role. Super Admin is owner-only via .env.',
          });
        }

        if (fullName.length < 2 || !isValidEmail(email) || temporaryPassword.trim().length < 6) {
          return res.status(400).json({
            error: 'Valid Full Name, Email, and temporary Password/OTP (at least 6 characters) are required.',
          });
        }

        const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existing[0]) {
          return res.status(409).json({ error: 'An account with this email already exists.' });
        }

        const updatedBy = formatAdminAttribution(req.authUser!);

        const [created] = await db
          .insert(users)
          .values({
            uid: `admin-${crypto.randomUUID()}`,
            email,
            fullName,
            passwordHash: hashPassword(temporaryPassword.trim()),
            accountType: 'admin',
            adminRole: 'admin',
            isActive: true,
          })
          .returning();

        await writeAuditLog({
          actorUserId: req.authUser!.id,
          actorEmail: req.authUser!.email || req.authUser!.uid,
          actorRole: 'super_admin',
          action: 'ADMIN_ACCOUNT_INVITED',
          entityType: 'user',
          entityId: created.id,
          details: { email: created.email, adminRole: 'admin', updatedBy },
        });

        res.status(201).json({
          user: {
            id: created.id,
            uid: created.uid,
            email: created.email,
            fullName: created.fullName,
            accountType: created.accountType,
            adminRole: created.adminRole,
            isActive: created.isActive,
            createdAt: created.createdAt,
          },
        });
      } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({ error: 'Failed to create administrator account.' });
      }
    }
  );

  app.patch(
    '/api/admin/admins/:id',
    requireAuth,
    requireRoles('super_admin'),
    async (req: AuthRequest, res) => {
      try {
        const targetId = Number(req.params.id);
        if (!Number.isInteger(targetId) || targetId <= 0) {
          return res.status(400).json({ error: 'Invalid administrator ID.' });
        }

        const existingRows = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
        const target = existingRows[0];
        if (!target || target.accountType !== 'admin') {
          return res.status(404).json({ error: 'Administrator account not found.' });
        }

        const guard = canModifyTargetAdmin(req.authUser!.id, req.authUser!.adminRole!, target);
        if (!guard.allowed) {
          return res.status(guard.status).json({ error: guard.reason });
        }

        if (req.body?.adminRole !== undefined && req.body.adminRole !== 'admin') {
          return res.status(400).json({
            error: 'Team administrators must hold the "admin" role.',
          });
        }

        const updates: {
          fullName?: string;
          isActive?: boolean;
          passwordHash?: string;
          updatedAt: Date;
        } = { updatedAt: new Date() };

        if (typeof req.body?.fullName === 'string' && req.body.fullName.trim().length >= 2) {
          updates.fullName = req.body.fullName.trim();
        }
        if (req.body?.isActive !== undefined) {
          updates.isActive = Boolean(req.body.isActive);
        }
        const newTempPass = String(req.body?.temporaryPassword ?? req.body?.password ?? '').trim();
        if (newTempPass) {
          if (newTempPass.length < 6) {
            return res.status(400).json({
              error: 'Temporary password/OTP must be at least 6 characters.',
            });
          }
          updates.passwordHash = hashPassword(newTempPass);
        }

        const [updated] = await db
          .update(users)
          .set(updates)
          .where(eq(users.id, targetId))
          .returning();

        const updatedBy = formatAdminAttribution(req.authUser!);
        await writeAuditLog({
          actorUserId: req.authUser!.id,
          actorEmail: req.authUser!.email || req.authUser!.uid,
          actorRole: 'super_admin',
          action:
            updates.isActive === false
              ? 'ADMIN_ACCESS_REVOKED'
              : updates.isActive === true
              ? 'ADMIN_ACCESS_RESTORED'
              : 'ADMIN_ACCOUNT_UPDATED',
          entityType: 'user',
          entityId: targetId,
          details: { email: updated.email, isActive: updated.isActive, updatedBy },
        });

        res.json({
          user: {
            id: updated.id,
            uid: updated.uid,
            email: updated.email,
            fullName: updated.fullName,
            accountType: updated.accountType,
            adminRole: updated.adminRole,
            isActive: updated.isActive,
          },
        });
      } catch (error) {
        console.error('Update admin error:', error);
        res.status(500).json({ error: 'Failed to update administrator account.' });
      }
    }
  );

  app.delete(
    '/api/admin/admins/:id',
    requireAuth,
    requireRoles('super_admin'),
    async (req: AuthRequest, res) => {
      try {
        const targetId = Number(req.params.id);
        if (!Number.isInteger(targetId) || targetId <= 0) {
          return res.status(400).json({ error: 'Invalid administrator ID.' });
        }

        const existingRows = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
        const target = existingRows[0];
        if (!target || target.accountType !== 'admin') {
          return res.status(404).json({ error: 'Administrator account not found.' });
        }

        const guard = canModifyTargetAdmin(req.authUser!.id, req.authUser!.adminRole!, target);
        if (!guard.allowed) {
          return res.status(guard.status).json({ error: guard.reason });
        }

        // Preserve historical updatedBy attribution text while nullifying FK references
        await db
          .update(circulars)
          .set({ uploadedByUserId: null })
          .where(eq(circulars.uploadedByUserId, targetId));
        await db
          .update(circulars)
          .set({ reviewedByUserId: null })
          .where(eq(circulars.reviewedByUserId, targetId));
        await db
          .update(auditLogs)
          .set({ actorUserId: null })
          .where(eq(auditLogs.actorUserId, targetId));

        await db.delete(users).where(eq(users.id, targetId));

        const updatedBy = formatAdminAttribution(req.authUser!);
        await writeAuditLog({
          actorUserId: req.authUser!.id,
          actorEmail: req.authUser!.email || req.authUser!.uid,
          actorRole: 'super_admin',
          action: 'ADMIN_ACCOUNT_REMOVED',
          entityType: 'user',
          entityId: targetId,
          details: { removedEmail: target.email, updatedBy },
        });

        res.json({ ok: true, removedId: targetId });
      } catch (error) {
        console.error('Delete admin error:', error);
        res.status(500).json({ error: 'Failed to remove administrator account.' });
      }
    }
  );

  app.patch(
    '/api/admin/users/:id/status',
    requireAuth,
    requireRoles('super_admin', 'admin'),
    async (req: AuthRequest, res) => {
      try {
        const userId = Number(req.params.id);
        const targetRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        const target = targetRows[0];
        if (!target) {
          return res.status(404).json({ error: 'User not found.' });
        }

        // Protect super_admin and restrict admin account toggling strictly to super_admin
        if (target.accountType === 'admin') {
          const guard = canModifyTargetAdmin(req.authUser!.id, req.authUser!.adminRole!, target);
          if (!guard.allowed) {
            return res.status(guard.status).json({ error: guard.reason });
          }
        }

        const isActive = Boolean(req.body?.isActive);
        const [updated] = await db
          .update(users)
          .set({ isActive, updatedAt: new Date() })
          .where(eq(users.id, userId))
          .returning();

        const updatedBy = formatAdminAttribution(req.authUser!);
        await writeAuditLog({
          actorUserId: req.authUser!.id,
          actorEmail: req.authUser!.email || req.authUser!.uid,
          actorRole: req.authUser!.adminRole!,
          action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
          entityType: 'user',
          entityId: userId,
          details: { email: updated.email, updatedBy },
        });

        res.json({ user: updated });
      } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ error: 'Failed to update user status.' });
      }
    }
  );

  app.get(
    '/api/admin/help-settings',
    requireAuth,
    requireRoles('super_admin', 'admin'),
    async (_req, res) => {
      res.type('application/json');
      try {
        const rows = await db.select().from(helpSettings).where(eq(helpSettings.id, 1)).limit(1);
        const settings = rows[0]
          ? normalizeHelpSettingsRecord({
              ...rows[0],
              updatedAt: rows[0].updatedAt?.toISOString(),
            })
          : { ...DEFAULT_HELP_SETTINGS };
        res.json({ settings });
      } catch (error) {
        console.error('Fetch admin help settings error:', error);
        res.status(500).json({ error: 'Failed to load Help & Support settings.' });
      }
    }
  );

  app.put(
    '/api/admin/help-settings',
    requireAuth,
    requireRoles('super_admin', 'admin'),
    async (req: AuthRequest, res) => {
      res.type('application/json');
      try {
        const parsed = sanitizeHelpSettingsPayload((req.body ?? {}) as Record<string, unknown>);
        if (parsed.ok === false) {
          return res.status(400).json({ error: parsed.error });
        }

        const updatedBy = formatAdminAttribution(req.authUser!);
        const now = new Date();
        const [saved] = await db
          .insert(helpSettings)
          .values({
            id: 1,
            ...parsed.data,
            updatedBy,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: helpSettings.id,
            set: {
              ...parsed.data,
              updatedBy,
              updatedAt: now,
            },
          })
          .returning();

        await writeAuditLog({
          actorUserId: req.authUser!.id,
          actorEmail: req.authUser!.email || req.authUser!.uid,
          actorRole: req.authUser!.adminRole!,
          action: 'HELP_SETTINGS_UPDATED',
          entityType: 'help_settings',
          entityId: 1,
          details: {
            isEnabled: saved.isEnabled,
            showWhatsapp: saved.showWhatsapp,
            whatsappPhone: saved.whatsappPhone,
            showCareerFinder: saved.showCareerFinder,
            requireLogin: saved.requireLogin,
            updatedBy,
          },
        });

        res.json({
          settings: normalizeHelpSettingsRecord({
            ...saved,
            updatedAt: saved.updatedAt?.toISOString(),
          }),
        });
      } catch (error) {
        console.error('Update help settings error:', error);
        res.status(500).json({ error: 'Failed to save Help & Support settings.' });
      }
    }
  );

  app.get(
    '/api/admin/audit-logs',
    requireAuth,
    requireRoles('super_admin', 'admin'),
    async (_req, res) => {
      try {
        const logs = await db
          .select()
          .from(auditLogs)
          .orderBy(desc(auditLogs.createdAt))
          .limit(100);
        res.json({ logs });
      } catch (error) {
        console.error('Audit log error:', error);
        res.status(500).json({ error: 'Failed to load audit logs.' });
      }
    }
  );

  app.use(['/api', '/api/*'], (_req, res) => {
    res.status(404).type('application/json').json({ error: 'API endpoint not found.' });
  });

  app.use(
    (
      err: unknown,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (res.headersSent) {
        return next(err);
      }
      if (req.path === '/api' || req.path.startsWith('/api/')) {
        const status =
          typeof (err as { status?: unknown })?.status === 'number'
            ? (err as { status: number }).status
            : typeof (err as { statusCode?: unknown })?.statusCode === 'number'
              ? (err as { statusCode: number }).statusCode
              : 500;
        const message =
          err instanceof SyntaxError && 'body' in err
            ? 'Invalid JSON request payload.'
            : err instanceof Error && status < 500
              ? err.message
              : 'Internal server error.';
        return res.status(status).type('application/json').json({ error: message });
      }
      return next(err);
    }
  );

  return app;
}

export const app = createApp();
export default app;

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  // ---------------------------------------------------------------------------
  // 5. Vite Dev Middleware / Production Static Serving
  // ---------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use((req, res, next) => {
      if (req.path === '/api' || req.path.startsWith('/api/')) {
        return next();
      }
      return vite.middlewares(req, res, next);
    });
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path === '/api' || req.path.startsWith('/api/')) {
        return next();
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dream University server running on http://localhost:${PORT}`);
  });
}

const isDirectExecution =
  !process.env.VERCEL &&
  typeof process.argv[1] === 'string' &&
  path.resolve(process.argv[1]) === __filename;

if (isDirectExecution) {
  startServer().catch((err) => {
    console.error('Fatal server startup error:', err);
    process.exit(1);
  });
}
