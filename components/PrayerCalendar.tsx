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
  const [activeEditingPrayer, setActiveEditingPrayer] = useState<string | null>(null);

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
    
    // Check for Dhikr on this date
    const dhikrDone = state.dhikrHistory.some(h => h.date.startsWith(date));
    
    // Check for Quran activity on this date
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
    setActiveEditingPrayer(null);
    if ('vibrate' in navigator) navigator.vibrate(20);
  };

  const monthName = viewDate.toLocaleString('default', { month: 'long' });

  return (
    <div className="flex flex-col h-full bg-ivory dark:bg-slate-950 overflow-hidden view-transition">
      {/* Refined Modern Header */}
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
          {/* Calendar Grid with Activity Indicators */}
          <div className="grid grid-cols-7 gap-2.5 mb-10 animate-fade-up stagger-1">
            {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} className="aspect-square" />)}
            {days.map(d => {
              const data = getDayWorshipData(d);
              const isSelected = selectedDateStr === d;
              const isToday = d === new Date().toISOString().split('T')[0];
              
              return (
                <button 
                  key={d} 
                  onClick={() => {
                    setSelectedDateStr(d);
                    setActiveEditingPrayer(null);
                  }} 
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
                  
                  {/* Activity Markers */}
                  <div className="flex flex-wrap justify-center gap-[2px] w-full px-1">
                    {data.excused ? (
                      <i className="fas fa-leaf text-[7px] text-rose-300"></i>
                    ) : (
                      <>
                        {data.fardCount > 0 && <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_3px_rgba(16,185,129,0.5)]"></div>}
                        {data.missedCount > 0 && <div className="w-1 h-1 rounded-full bg-rose-500 shadow-[0_0_3px_rgba(244,63,94,0.5)]"></div>}
                        {data.dhikrDone && <div className="w-1 h-1 rounded-full bg-blue-400 shadow-[0_0_3px_rgba(96,165,250,0.5)]"></div>}
                        {data.quranDone && <div className="w-1 h-1 rounded-full bg-purple-400 shadow-[0_0_3px_rgba(168,85,247,0.5)]"></div>}
                        {data.isFasting && <div className="w-1 h-1 rounded-full bg-amber-400 shadow-[0_0_3px_rgba(251,191,36,0.5)]"></div>}
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Activity Legend Section */}
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-3 mb-10 px-6 py-5 bg-white/40 dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm animate-fade-up stagger-2">
            {[
              { c: 'bg-emerald-500', l: 'completed' },
              { c: 'bg-rose-500', l: 'missed' },
              { c: 'bg-blue-400', l: 'dhikr' },
              { c: 'bg-purple-400', l: 'quran' },
              { c: 'bg-amber-400', l: 'fasting' },
              ...(isFemale ? [{ c: 'bg-rose-400', l: 'excused' }] : [])
            ].map(item => (
              <div key={item.l} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${item.c} shadow-sm ${item.l === 'excused' ? 'bg-rose-400' : ''}`}></div>
                <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t(item.l)}</span>
              </div>
            ))}
          </div>

          {/* Daily Summary Modal-Style Card */}
          <div className="animate-fade-up stagger-3">
            <div className="card-premium !p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-start mb-8">
                <div className="flex flex-col">
                  <h2 className="text-2xl font-black text-emerald-950 dark:text-white leading-none tracking-tight">
                    {new Date(selectedDateStr).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Worship Insights</span>
                    {selectedData.excused && (
                      <span className="text-[8px] font-black text-rose-500 uppercase bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <i className="fas fa-leaf text-[7px]"></i> {t('excused')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                   <i className="fas fa-sparkles text-lg"></i>
                </div>
              </div>

              {/* Worship Status List */}
              <div className="space-y-4">
                {PRAYERS.map((p, idx) => {
                  const log = state.prayerLogs[selectedDateStr] || {};
                  const status = log[p] || PrayerStatus.PENDING;
                  const isEditing = activeEditingPrayer === p;
                  const isExcusedDay = selectedData.excused;
                  
                  return (
                    <div 
                      key={p} 
                      className={`relative group p-4 rounded-3xl border transition-all duration-300 ${
                        isEditing 
                          ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10 shadow-lg' 
                          : 'border-slate-50 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg transition-all shadow-sm ${
                            status === PrayerStatus.COMPLETED ? 'bg-emerald-500 text-white' : 
                            status === PrayerStatus.MISSED ? 'bg-rose-500 text-white' : 
                            isExcusedDay ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-400' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-300'
                          }`}>
                            <i className={`fas ${status === PrayerStatus.COMPLETED ? 'fa-check' : status === PrayerStatus.MISSED ? 'fa-history' : isExcusedDay ? 'fa-leaf' : 'fa-clock-rotate-left'}`}></i>
                          </div>
                          <div>
                            <p className="text-sm font-black capitalize text-emerald-950 dark:text-white leading-tight">{t(p)}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                              {isExcusedDay ? t('excused') : (status === PrayerStatus.PENDING ? 'Not Yet Logged' : status)}
                            </p>
                          </div>
                        </div>
                        
                        {!isExcusedDay && (
                          <button 
                            onClick={() => setActiveEditingPrayer(isEditing ? null : p)}
                            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                              isEditing ? 'bg-emerald-100 text-emerald-600' : 'text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <i className={`fas ${isEditing ? 'fa-chevron-up' : 'fa-ellipsis-v'} text-xs`}></i>
                          </button>
                        )}
                      </div>

                      {isEditing && !isExcusedDay && (
                        <div className="mt-5 flex gap-2.5 animate-fade-in">
                          <button 
                            onClick={() => handleStatusChange(p, PrayerStatus.COMPLETED)}
                            className="flex-1 py-3.5 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                          >
                            Completed
                          </button>
                          <button 
                            onClick={() => handleStatusChange(p, PrayerStatus.MISSED)}
                            className="flex-1 py-3.5 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-500/20 active:scale-95 transition-all"
                          >
                            Missed
                          </button>
                          <button 
                            onClick={() => handleStatusChange(p, PrayerStatus.PENDING)}
                            className="w-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl active:scale-95 transition-all"
                            aria-label="Clear"
                          >
                            <i className="fas fa-undo text-xs"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Enhanced Quick Stats Row */}
              <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-between px-2">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-xl flex items-center justify-center mb-2">
                     <i className="fas fa-check-double text-xs"></i>
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Prayed</p>
                  <p className="text-xl font-black text-emerald-950 dark:text-white mt-0.5">{selectedData.fardCount}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 bg-purple-50 dark:bg-purple-900/30 text-purple-400 rounded-xl flex items-center justify-center mb-2">
                     <i className="fas fa-book-quran text-xs"></i>
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quran</p>
                  <p className="text-xl font-black text-emerald-950 dark:text-white mt-0.5">{selectedData.quranDone ? 'YES' : 'NO'}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/30 text-blue-400 rounded-xl flex items-center justify-center mb-2">
                     <i className="fas fa-fingerprint text-xs"></i>
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dhikr</p>
                  <p className="text-xl font-black text-emerald-950 dark:text-white mt-0.5">{selectedData.dhikrDone ? 'YES' : 'NO'}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-xl flex items-center justify-center mb-2">
                     <i className="fas fa-moon text-xs"></i>
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fast</p>
                  <p className="text-xl font-black text-emerald-950 dark:text-white mt-0.5">{selectedData.isFasting ? 'YES' : 'NO'}</p>
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
