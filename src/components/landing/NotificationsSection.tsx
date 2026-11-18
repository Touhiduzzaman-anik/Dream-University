import { useMemo, useState } from 'react';
import { Bell, CalendarClock, ExternalLink, FileText } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import type { InstitutionRecord } from '../../types/domain';
import { buildCircularNotifications } from '../../utils/circularNotifications';

interface NotificationsSectionProps {
  institutions: InstitutionRecord[];
}

export function NotificationsSection({ institutions }: NotificationsSectionProps) {
  const { lang } = useLanguage();
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'closing_soon' | 'upcoming'>('all');
  const [openPdfId, setOpenPdfId] = useState<number | null>(null);

  const notifications = useMemo(() => buildCircularNotifications(institutions), [institutions]);

  const filtered = useMemo(() => {
    if (urgencyFilter === 'all') return notifications;
    return notifications.filter((n) => n.urgency === urgencyFilter);
  }, [notifications, urgencyFilter]);

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white dark:border-[#222222] dark:bg-[#121212] overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[#E2E8F0] px-6 py-5 dark:border-[#222222] sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#F57C00] dark:text-[#FFA726]">
            <Bell className="h-4 w-4" aria-hidden="true" />
            <span>
              {lang === 'bn' ? 'লাইভ ভর্তি বিজ্ঞপ্তি ও সময় গণনা' : 'Live Admission Circular Alerts & Countdowns'}
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
            {lang === 'bn' ? 'ভর্তি নোটিফিকেশন ও শেষ সময়সূচি' : 'Official Circular Notifications & Deadlines'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-1 dark:bg-[#0A0A0A] dark:border-[#222222] shrink-0">
          {(
            [
              { id: 'all', labelEn: `All Alerts (${notifications.length})`, labelBn: `সব বিজ্ঞপ্তি (${notifications.length})` },
              { id: 'closing_soon', labelEn: 'Closing <= 14 Days', labelBn: 'শীঘ্রই শেষ (১৪ দিন)' },
              { id: 'upcoming', labelEn: 'Upcoming', labelBn: 'আসন্ন' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setUrgencyFilter(tab.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold tabular-nums whitespace-nowrap transition-colors ${
                urgencyFilter === tab.id
                  ? 'bg-[#00796B] text-white shadow-xs dark:bg-[#26A69A] dark:text-[#050505]'
                  : 'text-[#475569] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]'
              }`}
            >
              {lang === 'bn' ? tab.labelBn : tab.labelEn}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center text-sm text-[#475569] dark:text-[#94A3B8]">
          {lang === 'bn'
            ? 'এই ফিল্টারে কোনো সক্রিয় ভর্তি বিজ্ঞপ্তি পাওয়া যায়নি।'
            : 'No published admission circular alerts match this filter right now.'}
        </div>
      ) : (
        <div className="divide-y divide-[#E2E8F0] dark:divide-[#222222]">
          {filtered.map((alert) => {
            const isPdfOpen = openPdfId === alert.circularId;
            return (
              <article key={alert.circularId} className="p-5 sm:px-6 space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#475569] dark:text-[#94A3B8]">
                      <span className="font-mono font-bold text-[#00796B] dark:text-[#26A69A]">
                        {alert.institutionCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{lang === 'bn' ? alert.institutionNameBn : alert.institutionNameEn}</span>
                      <span aria-hidden="true">·</span>
                      <span>{alert.session}</span>
                    </div>
                    <h4 className="font-sans text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      {lang === 'bn' ? alert.titleBn : alert.titleEn}
                    </h4>
                  </div>

                  {/* Countdown tag */}
                  <div className="flex items-center gap-2 shrink-0">
                    {alert.daysRemaining !== null && (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-xs font-bold tabular-nums whitespace-nowrap ${
                          alert.urgency === 'closing_soon'
                            ? 'border-[#F57C00]/35 bg-[#F57C00]/10 text-[#E65100] dark:border-[#FFA726]/40 dark:bg-[#FFA726]/12 dark:text-[#FFA726]'
                            : alert.urgency === 'expired'
                            ? 'border-[#D32F2F]/35 bg-[#D32F2F]/10 text-[#D32F2F] dark:border-[#FF4D4D]/40 dark:bg-[#FF4D4D]/12 dark:text-[#FF4D4D]'
                            : 'border-[#388E3C]/35 bg-[#388E3C]/10 text-[#2E7D32] dark:border-[#66BB6A]/40 dark:bg-[#66BB6A]/12 dark:text-[#66BB6A]'
                        }`}
                      >
                        <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                        {alert.daysRemaining > 0
                          ? lang === 'bn'
                            ? `${alert.daysRemaining} দিন বাকি`
                            : `${alert.daysRemaining} days left`
                          : alert.daysRemaining === 0
                          ? lang === 'bn'
                            ? 'আজই শেষ দিন'
                            : 'Closes Today'
                          : lang === 'bn'
                          ? 'সময়সীমা শেষ'
                          : 'Closed'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#475569] dark:text-[#94A3B8]">
                  <div className="flex flex-wrap items-center gap-3 tabular-nums">
                    <span>
                      <strong className="text-[#0F172A] dark:text-[#F8FAFC]">
                        {lang === 'bn' ? 'আবেদন শেষ:' : 'Deadline:'}
                      </strong>{' '}
                      {alert.applicationDeadline || 'See circular'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {lang === 'bn'
                        ? `${alert.verifiedRuleCount}টি যাচাইকৃত নিয়ম যুক্ত`
                        : `${alert.verifiedRuleCount} verified rule(s) active`}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setOpenPdfId(isPdfOpen ? null : alert.circularId)}
                      className="inline-flex items-center gap-1.5 font-semibold text-[#00796B] dark:text-[#26A69A] hover:underline whitespace-nowrap"
                    >
                      <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                      {isPdfOpen
                        ? lang === 'bn'
                          ? 'পিডিএফ বন্ধ করুন'
                          : 'Hide PDF'
                        : lang === 'bn'
                        ? 'অফিশিয়াল পিডিএফ দেখুন'
                        : 'View Circular PDF'}
                    </button>

                    <a
                      href={alert.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-[#475569] hover:text-[#00796B] dark:text-[#94A3B8] dark:hover:text-[#26A69A] hover:underline whitespace-nowrap"
                    >
                      {lang === 'bn' ? 'অফিশিয়াল পোর্টাল' : 'Official Portal'}
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </div>
                </div>

                {isPdfOpen && (
                  <div className="rounded-lg border border-[#E2E8F0] dark:border-[#222222] overflow-hidden bg-[#F8FAFC] dark:bg-[#0A0A0A]">
                    <iframe
                      title={`${alert.institutionCode} Admission Circular PDF`}
                      src={alert.pdfUrl}
                      className="h-72 w-full"
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
