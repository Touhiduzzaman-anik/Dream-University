import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').unique(),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  passwordHash: text('password_hash'),
  accountType: text('account_type').notNull().default('student'), // 'student' | 'admin'
  adminRole: text('admin_role'), // 'super_admin' | 'admin' | null
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const studentProfiles = pgTable('student_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  sscBoard: text('ssc_board'),
  sscYear: integer('ssc_year'),
  sscGroup: text('ssc_group'),
  sscGpa: real('ssc_gpa'),
  sscGpaWithoutFourth: real('ssc_gpa_without_fourth'),
  hscBoard: text('hsc_board'),
  hscYear: integer('hsc_year'),
  hscGroup: text('hsc_group'),
  hscGpa: real('hsc_gpa'),
  hscGpaWithoutFourth: real('hsc_gpa_without_fourth'),
  fourthSubjectCode: text('fourth_subject_code'),
  selectedSubjects: jsonb('selected_subjects').$type<string[]>().default([]).notNull(),
  subjectGrades: jsonb('subject_grades').$type<Record<string, number>>().default({}).notNull(),
  isSecondTimer: boolean('is_second_timer').notNull().default(false),
  preferredSubject: text('preferred_subject'),
  preferredCity: text('preferred_city'),
  collegeName: text('college_name'),
  tuitionBudgetBdt: integer('tuition_budget_bdt'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const otpResets = pgTable('otp_resets', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  otpCode: text('otp_code').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const otpVerifications = pgTable('otp_verifications', {
  id: serial('id').primaryKey(),
  identifier: text('identifier').notNull(),
  identifierType: text('identifier_type').notNull(), // 'email' | 'phone'
  purpose: text('purpose').notNull(), // 'login' | 'register' | 'reset_password'
  otpHash: text('otp_hash').notNull(),
  pendingFullName: text('pending_full_name'),
  pendingPasswordHash: text('pending_password_hash'),
  expiresAt: timestamp('expires_at').notNull(),
  verified: boolean('verified').notNull().default(false),
  used: boolean('used').notNull().default(false),
  attempts: integer('attempts').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const institutions = pgTable('institutions', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  nameEn: text('name_en').notNull(),
  nameBn: text('name_bn').notNull(),
  shortNoteEn: text('short_note_en').notNull(),
  shortNoteBn: text('short_note_bn').notNull(),
  locationEn: text('location_en').notNull(),
  locationBn: text('location_bn').notNull(),
  city: text('city').notNull(),
  establishedYear: integer('established_year'),
  category: text('category').notNull(), // 'public' | 'private' | 'medical' | 'gst' | 'engineering' | 'national'
  institutionType: text('institution_type').notNull(),
  institutionTypeBn: text('institution_type_bn').notNull(),
  officialWebsite: text('official_website').notNull(),
  imageUrl: text('image_url'),
  imageAltEn: text('image_alt_en').notNull(),
  imageAltBn: text('image_alt_bn').notNull(),
  programsEn: jsonb('programs_en').$type<string[]>().default([]).notNull(),
  programsBn: jsonb('programs_bn').$type<string[]>().default([]).notNull(),
  perCreditFeeBdt: integer('per_credit_fee_bdt'),
  totalCredits: integer('total_credits'),
  semesterFeeBdt: integer('semester_fee_bdt'),
  admissionFeeBdt: integer('admission_fee_bdt'),
  estimatedTotalCostBdt: integer('estimated_total_cost_bdt'),
  updatedBy: text('updated_by'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const institutionRankings = pgTable('institution_rankings', {
  id: serial('id').primaryKey(),
  institutionCode: text('institution_code').notNull().unique(),
  qsGlobal2026: text('qs_global_2026').notNull(),
  theGlobal2026: text('the_global_2026').notNull(),
  qsRankScore: integer('qs_rank_score'),
  theRankScore: integer('the_rank_score'),
  qsAsiaRankScore: integer('qs_asia_rank_score'),
  bangladeshStandingEn: text('bangladesh_standing_en').notNull(),
  bangladeshStandingBn: text('bangladesh_standing_bn').notNull(),
  sourceCitation: text('source_citation').notNull(),
  citationYear: integer('citation_year').notNull().default(2026),
  sourceUrl: text('source_url').notNull(),
  updatedBy: text('updated_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const circulars = pgTable('circulars', {
  id: serial('id').primaryKey(),
  institutionId: integer('institution_id')
    .references(() => institutions.id, { onDelete: 'cascade' })
    .notNull(),
  titleEn: text('title_en').notNull(),
  titleBn: text('title_bn').notNull(),
  session: text('session').notNull(),
  sourceUrl: text('source_url').notNull(),
  applicationDeadline: text('application_deadline'),
  pdfFilename: text('pdf_filename'),
  pdfBase64: text('pdf_base64'),
  rawCircularText: text('raw_circular_text'),
  status: text('status').notNull().default('draft'), // 'draft' | 'ai_extracted' | 'under_review' | 'published' | 'expired' | 'archived'
  version: integer('version').notNull().default(1),
  uploadedByUserId: integer('uploaded_by_user_id').references(() => users.id),
  reviewedByUserId: integer('reviewed_by_user_id').references(() => users.id),
  updatedBy: text('updated_by'),
  reviewNotes: text('review_notes'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const admissionRules = pgTable('admission_rules', {
  id: serial('id').primaryKey(),
  circularId: integer('circular_id')
    .references(() => circulars.id, { onDelete: 'cascade' })
    .notNull(),
  institutionId: integer('institution_id')
    .references(() => institutions.id, { onDelete: 'cascade' })
    .notNull(),
  programName: text('program_name').notNull(),
  gpaMode: text('gpa_mode').notNull().default('with_fourth'), // 'with_fourth' | 'without_fourth'
  minSscGpa: real('min_ssc_gpa'),
  minHscGpa: real('min_hsc_gpa'),
  minCombinedGpa: real('min_combined_gpa'),
  minSscGpaWithoutFourth: real('min_ssc_gpa_without_fourth'),
  minHscGpaWithoutFourth: real('min_hsc_gpa_without_fourth'),
  minCombinedGpaWithoutFourth: real('min_combined_gpa_without_fourth'),
  allowedGroups: jsonb('allowed_groups').$type<string[]>().default([]).notNull(),
  allowedBoards: jsonb('allowed_boards').$type<string[]>().default([]).notNull(),
  allowedSscYears: jsonb('allowed_ssc_years').$type<number[]>().default([]).notNull(),
  allowedHscYears: jsonb('allowed_hsc_years').$type<number[]>().default([]).notNull(),
  allowsSecondTimer: boolean('allows_second_timer').notNull().default(false),
  requiredSubjectMinGpa: jsonb('required_subject_min_gpa')
    .$type<Record<string, number>>()
    .default({})
    .notNull(),
  pageReference: text('page_reference'),
  status: text('status').notNull().default('draft'), // 'draft' | 'ai_extracted' | 'under_review' | 'published' | 'expired' | 'archived'
  isVerified: boolean('is_verified').notNull().default(false),
  version: integer('version').notNull().default(1),
  updatedBy: text('updated_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorUserId: integer('actor_user_id').references(() => users.id),
  actorEmail: text('actor_email').notNull(),
  actorRole: text('actor_role').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  details: jsonb('details').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const helpSettings = pgTable('help_settings', {
  id: integer('id').primaryKey(),
  isEnabled: boolean('is_enabled').notNull().default(true),
  showWhatsapp: boolean('show_whatsapp').notNull().default(true),
  whatsappPhone: text('whatsapp_phone').notNull().default('01753653351'),
  whatsappSubtitle: text('whatsapp_subtitle').notNull().default('WhatsApp Direct · 01753653351'),
  whatsappMessage: text('whatsapp_message')
    .notNull()
    .default('Hello Dream University Team, I need admission guidance.'),
  showCareerFinder: boolean('show_career_finder').notNull().default(true),
  requireLogin: boolean('require_login').notNull().default(true),
  updatedBy: text('updated_by'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one }) => ({
  profile: one(studentProfiles, {
    fields: [users.id],
    references: [studentProfiles.userId],
  }),
}));

export const institutionsRelations = relations(institutions, ({ many }) => ({
  circulars: many(circulars),
  rules: many(admissionRules),
}));

export const circularsRelations = relations(circulars, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [circulars.institutionId],
    references: [institutions.id],
  }),
  rules: many(admissionRules),
}));

export const admissionRulesRelations = relations(admissionRules, ({ one }) => ({
  circular: one(circulars, {
    fields: [admissionRules.circularId],
    references: [circulars.id],
  }),
  institution: one(institutions, {
    fields: [admissionRules.institutionId],
    references: [institutions.id],
  }),
}));
