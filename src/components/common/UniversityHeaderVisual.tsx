import { useState } from 'react';
import { Calendar, MapPin, Shield } from 'lucide-react';
import type { AdmissionCategoryId, Language } from '../../types/domain';

interface UniversityHeaderVisualProps {
  imageUrl: string | null | undefined;
  alt: string;
  code: string;
  name: string;
  city: string;
  establishedYear: number | null;
  category: AdmissionCategoryId | string;
  institutionType: string;
  lang: Language;
  className?: string;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  public: 'from-[#0F172A] via-[#132A4A] to-[#00796B]',
  engineering: 'from-[#16120B] via-[#3A240B] to-[#F57C00]',
  medical: 'from-[#081F12] via-[#144323] to-[#388E3C]',
  gst: 'from-[#1A1308] via-[#422B0B] to-[#D97706]',
  private: 'from-[#1B0B0E] via-[#4A141A] to-[#D32F2F]',
  national: 'from-[#061F1C] via-[#0E3F39] to-[#00796B]',
};

const CATEGORY_ACCENT_TEXT: Record<string, string> = {
  public: 'text-[#60A5FA] border-[#60A5FA]/40 bg-[#60A5FA]/15',
  engineering: 'text-[#FFA726] border-[#FFA726]/40 bg-[#FFA726]/15',
  medical: 'text-[#66BB6A] border-[#66BB6A]/40 bg-[#66BB6A]/15',
  gst: 'text-[#FBBF24] border-[#FBBF24]/40 bg-[#FBBF24]/15',
  private: 'text-[#FF4D4D] border-[#FF4D4D]/40 bg-[#FF4D4D]/15',
  national: 'text-[#26A69A] border-[#26A69A]/40 bg-[#26A69A]/15',
};

export function UniversityHeaderVisual({
  imageUrl,
  alt,
  code,
  name,
  city,
  establishedYear,
  category,
  institutionType,
  lang,
  className = '',
}: UniversityHeaderVisualProps) {
  const [failed, setFailed] = useState(false);

  const validUrl = typeof imageUrl === 'string' && imageUrl.trim().length > 0 ? imageUrl.trim() : null;

  if (validUrl && !failed) {
    return (
      <img
        src={validUrl}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  const gradient = CATEGORY_GRADIENTS[category] ?? CATEGORY_GRADIENTS.public;
  const accentClasses = CATEGORY_ACCENT_TEXT[category] ?? CATEGORY_ACCENT_TEXT.public;

  return (
    <div
      role="img"
      aria-label={`${name} (${code}) institutional emblem`}
      data-testid={`university-emblem-${code}`}
      className={`relative flex h-full w-full flex-col justify-between overflow-hidden bg-gradient-to-br ${gradient} p-3.5 sm:p-4 text-[#F8FAFC] ${className}`}
    >
      {/* Subtle geometric seal watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full border border-white/10 bg-white/[0.04]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full border border-white/10"
      />

      <div className="relative z-10 flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${accentClasses}`}
        >
          <Shield className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="truncate max-w-[155px]">{institutionType}</span>
        </span>

        {establishedYear && (
          <span className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-black/30 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[#F8FAFC] shrink-0">
            <Calendar className="h-3 w-3 text-[#26A69A] shrink-0" aria-hidden="true" />
            {lang === 'bn' ? `স্থাপিত ${establishedYear}` : `Est. ${establishedYear}`}
          </span>
        )}
      </div>

      <div className="relative z-10 flex items-center gap-3 my-auto py-0.5">
        <div className="flex h-12 min-w-12 px-2.5 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10 shadow-inner backdrop-blur-xs">
          <span className="font-mono text-sm sm:text-base font-extrabold tracking-tight text-white">
            {code}
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-sans text-sm font-bold leading-snug text-white line-clamp-2">
            {name}
          </p>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between gap-2 border-t border-white/15 pt-1.5 text-[11px] text-[#E2E8F0]">
        <span className="inline-flex items-center gap-1 truncate">
          <MapPin className="h-3 w-3 text-[#26A69A] shrink-0" aria-hidden="true" />
          <span className="truncate">{city}, Bangladesh</span>
        </span>
        <span className="font-mono text-[10px] tracking-wider text-[#E2E8F0]/80 uppercase shrink-0">
          {code}
        </span>
      </div>
    </div>
  );
}
