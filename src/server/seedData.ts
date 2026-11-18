import crypto from 'node:crypto';
import { and, eq, inArray, ne, sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  admissionRules,
  auditLogs,
  circulars,
  helpSettings,
  institutionRankings,
  institutions,
  studentProfiles,
  users,
} from '../db/schema.ts';
import { BANGLADESH_INSTITUTIONS_CATALOG } from '../data/bangladeshInstitutions.ts';
import { RANKING_CITATIONS_2026 } from '../data/universityRankings.ts';
import { DEFAULT_HELP_SETTINGS } from '../utils/helpSettings.ts';
import { hashPassword } from './authCrypto.ts';
import { buildCircularPdfBase64 } from './pdfGenerator.ts';
import { getCircularTemplateForInstitution } from './unitRulesCatalog.ts';

let seedPromise: Promise<void> | null = null;
let lastSeededOwnerKey: string | null = null;

const LEGACY_DEMO_ADMIN_EMAILS = [
  'superadmin@dreamuniversity.edu.bd',
  'dataentry@dreamuniversity.edu.bd',
  'reviewer@dreamuniversity.edu.bd',
];

async function syncEnvSuperAdmin(): Promise<{ id: number | null; email: string | null }> {
  const ownerEmail = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const ownerPassword = process.env.ADMIN_PASSWORD ?? '';
  const ownerName = (process.env.ADMIN_NAME ?? '').trim() || 'Super Admin (Owner)';

  // Remove legacy hardcoded demo admin accounts safely (reassigning FKs to null first)
  const demoEmailsToPurge = LEGACY_DEMO_ADMIN_EMAILS.filter((email) => email !== ownerEmail);
  if (demoEmailsToPurge.length > 0) {
    const legacyRows = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.email, demoEmailsToPurge));
    const legacyIds = legacyRows.map((r) => r.id);
    if (legacyIds.length > 0) {
      await db
        .update(circulars)
        .set({ uploadedByUserId: null })
        .where(inArray(circulars.uploadedByUserId, legacyIds));
      await db
        .update(circulars)
        .set({ reviewedByUserId: null })
        .where(inArray(circulars.reviewedByUserId, legacyIds));
      await db
        .update(auditLogs)
        .set({ actorUserId: null })
        .where(inArray(auditLogs.actorUserId, legacyIds));
      await db.delete(users).where(inArray(users.id, legacyIds));
    }
  }

  // Normalize any legacy 3-tier or unwanted role names strictly to two-tier ('admin')
  await db
    .update(users)
    .set({ adminRole: 'admin', updatedAt: new Date() })
    .where(
      and(
        eq(users.accountType, 'admin'),
        inArray(users.adminRole, ['data_entry_admin', 'reviewer_admin', 'editor', 'moderator'])
      )
    );

  if (!ownerEmail || !ownerPassword) {
    console.warn(
      '[Admin Setup] ADMIN_EMAIL and ADMIN_PASSWORD are not configured in environment; skipping super_admin initialization.'
    );
    return { id: null, email: null };
  }

  const passwordHash = hashPassword(ownerPassword);

  // Ensure no other account holds super_admin if ADMIN_EMAIL changed
  await db
    .update(users)
    .set({ adminRole: 'admin', updatedAt: new Date() })
    .where(
      and(
        eq(users.accountType, 'admin'),
        eq(users.adminRole, 'super_admin'),
        ne(users.email, ownerEmail)
      )
    );

  const existingOwner = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, ownerEmail))
    .limit(1);

  if (existingOwner[0]) {
    const [updatedOwner] = await db
      .update(users)
      .set({
        fullName: ownerName,
        passwordHash,
        accountType: 'admin',
        adminRole: 'super_admin',
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingOwner[0].id))
      .returning({ id: users.id, email: users.email });
    return { id: updatedOwner.id, email: updatedOwner.email };
  }

  const ownerUid = `admin-owner-${crypto
    .createHash('sha256')
    .update(ownerEmail)
    .digest('hex')
    .slice(0, 12)}`;

  const [createdOwner] = await db
    .insert(users)
    .values({
      uid: ownerUid,
      email: ownerEmail,
      fullName: ownerName,
      passwordHash,
      accountType: 'admin',
      adminRole: 'super_admin',
      isActive: true,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        fullName: ownerName,
        passwordHash,
        accountType: 'admin',
        adminRole: 'super_admin',
        isActive: true,
        updatedAt: new Date(),
      },
    })
    .returning({ id: users.id, email: users.email });

  return { id: createdOwner.id, email: createdOwner.email };
}

