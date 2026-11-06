import React, { useState, useEffect } from 'react';
import { UserData, PrayerTimings } from '../types';

interface TrackerPageProps {
  state: UserData & { todayTimings: PrayerTimings | null; isExcusedToday?: boolean };
  setCurrentView: (view: string) => void;
  updateTotalDhikrCount: (delta: number) => void;
  t: (key: string) => string;
}

interface DhikrOption {
  id: string;
  name: string;
  arabic: string;
  meaning: string;
  defaultTarget: number;
}

const DHIKR_OPTIONS: DhikrOption[] = [
  { id: 'subhanallah', name: 'SubhanAllah', arabic: 'سُبْحَانَ اللَّهِ', meaning: 'Glory be to Allah', defaultTarget: 33 },
  { id: 'alhamdulillah', name: 'Alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', meaning: 'All praise is for Allah', defaultTarget: 33 },
  { id: 'allahuakbar', name: 'Allahu Akbar', arabic: 'اللَّهُ أَكْبَرُ', meaning: 'Allah is the Greatest', defaultTarget: 34 },
  { id: 'astaghfirullah', name: 'Astaghfirullah', arabic: 'أَسْتَغْفِرُ اللَّهَ', meaning: 'I seek forgiveness from Allah', defaultTarget: 100 },
  { id: 'lailaha', name: 'La Ilaha Illa Allah', arabic: 'لَا إِلَهَ إِلَّا اللَّهُ', meaning: 'There is no god but Allah', defaultTarget: 100 },
  { id: 'salawat', name: 'Salawat on Prophet ﷺ', arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', meaning: 'Blessings upon Prophet Muhammad', defaultTarget: 100 },
  { id: 'custom', name: 'Custom Dhikr', arabic: 'ذِكْرُ اللَّهِ', meaning: 'Continuous remembrance', defaultTarget: 100 },
];

const PRESET_TARGETS = [33, 99, 100, 300, 500, 1000];

const TrackerPage: React.FC<TrackerPageProps> = ({ state, setCurrentView, updateTotalDhikrCount, t }) => {
  const userKey = state.profile.username || 'guest';
  const storageKey = `ibadathi_tracker_dhikr_${userKey}`;

  // Dhikr Counter State
  const [count, setCount] = useState<number>(0);
  const [target, setTarget] = useState<number>(33);
  const [laps, setLaps] = useState<number>(0);
  const [selectedDhikr, setSelectedDhikr] = useState<DhikrOption>(DHIKR_OPTIONS[0]);
  const [customName, setCustomName] = useState<string>('');
  
  // Set Modal State
  const [isSetModalOpen, setIsSetModalOpen] = useState<boolean>(false);
  const [setTargetInput, setSetTargetInput] = useState<string>('33');
  const [setCountInput, setSetCountInput] = useState<string>('0');
  const [selectedDhikrId, setSelectedDhikrId] = useState<string>('subhanallah');

  // Animation trigger
  const [isPressing, setIsPressing] = useState<boolean>(false);
  const [justCompletedLap, setJustCompletedLap] = useState<boolean>(false);

  // Load saved state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.count === 'number') setCount(parsed.count);
        if (typeof parsed.target === 'number') setTarget(parsed.target);
        if (typeof parsed.laps === 'number') setLaps(parsed.laps);
        if (parsed.dhikrId) {
          const match = DHIKR_OPTIONS.find(d => d.id === parsed.dhikrId);
          if (match) setSelectedDhikr(match);
        }
        if (parsed.customName) setCustomName(parsed.customName);
      }
    } catch (e) {
      console.warn("Failed to load tracker dhikr state", e);
    }
  }, [storageKey]);

  // Persist state
  const saveState = (newCount: number, newTarget: number, newLaps: number, dhikrId: string, custom?: string) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        count: newCount,
        target: newTarget,
        laps: newLaps,
        dhikrId,
        customName: custom || customName
      }));
    } catch (e) {
      console.warn("Failed to persist tracker dhikr", e);
    }
  };

  // 1. COUNT ACTION
  const handleCount = () => {
    setIsPressing(true);
    setTimeout(() => setIsPressing(false), 150);

    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }

    const nextCount = count + 1;
    let nextLaps = laps;

    // Target reached
    if (target > 0 && nextCount % target === 0) {
      nextLaps = laps + 1;
      setJustCompletedLap(true);
      setTimeout(() => setJustCompletedLap(false), 2000);
      if ('vibrate' in navigator) {
        navigator.vibrate([60, 50, 100]);
      }
    }

    setCount(nextCount);
    setLaps(nextLaps);
    updateTotalDhikrCount(1);
    saveState(nextCount, target, nextLaps, selectedDhikr.id);
  };

  // 2. RESET ACTION
  const handleReset = () => {
    if ('vibrate' in navigator) navigator.vibrate(40);
    setCount(0);
    setLaps(0);
    saveState(0, target, 0, selectedDhikr.id);
  };

  // 3. SET ACTION (Open Modal)
  const openSetModal = () => {
    setSetCountInput(count.toString());
    setSetTargetInput(target.toString());
    setSelectedDhikrId(selectedDhikr.id);
    setIsSetModalOpen(true);
  };

  const handleApplySet = () => {
    const parsedTarget = Math.max(1, parseInt(setTargetInput, 10) || 33);
    const parsedCount = Math.max(0, parseInt(setCountInput, 10) || 0);
    const chosenDhikr = DHIKR_OPTIONS.find(d => d.id === selectedDhikrId) || selectedDhikr;

    setTarget(parsedTarget);
    setCount(parsedCount);
    setSelectedDhikr(chosenDhikr);
    setIsSetModalOpen(false);
    saveState(parsedCount, parsedTarget, laps, chosenDhikr.id, customName);

    if ('vibrate' in navigator) navigator.vibrate(30);
  };

  const progressPercentage = target > 0 ? Math.min(100, Math.round(((count % target) / target) * 100)) : 100;

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar scroll-container px-5 pt-8 pb-32 w-full">
      <div className="content-limit w-full space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between animate-fade-up">
          <div>
            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Worship & Reflection
            </span>
            <h1 className="text-2xl font-black text-emerald-950 dark:text-white tracking-tight">
              Tracker & Dhikr
            </h1>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-sm">
            <i className="fas fa-fingerprint text-base"></i>
          </div>
        </div>

        {/* ======================================================== */}
        {/* DIGITAL DHIKR COUNTER CARD                               */}
        {/* ======================================================== */}
        <div className="card-premium !p-6 relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 border-2 border-emerald-500/20 shadow-xl shadow-emerald-900/5 animate-fade-up stagger-1">
          {/* Subtle Ambient Background Ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-emerald-500/[0.04] dark:bg-emerald-500/[0.02] pointer-events-none blur-2xl"></div>

          {/* Top Bar: Dhikr Selector & Target Status */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                {selectedDhikr.id === 'custom' && customName ? customName : selectedDhikr.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {laps > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                  <i className="fas fa-trophy text-[8px]"></i>
                  <span>Laps: {laps}</span>
                </span>
              )}
              <span className="text-[10px] font-black tabular-nums text-slate-400 dark:text-slate-500 px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/5">
                Target: {target}
              </span>
            </div>
          </div>

          {/* Arabic Calligraphy Phrase */}
          <div className="text-center my-2 relative z-10">
            <p className="arabic-font text-3xl sm:text-4xl font-bold text-emerald-950 dark:text-emerald-300 drop-shadow-sm leading-relaxed" dir="rtl">
              {selectedDhikr.arabic}
            </p>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 italic mt-0.5">
              "{selectedDhikr.meaning}"
            </p>
          </div>

          {/* Progress Bar towards Target */}
          <div className="w-full my-4 relative z-10">
            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1.5 px-0.5">
              <span>Current Progress</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-black">
                {count % target} / {target} ({progressPercentage}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 shadow-sm shadow-emerald-500/20"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Lap Completion Alert */}
          {justCompletedLap && (
            <div className="mb-4 py-2 px-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-center text-xs font-black text-emerald-700 dark:text-emerald-300 animate-pop relative z-10 flex items-center justify-center gap-1.5">
              <i className="fas fa-sparkles text-amber-500"></i>
              <span>Alhamdulillah! Target reached!</span>
            </div>
          )}

          {/* THE MAIN COUNT BUTTON (Big, Tactile, Center) */}
          <div className="flex justify-center my-4 relative z-10">
            <button
              onClick={handleCount}
              className={`w-44 h-44 rounded-full flex flex-col items-center justify-center relative transition-all duration-200 select-none cursor-pointer ${
                isPressing 
                  ? 'scale-95 shadow-inner' 
                  : 'hover:scale-[1.02] active:scale-95'
              } bg-gradient-to-b from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 text-white shadow-2xl shadow-emerald-600/30 border-4 border-white/30 dark:border-white/10`}
            >
              {/* Ripple Ring */}
              <div className="absolute inset-2 rounded-full border border-white/20 pointer-events-none"></div>

              {/* Digital Count Display */}
              <span className="text-5xl font-black tabular-nums tracking-tighter leading-none mb-1 drop-shadow-md">
                {count}
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-100 opacity-90 flex items-center gap-1">
                <i className="fas fa-hand-pointer text-[9px]"></i>
                <span>COUNT</span>
              </span>
            </button>
          </div>

          {/* CONTROLS ROW: RESET BUTTON & SET BUTTON */}
          <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-black/5 dark:border-white/5 relative z-10">
            {/* RESET BUTTON */}
            <button
              onClick={handleReset}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 border border-black/5 dark:border-white/5 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
              title="Reset Count to 0"
            >
              <i className="fas fa-rotate-left text-xs"></i>
              <span className="uppercase tracking-wider text-[10px] font-black">Reset</span>
            </button>

            {/* SET BUTTON */}
            <button
              onClick={openSetModal}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-emerald-600/20"
              title="Set Target and Dhikr"
            >
              <i className="fas fa-sliders text-xs"></i>
              <span className="uppercase tracking-wider text-[10px] font-black">Set Target</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* WORSHIP HUB SHORTCUTS (Quran, Fasting, Qibla, Women)     */}
        {/* ======================================================== */}
        <div className="space-y-3 animate-fade-up stagger-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-tight">
              Worship Trackers
            </h3>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
              My Path
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Quran Tracker Card with Page No */}
            <div 
              onClick={() => setCurrentView('quran')}
              className="card-premium flex items-center gap-4 cursor-pointer hover:scale-[1.01] active:scale-98 transition-all !p-4 border-amber-500/20 hover:border-amber-400"
            >
              <div className="w-13 h-13 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0">
                <i className="fas fa-book-open"></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-emerald-950 dark:text-white text-base tracking-tight truncate">
                    {t('quran')}
                  </h3>
                  {state.quranProgress.page && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[9px] font-black uppercase tracking-wider">
                      Page {state.quranProgress.page}
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {state.quranProgress.surah 
                    ? `${state.quranProgress.surah}${state.quranProgress.ayah ? `, v. ${state.quranProgress.ayah}` : ''}${state.quranProgress.juz ? ` • Juz ${state.quranProgress.juz}` : ''}`
                    : 'Tap to log your daily reading'}
                </p>
              </div>
              <i className="fas fa-chevron-right text-slate-300 text-xs"></i>
            </div>

            {/* Fasting Tracker */}
            <div 
              onClick={() => setCurrentView('fasting')}
              className="card-premium flex items-center gap-4 cursor-pointer hover:scale-[1.01] active:scale-98 transition-all !p-4 border-blue-500/20 hover:border-blue-400"
            >
              <div className="w-13 h-13 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0">
                <i className="fas fa-moon"></i>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-emerald-950 dark:text-white text-base tracking-tight truncate">
                  {t('fasting')}
                </h3>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  Ramadan & Sunnah voluntary fasts
                </p>
              </div>
              <i className="fas fa-chevron-right text-slate-300 text-xs"></i>
            </div>

            {/* Qibla Direction */}
            <div 
              onClick={() => setCurrentView('qibla')}
              className="card-premium flex items-center gap-4 cursor-pointer hover:scale-[1.01] active:scale-98 transition-all !p-4 border-emerald-500/20 hover:border-emerald-400"
            >
              <div className="w-13 h-13 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0">
                <i className="fas fa-compass"></i>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-emerald-950 dark:text-white text-base tracking-tight truncate">
                  {t('qibla')}
                </h3>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  Accurate direction towards the Holy Kaaba
                </p>
              </div>
              <i className="fas fa-chevron-right text-slate-300 text-xs"></i>
            </div>

            {/* Women's Space (if user is female) */}
            {state.profile.sex === 'female' && (
              <div 
                onClick={() => setCurrentView('women')}
                className="card-premium flex items-center gap-4 cursor-pointer hover:scale-[1.01] active:scale-98 transition-all !p-4 border-rose-500/20 hover:border-rose-400"
              >
                <div className="w-13 h-13 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0">
                  <i className="fas fa-leaf"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-emerald-950 dark:text-white text-base tracking-tight truncate">
                    {t('womensSpace')}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    Health cycle & worship exemption tracker
                  </p>
                </div>
                <i className="fas fa-chevron-right text-slate-300 text-xs"></i>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* SET MODAL: CONFIG TARGET, COUNT, AND DHIKR PHRASE        */}
        {/* ======================================================== */}
        {isSetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 animate-pop">
              <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-sm">
                    <i className="fas fa-sliders"></i>
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Set Dhikr & Target
                  </h3>
                </div>
                <button 
                  onClick={() => setIsSetModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 text-slate-400 hover:text-slate-600 flex items-center justify-center"
                >
                  <i className="fas fa-xmark text-sm"></i>
                </button>
              </div>

              {/* Dhikr Phrase Selector */}
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                  Select Recitation
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto no-scrollbar">
                  {DHIKR_OPTIONS.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setSelectedDhikrId(d.id);
                        setSetTargetInput(d.defaultTarget.toString());
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedDhikrId === d.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300'
                          : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <p className="text-xs font-black truncate">{d.name}</p>
                      <p className="arabic-font text-xs text-slate-400 truncate" dir="rtl">{d.arabic}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Quick Presets */}
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                  Target Goal
                </label>
                <div className="flex gap-1.5 flex-wrap mb-2">
                  {PRESET_TARGETS.map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSetTargetInput(val.toString())}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                        setTargetInput === val.toString()
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  value={setTargetInput}
                  onChange={(e) => setSetTargetInput(e.target.value)}
                  placeholder="Custom Target"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Current Count Input */}
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                  Set Current Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={setCountInput}
                  onChange={(e) => setSetCountInput(e.target.value)}
                  placeholder="Start from count"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSetModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplySet}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white shadow-md shadow-emerald-600/20"
                >
                  Apply & Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackerPage;
