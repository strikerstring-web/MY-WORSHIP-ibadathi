import React, { useMemo, useState, useEffect } from 'react';
import { UserData, PrayerTimings, PrayerStatus, LocationInfo } from '../types';
import { PRAYERS, HADITHS } from '../constants';

interface DashboardProps {
  state: UserData & { todayTimings: PrayerTimings | null; isExcusedToday?: boolean; locationInfo?: LocationInfo };
  setCurrentView: (view: any) => void;
  onOpenLocationModal?: () => void;
  t: (key: string) => string;
  updatePrayerStatus: (date: string, prayer: any, status: PrayerStatus) => void;
  onLogout: () => void;
}

const PRAYER_CONFIG = [
  { id: 'fajr', nameKey: 'Fajr', arabic: 'الفجر', rakat: 2, icon: 'fa-cloud-sun' },
  { id: 'dhuhr', nameKey: 'Dhuhr', arabic: 'الظهر', rakat: 4, icon: 'fa-sun' },
  { id: 'asr', nameKey: 'Asr', arabic: 'العصر', rakat: 4, icon: 'fa-cloud-sun' },
  { id: 'maghrib', nameKey: 'Maghrib', arabic: 'المغرب', rakat: 3, icon: 'fa-cloud-moon' },
  { id: 'isha', nameKey: 'Isha', arabic: 'العشاء', rakat: 4, icon: 'fa-moon' },
];

const format12Hour = (time24?: string) => {
  if (!time24) return '--:--';
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
};

