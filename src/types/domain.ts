import type { EligibilityEvaluation, RulePublicationStatus } from '../utils/eligibilityEngine';

export type Language = 'en' | 'bn';

export type AdmissionCategoryId =
  | 'public'
  | 'private'
  | 'medical'
  | 'gst'
  | 'engineering'
  | 'national';

export type InstitutionType =
  | 'Public University'
  | 'Private University'
  | 'Medical College'
  | 'Engineering University'
  | 'Agricultural University'
  | 'Specialized University'
  | 'Affiliated College'
  | 'National University';

export type VerificationStatus = 'verified_official' | 'sample_not_verified';

export interface DemoInstitution {
  id: string;
  code: string;
  nameEn: string;
  nameBn: string;
  shortNoteEn: string;
  shortNoteBn: string;
  locationEn: string;
  locationBn: string;
  category: AdmissionCategoryId;
  institutionType: InstitutionType;
  institutionTypeBn: string;
  sampleProgramsEn: string[];
  sampleProgramsBn: string[];
  deadlineLabelEn: string;
  deadlineLabelBn: string;
  officialWebsite: string;
  imageUrl: string | null;
  imageAltEn: string;
  imageAltBn: string;
  isDemo: true;
  verificationStatus: VerificationStatus;
}

export interface PublishedCircularSummary {
  id: number;
  institutionId: number;
  titleEn: string;
  titleBn: string;
  session: string;
  sourceUrl: string;
  applicationDeadline: string | null;
  pdfFilename: string | null;
  status: RulePublicationStatus;
  version: number;
}

export interface VerifiedRuleRecord {
  id: number;
  circularId: number;
  institutionId: number;
  programName: string;
  gpaMode?: 'with_fourth' | 'without_fourth';
  minSscGpa: number | null;
  minHscGpa: number | null;
  minCombinedGpa: number | null;
  minSscGpaWithoutFourth?: number | null;
  minHscGpaWithoutFourth?: number | null;
  minCombinedGpaWithoutFourth?: number | null;
  allowedGroups: string[];
  allowedBoards?: string[];
  allowedSscYears?: number[];
  allowedHscYears: number[];
  allowsSecondTimer: boolean;
  requiredSubjectMinGpa: Record<string, number>;
  pageReference: string | null;
  status: RulePublicationStatus;
  isVerified: boolean;
  version: number;
  updatedBy?: string | null;
}

export interface InstitutionRecord {
  id: number;
  code: string;
  nameEn: string;
  nameBn: string;
  shortNoteEn: string;
  shortNoteBn: string;
  locationEn: string;
  locationBn: string;
  city: string;
  establishedYear: number | null;
  category: AdmissionCategoryId;
  institutionType: InstitutionType | string;
  institutionTypeBn: string;
  officialWebsite: string;
  imageUrl: string | null;
  imageAltEn: string;
  imageAltBn: string;
  programsEn: string[];
  programsBn: string[];
  perCreditFeeBdt: number | null;
  totalCredits: number | null;
  semesterFeeBdt: number | null;
  admissionFeeBdt: number | null;
  estimatedTotalCostBdt: number | null;
  updatedBy?: string | null;
  publishedCirculars: PublishedCircularSummary[];
  verifiedRules: VerifiedRuleRecord[];
}

export type AdminRole = 'super_admin' | 'admin';

export interface AuthUser {
  id: number;
  uid: string;
  email: string | null;
  fullName: string;
  phone: string | null;
  avatarUrl?: string | null;
  accountType: 'student' | 'admin';
  adminRole: AdminRole | null;
}

export interface StudentProfileRecord {
  id?: number;
  userId?: number;
  sscBoard: string | null;
  sscYear: number | null;
  sscGroup: string | null;
  sscGpa: number | null;
  sscGpaWithoutFourth?: number | null;
  hscBoard: string | null;
  hscYear: number | null;
  hscGroup: string | null;
  hscGpa: number | null;
  hscGpaWithoutFourth?: number | null;
  fourthSubjectCode?: string | null;
  selectedSubjects?: string[];
  subjectGrades: Record<string, number>;
  isSecondTimer: boolean;
  preferredSubject: string | null;
  preferredCity: string | null;
  collegeName?: string | null;
  tuitionBudgetBdt: number | null;
  updatedAt?: string;
}

export interface EligibilityResultItem {
  ruleId: number;
  circularId: number;
  institutionId: number;
  institutionCode: string;
  institutionNameEn: string;
  institutionNameBn: string;
  institutionType: string;
  institutionTypeBn: string;
  category: AdmissionCategoryId;
  city: string;
  estimatedTotalCostBdt: number | null;
  programName: string;
  applicationDeadline: string | null;
  pdfUrl: string;
  evaluation: EligibilityEvaluation;
}

export interface GroundedRecommendationItem {
  tier: 'dream' | 'match' | 'safer';
  ruleId: number;
  institutionCode: string;
  institutionNameEn: string;
  institutionNameBn: string;
  programName: string;
  academicMatchReason: string;
  relevantProgramReason: string;
  locationSuitability: string;
  budgetSuitability: string;
  circularTitle: string;
  sourceUrl: string;
}

export interface AdminCircularRecord {
  id: number;
  institutionId: number;
  titleEn: string;
  titleBn: string;
  session: string;
  sourceUrl: string;
  applicationDeadline: string | null;
  pdfFilename: string | null;
  rawCircularText: string | null;
  status: RulePublicationStatus;
  version: number;
  reviewNotes: string | null;
  updatedBy?: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  pdfUrl: string;
  institution: InstitutionRecord | null;
  rules: VerifiedRuleRecord[];
}

export interface AdminOverviewStats {
  totalInstitutions: number;
  universitiesExcludingMedical: number;
  uploadedCirculars: number;
  registeredStudents: number;
  pendingReviews: number;
  activeSessions: number;
  expiredCirculars: number;
}

export interface AuditLogRecord {
  id: number;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface UserAccountRecord {
  id: number;
  email: string | null;
  fullName: string;
  phone: string | null;
  accountType: 'student' | 'admin';
  adminRole: AdminRole | null;
  isActive: boolean;
  createdAt: string;
}

export type AppRoute =
  | '/'
  | '/about'
  | '/universities'
  | '/eligibility'
  | '/notifications'
  | '/ranking'
  | '/best-for-u'
  | '/reports'
  | '/profile'
  | '/login'
  | '/register'
  | '/forgot-password'
  | '/admin/login'
  | '/student/dashboard'
  | '/admin/dashboard'
  | '/dashboard'
  | '/admin';

export type StudentSectionId =
  | 'overview'
  | 'profile'
  | 'eligibility'
  | 'directory'
  | 'recommendations'
  | 'reports';

export type AdminSectionId =
  | 'overview'
  | 'institutions'
  | 'rankings'
  | 'circulars'
  | 'verification'
  | 'publications'
  | 'users'
  | 'manage_admins'
  | 'help_support'
  | 'audit';

export interface HelpSettingsRecord {
  id: number;
  isEnabled: boolean;
  showWhatsapp: boolean;
  whatsappPhone: string;
  whatsappSubtitle: string;
  whatsappMessage: string;
  showCareerFinder: boolean;
  requireLogin: boolean;
  updatedBy: string | null;
  updatedAt: string;
}

