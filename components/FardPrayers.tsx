import React, { useState } from 'react';
import { UserData, PrayerStatus, PrayerTimings } from '../types';
import { PRAYERS } from '../constants';

interface FardPrayersProps {
  state: UserData & { todayTimings: PrayerTimings | null };
  updatePrayerStatus: (date: string, prayer: any, status: PrayerStatus) => void;
  toggleSunnahStatus: (date: string, sunnahName: string) => void;
  setCurrentView: (view: any) => void;
  t: (key: string) => string;
}

const SUNNAH_PRAYERS = ['Fajr Sunnah', 'Dhuhr Before', 'Dhuhr After', 'Maghrib Sunnah', 'Isha Sunnah', 'Witr'];

const FardPrayers: React.FC<FardPrayersProps> = ({ state, updatePrayerStatus, toggleSunnahStatus, setCurrentView, t }) => {
  const [activeTab, setActiveTab] = useState<'fard' | 'sunnah'>('fard');
  const today = new Date().toISOString().split('T')[0];
  const fardLogs = state.prayerLogs[today] || { fajr: PrayerStatus.PENDING, dhuhr: PrayerStatus.PENDING, asr: PrayerStatus.PENDING, maghrib: PrayerStatus.PENDING, isha: PrayerStatus.PENDING };
  const sunnahLogs = state.sunnahLogs[today] || [];
  const isExcused = state.isHaydNifas;

  const handleToggle = (prayer: any, type: 'fard' | 'sunnah') => {
    if (type === 'fard') {
      const currentStatus = fardLogs[prayer as keyof typeof fardLogs];
      // Cycle: Pending -> Completed -> Missed -> Pending
      let nextStatus: PrayerStatus = PrayerStatus.PENDING;
      if (currentStatus === PrayerStatus.PENDING) nextStatus = PrayerStatus.COMPLETED;
      else if (currentStatus === PrayerStatus.COMPLETED) nextStatus = PrayerStatus.MISSED;
      else if (currentStatus === PrayerStatus.MISSED) nextStatus = PrayerStatus.PENDING;
      
      updatePrayerStatus(today, prayer, nextStatus);
    } else {
      toggleSunnahStatus(today, prayer);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#fdfbf7] dark:bg-slate-950 overflow-hidden">
      <header className="bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 px-6 pt-12 pb-8 flex flex-col gap-6 z-10 shrink-0 rounded-b-[40px] shadow-2xl relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="flex justify-between items-center w-full content-limit relative z-10">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-white tracking-tight">{t('fard')}</h1>
            <p className="text-[9px] font-black text-emerald-300 uppercase tracking-widest mt-1">Daily Divine Schedule</p>
          </div>
          <div className="bg-white/10 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
             <div className="flex">
               <button onClick={() => setActiveTab('fard')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'fard' ? 'bg-white text-emerald-900 shadow-lg' : 'text-white/40'}`}>{t('fard')}</button>
               <button onClick={() => setActiveTab('sunnah')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sunnah' ? 'bg-white text-emerald-900 shadow-lg' : 'text-white/40'}`}>{t('sunnah')}</button>
             </div>
          </div>
        </div>
      </header>

      <div className="scroll-container px-6 pt-8 space-y-4 w-full flex flex-col items-center no-scrollbar">
        <div className="w-full content-limit space-y-3 pb-24">
          {(activeTab === 'fard' ? PRAYERS : SUNNAH_PRAYERS).map((p, idx) => {
            const status = activeTab === 'fard' ? fardLogs[p as keyof typeof fardLogs] : (sunnahLogs.includes(p) ? PrayerStatus.COMPLETED : PrayerStatus.PENDING);
            const isDone = status === PrayerStatus.COMPLETED;
            const isMissed = status === PrayerStatus.MISSED;
            const time = activeTab === 'fard' ? state.todayTimings?.[p.charAt(0).toUpperCase() + p.slice(1) as keyof PrayerTimings] : null;
            
            return (
              <button 
                key={p} 
                onClick={() => !isExcused && handleToggle(p, activeTab)} 
                className={`card-premium !p-5 flex items-center justify-between border-2 transition-all duration-500 animate-fade-up ${
                  isDone 
                    ? `border-emerald-500 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 shadow-lg shadow-emerald-500/10 animate-pop` 
                    : isMissed 
                    ? `border-rose-400 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-950/20 shadow-sm`
                    : 'border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-200'
                } ${isExcused ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all duration-500 ${
                    isDone 
                      ? `bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/20 scale-110` 
                      : isMissed
                      ? `bg-rose-500 text-white shadow-md`
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-300'
                  }`}>
                    <i className={`fas ${isDone ? 'fa-check' : isMissed ? 'fa-xmark' : 'fa-kaaba'}`}></i>
                  </div>
                  <div className="text-left">
                    <h3 className="font-black text-slate-900 dark:text-emerald-50 text-base tracking-tight">{t(p)}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                       {time && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{time}</p>}
                       {isDone && (
                         <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <i className="fas fa-sparkles text-[7px]"></i> {t('completed')}
                         </span>
                       )}
                       {isMissed && (
                         <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest bg-rose-100 dark:bg-rose-900/30 px-2 py-0.5 rounded-full">
                               {t('missed')}
                            </span>
                            <span className="text-[8px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em] flex items-center gap-1">
                               <i className="fas fa-history text-[7px]"></i> Qada
                            </span>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
                
                {!isExcused && (
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDone ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : isMissed ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-200'}`}>
                      <i className={`fas ${isDone ? 'fa-star' : isMissed ? 'fa-rotate-right' : 'fa-plus'} text-[10px]`}></i>
                   </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FardPrayers;