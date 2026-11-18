import type { AdmissionCategoryId, InstitutionRecord } from '../types/domain';

export type NotificationUrgency = 'closing_soon' | 'upcoming' | 'expired';

export interface CircularNotificationItem {
  circularId: number;
  institutionId: number;
  institutionCode: string;
  institutionNameEn: string;
  institutionNameBn: string;
  institutionType: string;
  institutionTypeBn: string;
  category: AdmissionCategoryId;
  titleEn: string;
  titleBn: string;
  session: string;
  applicationDeadline: string | null;
  daysRemaining: number | null;
  urgency: NotificationUrgency;
  sourceUrl: string;
  pdfUrl: string;
  verifiedRuleCount: number;
}

export function buildCircularNotifications(
  institutions: InstitutionRecord[],
  referenceDate: Date = new Date()
): CircularNotificationItem[] {
  const refDayUtc = Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate()
  );

  const items: CircularNotificationItem[] = [];

  for (const inst of institutions) {
    for (const circ of inst.publishedCirculars) {
      let daysRemaining: number | null = null;
      let urgency: NotificationUrgency = 'upcoming';

      if (circ.applicationDeadline) {
        const parsed = new Date(`${circ.applicationDeadline}T00:00:00Z`);
        if (!Number.isNaN(parsed.getTime())) {
          daysRemaining = Math.round((parsed.getTime() - refDayUtc) / (1000 * 60 * 60 * 24));
          if (daysRemaining < 0) {
            urgency = 'expired';
          } else if (daysRemaining <= 14) {
            urgency = 'closing_soon';
          } else {
            urgency = 'upcoming';
          }
        }
      }

      items.push({
        circularId: circ.id,
        institutionId: inst.id,
        institutionCode: inst.code,
        institutionNameEn: inst.nameEn,
        institutionNameBn: inst.nameBn,
        institutionType: inst.institutionType,
        institutionTypeBn: inst.institutionTypeBn,
        category: inst.category,
        titleEn: circ.titleEn,
        titleBn: circ.titleBn,
        session: circ.session,
        applicationDeadline: circ.applicationDeadline,
        daysRemaining,
        urgency,
        sourceUrl: circ.sourceUrl,
        pdfUrl: `/api/circulars/${circ.id}/pdf`,
        verifiedRuleCount: inst.verifiedRules.filter((r) => r.circularId === circ.id).length,
      });
    }
  }

  return items.sort((a, b) => {
    // Active (non-expired) alerts come before expired; sooner deadlines first
    if (a.urgency === 'expired' && b.urgency !== 'expired') return 1;
    if (a.urgency !== 'expired' && b.urgency === 'expired') return -1;
    if (a.daysRemaining === null && b.daysRemaining === null) return 0;
    if (a.daysRemaining === null) return 1;
    if (b.daysRemaining === null) return -1;
    return a.daysRemaining - b.daysRemaining;
  });
}
