import { Mail, MapPin } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import type { AppRoute } from '../../types/domain';
import { BrandLogo } from '../common/BrandLogo';

interface FooterProps {
  onNavigate: (route: AppRoute, anchorId?: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const { tr } = useLanguage();

  return (
    <footer className="border-t border-[#E2E8F0] bg-[#0F172A] text-[#94A3B8] dark:border-[#222222] dark:bg-[#050505]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5 space-y-4">
            <BrandLogo inverted />
            <p className="text-sm font-medium text-[#FFA726]">{tr('tagline')}</p>
            <p className="max-w-md text-sm leading-relaxed text-[#94A3B8]">
              {tr('footerDescription')}
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h3 className="font-sans text-sm font-semibold text-[#F8FAFC]">{tr('footerLinksTitle')}</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="#top"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/', 'top');
                  }}
                  className="hover:text-[#26A69A] transition-colors"
                >
                  {tr('navHome')}
                </a>
              </li>
              <li>
                <a
                  href="#universities"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/', 'universities');
                  }}
                  className="hover:text-[#26A69A] transition-colors"
                >
                  {tr('navUniversities')}
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/about');
                  }}
                  className="hover:text-[#26A69A] transition-colors"
                >
                  {tr('navAbout')}
                </a>
              </li>
              <li>
                <a
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/login');
                  }}
                  className="hover:text-[#26A69A] transition-colors"
                >
                  {tr('navLogin')}
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h3 className="font-sans text-sm font-semibold text-[#F8FAFC]">{tr('footerSupportTitle')}</h3>
            <ul className="space-y-2.5 text-sm text-[#94A3B8]">
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-[#26A69A] shrink-0" aria-hidden="true" />
                <a href="mailto:support@dreamuniversity.edu.bd" className="hover:text-[#26A69A] transition-colors">
                  {tr('footerContactEmail')}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-[#66BB6A] shrink-0" aria-hidden="true" />
                <span>{tr('footerLocation')}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 dark:border-[#222222] pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-[#94A3B8]">
          <p>{tr('footerCopyright')}</p>
          <p>{tr('additionalTypesNote')}</p>
        </div>
      </div>
    </footer>
  );
}