const Dashboard: React.FC<DashboardProps> = ({ state, setCurrentView, onOpenLocationModal, t, updatePrayerStatus, onLogout }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [menuOpenPrayer, setMenuOpenPrayer] = useState<string | null>(null);

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

  const hijriDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(currentTime);
    } catch (e) {
      return "";
    }
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

  const completedCount = useMemo(() => {
    return PRAYERS.filter(p => logs[p as keyof typeof logs] === PrayerStatus.COMPLETED).length;
  }, [logs]);

  const handleBulkToggle = () => {
    if (state.isExcusedToday) return;
    const targetStatus = completedCount === 5 ? PrayerStatus.PENDING : PrayerStatus.COMPLETED;
    PRAYERS.forEach(p => {
      updatePrayerStatus(todayStr, p, targetStatus);
    });
  };

  const handleTogglePrayer = (p: string) => {
    if (state.isExcusedToday) return;
    const currentStatus = logs[p as keyof typeof logs] || PrayerStatus.PENDING;
    const nextStatus = currentStatus === PrayerStatus.COMPLETED ? PrayerStatus.PENDING : PrayerStatus.COMPLETED;
    updatePrayerStatus(todayStr, p, nextStatus);
  };

  const handleSetStatus = (p: string, status: PrayerStatus) => {
    if (state.isExcusedToday) return;
    updatePrayerStatus(todayStr, p, status);
    setMenuOpenPrayer(null);
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar scroll-container px-5 pt-8 pb-32 w-full">
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

        {/* Date Banner & Hijri Date */}
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
            
            <div className="text-right">
              <p className="arabic-font text-sm font-bold text-emerald-800 dark:text-emerald-400" dir="rtl">{hijriDate}</p>
              {state.isExcusedToday && (
                <div className="mt-1 py-1 px-2 bg-rose-500/10 dark:bg-rose-950/30 border border-rose-500/20 rounded-lg flex items-center gap-1.5 animate-pop justify-end">
                  <div className="w-1 h-1 rounded-full bg-rose-500 animate-pulse"></div>
                  <span className="text-[6px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">Excuse Active</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Daily Hadith */}
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

        {/* Active Azan Timing Location Bar */}
        <div 
          onClick={onOpenLocationModal} 
          className="card-premium !p-3.5 border border-emerald-500/20 hover:border-emerald-500/50 flex items-center justify-between cursor-pointer active:scale-98 transition-all animate-fade-up shadow-sm bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs shrink-0 shadow-sm">
              <i className="fas fa-location-dot"></i>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                  Azan Timings For
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 text-slate-400">
                  {state.locationInfo?.source === 'gps' ? 'GPS' : 'City'}
                </span>
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                {state.locationInfo?.city || state.profile.place || 'Detecting Location...'}
              </h4>
            </div>
          </div>
          <button 
            type="button" 
            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 shadow-sm shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <i className="fas fa-sliders text-[8px]"></i>
            <span>Change</span>
          </button>
        </div>

        {/* Next Prayer Highlight */}
        <div className="animate-fade-up stagger-3">
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

          {/* Prayers Tracker - Clean, beautiful list view showing all 5 prayers */}
          <div className="mb-8 animate-fade-up stagger-4">
            {/* Header with Title & Summary Progress */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs shadow-sm">
                  <i className="fas fa-list-check"></i>
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 tracking-tight">Prayer Tracker</h3>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Daily Obligatory Schedule</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {state.isExcusedToday ? (
                  <span className="text-[9px] font-black uppercase tracking-wider text-rose-500 bg-rose-500/10 dark:bg-rose-950/30 px-2.5 py-1 rounded-lg border border-rose-500/20 flex items-center gap-1.5">
                    <i className="fas fa-leaf text-[8px]"></i> Excused
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBulkToggle}
                      className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-2.5 py-1 rounded-lg transition-colors border border-emerald-500/20 active:scale-95"
                    >
                      {completedCount === 5 ? 'Reset All' : 'Mark All Done'}
                    </button>
                    <span className="text-[10px] font-black tabular-nums px-2.5 py-1 rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-600/20">
                      {completedCount}/5
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {!state.isExcusedToday && (
              <div className="mb-4 px-1">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                  <span>Today's Progress</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{Math.round((completedCount / 5) * 100)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 transition-all duration-500 shadow-sm shadow-emerald-500/20"
                    style={{ width: `${(completedCount / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Prayers Vertical List */}
            <div className="space-y-2.5">
              {PRAYER_CONFIG.map((p, index) => {
                const status = logs[p.id as keyof typeof logs] || PrayerStatus.PENDING;
                const isDone = status === PrayerStatus.COMPLETED;
                const isMissed = status === PrayerStatus.MISSED;
                const isExcused = status === PrayerStatus.EXCUSED || state.isExcusedToday;
                const rawTime = state.todayTimings?.[p.id.charAt(0).toUpperCase() + p.id.slice(1) as keyof PrayerTimings] || "--:--";
                const displayTime = format12Hour(rawTime);
                const isNext = nextPrayer?.name === p.id;
                const isMenuOpen = menuOpenPrayer === p.id;

                return (
                  <React.Fragment key={p.id}>
                    {/* Render Sunrise after Fajr (index 0) */}
                    {index === 1 && state.todayTimings?.Sunrise && (
                      <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-transparent dark:from-amber-500/10 dark:via-amber-500/5 dark:to-transparent border border-amber-500/20 flex items-center justify-between text-xs transition-all my-1.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm shadow-sm">
                            <i className="fas fa-sun"></i>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">Sunrise</span>
                              <span className="arabic-font text-xs font-bold text-amber-600 dark:text-amber-400" dir="rtl">الشروق</span>
                            </div>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">End of Fajr window • Ishraq</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-amber-600 dark:text-amber-400 text-xs tabular-nums">
                            {format12Hour(state.todayTimings.Sunrise)}
                          </span>
                          <p className="text-[8px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                            @{state.todayTimings.Sunrise}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Prayer Card */}
                    <div 
                      className={`card-premium !p-3.5 sm:!p-4 border-2 transition-all duration-300 relative overflow-hidden ${
                        isDone 
                          ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 shadow-md shadow-emerald-500/5' 
                          : isMissed
                          ? 'border-rose-400/40 bg-rose-500/10 dark:bg-rose-950/20'
                          : isNext
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/[0.04] dark:bg-emerald-950/20'
                          : 'border-black/5 dark:border-white/5 bg-white dark:bg-slate-900 hover:border-emerald-200/60 dark:hover:border-emerald-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Left: Icon & Names */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Prayer Icon */}
                          <div 
                            onClick={() => !isExcused && handleTogglePrayer(p.id)}
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm transition-all cursor-pointer shrink-0 shadow-sm ${
                              isDone 
                                ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/30' 
                                : isMissed
                                ? 'bg-rose-500 text-white shadow-rose-500/30'
                                : isExcused
                                ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-400'
                                : isNext
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-500'
                            }`}
                          >
                            <i className={`fas ${isDone ? 'fa-check' : isMissed ? 'fa-xmark' : isExcused ? 'fa-leaf' : p.icon}`}></i>
                          </div>

                          {/* Prayer Name & Timing */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-black text-sm text-slate-900 dark:text-white capitalize tracking-tight leading-tight">
                                {t(p.id) || p.nameKey}
                              </h4>
                              <span className="arabic-font text-xs font-bold text-slate-400 dark:text-slate-500" dir="rtl">
                                {p.arabic}
                              </span>
                              <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                {p.rakat}R
                              </span>
                              {isNext && !isExcused && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-wider border border-emerald-500/25">
                                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping"></span>
                                  Next
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs font-black text-emerald-950 dark:text-emerald-400 tabular-nums leading-none">
                                {displayTime}
                              </p>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                @{rawTime}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isExcused ? (
                            <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                              <i className="fas fa-leaf text-[9px]"></i> Excused
                            </span>
                          ) : (
                            <>
                              {/* Main Toggle Button */}
                              {isDone ? (
                                <button
                                  onClick={() => handleTogglePrayer(p.id)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 active:scale-95 transition-all"
                                  title="Mark as Pending"
                                >
                                  <i className="fas fa-check-circle text-xs"></i>
                                  <span>Prayed</span>
                                </button>
                              ) : isMissed ? (
                                <button
                                  onClick={() => handleTogglePrayer(p.id)}
                                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
                                  title="Click to change status"
                                >
                                  <i className="fas fa-history text-xs"></i>
                                  <span>Missed</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleTogglePrayer(p.id)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-200 border border-black/5 dark:border-white/5 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all group"
                                  title="Mark as Prayed"
                                >
                                  <i className="far fa-circle text-[10px] group-hover:hidden"></i>
                                  <i className="fas fa-check text-[10px] hidden group-hover:inline"></i>
                                  <span>Prayed</span>
                                </button>
                              )}

                              {/* Menu Button for quick status selection (Completed / Missed / Reset) */}
                              <div className="relative">
                                <button
                                  onClick={() => setMenuOpenPrayer(isMenuOpen ? null : p.id)}
                                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                  title="Status options"
                                >
                                  <i className="fas fa-ellipsis-vertical text-xs"></i>
                                </button>

                                {isMenuOpen && (
                                  <div className="absolute right-0 top-full mt-1 z-20 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-black/10 dark:border-white/10 py-1 text-xs animate-pop">
                                    <button
                                      onClick={() => handleSetStatus(p.id, PrayerStatus.COMPLETED)}
                                      className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold ${isDone ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}
                                    >
                                      <i className="fas fa-check text-[10px] text-emerald-500"></i>
                                      <span>Mark Done</span>
                                    </button>
                                    <button
                                      onClick={() => handleSetStatus(p.id, PrayerStatus.MISSED)}
                                      className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold ${isMissed ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''}`}
                                    >
                                      <i className="fas fa-xmark text-[10px] text-rose-500"></i>
                                      <span>Mark Missed</span>
                                    </button>
                                    <button
                                      onClick={() => handleSetStatus(p.id, PrayerStatus.PENDING)}
                                      className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium"
                                    >
                                      <i className="fas fa-rotate-left text-[10px] text-slate-400"></i>
                                      <span>Reset Status</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Quick Link to Calendar / Full Schedule */}
            <div className="mt-3 text-center">
              <button
                onClick={() => setCurrentView('prayer')}
                className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 inline-flex items-center gap-1.5 transition-colors"
              >
                <span>View Full Month Calendar & Qada</span>
                <i className="fas fa-arrow-right text-[8px]"></i>
              </button>
            </div>
          </div>

          {/* Navigation Tools */}
          <div className="grid grid-cols-2 gap-4 animate-fade-up stagger-5 mb-8">
            <button onClick={() => setCurrentView('quran')} className="card-premium h-24 flex items-center gap-4 !p-4 hover:border-amber-200 transition-colors">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm"><i className="fas fa-book-quran"></i></div>
              <div className="text-left overflow-hidden">
                <h4 className="font-black text-sm text-emerald-950 dark:text-white truncate">{t('quran')}</h4>
                <p className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">
                  {state.quranProgress.surah ? `${state.quranProgress.surah}${state.quranProgress.page ? ` (p. ${state.quranProgress.page})` : ''}` : 'Not Started'}
                </p>
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
    );
};

export default Dashboard;