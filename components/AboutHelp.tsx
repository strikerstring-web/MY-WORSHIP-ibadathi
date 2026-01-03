
import React, { useState } from 'react';

interface AboutHelpProps {
  setCurrentView: (view: any) => void;
  t: (key: string) => string;
}

const GUIDE_ITEMS_PER_PAGE = 5;

const AboutHelp: React.FC<AboutHelpProps> = ({ setCurrentView, t }) => {
  const [activeTab, setActiveTab] = useState<'about' | 'guide'>('about');
  const [guidePage, setGuidePage] = useState(0);

  const guideItems = [
    { icon: 'fa-kaaba', title: 'fard', desc: 'Track your 5 daily prayers.' },
    { icon: 'fa-sun', title: 'sunnah', desc: 'Optional prayers log.' },
    { icon: 'fa-calendar-check', title: 'qadah', desc: 'Manage missed prayers.' },
    { icon: 'fa-moon', title: 'fasting', desc: 'Ramadan & Sunnah fasts.' },
    { icon: 'fa-book-quran', title: 'quran', desc: 'Surah & Ayah progress.' },
    { icon: 'fa-venus', title: 'womensSpace', desc: 'Excused handling.' },
    { icon: 'fa-lock', title: 'persistence', desc: 'Secure cloud syncing.' }
  ];

  const totalGuidePages = Math.ceil(guideItems.length / GUIDE_ITEMS_PER_PAGE);
  const visibleGuide = guideItems.slice(guidePage * GUIDE_ITEMS_PER_PAGE, (guidePage + 1) * GUIDE_ITEMS_PER_PAGE);

  return (
    <div className="h-full w-full flex flex-col bg-[#fdfbf7] dark:bg-slate-900 overflow-hidden">
      <header className="p-4 pt-10 pb-4 bg-emerald-900 text-white shrink-0 shadow-lg rounded-b-[24px]">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setCurrentView('dashboard')} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-lg"><i className="fas fa-chevron-left text-xs"></i></button>
          <h1 className="text-lg font-black tracking-tight">{t('about')}</h1>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl">
          <button onClick={() => setActiveTab('about')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'about' ? 'bg-white text-emerald-900' : 'text-white/60'}`}>{t('about')}</button>
          <button onClick={() => setActiveTab('guide')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'guide' ? 'bg-white text-emerald-900' : 'text-white/60'}`}>GUIDE</button>
        </div>
      </header>

      <div className="flex-1 p-4 flex flex-col justify-center overflow-hidden">
        {activeTab === 'about' ? (
          <div className="space-y-6 flex flex-col items-center text-center animate-fade-up">
            <div>
              <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md border dark:border-slate-700">
                <i className="fas fa-mosque text-xl text-emerald-800"></i>
              </div>
              <h2 className="text-2xl font-black text-emerald-950 dark:text-emerald-50 tracking-tighter">Ibadathi</h2>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] leading-tight px-6 font-medium mt-1">"Your modern spiritual companion for consistency and growth."</p>
            </div>
            
            <div className="grid grid-cols-1 gap-2 w-full max-w-[280px]">
              <div className="card-premium !p-3 dark:bg-slate-800 flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center text-xs"><i className="fas fa-heart"></i></div>
                 <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 text-left">Helping you stay consistent in daily worship.</p>
              </div>
              <div className="card-premium !p-3 dark:bg-slate-800 flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center text-xs"><i className="fas fa-globe"></i></div>
                 <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 text-left">Available in multiple languages for accessibility.</p>
              </div>
            </div>
            
            <span className="text-slate-300 dark:text-slate-700 font-black uppercase text-[7px] tracking-[0.4em] mt-4">V5.5 • 1446 AH</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between animate-fade-up">
            <div className="space-y-2">
              {visibleGuide.map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-50 dark:border-slate-700 shadow-sm flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 flex items-center justify-center shrink-0"><i className={`fas ${item.icon} text-xs`}></i></div>
                  <div className="overflow-hidden">
                    <h3 className="text-[9px] font-black text-emerald-950 dark:text-emerald-50 uppercase tracking-tight">{t(item.title)}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-[8px] leading-none truncate">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            {totalGuidePages > 1 && (
              <div className="flex justify-between items-center px-2 mt-4">
                 <button disabled={guidePage === 0} onClick={() => setGuidePage(p => p - 1)} className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400 disabled:opacity-20"><i className="fas fa-chevron-left text-[8px]"></i></button>
                 <span className="text-[8px] font-black uppercase text-slate-300">Page {guidePage + 1}/{totalGuidePages}</span>
                 <button disabled={guidePage === totalGuidePages - 1} onClick={() => setGuidePage(p => p + 1)} className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400 disabled:opacity-20"><i className="fas fa-chevron-right text-[8px]"></i></button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AboutHelp;
