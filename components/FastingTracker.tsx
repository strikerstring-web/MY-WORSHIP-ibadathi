import React, { useState } from 'react';
import { UserData, FastingLog, PrayerTimings } from '../types';

interface FastingTrackerProps {
  state: UserData & { todayTimings: PrayerTimings | null };
  updateFasting: (date: string, log: FastingLog) => void;
  setCurrentView: (view: any) => void;
  t: (key: string) => string;
}

const FastingTracker: React.FC<FastingTrackerProps> = ({ state, updateFasting, setCurrentView, t }) => {
  const ramadanDays = Array.from({ length: 30 }, (_, i) => i + 1);
  const year = '1446H';

  const getLog = (day: number) => state.fastingLogs[`ramadan-${year}-${day}`] || { status: 'none', type: 'ramadan' };

  const toggle = (day: number) => {
    const current = getLog(day);
    const next: FastingLog['status'] = current.status === 'none' ? 'completed' : current.status === 'completed' ? 'missed' : 'none';
    updateFasting(`ramadan-${year}-${day}`, { status: next, type: 'ramadan' });
  };

  const stats = ramadanDays.reduce((acc, d) => {
    const l = getLog(d);
    if (l.status === 'completed') acc.c++;
    if (l.status === 'missed') acc.m++;
    return acc;
  }, { c: 0, m: 0 });

  return (
    <div className="scroll-container px-4 pt-10 content-limit w-full pb-32">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => setCurrentView(null)} className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm"><i className="fas fa-chevron-left text-xs"></i></button>
        <h1 className="text-3xl font-black text-emerald-950 dark:text-emerald-50 tracking-tighter">Holy Fasting</h1>
      </div>

      <div className="card-premium bg-gradient-to-br from-emerald-800 to-teal-900 text-white mb-8 !p-6 flex justify-around items-center border-none shadow-xl shadow-emerald-900/20">
         <div className="text-center">
            <p className="text-3xl font-black text-emerald-300">{stats.c}</p>
            <p className="text-[8px] font-black uppercase tracking-widest text-white/50">{t('completed')}</p>
         </div>
         <div className="h-10 w-px bg-white/10"></div>
         <div className="text-center">
            <p className="text-3xl font-black text-rose-400">{stats.m}</p>
            <p className="text-[8px] font-black uppercase tracking-widest text-white/50">Qada Due</p>
         </div>
      </div>

      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Ramadan {year} Calendar</h3>
      <div className="grid grid-cols-5 gap-3">
         {ramadanDays.map(d => {
           const log = getLog(d);
           return (
             <button 
               key={d} 
               onClick={() => toggle(d)}
               className={`h-16 rounded-2xl border-2 flex flex-col items-center justify-center transition-all active:scale-95 ${log.status === 'completed' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-400 text-white' : log.status === 'missed' ? 'bg-gradient-to-br from-rose-500 to-rose-600 border-rose-400 text-white' : 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-slate-50 dark:border-slate-800 text-slate-300'}`}
             >
                <span className="text-xs font-black">{d}</span>
                <i className={`fas ${log.status === 'completed' ? 'fa-check' : log.status === 'missed' ? 'fa-xmark' : 'fa-moon'} text-[8px] mt-1`}></i>
             </button>
           );
         })}
      </div>
    </div>
  );
};

export default FastingTracker;