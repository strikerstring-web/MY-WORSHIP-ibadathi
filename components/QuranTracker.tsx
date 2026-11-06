import React, { useState, useMemo, useRef, useEffect } from 'react';
import { UserData, QuranProgress, PrayerTimings } from '../types';
import { SURAHS } from '../constants';

interface QuranTrackerProps {
  state: UserData & { todayTimings: PrayerTimings | null };
  onUpdate: (progress: QuranProgress) => void;
  setCurrentView: (view: any) => void;
  t: (key: string) => string;
}

const QuranTracker: React.FC<QuranTrackerProps> = ({ state, onUpdate, setCurrentView, t }) => {
  const [surahInput, setSurahInput] = useState(state.quranProgress.surah || '');
  const [ayahInput, setAyahInput] = useState(state.quranProgress.ayah || '');
  const [juzInput, setJuzInput] = useState(state.quranProgress.juz || '');
  const [pageInput, setPageInput] = useState(state.quranProgress.page || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [savedAlert, setSavedAlert] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredSurahs = useMemo(() => {
    if (!surahInput) return SURAHS.slice(0, 5);
    return SURAHS.filter(s => s.toLowerCase().includes(surahInput.toLowerCase())).slice(0, 5);
  }, [surahInput]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePageStep = (delta: number) => {
    const current = parseInt(pageInput, 10) || 0;
    const next = Math.max(1, Math.min(604, current + delta));
    setPageInput(next.toString());
  };

  const handleSave = () => {
    onUpdate({
      surah: surahInput,
      ayah: ayahInput,
      juz: juzInput,
      page: pageInput,
      lastUpdated: new Date().toISOString()
    });
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2500);
    if ('vibrate' in navigator) navigator.vibrate(40);
  };

  const inputClasses = "w-full p-3.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-amber-500/10 outline-none shadow-sm font-black text-emerald-950 dark:text-emerald-50 text-sm";
  const labelClasses = "text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block";

  return (
    <div className="flex flex-col h-full bg-[#fdfbf7] dark:bg-slate-900 animate-fade-up">
      <div className="p-4 pt-10 pb-6 bg-gradient-to-br from-amber-600 via-amber-700 to-orange-800 text-white shadow-xl rounded-b-[32px] z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentView('dashboard')} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl border border-white/20 active:scale-90">
            <i className="fas fa-chevron-left text-sm"></i>
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight">{t('quran')}</h1>
            <p className="text-[9px] text-amber-200 font-black uppercase tracking-widest">Divine Journey</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-5 overflow-y-auto">
        <div className="card-premium !p-5 text-center relative overflow-hidden bg-gradient-to-br from-white to-amber-50/20 dark:from-slate-800 dark:to-amber-900/10 border-amber-100/50">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 dark:bg-amber-900/10 rounded-full -mr-12 -mt-12 blur-2xl opacity-50"></div>
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-600 text-xl shadow-md">
            <i className="fas fa-book-open"></i>
          </div>
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('lastRead')}</span>
          <h2 className="text-lg font-black text-emerald-950 dark:text-emerald-50 leading-tight">
            {state.quranProgress.surah ? `${state.quranProgress.surah}${state.quranProgress.ayah ? `, ${t('ayah')} ${state.quranProgress.ayah}` : ''}` : 'Not started'}
          </h2>
          
          <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
            {state.quranProgress.page && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-amber-500/20">
                <i className="fas fa-file-lines text-[9px]"></i> {t('page')} {state.quranProgress.page}
              </span>
            )}
            {state.quranProgress.juz && (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-emerald-500/20">
                <i className="fas fa-bookmark text-[9px]"></i> {t('juz')} {state.quranProgress.juz}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Add Page No section */}
          <div className="p-3.5 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <i className="fas fa-file-lines text-amber-600"></i>
                <span>Add Page No (Mushaf)</span>
              </label>
              <span className="text-[9px] font-bold text-slate-400">Pages 1 – 604</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageStep(-1)}
                className="w-11 h-11 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-center justify-center text-amber-700 dark:text-amber-300 active:scale-95 shadow-sm text-sm font-black"
                title="Previous Page"
              >
                <i className="fas fa-minus text-xs"></i>
              </button>

              <input 
                type="number" 
                min="1"
                max="604"
                placeholder="Page # (e.g. 142)"
                className={`${inputClasses} text-center text-base`}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
              />

              <button
                type="button"
                onClick={() => handlePageStep(1)}
                className="w-11 h-11 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-center justify-center text-amber-700 dark:text-amber-300 active:scale-95 shadow-sm text-sm font-black"
                title="Next Page"
              >
                <i className="fas fa-plus text-xs"></i>
              </button>
            </div>
          </div>

          {/* Surah dropdown selection */}
          <div className="space-y-1 relative" ref={dropdownRef}>
            <label className={labelClasses}>{t('surah')}</label>
            <input 
              type="text" 
              placeholder="e.g. Al-Baqarah"
              className={inputClasses}
              value={surahInput}
              onFocus={() => setShowDropdown(true)}
              onChange={(e) => { setSurahInput(e.target.value); setShowDropdown(true); }}
            />
            {showDropdown && filteredSurahs.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 p-1 z-50">
                {filteredSurahs.map(s => (
                  <button key={s} onClick={() => { setSurahInput(s); setShowDropdown(false); }} className="w-full text-left px-4 py-2 hover:bg-amber-50 dark:hover:bg-slate-700 rounded-lg text-xs font-black text-emerald-950 dark:text-emerald-50">{s}</button>
                ))}
              </div>
            )}
          </div>

          {/* Juz & Ayah inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={labelClasses}>{t('juz')}</label>
              <input type="number" min="1" max="30" placeholder="1-30" className={inputClasses} value={juzInput} onChange={(e) => setJuzInput(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>{t('ayah')}</label>
              <input type="number" placeholder="Verse #" className={inputClasses} value={ayahInput} onChange={(e) => setAyahInput(e.target.value)} />
            </div>
          </div>

          {savedAlert && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-bold animate-pop">
              <i className="fas fa-circle-check"></i>
              <span>Reading progress saved!</span>
            </div>
          )}

          <button onClick={handleSave} className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-900/10 active:scale-95 transition-all">
            {t('save')}
          </button>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/10 dark:to-slate-900 p-4 rounded-3xl border border-amber-100 dark:border-amber-900/30 mt-2">
          <h3 className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-2">
            <i className="fas fa-sparkles"></i> {t('quranVirtue')}
          </h3>
          <p className="text-emerald-950 dark:text-emerald-50 arabic-font text-lg leading-relaxed text-right font-black mb-2" dir="rtl">مَنْ قَرَأَ حَرْفًا مِنْ كِتَابِ اللَّهِ فَلَهُ بِهِ حَسَنَةٌ</p>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] italic border-l-2 border-amber-200 dark:border-amber-800 pl-3 font-black">"Whoever reads a letter from the Book of Allah, he will have a reward ten-fold..."</p>
        </div>
      </div>
    </div>
  );
};

export default QuranTracker;