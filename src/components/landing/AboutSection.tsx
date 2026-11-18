import {
  ArrowLeft,
  BookOpenCheck,
  Code2,
  Globe2,
  GraduationCap,
  Link2,
  Mail,
  ShieldCheck,
  UserCircle2,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import type { AppRoute } from '../../types/domain';
import studyHallImg from '../../assets/images/study_hall_editorial_1794729746373.jpg';
import { SafeImage } from '../common/SafeImage';

interface AboutSectionProps {
  onBackToHome: () => void;
  onNavigate: (route: AppRoute) => void;
}

export function AboutSection({ onBackToHome, onNavigate }: AboutSectionProps) {
  const { lang, tr } = useLanguage();

  return (
    <section
      id="about-page"
      data-testid="about-page-section"
      className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8"
    >
      <div className="flex items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4 dark:border-[#222222]">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3.5 text-xs font-semibold text-[#0F172A] hover:border-[#00796B] hover:text-[#00796B] dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:hover:border-[#26A69A] dark:hover:text-[#26A69A] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {lang === 'bn' ? 'হোম ওভারভিউতে ফিরুন' : 'Back to Home / Universities'}
        </button>
      </div>

      {/* App Overview Card */}
      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-xs dark:border-[#222222] dark:bg-[#121212]">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-5 bg-[#F8FAFC] dark:bg-[#0A0A0A]">
            <SafeImage
              src={studyHallImg}
              alt={tr('aiPreviewImageAlt')}
              fallbackTitle={tr('aboutTitle')}
              className="h-64 w-full object-cover lg:h-full"
            />
          </div>
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-5">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-[#00796B] dark:text-[#26A69A] uppercase">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              {lang === 'bn' ? 'ড্রিম ইউনিভার্সিটি সম্পর্কে' : 'About Dream University'}
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] sm:text-3xl">
              {tr('aboutTitle')}
            </h1>
            <p className="text-sm leading-relaxed text-[#475569] dark:text-[#94A3B8] sm:text-base">
              {tr('aboutBody')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 dark:border-[#222222] dark:bg-[#0A0A0A]">
                <BookOpenCheck className="h-4 w-4 text-[#00796B] dark:text-[#26A69A] mb-1.5" aria-hidden="true" />
                <p className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  {lang === 'bn' ? 'যাচাইকৃত সার্কুলার' : 'Verified Circulars'}
                </p>
                <p className="mt-0.5 text-[11px] text-[#475569] dark:text-[#94A3B8]">
                  {lang === 'bn'
                    ? 'অফিশিয়াল জিপিএ ও ইউনিট শর্তাবলি সরাসরি যাচাই।'
                    : 'Deterministic unit rules backed by official admission notices.'}
                </p>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 dark:border-[#222222] dark:bg-[#0A0A0A]">
                <GraduationCap className="h-4 w-4 text-[#388E3C] dark:text-[#66BB6A] mb-1.5" aria-hidden="true" />
                <p className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  {lang === 'bn' ? 'সকল ক্যাটাগরি' : 'All BD Sectors'}
                </p>
                <p className="mt-0.5 text-[11px] text-[#475569] dark:text-[#94A3B8]">
                  {lang === 'bn'
                    ? 'পাবলিক, প্রাইভেট, প্রকৌশল, মেডিকেল, জিএসটি ও জাতীয়।'
                    : 'Public, Private, Engineering, Medical, GST & National institutions.'}
                </p>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 dark:border-[#222222] dark:bg-[#0A0A0A]">
                <Globe2 className="h-4 w-4 text-[#F57C00] dark:text-[#FFA726] mb-1.5" aria-hidden="true" />
                <p className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  {lang === 'bn' ? 'দ্বিভাষিক সহায়তা' : 'Bilingual EN / BN'}
                </p>
                <p className="mt-0.5 text-[11px] text-[#475569] dark:text-[#94A3B8]">
                  {lang === 'bn'
                    ? 'ইংরেজি ও বাংলায় সম্পূর্ণ অ্যাডমিশন নির্দেশনা।'
                    : 'Seamless English & Bangla experience for HSC candidates.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onBackToHome}
                className="inline-flex h-10 items-center rounded-lg bg-[#00796B] px-4 text-xs font-semibold text-white hover:bg-[#00695C] dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD] transition-colors"
              >
                {lang === 'bn' ? 'বিশ্ববিদ্যালয় ডিরেক্টরি দেখুন' : 'Browse Universities'}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="inline-flex h-10 items-center rounded-lg border border-[#E2E8F0] bg-white px-4 text-xs font-semibold text-[#0F172A] hover:border-[#00796B] hover:text-[#00796B] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:hover:border-[#26A69A] dark:hover:text-[#26A69A] transition-colors"
              >
                {lang === 'bn' ? 'শিক্ষার্থী সাইন ইন' : 'Student Sign In'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Developer Details Placeholder Card */}
      <div
        data-testid="developer-details-card"
        className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 shadow-xs dark:border-[#222222] dark:bg-[#121212]"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-[#E2E8F0] pb-5 dark:border-[#222222]">
          <div className="flex items-start gap-3.5">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#00796B]/10 text-[#00796B] dark:bg-[#26A69A]/15 dark:text-[#26A69A]">
              <Code2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
                {lang === 'bn' ? 'ডেভেলপারের তথ্য' : 'Developer Details'}
              </h2>
              <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8]">
                {lang === 'bn'
                  ? 'এই অংশে পরবর্তীতে ডেভেলপার বা টিমের বিস্তারিত তথ্য যুক্ত করা হবে।'
                  : 'Dedicated placeholder card — developer profile, bio, and contact information can be added here later.'}
              </p>
            </div>
          </div>
          <span className="inline-flex w-fit items-center rounded-md border border-dashed border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-semibold text-[#475569] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#94A3B8]">
            {lang === 'bn' ? 'তথ্য যোগের জন্য প্রস্তুত' : 'Placeholder Slot'}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-4 dark:border-[#222222] dark:bg-[#0A0A0A]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#475569] dark:text-[#94A3B8]">
              <UserCircle2 className="h-4 w-4 text-[#00796B] dark:text-[#26A69A]" aria-hidden="true" />
              <span>{lang === 'bn' ? 'ডেভেলপারের নাম' : 'Developer Name'}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
              {lang === 'bn' ? 'পরবর্তীতে যুক্ত করা হবে' : 'To be added'}
            </p>
          </div>

          <div className="rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-4 dark:border-[#222222] dark:bg-[#0A0A0A]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#475569] dark:text-[#94A3B8]">
              <Code2 className="h-4 w-4 text-[#F57C00] dark:text-[#FFA726]" aria-hidden="true" />
              <span>{lang === 'bn' ? 'পদবি ও পরিচিতি' : 'Role & Affiliation'}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
              {lang === 'bn' ? 'প্রজেক্ট ক্রেডিট প্লেসহোল্ডার' : 'Lead Developer / Team Bio'}
            </p>
          </div>

          <div className="rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-4 dark:border-[#222222] dark:bg-[#0A0A0A]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#475569] dark:text-[#94A3B8]">
              <Mail className="h-4 w-4 text-[#388E3C] dark:text-[#66BB6A]" aria-hidden="true" />
              <span>{lang === 'bn' ? 'যোগাযোগের ইমেইল' : 'Contact Email'}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
              {lang === 'bn' ? 'ইমেইল প্লেসহোল্ডার' : 'developer@example.com'}
            </p>
          </div>

          <div className="rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-4 dark:border-[#222222] dark:bg-[#0A0A0A]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#475569] dark:text-[#94A3B8]">
              <Link2 className="h-4 w-4 text-[#D32F2F] dark:text-[#FF4D4D]" aria-hidden="true" />
              <span>{lang === 'bn' ? 'পোর্টফোলিও / লিংক' : 'Portfolio & Links'}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
              {lang === 'bn' ? 'গিটহাব / লিংকডইন প্লেসহোল্ডার' : 'GitHub / LinkedIn'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
