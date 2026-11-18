import { useState } from 'react';
import { GraduationCap } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function SafeImage({ src, alt, className = '', fallbackTitle }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#0F172A] via-[#004D40] to-[#00796B] text-[#F8FAFC] p-6 dark:from-[#0A0A0A] dark:via-[#121212] dark:to-[#004D40] ${className}`}
      >
        <GraduationCap className="h-10 w-10 text-[#26A69A] mb-3" aria-hidden="true" />
        {fallbackTitle && (
          <p className="text-sm font-medium text-[#F8FAFC]/90 text-center">{fallbackTitle}</p>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
