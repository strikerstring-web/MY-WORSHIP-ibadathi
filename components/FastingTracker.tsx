
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
    // If today is an excused day, we can handle logic to mark as missed for Qada
    const current = getLog(day);
    let next: FastingLog['status'] = 'none';
    
    if (current.status === 'none') next = 'completed';
    else if (current.status === 'completed') next = 'missed';
    else if (current.status === 'missed') next = 'excused';
    else if (current.status === 'excused') next = 'none';
    
    updateFasting(`ramadan-${year}-${day}`, { status: next, type: 'ramadan' });
  };

  const stats = ramadanDays.reduce((acc, d) => {
    const l = getLog(d);
    if (l.status === 'completed') acc.c++;
    if (l.status === 'missed') acc.m++;
    if (l.status === 'excused') acc.e++;
    return acc;
  }, { c: 0, m: 0, e: 0 });

  return (
    <div className="scroll-container px-4 pt-10 content-limit w-full pb-32">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => setCurrentView(null)} className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm"><i className="fas fa-chevron-left text-xs"></i></button>
        <h1 className="text-3xl font-black text-emerald-950 dark:text-emerald-50 tracking-tighter">Holy Fasting</h1>
      </div>

      <div className={`card-premium mb-8 !p-6 flex justify-around items-center border-none shadow-xl transition-all duration-500 ${state.isExcusedToday ? 'bg-gradient-to-br from-rose-800 to-rose-950 shadow-rose-900/20' : 'bg-gradient-to-br from-emerald-800 to-teal-900 shadow-emerald-900/20'} text-white`}>
         <div className="text-center">
            <p className={`text-3xl font-black ${state.isExcusedToday ? 'text-rose-200' : 'text-emerald-300'}`}>{stats.c}</p>
            <p className="text-[8px] font-black uppercase tracking-widest text-white/50">{t('completed')}</p>
         </div>
         <div className="h-10 w-px bg-white/10"></div>
         <div className="text-center">
            <p className="text-3xl font-black text-rose-400">{stats.m + stats.e}</p>
            <p className="text-[8px] font-black uppercase tracking-widest text-white/50">Qada Due</p>
         </div>
         {stats.e > 0 && (
           <>
             <div className="h-10 w-px bg-white/10"></div>
             <div className="text-center">
                <p className="text-3xl font-black text-pink-300">{stats.e}</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-white/50">{t('excused')}</p>
             </div>
           </>
         )}
      </div>

      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ramadan {year} Calendar</h3>
        {state.isExcusedToday && (
          <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-full border border-rose-100 dark:border-rose-900/20 flex items-center gap-2">
            <i className="fas fa-leaf text-[7px]"></i> Excuse Active
          </span>
        )}
      </div>

      <div className="grid grid-cols-5 gap-3">
         {ramadanDays.map(d => {
           const log = getLog(d);
           const isCompleted = log.status === 'completed';
           const isMissed = log.status === 'missed';
           const isExcused = log.status === 'excused';
           
           return (
             <button 
               key={d} 
               onClick={() => toggle(d)}
               className={`h-16 rounded-2xl border-2 flex flex-col items-center justify-center transition-all active:scale-95 ${
                 isCompleted 
                   ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-400 text-white' 
                   : isMissed 
                   ? 'bg-gradient-to-br from-rose-500 to-rose-600 border-rose-400 text-white' 
                   : isExcused
                   ? 'bg-gradient-to-br from-pink-500 to-rose-500 border-pink-400 text-white shadow-inner'
                   : 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-slate-50 dark:border-slate-800 text-slate-300'
               }`}
             >
                <span className="text-xs font-black">{d}</span>
                <i className={`fas ${
                  isCompleted ? 'fa-check' : 
                  isMissed ? 'fa-xmark' : 
                  isExcused ? 'fa-leaf' : 'fa-moon'
                } text-[8px] mt-1`}></i>
             </button>
           );
         })}
      </div>

      <div className="mt-8 p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Fasting Guide</h4>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center shrink-0">
              <i className="fas fa-check text-[10px]"></i>
            </div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed">Fasts completed normally are rewarded in full. Alhamdulillah.</p>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center shrink-0">
              <i className="fas fa-xmark text-[10px]"></i>
            </div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed">Missed fasts (due to travel/illness) should be marked for Qada.</p>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-xl bg-pink-50 dark:bg-pink-900/20 text-pink-500 flex items-center justify-center shrink-0">
              <i className="fas fa-leaf text-[10px]"></i>
            </div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed">Fasts missed due to Hayd/Nifas are to be made up later, with no sin. Ibadathi labels these clearly for your tracking.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FastingTracker;
