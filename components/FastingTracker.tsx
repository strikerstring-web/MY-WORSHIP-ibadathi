import React from 'react';
import { UserData, FastingLog, PrayerTimings } from '../types';

interface FastingTrackerProps {
  state: UserData & { todayTimings: PrayerTimings | null; isExcusedToday?: boolean };
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
    let next: FastingLog['status'] = 'none';
    
    // Simplified cycle: None -> Completed -> Missed -> None
    // "Excused" is treated as "Missed" for Qada purposes
    if (current.status === 'none') next = 'completed';
    else if (current.status === 'completed') next = 'missed';
    else next = 'none';
    
    updateFasting(`ramadan-${year}-${day}`, { status: next, type: 'ramadan' });
  };

  const stats = ramadanDays.reduce((acc, d) => {
    const l = getLog(d);
    if (l.status === 'completed') acc.c++;
    // We count both 'missed' and legacy 'excused' entries as missed for stats
    if (l.status === 'missed' || l.status === 'excused') acc.m++;
    return acc;
  }, { c: 0, m: 0 });

  return (
    <div className="scroll-container px-4 pt-10 content-limit w-full pb-32">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => setCurrentView(null)} className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm active:scale-90 transition-transform"><i className="fas fa-chevron-left text-xs"></i></button>
        <h1 className="text-3xl font-black text-emerald-950 dark:text-emerald-50 tracking-tighter">Holy Fasting</h1>
      </div>

      <div className={`card-premium mb-8 !p-6 flex justify-around items-center border-none shadow-xl transition-all duration-500 ${state.isExcusedToday ? 'bg-gradient-to-br from-rose-800 to-rose-950 shadow-rose-900/20' : 'bg-gradient-to-br from-emerald-800 to-teal-900 shadow-emerald-900/20'} text-white`}>
         <div className="text-center">
            <p className={`text-3xl font-black ${state.isExcusedToday ? 'text-rose-200' : 'text-emerald-300'}`}>{stats.c}</p>
            <p className="text-[8px] font-black uppercase tracking-widest text-white/50">{t('completed')}</p>
         </div>
         <div className="h-10 w-px bg-white/10"></div>
         <div className="text-center">
            <p className="text-3xl font-black text-rose-400">{stats.m}</p>
            <p className="text-[8px] font-black uppercase tracking-widest text-white/50">Qada Required</p>
         </div>
      </div>

      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ramadan {year} Progress</h3>
        {state.isExcusedToday && (
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-full border border-rose-100 dark:border-rose-900/20 flex items-center gap-2 mb-1">
              <i className="fas fa-leaf text-[7px]"></i> Excuse Active
            </span>
            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Mark as Missed for Qada</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-5 gap-3">
         {ramadanDays.map(d => {
           const log = getLog(d);
           // Treat legacy 'excused' as missed visually
           const isCompleted = log.status === 'completed';
           const isMissed = log.status === 'missed' || log.status === 'excused';
           
           return (
             <button 
               key={d} 
               onClick={() => toggle(d)}
               className={`h-16 rounded-2xl border-2 flex flex-col items-center justify-center transition-all active:scale-95 ${
                 isCompleted 
                   ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-400 text-white shadow-md' 
                   : isMissed 
                   ? 'bg-gradient-to-br from-rose-500 to-rose-600 border-rose-400 text-white shadow-sm' 
                   : 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-slate-50 dark:border-slate-800 text-slate-300'
               }`}
             >
                <span className="text-xs font-black">{d}</span>
                <i className={`fas ${
                  isCompleted ? 'fa-check' : 
                  isMissed ? 'fa-history' : 
                  'fa-moon'
                } text-[8px] mt-1`}></i>
             </button>
           );
         })}
      </div>

      <div className="mt-8 p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ramadan Fasting Rules</h4>
        <div className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center shrink-0">
              <i className="fas fa-check text-xs"></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-950 dark:text-emerald-50 uppercase tracking-tight mb-0.5">Completed Fast</p>
              <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">Fasts observed from dawn to sunset. Reward multiplied by 10 to 700 times. Alhamdulillah.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center shrink-0">
              <i className="fas fa-history text-xs"></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-950 dark:text-emerald-50 uppercase tracking-tight mb-0.5">Missed / Excused (Qada)</p>
              <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">Days missed due to travel, illness, or Hayd/Nifas. These must be marked as Missed and made up before the next Ramadan.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center px-6">
        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-relaxed">
          "The fast is for Me and I will give the reward for it." (Hadith Qudsi)
        </p>
      </div>
    </div>
  );
};

export default FastingTracker;