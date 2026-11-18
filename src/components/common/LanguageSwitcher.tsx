import { useLanguage } from '../../context/LanguageContext';

interface LanguageSwitcherProps {
  compact?: boolean;
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Language switcher"
      className="inline-flex items-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-0.5 dark:border-[#222222] dark:bg-[#121212] shrink-0"
    >
      <button
        type="button"
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        className={`px-1.5 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#00796B] dark:focus-visible:outline-[#26A69A] ${
          lang === 'en'
            ? 'bg-white text-[#00796B] shadow-2xs dark:bg-[#050505] dark:text-[#26A69A]'
            : 'text-[#475569] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]'
        }`}
      >
        {compact ? 'EN' : 'English'}
      </button>
      <button
        type="button"
        onClick={() => setLang('bn')}
        aria-pressed={lang === 'bn'}
        className={`px-1.5 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#00796B] dark:focus-visible:outline-[#26A69A] ${
          lang === 'bn'
            ? 'bg-white text-[#00796B] shadow-2xs dark:bg-[#050505] dark:text-[#26A69A]'
            : 'text-[#475569] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]'
        }`}
      >
        বাংলা
      </button>
    </div>
  );
}
