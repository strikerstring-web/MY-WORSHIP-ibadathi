import React from 'react';
import { Language } from '../types';

interface WelcomeProps {
  onEnter: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const Welcome: React.FC<WelcomeProps> = ({ onEnter, language, setLanguage, t }) => {
  const languages: { code: Language; label: string; icon: string; color: string }[] = [
    { code: 'ar', label: 'العربية', icon: 'fa-kaaba', color: 'from-emerald-400 to-emerald-600' },
    { code: 'en', label: 'English', icon: 'fa-globe', color: 'from-sky-400 to-sky-600' },
    { code: 'ml', label: 'മലയാളം', icon: 'fa-language', color: 'from-violet-400 to-violet-600' },
    { code: 'ta', label: 'தமிழ்', icon: 'fa-feather', color: 'from-amber-400 to-amber-600' },
  ];

  return (
    <div className="flex flex-col items-center justify-between h-full w-full p-6 text-center relative overflow-hidden bg-mesh">
      {/* Decorative ambient light */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] left-[-10%] w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="z-10 w-full max-w-sm flex-1 flex flex-col items-center justify-center pt-4">
        {/* Typographic Branding */}
        <div className="animate-fade-up mt-8 mb-12 flex flex-col items-center">
          <span className="text-5xl font-black text-white dark:text-emerald-50 font-title-ar block tracking-tight leading-none mb-6">
            عبادتي
          </span>
          <div className="flex items-center gap-3">
            <span className="h-[2px] w-6 bg-emerald-500/40 rounded-full"></span>
            <p className="text-emerald-500 dark:text-emerald-400 font-title-en text-sm">
              Ibadathi
            </p>
            <span className="h-[2px] w-6 bg-emerald-500/40 rounded-full"></span>
          </div>
          <p className="text-slate-400 text-[10px] font-medium max-w-[220px] mx-auto leading-relaxed mt-10 opacity-70">
            {t('welcomeSub')}
          </p>
        </div>

        {/* Language Selection Grid */}
        <div className="w-full space-y-4 animate-fade-up stagger-1">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-5 bg-white/10"></span>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">{t('selectLanguage')}</p>
            <span className="h-px w-5 bg-white/10"></span>
          </div>
          
          <div className="grid grid-cols-2 gap-2.5 max-w-[260px] mx-auto">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`relative p-3 rounded-[1.25rem] flex flex-col items-center gap-2 transition-all duration-500 active:scale-95 border-2 ${
                  language === lang.code 
                    ? `bg-white/5 border-emerald-500 shadow-[0_8px_16px_rgba(16,185,129,0.1)]` 
                    : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs transition-all duration-500 ${
                  language === lang.code 
                    ? `bg-gradient-to-br ${lang.color} text-white scale-105 shadow-md` 
                    : 'bg-white/5 text-slate-500'
                }`}>
                  <i className={`fas ${lang.icon}`}></i>
                </div>
                <span className={`text-[9px] font-bold transition-colors duration-500 ${
                  language === lang.code ? 'text-white' : 'text-slate-500'
                }`}>
                  {lang.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary CTA */}
      <div className="w-full max-w-[260px] pb-8 z-10 animate-fade-up stagger-2">
        <button 
          onClick={onEnter}
          className="group relative w-full h-12 rounded-[1.15rem] overflow-hidden transition-all duration-500 active:scale-95 shadow-2xl shadow-emerald-950/40"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-700"></div>
          <div className="relative flex items-center justify-center gap-3">
            <span className="text-white tracking-[0.3em] uppercase text-[9px] font-black">
              {t('getStarted')}
            </span>
            <i className="fas fa-arrow-right text-[7px] text-white/50 group-hover:translate-x-1 transition-transform"></i>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Welcome;