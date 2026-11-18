import { useLanguage } from '../../context/LanguageContext';

interface BrandQuadrantMarkProps {
  className?: string;
}

export function BrandQuadrantMark({ className = 'h-9 w-9' }: BrandQuadrantMarkProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Top-Left Leaf: Vibrant Red (#D32F2F) + Paint Palette & Brush */}
      <path d="M4 4 H26 C39 4 47 12 47 25 V47 H25 C12 47 4 39 4 26 Z" fill="#D32F2F" />
      <path
        d="M23 16 C16.5 16 12 20.8 12 26.8 C12 32.8 16.8 36.8 22.8 36.8 C25.2 36.8 27.1 35.6 27.1 33.8 C27.1 32.5 26 31.8 26 30.6 C26 29.4 27.1 28.6 28.8 28.6 H30.8 C33.5 28.6 35.4 26.8 35.4 24.2 C35.4 19.3 29.9 16 23 16 Z"
        fill="#FFFFFF"
      />
      <circle cx="18.2" cy="23.2" r="1.7" fill="#D32F2F" />
      <circle cx="24" cy="20.6" r="1.7" fill="#D32F2F" />
      <circle cx="29.4" cy="22.8" r="1.7" fill="#D32F2F" />
      <circle cx="17.8" cy="29.4" r="1.7" fill="#D32F2F" />
      <circle cx="22.5" cy="32.2" r="2.1" fill="#D32F2F" />
      <path d="M35.5 12 L38.2 12.2 L40.6 31.2 L38.2 31.6 Z" fill="#FFFFFF" />
      <path d="M38.3 32.8 C37.2 34.4 37.6 37 39.4 37.6 C41.2 37.8 42.3 35.8 41 33.4 Z" fill="#FFFFFF" />

      {/* Top-Right Leaf: Warm Orange (#F57C00) + Microscope */}
      <path d="M96 4 V26 C96 39 88 47 75 47 H53 V25 C53 12 61 4 74 4 Z" fill="#F57C00" />
      <rect x="65" y="34.5" width="19" height="3.2" rx="1.2" fill="#FFFFFF" />
      <path
        d="M77.5 18.5 C81.8 20.5 83.2 26.5 80.5 31.2 L78.5 34.5 H74.5 L76.8 30 C78.6 26.8 77.8 22.8 75 21.4 Z"
        fill="#FFFFFF"
      />
      <rect
        x="71.2"
        y="12"
        width="5"
        height="13.5"
        rx="1.2"
        transform="rotate(20 73.7 18.7)"
        fill="#FFFFFF"
      />
      <rect x="66.2" y="29" width="9.5" height="2.4" rx="1" fill="#FFFFFF" />
      <circle cx="77.2" cy="25" r="2.6" fill="#FFFFFF" stroke="#F57C00" strokeWidth="1.2" />

      {/* Bottom-Left Leaf: Fresh Green (#388E3C) + Stacked Books */}
      <path d="M4 96 V74 C4 61 12 53 25 53 H47 V75 C47 88 39 96 26 96 Z" fill="#388E3C" />
      <path d="M13 66.5 L27 60.2 L40 65.8 L26 72.1 Z" fill="#FFFFFF" />
      <path d="M13 68.5 L26 74.1 L39.5 68.2 V71.8 L26 77.7 L13 72.1 Z" fill="#FFFFFF" />
      <path d="M13 74.6 L26 80.2 L39.5 74.3 V77.9 L26 83.8 L13 78.2 Z" fill="#FFFFFF" />
      <path d="M13 80.7 L26 86.3 L39.5 80.4 V84 L26 89.9 L13 84.3 Z" fill="#FFFFFF" />

      {/* Bottom-Right Leaf: Calming Teal (#00796B) + Laptop */}
      <path d="M96 96 H74 C61 96 53 88 53 75 V53 H75 C88 53 96 61 96 74 Z" fill="#00796B" />
      <rect x="61.5" y="61.5" width="26" height="16.5" rx="2" fill="#FFFFFF" />
      <rect x="64" y="64" width="21" height="11.5" rx="0.8" fill="#00796B" />
      <path d="M67 74.5 L72.5 65 H75.5 L70 74.5 Z" fill="#FFFFFF" opacity="0.4" />
      <path d="M74 74.5 L79.5 65 H81.5 L76 74.5 Z" fill="#FFFFFF" opacity="0.3" />
      <path d="M58.5 79.5 H90.5 L93 85.2 C93.3 86 92.7 86.8 91.8 86.8 H57.2 C56.3 86.8 55.7 86 56 85.2 Z" fill="#FFFFFF" />
      <rect x="70.5" y="83.4" width="8" height="2" rx="0.8" fill="#00796B" />
    </svg>
  );
}

interface BrandLogoProps {
  inverted?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export function BrandLogo({ inverted = false, onClick, compact = false }: BrandLogoProps) {
  const { tr } = useLanguage();

  const content = (
    <span className="inline-flex items-center gap-2 sm:gap-2.5 whitespace-nowrap shrink-0">
      <BrandQuadrantMark
        className={compact ? 'h-7 w-7 shrink-0' : 'h-7 w-7 sm:h-9 sm:w-9 shrink-0'}
      />
      <span
        className={`font-sans text-sm sm:text-lg font-extrabold tracking-tight ${
          inverted ? 'text-[#F8FAFC]' : 'text-[#0F172A] dark:text-[#F8FAFC]'
        }`}
      >
        {tr('brandName')}
      </span>
    </span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00796B] dark:focus-visible:outline-[#26A69A] rounded-lg"
      >
        {content}
      </button>
    );
  }

  return content;
}
