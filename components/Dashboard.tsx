import React, { useMemo, useState, useEffect } from 'react';
import { UserData, PrayerTimings, PrayerStatus } from '../types';
import { PRAYERS, HADITHS } from '../constants';

interface DashboardProps {
  state: UserData & { todayTimings: PrayerTimings | null; isExcusedToday?: boolean };
  setCurrentView: (view: any) => void;
  t: (key: string) => string;
  updatePrayerStatus: (date: string, prayer: any, status: PrayerStatus) => void;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, setCurrentView, t, updatePrayerStatus, onLogout }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = useMemo(() => currentTime.toISOString().split('T')[0], [currentTime]);
  const logs = useMemo(() => state.prayerLogs[todayStr] || { fajr: 'pending', dhuhr: 'pending', asr: 'pending', maghrib: 'pending', isha: 'pending' }, [state.prayerLogs, todayStr]);

  const dailyHadith = useMemo(() => {
    const start = new Date(currentTime.getFullYear(), 0, 0);
    const diff = currentTime.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayIndex = Math.floor(diff / oneDay);
    return HADITHS[dayIndex % HADITHS.length];
  }, [currentTime]);

  const nextPrayer = useMemo(() => {
    if (!state.todayTimings) return null;
    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const timings = PRAYERS.map(p => {
      const key = p.charAt(0).toUpperCase() + p.slice(1) as keyof PrayerTimings;
      const [h, m] = (state.todayTimings![key] || "00:00").split(':').map(Number);
      return { name: p, minutes: h * 60 + m, time: state.todayTimings![key] };
    });
    let next = timings.find(t => t.minutes > nowMinutes);
    if (!next) next = { ...timings[0], minutes: timings[0].minutes + 1440 };
    const diff = next.minutes - nowMinutes;
    return { ...next, diffH: Math.floor(diff / 60), diffM: diff % 60 };
  }, [state.todayTimings, currentTime]);

  return (
    <div className="flex flex-col h-full overflow-hidden w-full">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-30 bg-ivory/80 dark:bg-slate-950/80 backdrop-blur-xl px-5 pt-8 pb-4 border-b border-black/5 dark:border-white/5 shadow-sm transition-colors duration-500">
        <div className="content-limit w-full space-y-6">
          {/* Header & Greeting */}
          <div className="flex justify-between items-center animate-fade-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 text-emerald-500">
                <i className="fas fa-mosque text-sm"></i>
              </div>
              <div>
                <h2 className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none mb-1">Assalamu Alaikum</h2>
                <h1 className="text-lg font-black text-emerald-950 dark:text-white tracking-tight leading-none truncate max-w-[150px]">{state.profile.name}</h1>
              </div>
            </div>
            <button onClick={onLogout} className="w-9 h-9 flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-xl text-slate-400 hover:text-rose-500 transition-colors">
              <i className="fas fa-power-off text-xs"></i>
            </button>
          </div>

          {/* Date Banner & Women's Indicator */}
          <div className="card-premium !p-4 bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/20 border-emerald-100/30 dark:border-emerald-900/10 flex flex-col gap-2 shadow-lg animate-fade-up stagger-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-emerald-600 text-white rounded-xl flex flex-col items-center justify-center shadow-md shadow-emerald-600/10">
                  <span className="text-[10px] font-black leading-none mb-0.5">{currentTime.getDate()}</span>
                  <span className="text-[6px] font-black uppercase tracking-widest leading-none">{currentTime.toLocaleString('default', { month: 'short' })}</span>
                </div>
                <div>
                  <h3 className="text-xs font-black text-emerald-900 dark:text-emerald-400 tracking-tight">{currentTime.toLocaleDateString(undefined, { weekday: 'long' })}</h3>
                  <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{currentTime.getFullYear()}</p>
                </div>
              </div>
              {state.isExcusedToday && (
                <div className="py-1.5 px-3 bg-rose-500/10 dark:bg-rose-950/30 border border-rose-500/20 rounded-lg flex items-center gap-2 animate-pop">
                  <div className="w-1 h-1 rounded-full bg-rose-500 animate-pulse"></div>
                  <span className="text-[7px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">Excuse Active</span>
                </div>
              )}
            </div>
          </div>

          {/* Daily Hadith (Sticky) */}
          <div className="animate-fade-up stagger-2">
            <div className="card-premium !p-4 relative overflow-hidden group !bg-transparent border-emerald-500/10 dark:border-emerald-400/10 shadow-none">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[7px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">{t('hadithTitle')}</span>
                <span className="text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{dailyHadith.reference}</span>
              </div>
              <p className="arabic-font text-xl font-bold text-emerald-950 dark:text-white text-center leading-relaxed" dir="rtl">{dailyHadith.arabic}</p>
              <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 italic leading-relaxed text-center opacity-80 mt-2 line-clamp-2">"{dailyHadith.en}"</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-container px-5 pt-4 pb-32">
        <div className="content-limit w-full">
          {/* Next Prayer Highlight */}
          <div className="mb-8 animate-fade-up stagger-3">
            <div className={`card-premium !p-6 flex items-center justify-between shadow-2xl transition-all duration-500 ${state.isExcusedToday ? 'bg-gradient-to-r from-rose-500 to-rose-600 shadow-rose-600/20' : 'bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-emerald-600/20'} border-none`}>
              <div className="flex items-center gap-5 text-white">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                  <i className={`fas ${state.isExcusedToday ? 'fa-leaf' : 'fa-clock'}`}></i>
                </div>
                <div>
                  <h3 className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${state.isExcusedToday ? 'text-rose-100/70' : 'text-emerald-100/70'}`}>{t('nextPrayer')}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black tracking-tight capitalize">{nextPrayer ? t(nextPrayer.name) : '---'}</span>
                    <span className={`text-xs font-bold tabular-nums ${state.isExcusedToday ? 'text-rose-100/60' : 'text-emerald-100/60'}`}>@ {nextPrayer?.time}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl py-2 px-4 border border-white/20 text-center text-white">
                 <p className="text-[11px] font-black tabular-nums leading-none">
                   {state.isExcusedToday ? 'Excused' : `-${nextPrayer?.diffH}h ${nextPrayer?.diffM}m`}
                 </p>
              </div>
            </div>
          </div>

          {/* Prayers Tracker */}
          <div className="mb-8 animate-fade-up stagger-4">
            <div className="flex justify-between items-center mb-5 px-1">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Worship Tracker</h3>
              <span className={`text-[9px] font-black uppercase tracking-widest ${state.isExcusedToday ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-50'}`}>
                {state.isExcusedToday ? 'EXCUSED' : `${PRAYERS.filter(p => logs[p as keyof typeof logs] === 'completed').length}/5`}
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-1 px-1 py-1">
              {PRAYERS.map(p => {
                const status = logs[p as keyof typeof logs];
                const isDone = status === PrayerStatus.COMPLETED;
                const isExcused = status === PrayerStatus.EXCUSED || state.isExcusedToday;
                const time = state.todayTimings?.[p.charAt(0).toUpperCase() + p.slice(1) as keyof PrayerTimings];
                
                return (
                  <button 
                    key={p} 
                    disabled={isExcused}
                    onClick={() => !isExcused && updatePrayerStatus(todayStr, p, isDone ? PrayerStatus.PENDING : PrayerStatus.COMPLETED)} 
                    className={`flex-none w-20 aspect-[4/5] rounded-[1.5rem] border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
                      isDone 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' 
                        : isExcused
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-500/60 opacity-80'
                        : 'bg-white dark:bg-slate-900 border-black/5 dark:border-white/10 text-slate-400 hover:border-emerald-200'
                    }`}
                  >
                    <div className="text-center">
                      <p className="text-[7px] font-black uppercase tracking-widest mb-0.5 opacity-60 leading-none">{time}</p>
                      <p className="text-[10px] font-black capitalize leading-none">{t(p)}</p>
                    </div>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs transition-all ${
                      isDone ? 'bg-emerald-500 text-white shadow-md' : isExcused ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-300'
                    }`}>
                       <i className={`fas ${isDone ? 'fa-check' : isExcused ? 'fa-leaf' : 'fa-clock'}`}></i>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Tools */}
          <div className="grid grid-cols-2 gap-4 animate-fade-up stagger-5 mb-8">
            <button onClick={() => setCurrentView('quran')} className="card-premium h-24 flex items-center gap-4 !p-4 hover:border-amber-200 transition-colors">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm"><i className="fas fa-book-quran"></i></div>
              <div className="text-left overflow-hidden">
                <h4 className="font-black text-sm text-emerald-950 dark:text-white truncate">{t('quran')}</h4>
                <p className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">{state.quranProgress.surah || 'Not Started'}</p>
              </div>
            </button>
            <button onClick={() => setCurrentView('qibla')} className="card-premium h-24 flex items-center gap-4 !p-4 hover:border-blue-200 transition-colors">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center text-2xl shadow-sm"><i className="fas fa-compass"></i></div>
              <div className="text-left overflow-hidden">
                <h4 className="font-black text-sm text-emerald-950 dark:text-white truncate">{t('qibla')}</h4>
                <p className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">Direction</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;