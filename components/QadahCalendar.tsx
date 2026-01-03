import React, { useState, useMemo } from 'react';
import { UserData, PrayerStatus, QadaReminder, PrayerTimings, HealthPeriod, FastingLog } from '../types';
import { PRAYERS } from '../constants';

interface QadahCalendarProps {
  state: UserData & { todayTimings: PrayerTimings | null };
  updatePrayerStatus: (date: string, prayer: any, status: PrayerStatus) => void;
  updateReminders: (reminders: QadaReminder[]) => void;
  setCurrentView: (view: any) => void;
  t: (key: string) => string;
}

const QadahCalendar: React.FC<QadahCalendarProps> = ({ state, updatePrayerStatus, updateReminders, setCurrentView, t }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const month = viewDate.getMonth(), year = viewDate.getFullYear();
  const todayStr = new Date().toISOString().split('T')[0];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const isDateInHayd = (dateStr: string): boolean => {
    const targetDate = new Date(dateStr).getTime();
    return state.healthPeriods.some(p => {
      const start = new Date(p.start).getTime();
      const end = p.end ? new Date(p.end).getTime() : new Date().getTime() + (100 * 365 * 24 * 60 * 60 * 1000);
      return targetDate >= start && targetDate <= end;
    });
  };

  const days = useMemo(() => {
    const arr = [];
    for (let i = 0; i < firstDayOfMonth; i++) arr.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      arr.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`);
    }
    return arr;
  }, [month, year]);

  const monthlyStats = useMemo(() => {
    let completed = 0;
    let missed = 0;
    let fastingCount = 0;

    days.forEach(dateStr => {
      if (!dateStr) return;
      const logs = state.prayerLogs[dateStr];
      const fastingLog = Object.entries(state.fastingLogs).find(([k]) => k.includes(dateStr))?.[1] as FastingLog | undefined;

      if (fastingLog?.status === 'completed') fastingCount++;

      if (logs) {
        PRAYERS.forEach(p => {
          if (logs[p] === PrayerStatus.COMPLETED) completed++;
          if (logs[p] === PrayerStatus.MISSED) missed++;
        });
      }
    });
    return { completed, missed, fastingCount };
  }, [days, state.prayerLogs, state.fastingLogs]);

  const handleStatus = (prayer: string, status: PrayerStatus) => {
    if (selectedDate) {
      if ('vibrate' in navigator) navigator.vibrate(20);
      updatePrayerStatus(selectedDate, prayer as any, status);
    }
  };

  const monthName = viewDate.toLocaleString('default', { month: 'long' });

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const range = [];
    for (let i = currentYear - 2; i <= currentYear + 1; i++) range.push(i);
    return range;
  }, []);

  const handleMonthSelect = (m: number) => {
    setViewDate(new Date(year, m, 1));
  };

  const handleYearSelect = (y: number) => {
    setViewDate(new Date(y, month, 1));
  };

  return (
    <div className="flex flex-col h-full bg-[#fdfbf7] dark:bg-slate-950 overflow-hidden animate-fade-in relative">
      {/* Date Picker Overlay */}
      {showDatePicker && (
        <div className="absolute inset-0 z-50 flex flex-col animate-fade-in">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowDatePicker(false)}></div>
          <div className="relative mt-auto bg-white dark:bg-slate-900 rounded-t-[40px] p-8 shadow-2xl animate-fade-up max-h-[80%] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-emerald-950 dark:text-emerald-50 tracking-tight">Jump to Date</h3>
              <button onClick={() => setShowDatePicker(false)} className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="space-y-8">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Select Year</p>
                <div className="flex flex-wrap gap-3">
                  {years.map(y => (
                    <button 
                      key={y} 
                      onClick={() => handleYearSelect(y)}
                      className={`px-6 py-3 rounded-2xl text-xs font-black transition-all ${year === y ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Select Month</p>
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 12 }, (_, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleMonthSelect(i)}
                      className={`px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all ${month === i ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                    >
                      {new Date(0, i).toLocaleString('default', { month: 'short' })}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setShowDatePicker(false)}
                className="w-full py-5 bg-emerald-950 dark:bg-emerald-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl"
              >
                Apply Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Header with Gradient */}
      <header className="sticky top-0 z-30 bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 px-6 pt-12 pb-6 shrink-0 shadow-2xl rounded-b-[40px]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentView(null)} 
              className="w-11 h-11 flex items-center justify-center bg-white/10 text-white rounded-2xl border border-white/10 active:scale-95 transition-transform"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            <button 
              onClick={() => setShowDatePicker(true)}
              className="flex flex-col text-left group active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight group-hover:text-emerald-300 transition-colors">{monthName}</h1>
                <i className="fas fa-calendar-alt text-xs text-emerald-400 opacity-40 group-hover:opacity-100 transition-opacity"></i>
              </div>
              <p className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.2em]">{year}</p>
            </button>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setViewDate(new Date(year, month - 1, 1))} 
              className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <button 
              onClick={() => setViewDate(new Date(year, month + 1, 1))} 
              className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>

        {/* Monthly Summary Cards */}
        <div className="grid grid-cols-3 gap-3 relative z-10">
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-center">
            <p className="text-[8px] font-black text-emerald-300 uppercase tracking-widest mb-1">{t('completed')}</p>
            <p className="text-lg font-black text-white">{monthlyStats.completed}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-center">
            <p className="text-[8px] font-black text-rose-300 uppercase tracking-widest mb-1">{t('missed')}</p>
            <p className="text-lg font-black text-white">{monthlyStats.missed}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-center">
            <p className="text-[8px] font-black text-amber-300 uppercase tracking-widest mb-1">{t('fasting')}</p>
            <p className="text-lg font-black text-white">{monthlyStats.fastingCount}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 pb-32 no-scrollbar">
        {/* Visual Legend */}
        <div className="content-limit mb-6 px-2">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 py-4 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('completed')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
              <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('missed')}</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-leaf text-[10px] text-pink-400"></i>
              <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('excused')}</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-moon text-[10px] text-gold-500"></i>
              <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('fasting')}</span>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="content-limit grid grid-cols-7 gap-2 mb-8">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
            <div key={d} className="text-center text-[10px] font-black text-slate-300 dark:text-slate-700 py-2 uppercase tracking-[0.2em]">{d}</div>
          ))}
          
          {days.map((dateStr, idx) => {
            if (!dateStr) return <div key={`empty-${idx}`} className="h-14" />;
            
            const isSelected = selectedDate === dateStr;
            const isToday = dateStr === todayStr;
            const isHayd = isDateInHayd(dateStr);
            const dayNum = dateStr.split('-')[2];
            const logs = state.prayerLogs[dateStr];
            const fastingLog = Object.entries(state.fastingLogs).find(([k]) => k.includes(dateStr))?.[1] as FastingLog | undefined;
            const isFast = fastingLog?.status === 'completed';

            // Calculate overall day status for background highlights
            const allPrayersDone = logs && PRAYERS.every(p => logs[p] === PrayerStatus.COMPLETED);

            return (
              <button 
                key={dateStr} 
                onClick={() => setSelectedDate(dateStr)} 
                className={`
                  relative h-20 rounded-[1.25rem] border-2 flex flex-col items-center justify-between p-2 transition-all duration-300 group
                  ${isSelected ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-xl shadow-emerald-500/10 z-10 scale-105' : 
                    isHayd ? 'border-pink-100 dark:border-pink-900/20 bg-pink-50/40 dark:bg-pink-950/20' : 
                    isToday ? 'border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900' :
                    'border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900'}
                  ${allPrayersDone && !isSelected ? 'ring-1 ring-emerald-500/20' : ''}
                `}
              >
                <div className="flex justify-between w-full">
                  <span className={`text-[11px] font-black ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : isHayd ? 'text-pink-500' : isToday ? 'text-teal-600' : 'text-slate-400'}`}>
                    {parseInt(dayNum)}
                  </span>
                  {isFast && (
                    <i className="fas fa-moon text-[8px] text-gold-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.3)]"></i>
                  )}
                </div>

                {!isHayd && logs ? (
                  <div className="grid grid-cols-3 gap-1 px-1">
                    {PRAYERS.map(p => {
                      const s = logs[p];
                      return (
                        <div 
                          key={p} 
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                            s === PrayerStatus.COMPLETED ? 'bg-emerald-500 scale-110 shadow-[0_0_4px_rgba(16,185,129,0.4)]' : 
                            s === PrayerStatus.MISSED ? 'bg-rose-500 scale-110 shadow-[0_0_4px_rgba(244,63,94,0.4)]' : 
                            'bg-slate-100 dark:bg-slate-800'
                          }`}
                        ></div>
                      );
                    })}
                  </div>
                ) : isHayd ? (
                  <div className="flex items-center justify-center mb-1">
                    <i className="fas fa-leaf text-[11px] text-pink-300/80 animate-pulse"></i>
                  </div>
                ) : (
                  <div className="h-4"></div>
                )}
                
                {isSelected && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Day Details Section */}
        {selectedDate && (
          <div className="content-limit animate-fade-up px-2 pb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-600 dark:bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <i className="fas fa-calendar-check"></i>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white leading-none">
                    {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
                  </h2>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Worship Status Summary</p>
                </div>
              </div>
              {isDateInHayd(selectedDate) && (
                <span className="px-4 py-2 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-pink-100 dark:border-pink-800/30 flex items-center gap-2">
                  <i className="fas fa-leaf text-[8px] animate-pulse"></i> {t('excused')}
                </span>
              )}
            </div>

            <div className="space-y-4">
              {PRAYERS.map((prayer) => {
                const logs = state.prayerLogs[selectedDate] || { fajr: 'pending', dhuhr: 'pending', asr: 'pending', maghrib: 'pending', isha: 'pending' };
                const s = isDateInHayd(selectedDate) ? PrayerStatus.EXCUSED : (logs[prayer as keyof typeof logs] || PrayerStatus.PENDING);
                
                const isCompleted = s === PrayerStatus.COMPLETED;
                const isMissed = s === PrayerStatus.MISSED;
                const isExcused = s === PrayerStatus.EXCUSED;

                return (
                  <div 
                    key={prayer} 
                    className={`
                      card-premium !p-5 flex items-center justify-between transition-all duration-300 border-2
                      ${isCompleted ? 'border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-900/10' : 
                        isMissed ? 'border-rose-500/30 bg-rose-50/10 dark:bg-rose-900/10' : 
                        isExcused ? 'border-pink-500/10 bg-pink-50/5 dark:bg-pink-900/5' :
                        'border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm'}
                    `}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all duration-500 ${
                        isCompleted ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 scale-105' : 
                        isMissed ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/20 scale-105' : 
                        isExcused ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-400' :
                        'bg-slate-50 dark:bg-slate-800 text-slate-300'
                      }`}>
                        <i className={`fas ${
                          isCompleted ? 'fa-check-circle' : 
                          isMissed ? 'fa-history' : 
                          isExcused ? 'fa-leaf' : 'fa-circle-dot'
                        }`}></i>
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white capitalize text-base tracking-tight">{t(prayer)}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${
                            isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 
                            isMissed ? 'text-rose-600 dark:text-rose-400' : 
                            isExcused ? 'text-pink-400' : 'text-slate-400'
                          }`}>
                            {isCompleted ? 'Alhamdulillah' : isMissed ? 'Requires Qada' : isExcused ? t('excused') : t('pending')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!isExcused && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleStatus(prayer, isCompleted ? PrayerStatus.PENDING : PrayerStatus.COMPLETED)}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all active:scale-95 duration-200 ${
                            isCompleted ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 
                            'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-300 hover:border-emerald-200 hover:text-emerald-500'
                          }`}
                        >
                          <i className="fas fa-check text-sm"></i>
                        </button>
                        <button 
                          onClick={() => handleStatus(prayer, isMissed ? PrayerStatus.PENDING : PrayerStatus.MISSED)}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all active:scale-95 duration-200 ${
                            isMissed ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-500/30' : 
                            'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-300 hover:border-rose-200 hover:text-rose-500'
                          }`}
                        >
                          <i className="fas fa-history text-[11px]"></i>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QadahCalendar;