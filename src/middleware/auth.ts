import type { NextFunction, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { adminAuth } from '../lib/firebase-admin.ts';
import { verifySessionToken } from '../server/authCrypto.ts';
import { normalizeAdminRole } from '../server/adminRbac.ts';
import type { AdminRole } from '../types/domain.ts';

export interface AuthenticatedDbUser {
  id: number;
  uid: string;
  email: string | null;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  accountType: 'student' | 'admin';
  adminRole: AdminRole | null;
  isActive: boolean;
}

export interface AuthRequest extends Request {
  authUser?: AuthenticatedDbUser;
}

export async function resolveTokenToUser(token: string): Promise<AuthenticatedDbUser | null> {
  // 1. Check signed session token (issued for email+password auth)
  const sessionPayload = verifySessionToken(token);
  if (sessionPayload) {
    const found = await db
      .select()
      .from(users)
      .where(eq(users.id, sessionPayload.userId))
      .limit(1);
    const row = found[0];
    if (!row || !row.isActive) return null;
    return {
      id: row.id,
      uid: row.uid,
      email: row.email,
      fullName: row.fullName,
      phone: row.phone,
      avatarUrl: row.avatarUrl ?? null,
      accountType: row.accountType as 'student' | 'admin',
      adminRole: row.accountType === 'admin' ? normalizeAdminRole(row.adminRole) : null,
      isActive: row.isActive,
    };
  }

  // 2. Fallback to Firebase ID Token verification (Google Sign-In)
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const email = (decoded.email || '').toLowerCase();
    if (!email) return null;

    // Look up by uid or email first so existing admins keep their adminRole
    const byUid = await db.select().from(users).where(eq(users.uid, decoded.uid)).limit(1);
    if (byUid[0]) {
      const row = byUid[0];
      if (!row.isActive) return null;
      return {
        id: row.id,
        uid: row.uid,
        email: row.email,
        fullName: row.fullName,
        phone: row.phone,
        avatarUrl: row.avatarUrl ?? null,
        accountType: row.accountType as 'student' | 'admin',
        adminRole: row.accountType === 'admin' ? normalizeAdminRole(row.adminRole) : null,
        isActive: row.isActive,
      };
    }

    const byEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (byEmail[0]) {
      const updated = await db
        .update(users)
        .set({ uid: decoded.uid, updatedAt: new Date() })
        .where(eq(users.id, byEmail[0].id))
        .returning();
      const row = updated[0];
      if (!row.isActive) return null;
      return {
        id: row.id,
        uid: row.uid,
        email: row.email,
        fullName: row.fullName,
        phone: row.phone,
        avatarUrl: row.avatarUrl ?? null,
        accountType: row.accountType as 'student' | 'admin',
        adminRole: row.accountType === 'admin' ? normalizeAdminRole(row.adminRole) : null,
        isActive: row.isActive,
      };
    }

    // Upsert new Firebase user strictly as a student (never admin)
    const inserted = await db
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

    const row = inserted[0];
    return {
      id: row.id,
      uid: row.uid,
      email: row.email,
      fullName: row.fullName,
      phone: row.phone,
      avatarUrl: row.avatarUrl ?? null,
      accountType: 'student',
      adminRole: null,
      isActive: row.isActive,
    };
  } catch {
    return null;
  }
}

export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('du_session='));
    if (match) {
      return decodeURIComponent(match.slice('du_session='.length));
    }
  }
  if (typeof req.query?.token === 'string' && req.query.token.trim()) {
    return req.query.token.trim();
  }
  return null;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing authentication token' });
  }

  try {
    const authUser = await resolveTokenToUser(token);
    if (!authUser) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
    }
    req.authUser = authUser;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.authUser.accountType !== 'admin' || !req.authUser.adminRole) {
    return res.status(403).json({ error: 'Forbidden: Administrator role required' });
  }
  next();
}

export function requireRoles(...allowedRoles: AdminRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.authUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (
      req.authUser.accountType !== 'admin' ||
      !req.authUser.adminRole ||
      !allowedRoles.includes(req.authUser.adminRole)
    ) {
      return res.status(403).json({
        error: `Forbidden: Requires one of [${allowedRoles.join(', ')}]`,
      });
    }
    next();
  };
}
