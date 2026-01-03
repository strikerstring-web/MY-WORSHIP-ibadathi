import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', withText = false }) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-14 h-14',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${sizeMap[size]} aspect-square relative flex items-center justify-center overflow-hidden rounded-[24%] bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800`}>
        {/* Minimal Flat Vector SVG */}
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full p-3">
          
          {/* THE KAABA (Left) */}
          {/* Main Block (Black) */}
          <path d="M 12 65 L 35 68 V 45 L 12 42 Z" fill="#000000" />
          <path d="M 35 68 L 45 65 V 42 L 35 45 Z" fill="#1A1A1A" />
          <path d="M 12 42 L 22 39 L 45 42 L 35 45 Z" fill="#2D2D2D" />
          
          {/* Gold Band (Solid Gold) */}
          <path d="M 12 48 L 35 51 L 45 48 L 45 50 L 35 53 L 12 50 Z" fill="#FFD700" />

          {/* MASJID NABAWI (Right) */}
          {/* Green Dome - Pure geometric arc */}
          <path d="M 50 65 C 50 48 58 42 68 42 C 78 42 86 48 86 65 H 50 Z" fill="#00843D" />
          
          {/* Crescent on Top */}
          <path d="M 68 38 A 2 2 0 1 1 68 34 A 2.5 2.5 0 1 0 68 38 Z" fill="#FFD700" />

          {/* Simple Minaret */}
          <rect x="78" y="44" width="4" height="21" fill="#E2E8F0" />
          <rect x="77" y="44" width="6" height="2" fill="#00843D" />
          <path d="M 78 44 L 80 40 L 82 44 Z" fill="#00843D" />
          <circle cx="80" cy="38" r="1" fill="#FFD700" />

        </svg>
      </div>
      
      {withText && (
        <div className="mt-4 text-center animate-fade-up">
          <span className="text-xl font-black text-slate-900 dark:text-emerald-50 font-title-ar block tracking-tight leading-none">
            عبادتي
          </span>
          <div className="mt-2 flex flex-col items-center">
            <div className="flex items-center gap-2">
              <span className="h-[1px] w-4 bg-emerald-500/20"></span>
              <p className="text-emerald-600 dark:text-emerald-400 font-title-en text-[9px]">
                Ibadathi
              </p>
              <span className="h-[1px] w-4 bg-emerald-500/20"></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logo;