
import React, { useMemo, useState } from 'react';
import { UserData, PrayerStatus, PrayerReminder, FastingLog } from '../types';
import { PRAYERS } from '../constants';

interface MyAccountProps {
  state: UserData;
  setCurrentView: (view: any) => void;
  t: (key: string) => string;
  onLogout: () => void;
  toggleTheme: () => void;
  toggleEcoMode: () => void;
  // Added toggleNotifications to fix type error in App.tsx
  toggleNotifications: () => void;
  updatePrayerReminder: (prayer: string, time: string, enabled: boolean) => void;
}

type Period = 'weekly' | 'monthly' | 'yearly';

const MyAccount: React.FC<MyAccountProps> = ({ state, setCurrentView, t, onLogout, toggleTheme, toggleEcoMode, toggleNotifications, updatePrayerReminder }) => {
  const [activePeriod, setActivePeriod] = useState<Period>('weekly');

  const stats = useMemo(() => {
    let totalFard = 0, completedFard = 0, missedFard = 0;
    Object.values(state.prayerLogs).forEach(log => {
      Object.values(log).forEach(status => {
        totalFard++;
        if (status === PrayerStatus.COMPLETED) completedFard++;
        if (status === PrayerStatus.MISSED) missedFard++;
      });
    });
    const ratio = totalFard > 0 ? (completedFard / totalFard) : 0;
    
    let level = 'levelBeginner', color = 'text-slate-400', icon = 'fa-seedling';
    if (ratio >= 0.9) { level = 'levelElite'; color = 'text-amber-500'; icon = 'fa-crown'; }
    else if (ratio >= 0.7) { level = 'levelAdvanced'; color = 'text-emerald-500'; icon = 'fa-shield-heart'; }
    else if (ratio >= 0.4) { level = 'levelConsistent'; color = 'text-teal-500'; icon = 'fa-leaf'; }

    return { totalFard, completedFard, missedFard, ratio, level, color, icon };
  }, [state]);

  const periodStats = useMemo(() => {
    const now = new Date();
    const days = activePeriod === 'weekly' ? 7 : activePeriod === 'monthly' ? 30 : 365;
    const dateRange = Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - i);
      return d.toISOString().split('T')[0];
    });

    let fardComp = 0, sunnahDays = 0, fastingComp = 0, dhikrDays = 0;

    dateRange.forEach(date => {
      // Fard
      const fLog = state.prayerLogs[date];
      if (fLog) {
        PRAYERS.forEach(p => { if (fLog[p] === PrayerStatus.COMPLETED) fardComp++; });
      }
      // Sunnah
      if (state.sunnahLogs[date] && state.sunnahLogs[date].length > 0) sunnahDays++;
      // Fasting
      const fastLog = Object.entries(state.fastingLogs).find(([k]) => k.includes(date))?.[1] as FastingLog | undefined;
      if (fastLog?.status === 'completed') fastingComp++;
    });

    // Dhikr history - check unique dates in history within range
    const dhikrHistoryInRange = state.dhikrHistory.filter(h => {
      const hDate = h.date.split('T')[0];
      return dateRange.includes(hDate);
    });
    dhikrDays = new Set(dhikrHistoryInRange.map(h => h.date.split('T')[0])).size;

    return {
      fard: Math.min(100, (fardComp / (days * 5)) * 100),
      sunnah: Math.min(100, (sunnahDays / days) * 100),
      fasting: Math.min(100, (fastingComp / (activePeriod === 'yearly' ? 30 : days)) * 100), // Normalize fasting for yearly (approx ramadan)
      dhikr: Math.min(100, (dhikrDays / days) * 100)
    };
  }, [activePeriod, state]);

  const prayerReminders = state.settings.prayerReminders || [];
  const isDark = state.settings.theme === 'dark';

  const ProgressStat = ({ label, value, color, icon }: { label: string, value: number, color: string, icon: string }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-end px-1">
        <div className="flex items-center gap-2">
          <i className={`fas ${icon} ${color} text-[10px]`}></i>
          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</span>
        </div>
        <span className={`text-[11px] font-black ${color}`}>{value.toFixed(0)}%</span>
      </div>
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color.replace('text', 'bg')} transition-all duration-1000 ease-out`} 
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="scroll-container px-6 pt-12 content-limit w-full">
      {/* Profile Header */}
      <div className="flex items-center justify-between mb-10 animate-fade-up">
         <div>
            <h1 className="text-3xl font-black text-emerald-950 dark:text-white tracking-tighter">{state.profile.name}</h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">@{state.profile.username}</p>
         </div>
         <button onClick={onLogout} className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center border border-rose-500/20 active:scale-90 transition-transform">
           <i className="fas fa-power-off"></i>
         </button>
      </div>

      {/* Commitment Card */}
      <div className={`card-premium mb-10 flex items-center gap-6 !p-8 animate-fade-up stagger-1`}>
         <div className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center text-4xl shadow-2xl bg-white/5 border border-white/10 ${stats.color}`}>
           <i className={`fas ${stats.icon}`}></i>
         </div>
         <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t('consistency')}</p>
            <h3 className={`text-2xl font-black tracking-tight ${stats.color}`}>{t(stats.level)}</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">{(stats.ratio * 100).toFixed(0)}% Commitment</p>
         </div>
      </div>

      {/* NEW: Progress Overview Section */}
      <div className="mb-12 animate-fade-up stagger-1.5">
        <div className="flex items-center justify-between mb-6 px-1">
          <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Progress Overview</h4>
          <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
            {(['weekly', 'monthly', 'yearly'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setActivePeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${activePeriod === p ? 'bg-white dark:bg-emerald-600 text-emerald-600 dark:text-white shadow-sm' : 'text-slate-400'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="card-premium space-y-6 !p-7">
          <ProgressStat label={t('fard')} value={periodStats.fard} color="text-emerald-500" icon="fa-kaaba" />
          <ProgressStat label={t('sunnah')} value={periodStats.sunnah} color="text-teal-500" icon="fa-sun" />
          <ProgressStat label={t('fasting')} value={periodStats.fasting} color="text-amber-500" icon="fa-moon" />
          <ProgressStat label={t('dhikr')} value={periodStats.dhikr} color="text-blue-500" icon="fa-fingerprint" />
          
          <div className="pt-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <i className="fas fa-book-quran text-purple-500 text-[10px]"></i>
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('quran')}</span>
              </div>
              <span className="text-[9px] font-black text-purple-500 uppercase tracking-widest">
                {state.quranProgress.surah || 'Not Started'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-2 gap-4 mb-12 animate-fade-up stagger-2">
         <div className="card-premium flex flex-col items-center !p-6">
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center mb-4"><i className="fas fa-check-double text-xs"></i></div>
            <p className="text-2xl font-black text-emerald-950 dark:text-white">{stats.completedFard}</p>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{t('completed')}</p>
         </div>
         <div className="card-premium flex flex-col items-center !p-6">
            <div className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center mb-4"><i className="fas fa-history text-xs"></i></div>
            <p className="text-2xl font-black text-emerald-950 dark:text-white">{stats.missedFard}</p>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{t('missed')}</p>
         </div>
      </div>

      {/* Reminders Section */}
      <div className="space-y-6 mb-12 animate-fade-up stagger-3">
         <div className="flex items-center gap-4 px-1">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Prayer Alerts</h4>
            <span className="h-px flex-1 bg-black/5 dark:bg-white/5"></span>
         </div>
         <div className="space-y-3">
           {PRAYERS.map(p => {
             const reminder = prayerReminders.find(r => r.prayer === p) || { prayer: p, time: '12:00', enabled: false };
             return (
               <div key={p} className="card-premium flex items-center justify-between !p-5 group">
                 <div className="flex items-center gap-5">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${reminder.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-600'}`}>
                     <i className="fas fa-bell"></i>
                   </div>
                   <div>
                     <span className="font-black text-sm text-emerald-950 dark:text-white capitalize">{t(p)}</span>
                     <p className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-0.5">Custom Reminder</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-4">
                   <input 
                     type="time" 
                     className="bg-transparent border-none text-xs font-black text-emerald-600 focus:ring-0 cursor-pointer" 
                     value={reminder.time} 
                     onChange={(e) => updatePrayerReminder(p, e.target.value, reminder.enabled)}
                   />
                   <button 
                     onClick={() => updatePrayerReminder(p, reminder.time, !reminder.enabled)}
                     className={`w-12 h-6 rounded-full p-1 transition-all ${reminder.enabled ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-white/10'}`}
                   >
                     <div className={`w-4 h-4 bg-white rounded-full transition-transform ${reminder.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                   </button>
                 </div>
               </div>
             );
           })}
         </div>
      </div>

      {/* System Settings */}
      <div className="space-y-6 animate-fade-up stagger-4 pb-20">
         <div className="flex items-center gap-4 px-1">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Preferences</h4>
            <span className="h-px flex-1 bg-black/5 dark:bg-white/5"></span>
         </div>
         
         <button onClick={toggleTheme} className="card-premium w-full flex items-center justify-between !p-6 mb-3">
            <div className="flex items-center gap-5">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-500'}`}>
                 <i className={`fas ${isDark ? 'fa-moon' : 'fa-sun'}`}></i>
               </div>
               <div className="text-left">
                 <span className="font-black text-sm text-emerald-950 dark:text-white">{isDark ? 'Dark Theme' : 'Light Theme'}</span>
                 <p className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-0.5">Visual Appearance</p>
               </div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isDark ? 'bg-indigo-600' : 'bg-amber-500'}`}>
               <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isDark ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
         </button>

         {/* Added Notifications Toggle button */}
         <button onClick={toggleNotifications} className="card-premium w-full flex items-center justify-between !p-6 mb-3">
            <div className="flex items-center gap-5">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${state.settings.notificationsEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'}`}>
                 <i className={`fas ${state.settings.notificationsEnabled ? 'fa-bell' : 'fa-bell-slash'}`}></i>
               </div>
               <div className="text-left">
                 <span className="font-black text-sm text-emerald-950 dark:text-white">Notifications</span>
                 <p className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-0.5">Push Alerts</p>
               </div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${state.settings.notificationsEnabled ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-white/10'}`}>
               <div className={`w-4 h-4 bg-white rounded-full transition-transform ${state.settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
         </button>

         <button onClick={toggleEcoMode} className="card-premium w-full flex items-center justify-between !p-6">
            <div className="flex items-center gap-5">
               <div className="w-12 h-12 bg-teal-500/10 text-teal-500 rounded-2xl flex items-center justify-center text-xl"><i className="fas fa-bolt-lightning"></i></div>
               <div className="text-left">
                 <span className="font-black text-sm text-emerald-950 dark:text-white">Eco Mode</span>
                 <p className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-0.5">Performance Optimizer</p>
               </div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${state.settings.ecoMode ? 'bg-teal-600' : 'bg-slate-200 dark:bg-white/10'}`}>
               <div className={`w-4 h-4 bg-white rounded-full transition-transform ${state.settings.ecoMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
         </button>
      </div>
    </div>
  );
};

export default MyAccount;