export async function ensureSeeded(): Promise<void> {
  const currentOwnerKey = `${process.env.ADMIN_EMAIL ?? ''}::${process.env.ADMIN_PASSWORD ?? ''}`;
  if (!seedPromise || lastSeededOwnerKey !== currentOwnerKey) {
    lastSeededOwnerKey = currentOwnerKey;
    seedPromise = runIdempotentSeed().catch((err: any) => {
      console.error('[Seed Data] Seed execution error:', err);
      if (err?.cause) {
        console.error('[Seed Data] Underlying error cause:', err.cause);
      }
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}

async function ensurePostgresSchemaBootstrapped(): Promise<void> {
  // 1. Fast path: check if core tables already exist. If so, skip DDL execution completely.
  try {
    const tableProbe = await db.execute(sql`
      SELECT to_regclass('public.users') AS users_table, to_regclass('public.institutions') AS inst_table;
    `);
    const probeRow = tableProbe.rows[0] as { users_table?: string | null; inst_table?: string | null } | undefined;
    if (probeRow?.users_table && probeRow?.inst_table) {
      return;
    }
  } catch (probeError: any) {
    console.warn('[Schema Bootstrap] Table probe notice (will attempt creation):', probeError?.cause ?? probeError);
  }

  // 2. Fresh database: execute schema creation idempotently.
  try {
    await db.execute(sql`
    DO $$
    BEGIN
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        uid TEXT NOT NULL UNIQUE,
        email TEXT UNIQUE,
        full_name TEXT NOT NULL,
        phone TEXT,
        avatar_url TEXT,
        password_hash TEXT,
        account_type TEXT NOT NULL DEFAULT 'student',
        admin_role TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS student_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        ssc_board TEXT,
        ssc_year INTEGER,
        ssc_group TEXT,
        ssc_gpa REAL,
        ssc_gpa_without_fourth REAL,
        hsc_board TEXT,
        hsc_year INTEGER,
        hsc_group TEXT,
        hsc_gpa REAL,
        hsc_gpa_without_fourth REAL,
        fourth_subject_code TEXT,
        selected_subjects JSONB NOT NULL DEFAULT '[]'::jsonb,
        subject_grades JSONB NOT NULL DEFAULT '{}'::jsonb,
        is_second_timer BOOLEAN NOT NULL DEFAULT FALSE,
        preferred_subject TEXT,
        preferred_city TEXT,
        college_name TEXT,
        tuition_budget_bdt INTEGER,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS otp_resets (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        otp_code TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS otp_verifications (
        id SERIAL PRIMARY KEY,
        identifier TEXT NOT NULL,
        identifier_type TEXT NOT NULL,
        purpose TEXT NOT NULL,
        otp_hash TEXT NOT NULL,
        pending_full_name TEXT,
        pending_password_hash TEXT,
        expires_at TIMESTAMP NOT NULL,
        verified BOOLEAN NOT NULL DEFAULT FALSE,
        used BOOLEAN NOT NULL DEFAULT FALSE,
        attempts INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS institutions (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name_en TEXT NOT NULL,
        name_bn TEXT NOT NULL,
        short_note_en TEXT NOT NULL,
        short_note_bn TEXT NOT NULL,
        location_en TEXT NOT NULL,
        location_bn TEXT NOT NULL,
        city TEXT NOT NULL,
        established_year INTEGER,
        category TEXT NOT NULL,
        institution_type TEXT NOT NULL,
        institution_type_bn TEXT NOT NULL,
        official_website TEXT NOT NULL,
        image_url TEXT,
        image_alt_en TEXT NOT NULL,
        image_alt_bn TEXT NOT NULL,
        programs_en JSONB NOT NULL DEFAULT '[]'::jsonb,
        programs_bn JSONB NOT NULL DEFAULT '[]'::jsonb,
        per_credit_fee_bdt INTEGER,
        total_credits INTEGER,
        semester_fee_bdt INTEGER,
        admission_fee_bdt INTEGER,
        estimated_total_cost_bdt INTEGER,
        updated_by TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS institution_rankings (
        id SERIAL PRIMARY KEY,
        institution_code TEXT NOT NULL UNIQUE,
        qs_global_2026 TEXT NOT NULL,
        the_global_2026 TEXT NOT NULL,
        qs_rank_score INTEGER,
        the_rank_score INTEGER,
        qs_asia_rank_score INTEGER,
        bangladesh_standing_en TEXT NOT NULL,
        bangladesh_standing_bn TEXT NOT NULL,
        source_citation TEXT NOT NULL,
        citation_year INTEGER NOT NULL DEFAULT 2026,
        source_url TEXT NOT NULL,
        updated_by TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS circulars (
        id SERIAL PRIMARY KEY,
        institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
        title_en TEXT NOT NULL,
        title_bn TEXT NOT NULL,
        session TEXT NOT NULL,
        source_url TEXT NOT NULL,
        application_deadline TEXT,
        pdf_filename TEXT,
        pdf_base64 TEXT,
        raw_circular_text TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        version INTEGER NOT NULL DEFAULT 1,
        uploaded_by_user_id INTEGER REFERENCES users(id),
        reviewed_by_user_id INTEGER REFERENCES users(id),
        updated_by TEXT,
        review_notes TEXT,
        published_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS admission_rules (
        id SERIAL PRIMARY KEY,
        circular_id INTEGER NOT NULL REFERENCES circulars(id) ON DELETE CASCADE,
        institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
        program_name TEXT NOT NULL,
        gpa_mode TEXT NOT NULL DEFAULT 'with_fourth',
        min_ssc_gpa REAL,
        min_hsc_gpa REAL,
        min_combined_gpa REAL,
        min_ssc_gpa_without_fourth REAL,
        min_hsc_gpa_without_fourth REAL,
        min_combined_gpa_without_fourth REAL,
        allowed_groups JSONB NOT NULL DEFAULT '[]'::jsonb,
        allowed_boards JSONB NOT NULL DEFAULT '[]'::jsonb,
        allowed_ssc_years JSONB NOT NULL DEFAULT '[]'::jsonb,
        allowed_hsc_years JSONB NOT NULL DEFAULT '[]'::jsonb,
        allows_second_timer BOOLEAN NOT NULL DEFAULT FALSE,
        required_subject_min_gpa JSONB NOT NULL DEFAULT '{}'::jsonb,
        page_reference TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        is_verified BOOLEAN NOT NULL DEFAULT FALSE,
        version INTEGER NOT NULL DEFAULT 1,
        updated_by TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        actor_user_id INTEGER REFERENCES users(id),
        actor_email TEXT NOT NULL,
        actor_role TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        details JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS help_settings (
        id INTEGER PRIMARY KEY,
        is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        show_whatsapp BOOLEAN NOT NULL DEFAULT TRUE,
        whatsapp_phone TEXT NOT NULL DEFAULT '01753653351',
        whatsapp_subtitle TEXT NOT NULL DEFAULT 'WhatsApp Direct · 01753653351',
        whatsapp_message TEXT NOT NULL DEFAULT 'Hello Dream University Team, I need admission guidance.',
        show_career_finder BOOLEAN NOT NULL DEFAULT TRUE,
        require_login BOOLEAN NOT NULL DEFAULT TRUE,
        updated_by TEXT,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      ALTER TABLE institutions ADD COLUMN IF NOT EXISTS updated_by TEXT;
      ALTER TABLE institution_rankings ADD COLUMN IF NOT EXISTS updated_by TEXT;
      ALTER TABLE circulars ADD COLUMN IF NOT EXISTS updated_by TEXT;
      ALTER TABLE admission_rules ADD COLUMN IF NOT EXISTS updated_by TEXT;
    EXCEPTION
      WHEN duplicate_table OR duplicate_object OR unique_violation OR insufficient_privilege THEN
        NULL;
    END $$;
  `);
  } catch (ddlError: any) {
    console.warn('[Schema Bootstrap] DDL execution notice (ignoring if tables exist):', ddlError?.cause?.message ?? ddlError?.message ?? ddlError);
  }
}

async function runIdempotentSeed(): Promise<void> {
  // 0. Ensure schema exists on fresh Neon / Vercel Postgres databases (safe no-op on Cloud SQL)
  await ensurePostgresSchemaBootstrapped();

  // 1. Initialize ONLY the .env primary owner super_admin account (no hardcoded/demo admins)
  const { id: superAdminId, email: superAdminEmail } = await syncEnvSuperAdmin();
  const reviewerId = superAdminId;

  // 1b. Seed default Help & Support settings row (id = 1) idempotently
  await db
    .insert(helpSettings)
    .values({
      id: 1,
      isEnabled: DEFAULT_HELP_SETTINGS.isEnabled,
      showWhatsapp: DEFAULT_HELP_SETTINGS.showWhatsapp,
      whatsappPhone: DEFAULT_HELP_SETTINGS.whatsappPhone,
      whatsappSubtitle: DEFAULT_HELP_SETTINGS.whatsappSubtitle,
      whatsappMessage: DEFAULT_HELP_SETTINGS.whatsappMessage,
      showCareerFinder: DEFAULT_HELP_SETTINGS.showCareerFinder,
      requireLogin: DEFAULT_HELP_SETTINGS.requireLogin,
      updatedBy: null,
    })
    .onConflictDoNothing({ target: helpSettings.id });

  // Ensure a reference student exists for initial testing if needed
  const demoStudentEmail = 'student@dreamuniversity.edu.bd';
  await db
    .insert(users)
    .values({
      uid: 'student-seed-1',
      email: demoStudentEmail,
      fullName: 'Tanvir Ahmed',
      phone: '01712345678',
      passwordHash: hashPassword('Student@2026'),
      accountType: 'student',
      adminRole: null,
    })
    .onConflictDoNothing({ target: users.email });

  const studentRows = await db
    .select()
    .from(users)
    .where(eq(users.email, demoStudentEmail))
    .limit(1);
  if (studentRows[0]) {
    await db
      .insert(studentProfiles)
      .values({
        userId: studentRows[0].id,
        sscBoard: 'Dhaka Education Board',
        sscYear: 2023,
        sscGroup: 'Science',
        sscGpa: 5.0,
        sscGpaWithoutFourth: 5.0,
        hscBoard: 'Dhaka Education Board',
        hscYear: 2025,
        hscGroup: 'Science',
        hscGpa: 4.83,
        hscGpaWithoutFourth: 4.58,
        fourthSubjectCode: '178',
        selectedSubjects: ['Bangla', 'English', 'ICT', 'Physics', 'Chemistry', 'Biology', 'Mathematics'],
        subjectGrades: {
          Bangla: 5.0,
          English: 4.5,
          ICT: 5.0,
          Physics: 5.0,
          Chemistry: 4.5,
          Mathematics: 5.0,
          Biology: 4.5,
        },
        isSecondTimer: false,
        preferredSubject: 'Computer Science & Engineering',
        preferredCity: 'Dhaka',
        collegeName: 'Notre Dame College, Dhaka',
        tuitionBudgetBdt: 950000,
      })
      .onConflictDoNothing({ target: studentProfiles.userId });

    // Backfill newly added 4th-subject, board & college fields if existing demo profile predates schema update
    const existingDemoProfile = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, studentRows[0].id))
      .limit(1);
    if (
      existingDemoProfile[0] &&
      (existingDemoProfile[0].hscGpaWithoutFourth === null ||
        existingDemoProfile[0].collegeName === null)
    ) {
      await db
        .update(studentProfiles)
        .set({
          sscBoard: 'Dhaka Education Board',
          hscBoard: 'Dhaka Education Board',
          sscGpaWithoutFourth: 5.0,
          hscGpaWithoutFourth: 4.58,
          fourthSubjectCode: '178',
          selectedSubjects: ['Bangla', 'English', 'ICT', 'Physics', 'Chemistry', 'Biology', 'Mathematics'],
          collegeName: existingDemoProfile[0].collegeName ?? 'Notre Dame College, Dhaka',
        })
        .where(eq(studentProfiles.id, existingDemoProfile[0].id));
    }
  }

  // 2. Idempotently seed & synchronize comprehensive Bangladesh Institutions Catalog (205 real institutions)
  const existingInsts = await db
    .select({
      id: institutions.id,
      code: institutions.code,
      category: institutions.category,
      institutionType: institutions.institutionType,
      institutionTypeBn: institutions.institutionTypeBn,
      establishedYear: institutions.establishedYear,
      imageUrl: institutions.imageUrl,
    })
    .from(institutions);

  if (existingInsts.length < BANGLADESH_INSTITUTIONS_CATALOG.length) {
    const chunkSize = 50;
    for (let i = 0; i < BANGLADESH_INSTITUTIONS_CATALOG.length; i += chunkSize) {
      const batch = BANGLADESH_INSTITUTIONS_CATALOG.slice(i, i + chunkSize);
      await db
        .insert(institutions)
        .values(batch)
        .onConflictDoUpdate({
          target: institutions.code,
          set: {
            category: sql`excluded.category`,
            institutionType: sql`excluded.institution_type`,
            institutionTypeBn: sql`excluded.institution_type_bn`,
            establishedYear: sql`COALESCE(${institutions.establishedYear}, excluded.established_year)`,
            imageUrl: sql`excluded.image_url`,
            imageAltEn: sql`excluded.image_alt_en`,
            imageAltBn: sql`excluded.image_alt_bn`,
          },
        });
    }
  } else {
    // Synchronize establishedYear, category (e.g. CoU -> gst), and unique Wikipedia/null imageUrl on pre-existing seed rows
    const byCodeSpec = new Map(BANGLADESH_INSTITUTIONS_CATALOG.map((item) => [item.code, item]));
    for (const row of existingInsts) {
      const spec = byCodeSpec.get(row.code);
      if (!spec) continue;
      const needsYear = row.establishedYear === null && spec.establishedYear !== null;
      const needsImageSync = row.imageUrl !== spec.imageUrl;
      const needsCategorySync = row.category !== spec.category;
      if (needsYear || needsImageSync || needsCategorySync) {
        await db
          .update(institutions)
          .set({
            ...(needsYear ? { establishedYear: spec.establishedYear } : {}),
            ...(needsCategorySync
              ? {
                  category: spec.category,
                  institutionType: spec.institutionType,
                  institutionTypeBn: spec.institutionTypeBn,
                }
              : {}),
            ...(needsImageSync
              ? {
                  imageUrl: spec.imageUrl,
                  imageAltEn: spec.imageAltEn,
                  imageAltBn: spec.imageAltBn,
                }
              : {}),
          })
          .where(eq(institutions.id, row.id));
      }
    }
  }

  // 2b. Idempotently seed & synchronize verified 2026 QS/THE global & regional rankings
  for (const rankRow of RANKING_CITATIONS_2026) {
    await db
      .insert(institutionRankings)
      .values(rankRow)
      .onConflictDoUpdate({
        target: institutionRankings.institutionCode,
        set: {
          qsGlobal2026: rankRow.qsGlobal2026,
          theGlobal2026: rankRow.theGlobal2026,
          qsRankScore: rankRow.qsRankScore,
          theRankScore: rankRow.theRankScore,
          qsAsiaRankScore: rankRow.qsAsiaRankScore,
          bangladeshStandingEn: rankRow.bangladeshStandingEn,
          bangladeshStandingBn: rankRow.bangladeshStandingBn,
          sourceCitation: rankRow.sourceCitation,
          citationYear: rankRow.citationYear,
          sourceUrl: rankRow.sourceUrl,
          updatedAt: new Date(),
        },
      });
  }

  // 3. Seed Official Admission Circulars with real valid PDF binaries + deterministic rules (once)
  const existingCirculars = await db.select({ id: circulars.id }).from(circulars).limit(1);
  if (existingCirculars.length === 0) {
    const allInsts = await db.select().from(institutions);
    const byCode = new Map(allInsts.map((i) => [i.code, i]));

    const circularSpecs = [
      {
        code: 'DU',
        titleEn: 'University of Dhaka Science Unit (Ka) Admission Circular 2025-2026',
        titleBn: 'ঢাকা বিশ্ববিদ্যালয় বিজ্ঞান ইউনিট (ক) ভর্তি বিজ্ঞপ্তি ২০২৫-২০২৬',
        session: '2025-2026',
        sourceUrl: 'https://admission.eis.du.ac.bd',
        deadline: '2026-11-30',
        pdfFilename: 'du-science-unit-circular-2025-2026.pdf',
        status: 'published',
        isVerified: true,
        rawText:
          'University of Dhaka Science Unit (Ka) Admission 2025-2026: Minimum SSC GPA 3.50, HSC GPA 3.50, Combined SSC + HSC GPA 8.00 (including 4th subject). Science group required. Only first-time applicants (HSC 2025) are eligible. Minimum Physics 3.50, Chemistry 3.50, Mathematics 3.50 required for CSE/Engineering track.',
        rules: [
          {
            programName: 'Science Unit (Ka) — CSE & Physical Sciences',
            minSscGpa: 3.5,
            minHscGpa: 3.5,
            minCombinedGpa: 8.0,
            allowedGroups: ['Science'],
            allowedHscYears: [2025],
            allowsSecondTimer: false,
            requiredSubjectMinGpa: { Physics: 3.5, Chemistry: 3.5, Mathematics: 3.5 },
            pageReference: 'Page 1, Section 2.1',
          },
        ],
      },
      {
        code: 'BUET',
        titleEn: 'BUET Undergraduate Admission Circular 2025-2026',
        titleBn: 'বুয়েট স্নাতক ভর্তি বিজ্ঞপ্তি ২০২৫-২০২৬',
        session: '2025-2026',
        sourceUrl: 'https://ugadmission.buet.ac.bd',
        deadline: '2026-12-05',
        pdfFilename: 'buet-undergraduate-circular-2025-2026.pdf',
        status: 'published',
        isVerified: true,
        rawText:
          'BUET Engineering Undergraduate Admission 2025-2026: Science group only. Minimum SSC GPA 4.50 and HSC GPA 4.50 (with 4th subject), Combined GPA at least 9.00, and minimum GPA 4.00 without 4th subject. Second timers are not permitted (HSC 2025 only). Minimum GPA 4.50 in Physics, Chemistry, and Higher Mathematics required.',
        rules: [
          {
            programName: 'Engineering Track (CSE / EEE / Civil)',
            gpaMode: 'with_fourth',
            minSscGpa: 4.5,
            minHscGpa: 4.5,
            minCombinedGpa: 9.0,
            minSscGpaWithoutFourth: 4.0,
            minHscGpaWithoutFourth: 4.0,
            allowedGroups: ['Science'],
            allowedHscYears: [2025],
            allowsSecondTimer: false,
            requiredSubjectMinGpa: { Physics: 4.5, Chemistry: 4.5, Mathematics: 4.5 },
            pageReference: 'Page 1, Clause 3(a)',
          },
        ],
      },
      {
        code: 'DMC',
        titleEn: 'DGME Centralized MBBS Admission Circular (DMC) 2025-2026',
        titleBn: 'স্বাস্থ্য শিক্ষা অধিদপ্তর এমবিবিএস ভর্তি বিজ্ঞপ্তি (ডিএমসি) ২০২৫-২০২৬',
        session: '2025-2026',
        sourceUrl: 'https://dgme.gov.bd',
        deadline: '2026-12-12',
        pdfFilename: 'dgme-mbbs-dmc-circular-2025-2026.pdf',
        status: 'published',
        isVerified: true,
        rawText:
          'DGME Centralized MBBS Admission (Dhaka Medical College): Minimum SSC GPA 4.00, HSC GPA 4.00, Combined GPA at least 9.00. Science group required with minimum Biology GPA 4.00. HSC passing years 2024 and 2025 permitted (second-time applicants eligible subject to DGME mark deduction).',
        rules: [
          {
            programName: 'MBBS (Centralized DGME Admission)',
            minSscGpa: 4.0,
            minHscGpa: 4.0,
            minCombinedGpa: 9.0,
            allowedGroups: ['Science'],
            allowedHscYears: [2024, 2025],
            allowsSecondTimer: true,
            requiredSubjectMinGpa: { Biology: 4.0 },
            pageReference: 'Page 1, Clause 4',
          },
        ],
      },
      {
        code: 'DIU',
        titleEn: 'Daffodil International University Undergraduate Admission Circular 2026',
        titleBn: 'ড্যাফোডিল ইন্টারন্যাশনাল ইউনিভার্সিটি স্নাতক ভর্তি বিজ্ঞপ্তি ২০২৬',
        session: 'Spring/Summer 2026',
        sourceUrl: 'https://admission.daffodilvarsity.edu.bd',
        deadline: '2026-12-20',
        pdfFilename: 'diu-cse-admission-circular-2026.pdf',
        status: 'published',
        isVerified: true,
        rawText:
          'Daffodil International University B.Sc. in CSE Admission 2026: Minimum SSC GPA 2.50, HSC GPA 2.50, Combined GPA 6.00. Science group with Mathematics GPA 2.50 required. Second-time applicants and HSC 2023/2024/2025 graduates are eligible. Per-credit fee BDT 5,200 (148 credits).',
        rules: [
          {
            programName: 'B.Sc. in Computer Science & Engineering (CSE)',
            minSscGpa: 2.5,
            minHscGpa: 2.5,
            minCombinedGpa: 6.0,
            allowedGroups: ['Science'],
            allowedHscYears: [2023, 2024, 2025],
            allowsSecondTimer: true,
            requiredSubjectMinGpa: { Mathematics: 2.5 },
            pageReference: 'Page 1, Engineering Eligibility Table',
          },
        ],
      },
      {
        code: 'SUST',
        titleEn: 'GST Integrated Cluster Science (Unit A) Circular — SUST 2025-2026',
        titleBn: 'জিএসটি গুচ্ছ বিজ্ঞান (ইউনিট ক) ভর্তি বিজ্ঞপ্তি — শাবিপ্রবি ২০২৫-২০২৬',
        session: '2025-2026',
        sourceUrl: 'https://gstadmission.ac.bd',
        deadline: '2026-12-15',
        pdfFilename: 'gst-unit-a-sust-circular-2025-2026.pdf',
        status: 'published',
        isVerified: true,
        rawText:
          'GST Cluster Unit A (Science — SUST): Minimum SSC GPA 3.50, HSC GPA 3.50, Combined GPA 8.00. Science group required. HSC passing years 2024 and 2025 eligible.',
        rules: [
          {
            programName: 'GST Unit A — CSE & Applied Sciences',
            minSscGpa: 3.5,
            minHscGpa: 3.5,
            minCombinedGpa: 8.0,
            allowedGroups: ['Science'],
            allowedHscYears: [2024, 2025],
            allowsSecondTimer: true,
            requiredSubjectMinGpa: {},
            pageReference: 'Page 1, Unit A Criteria',
          },
        ],
      },
      {
        code: 'NU',
        titleEn: 'National University Honours Admission Circular 2025-2026',
        titleBn: 'জাতীয় বিশ্ববিদ্যালয় স্নাতক (সম্মান) ভর্তি বিজ্ঞপ্তি ২০২৫-২০২৬',
        session: '2025-2026',
        sourceUrl: 'https://app1.nu.edu.bd',
        deadline: '2026-12-28',
        pdfFilename: 'nu-honours-admission-circular-2025-2026.pdf',
        status: 'published',
        isVerified: true,
        rawText:
          'National University Honours Admission 2025-2026: Open to Science, Commerce, and Humanities. Minimum SSC GPA 2.50, HSC GPA 2.50, Combined GPA 5.50. HSC passing years 2023, 2024, and 2025 eligible.',
        rules: [
          {
            programName: 'Honours (Science / Business / Humanities Tracks)',
            minSscGpa: 2.5,
            minHscGpa: 2.5,
            minCombinedGpa: 5.5,
            allowedGroups: ['Science', 'Commerce', 'Humanities'],
            allowedHscYears: [2023, 2024, 2025],
            allowsSecondTimer: true,
            requiredSubjectMinGpa: {},
            pageReference: 'Page 1, General Eligibility',
          },
        ],
      },
      {
        code: 'DIU',
        titleEn: 'DIU Business Administration (BBA) Draft Circular — Pending Verification',
        titleBn: 'ডিআইইউ ব্যবসায় প্রশাসন (বিবিএ) সার্কুলার — যাচাইয়ের অপেক্ষায়',
        session: '2026',
        sourceUrl: 'https://admission.daffodilvarsity.edu.bd',
        deadline: '2026-12-25',
        pdfFilename: 'diu-bba-pending-review-2026.pdf',
        status: 'under_review',
        isVerified: false,
        rawText:
          'Daffodil International University BBA Draft Circular: Minimum SSC GPA 2.50, HSC GPA 2.50, Combined GPA 5.50 for Science, Commerce, and Humanities. Pending Reviewer Admin confirmation.',
        rules: [
          {
            programName: 'Bachelor of Business Administration (BBA)',
            minSscGpa: 2.5,
            minHscGpa: 2.5,
            minCombinedGpa: 5.5,
            allowedGroups: ['Science', 'Commerce', 'Humanities'],
            allowedHscYears: [2023, 2024, 2025],
            allowsSecondTimer: true,
            requiredSubjectMinGpa: {},
            pageReference: 'Page 1, Business Faculty',
          },
        ],
      },
    ];

    for (const spec of circularSpecs) {
      const inst = byCode.get(spec.code);
      if (!inst) continue;

      const pdfBase64 = buildCircularPdfBase64(spec.titleEn, [
        `Institution: ${inst.nameEn} (${inst.code})`,
        `Session: ${spec.session} | Application Deadline: ${spec.deadline}`,
        `Official Source: ${spec.sourceUrl}`,
        '',
        ...spec.rawText.match(/.{1,82}(\s|$)/g)?.map((s) => s.trim()) ?? [spec.rawText],
      ]);

      const [createdCircular] = await db
        .insert(circulars)
        .values({
          institutionId: inst.id,
          titleEn: spec.titleEn,
          titleBn: spec.titleBn,
          session: spec.session,
          sourceUrl: spec.sourceUrl,
          applicationDeadline: spec.deadline,
          pdfFilename: spec.pdfFilename,
          pdfBase64,
          rawCircularText: spec.rawText,
          status: spec.status,
          version: 1,
          uploadedByUserId: superAdminId,
          reviewedByUserId: spec.isVerified ? reviewerId : null,
          publishedAt: spec.status === 'published' ? new Date() : null,
        })
        .returning();

      for (const rule of spec.rules) {
        const ruleTyped = rule as typeof rule & {
          gpaMode?: string;
          minSscGpaWithoutFourth?: number;
          minHscGpaWithoutFourth?: number;
        };
        await db.insert(admissionRules).values({
          circularId: createdCircular.id,
          institutionId: inst.id,
          programName: rule.programName,
          gpaMode: ruleTyped.gpaMode ?? 'with_fourth',
          minSscGpa: rule.minSscGpa,
          minHscGpa: rule.minHscGpa,
          minCombinedGpa: rule.minCombinedGpa,
          minSscGpaWithoutFourth: ruleTyped.minSscGpaWithoutFourth ?? null,
          minHscGpaWithoutFourth: ruleTyped.minHscGpaWithoutFourth ?? null,
          allowedGroups: rule.allowedGroups,
          allowedHscYears: rule.allowedHscYears,
          allowsSecondTimer: rule.allowsSecondTimer,
          requiredSubjectMinGpa: rule.requiredSubjectMinGpa,
          pageReference: rule.pageReference,
          status: spec.status,
          isVerified: spec.isVerified,
          version: 1,
        });
      }
    }

    await db.insert(auditLogs).values({
      actorUserId: superAdminId,
      actorEmail: superAdminEmail ?? 'system@dreamuniversity.edu.bd',
      actorRole: superAdminId ? 'super_admin' : 'system',
      action: 'SYSTEM_SEED_INITIALIZED',
      entityType: 'database',
      entityId: 'initial',
      details: {
        institutionsCount: allInsts.length,
        circularsCount: circularSpecs.length,
      },
    });
  }

  // Ensure BUET & CKRUET (RUET) support GPA Without 4th Subject verification on already-seeded DBs
  const buetInst = await db
    .select({ id: institutions.id })
    .from(institutions)
    .where(eq(institutions.code, 'BUET'))
    .limit(1);
  if (buetInst[0]) {
    await db
      .update(admissionRules)
      .set({
        minSscGpaWithoutFourth: sql`COALESCE(${admissionRules.minSscGpaWithoutFourth}, 4.0)`,
        minHscGpaWithoutFourth: sql`COALESCE(${admissionRules.minHscGpaWithoutFourth}, 4.0)`,
      })
      .where(eq(admissionRules.institutionId, buetInst[0].id));
  }

  const ruetInst = await db
    .select()
    .from(institutions)
    .where(eq(institutions.code, 'RUET'))
    .limit(1);
  if (ruetInst[0]) {
    const existingRuetCirc = await db
      .select({ id: circulars.id })
      .from(circulars)
      .where(eq(circulars.institutionId, ruetInst[0].id))
      .limit(1);
    if (existingRuetCirc.length === 0) {
      const ckruetTitle = 'CKRUET (CUET · KUET · RUET) Combined Engineering Admission 2025-2026';
      const ckruetText =
        'CKRUET Combined Engineering Admission (RUET / KUET / CUET): Science group only. Minimum SSC GPA 4.00 and HSC GPA 4.00 (without 4th subject >= 4.00), Combined GPA >= 8.50. Minimum GPA 4.00 in Physics, Chemistry, Higher Mathematics, and English.';
      const [createdRuetCirc] = await db
        .insert(circulars)
        .values({
          institutionId: ruetInst[0].id,
          titleEn: ckruetTitle,
          titleBn: 'CKRUET (চুয়েট · কুয়েট · রুয়েট) সমন্বিত প্রকৌশল ভর্তি বিজ্ঞপ্তি ২০২৫-২০২৬',
          session: '2025-2026',
          sourceUrl: 'https://admissionckruet.ac.bd',
          applicationDeadline: '2026-12-08',
          pdfFilename: 'ckruet-combined-engineering-circular-2025-2026.pdf',
          pdfBase64: buildCircularPdfBase64(ckruetTitle, [
            'Combined Engineering Admission: CUET, KUET & RUET',
            'Session: 2025-2026 | Application Deadline: 2026-12-08',
            ckruetText,
          ]),
          rawCircularText: ckruetText,
          status: 'published',
          version: 1,
          uploadedByUserId: superAdminId,
          reviewedByUserId: reviewerId,
          publishedAt: new Date(),
        })
        .returning();

      await db.insert(admissionRules).values({
        circularId: createdRuetCirc.id,
        institutionId: ruetInst[0].id,
        programName: 'CKRUET Combined Engineering (CSE / EEE / ME / Civil)',
        gpaMode: 'with_fourth',
        minSscGpa: 4.0,
        minHscGpa: 4.0,
        minCombinedGpa: 8.5,
        minSscGpaWithoutFourth: 4.0,
        minHscGpaWithoutFourth: 4.0,
        allowedGroups: ['Science'],
        allowedHscYears: [2025],
        allowsSecondTimer: false,
        requiredSubjectMinGpa: { Physics: 4.0, Chemistry: 4.0, Mathematics: 4.0, English: 3.5 },
        pageReference: 'Page 1, CKRUET Eligibility Clause 2',
        status: 'published',
        isVerified: true,
        version: 1,
      });
    }
  }

  // Ensure legacy DIU under_review sample does not collide with published DIU BBA rule
  await db
    .update(admissionRules)
    .set({ programName: 'Bachelor of Pharmacy (B.Pharm) — Pending Verification' })
    .where(
      sql`${admissionRules.programName} = 'Bachelor of Business Administration (BBA)' AND ${admissionRules.status} = 'under_review'`
    );

  // 4. Idempotently ensure ALL 205 institutions have unit-level published circulars & verified rules
  const allInstsCatalogRows = await db
    .select({
      id: institutions.id,
      code: institutions.code,
      nameEn: institutions.nameEn,
      nameBn: institutions.nameBn,
      category: institutions.category,
      officialWebsite: institutions.officialWebsite,
    })
    .from(institutions);

  const [existingCircRows, existingRuleRows] = await Promise.all([
    db
      .select({
        id: circulars.id,
        institutionId: circulars.institutionId,
        status: circulars.status,
      })
      .from(circulars),
    db
      .select({
        institutionId: admissionRules.institutionId,
        programName: admissionRules.programName,
      })
      .from(admissionRules),
  ]);

  const publishedCircularByInstId = new Map<number, number>();
  for (const circ of existingCircRows) {
    if (circ.status === 'published' && !publishedCircularByInstId.has(circ.institutionId)) {
      publishedCircularByInstId.set(circ.institutionId, circ.id);
    }
  }

  const missingCircularSpecs: Array<{
    institutionId: number;
    titleEn: string;
    titleBn: string;
    session: string;
    sourceUrl: string;
    applicationDeadline: string;
    pdfFilename: string;
    rawCircularText: string;
    status: string;
    version: number;
    uploadedByUserId: number | null;
    reviewedByUserId: number | null;
    publishedAt: Date;
  }> = [];

  for (const inst of allInstsCatalogRows) {
    if (publishedCircularByInstId.has(inst.id)) continue;
    const template = getCircularTemplateForInstitution(
      inst as typeof inst & { category: 'public' | 'private' | 'medical' | 'gst' | 'engineering' | 'national' }
    );
    missingCircularSpecs.push({
      institutionId: inst.id,
      titleEn: template.titleEn,
      titleBn: template.titleBn,
      session: template.session,
      sourceUrl: template.sourceUrl,
      applicationDeadline: template.deadline,
      pdfFilename: `${inst.code.toLowerCase()}-admission-circular-2026.pdf`,
      rawCircularText: template.rawText,
      status: 'published',
      version: 1,
      uploadedByUserId: superAdminId,
      reviewedByUserId: reviewerId,
      publishedAt: new Date(),
    });
  }

  for (let i = 0; i < missingCircularSpecs.length; i += 50) {
    const chunk = missingCircularSpecs.slice(i, i + 50);
    const inserted = await db
      .insert(circulars)
      .values(chunk)
      .returning({ id: circulars.id, institutionId: circulars.institutionId });
    for (const row of inserted) {
      publishedCircularByInstId.set(row.institutionId, row.id);
    }
  }

  const existingRuleKeys = new Set<string>(
    existingRuleRows.map((r) => `${r.institutionId}::${r.programName.trim().toLowerCase()}`)
  );

  const missingRulesBatch: Array<{
    circularId: number;
    institutionId: number;
    programName: string;
    gpaMode: string;
    minSscGpa: number;
    minHscGpa: number;
    minCombinedGpa: number;
    minSscGpaWithoutFourth: number | null;
    minHscGpaWithoutFourth: number | null;
    allowedGroups: string[];
    allowedHscYears: number[];
    allowsSecondTimer: boolean;
    requiredSubjectMinGpa: Record<string, number>;
    pageReference: string;
    status: string;
    isVerified: boolean;
    version: number;
  }> = [];

  for (const inst of allInstsCatalogRows) {
    const circularId = publishedCircularByInstId.get(inst.id);
    if (!circularId) continue;
    const template = getCircularTemplateForInstitution(
      inst as typeof inst & { category: 'public' | 'private' | 'medical' | 'gst' | 'engineering' | 'national' }
    );
    for (const rule of template.rules) {
      const key = `${inst.id}::${rule.programName.trim().toLowerCase()}`;
      if (existingRuleKeys.has(key)) continue;
      existingRuleKeys.add(key);
      missingRulesBatch.push({
        circularId,
        institutionId: inst.id,
        programName: rule.programName,
        gpaMode: rule.gpaMode ?? 'with_fourth',
        minSscGpa: rule.minSscGpa,
        minHscGpa: rule.minHscGpa,
        minCombinedGpa: rule.minCombinedGpa,
        minSscGpaWithoutFourth: rule.minSscGpaWithoutFourth ?? null,
        minHscGpaWithoutFourth: rule.minHscGpaWithoutFourth ?? null,
        allowedGroups: rule.allowedGroups,
        allowedHscYears: rule.allowedHscYears,
        allowsSecondTimer: rule.allowsSecondTimer,
        requiredSubjectMinGpa: rule.requiredSubjectMinGpa,
        pageReference: rule.pageReference,
        status: 'published',
        isVerified: true,
        version: 1,
      });
    }
  }

  for (let i = 0; i < missingRulesBatch.length; i += 100) {
    const chunk = missingRulesBatch.slice(i, i + 100);
    await db.insert(admissionRules).values(chunk);
  }
}
