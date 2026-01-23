import React, { useState, useMemo, useEffect } from 'react';
import { UserData, PrayerStatus, PrayerTimings, FastingLog } from '../types';
import { PRAYERS } from '../constants';

interface PrayerCalendarProps {
  state: UserData & { todayTimings: PrayerTimings | null };
  updatePrayerStatus: (date: string, prayer: any, status: PrayerStatus) => void;
  setCurrentView: (view: any) => void;
  t: (key: string) => string;
}

const PrayerCalendar: React.FC<PrayerCalendarProps> = ({ state, updatePrayerStatus, setCurrentView, t }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const month = viewDate.getMonth();
  const year = viewDate.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const isFemale = state.profile.sex === 'female';

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  });

  const getDayWorshipData = (date: string) => {
    const log = state.prayerLogs[date] || {};
    const excused = isFemale && state.healthPeriods.some(p => {
      const d = new Date(date).setHours(0, 0, 0, 0);
      const s = new Date(p.start).setHours(0, 0, 0, 0);
      const e = p.end ? new Date(p.end).setHours(23, 59, 59, 999) : new Date().getTime() + 86400000000;
      return d >= s && d <= e;
    });

    const fasting = Object.entries(state.fastingLogs).find(([k]) => k.includes(date))?.[1] as FastingLog | undefined;
    const dhikrDone = state.dhikrHistory.some(h => h.date.startsWith(date));
    const quranDone = state.quranProgress.lastUpdated.startsWith(date);

    return {
      fardCount: PRAYERS.filter(p => log[p] === PrayerStatus.COMPLETED).length,
      missedCount: PRAYERS.filter(p => log[p] === PrayerStatus.MISSED).length,
      isFasting: fasting?.status === 'completed',
      dhikrDone,
      quranDone,
      excused
    };
  };

  const selectedData = useMemo(() => getDayWorshipData(selectedDateStr), [selectedDateStr, state, isFemale]);

  const handleStatusChange = (prayer: string, status: PrayerStatus) => {
    updatePrayerStatus(selectedDateStr, prayer, status);
    if ('vibrate' in navigator) navigator.vibrate(40);
  };

  const monthName = viewDate.toLocaleString('default', { month: 'long' });

  return (
    <div className="flex flex-col h-full bg-ivory dark:bg-slate-950 overflow-hidden view-transition">
      {/* Premium Header */}
      <header className="p-6 pt-12 bg-gradient-to-br from-emerald-800 to-emerald-950 text-white shrink-0 shadow-2xl rounded-b-[48px] relative z-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black tracking-tighter leading-none animate-fade-up">
              {monthName}
            </h1>
            <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mt-2 opacity-70">
              {year} • Worship Cycle
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setViewDate(new Date(year, month - 1, 1))} 
              className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 active:scale-95 transition-all hover:bg-white/20"
              aria-label="Previous Month"
            >
              <i className="fas fa-chevron-left text-sm"></i>
            </button>
            <button 
              onClick={() => setViewDate(new Date(year, month + 1, 1))} 
              className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 active:scale-95 transition-all hover:bg-white/20"
              aria-label="Next Month"
            >
              <i className="fas fa-chevron-right text-sm"></i>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black text-emerald-300/60 uppercase tracking-[0.2em] relative z-10">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-40 no-scrollbar">
        <div className="content-limit w-full">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2.5 mb-10 animate-fade-up stagger-1">
            {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} className="aspect-square" />)}
            {days.map(d => {
              const data = getDayWorshipData(d);
              const isSelected = selectedDateStr === d;
              const isToday = d === new Date().toISOString().split('T')[0];
              
              return (
                <button 
                  key={d} 
                  onClick={() => setSelectedDateStr(d)} 
                  className={`relative aspect-square rounded-[1.25rem] border-2 flex flex-col items-center justify-center transition-all duration-300 ${
                    isSelected ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 scale-105 shadow-xl z-10' : 
                    data.excused ? 'bg-rose-50/20 border-rose-100/30 dark:bg-rose-950/10' : 
                    isToday ? 'border-teal-500/50 bg-white dark:bg-slate-900 ring-2 ring-teal-500/10' :
                    'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 hover:border-emerald-100'
                  }`}
                >
                  <span className={`text-[12px] font-black ${
                    isSelected ? 'text-emerald-700 dark:text-emerald-400' : 
                    data.excused ? 'text-rose-400' : 
                    'text-slate-800 dark:text-emerald-50'
                  }`}>
                    {d.split('-')[2]}
                  </span>
                  
                  <div className="flex flex-wrap justify-center gap-[2px] w-full px-1">
                    {data.excused ? (
                      <i className="fas fa-leaf text-[7px] text-rose-300"></i>
                    ) : (
                      <>
                        {data.fardCount > 0 && <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_3px_rgba(16,185,129,0.5)]"></div>}
                        {data.missedCount > 0 && <div className="w-1 h-1 rounded-full bg-rose-500 shadow-[0_0_3px_rgba(244,63,94,0.5)]"></div>}
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Daily Worship Details */}
          <div className="animate-fade-up stagger-2">
            <div className="card-premium !p-6 shadow-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                    {new Date(selectedDateStr).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Worship Details</p>
                </div>
                {selectedData.excused && (
                  <div className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center gap-1.5 animate-pop">
                    <i className="fas fa-leaf text-[8px] text-rose-500"></i>
                    <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">{t('excused')}</span>
                  </div>
                )}
              </div>

              {/* Individual Prayer Rows */}
              <div className="space-y-3">
                {PRAYERS.map((p) => {
                  const log = state.prayerLogs[selectedDateStr] || {};
                  const status = selectedData.excused ? PrayerStatus.EXCUSED : (log[p] || PrayerStatus.PENDING);
                  
                  const isCompleted = status === PrayerStatus.COMPLETED;
                  const isMissed = status === PrayerStatus.MISSED;
                  const isExcused = status === PrayerStatus.EXCUSED;
                  const isPending = status === PrayerStatus.PENDING;

                  return (
                    <div 
                      key={p} 
                      className={`p-4 rounded-3xl border transition-all duration-300 flex flex-col gap-3 ${
                        isCompleted ? 'border-emerald-500/20 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02]' : 
                        isMissed ? 'border-rose-500/20 bg-rose-500/[0.03] dark:bg-rose-500/[0.02]' : 
                        isExcused ? 'border-rose-200/20 bg-rose-200/[0.03]' :
                        'border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm transition-all ${
                            isCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 
                            isMissed ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 
                            isExcused ? 'bg-rose-100 text-rose-400' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-300'
                          }`}>
                            <i className={`fas ${
                              isCompleted ? 'fa-check-circle' : 
                              isMissed ? 'fa-circle-xmark' : 
                              isExcused ? 'fa-leaf' : 'fa-circle-dot'
                            }`}></i>
                          </div>
                          <div>
                            <p className="text-sm font-black capitalize text-emerald-950 dark:text-white leading-tight">{t(p)}</p>
                            <span className={`text-[8px] font-black uppercase tracking-widest ${
                              isCompleted ? 'text-emerald-500' : 
                              isMissed ? 'text-rose-500' : 
                              isExcused ? 'text-rose-400' : 'text-slate-400'
                            }`}>
                              {isCompleted ? 'Alhamdulillah' : isMissed ? 'Needs Qada' : isExcused ? 'Day of Ease' : 'Pending Log'}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Status Buttons */}
                        {!isExcused && (
                          <div className="flex gap-1.5 p-1 bg-white/50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <button 
                              onClick={() => handleStatusChange(p, PrayerStatus.COMPLETED)}
                              title="Mark Completed"
                              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                                isCompleted ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-300 hover:text-emerald-500'
                              }`}
                            >
                              <i className="fas fa-check text-[10px]"></i>
                            </button>
                            <button 
                              onClick={() => handleStatusChange(p, PrayerStatus.MISSED)}
                              title="Mark Missed"
                              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                                isMissed ? 'bg-rose-500 text-white shadow-md' : 'text-slate-300 hover:text-rose-500'
                              }`}
                            >
                              <i className="fas fa-xmark text-[10px]"></i>
                            </button>
                            <button 
                              onClick={() => handleStatusChange(p, PrayerStatus.PENDING)}
                              title="Reset status"
                              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                                isPending ? 'bg-slate-200 dark:bg-slate-700 text-slate-500' : 'text-slate-300 hover:text-slate-500'
                              }`}
                            >
                              <i className="fas fa-rotate-left text-[9px]"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Day Quick Summary Icons */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-4 gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 ${selectedData.fardCount === 5 ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                    <i className="fas fa-check-double text-[10px]"></i>
                  </div>
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{t('fard')}</span>
                  <p className="text-xs font-black text-slate-900 dark:text-white">{selectedData.fardCount}/5</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 ${selectedData.isFasting ? 'bg-amber-400 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                    <i className="fas fa-moon text-[10px]"></i>
                  </div>
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{t('fasting')}</span>
                  <p className="text-xs font-black text-slate-900 dark:text-white">{selectedData.isFasting ? 'YES' : 'NO'}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 ${selectedData.quranDone ? 'bg-purple-400 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                    <i className="fas fa-book-quran text-[10px]"></i>
                  </div>
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{t('quran')}</span>
                  <p className="text-xs font-black text-slate-900 dark:text-white">{selectedData.quranDone ? 'YES' : 'NO'}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 ${selectedData.dhikrDone ? 'bg-blue-400 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                    <i className="fas fa-fingerprint text-[10px]"></i>
                  </div>
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{t('dhikr')}</span>
                  <p className="text-xs font-black text-slate-900 dark:text-white">{selectedData.dhikrDone ? 'YES' : 'NO'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrayerCalendar;