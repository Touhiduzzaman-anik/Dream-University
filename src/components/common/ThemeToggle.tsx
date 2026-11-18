import { Moon, Sun } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { tr } = useLanguage();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? tr('switchToLightMode') : tr('switchToDarkMode')}
      title={isDark ? tr('switchToLightMode') : tr('switchToDarkMode')}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] transition-colors hover:border-[#00796B] hover:text-[#0F172A] dark:border-[#222222] dark:bg-[#121212] dark:text-[#94A3B8] dark:hover:border-[#FFA726]/60 dark:hover:text-[#F8FAFC] shrink-0 focus-visible:outline-2 focus-visible:outline-[#00796B] dark:focus-visible:outline-[#26A69A]"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-[#FFA726]" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
