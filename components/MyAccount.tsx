import React, { useMemo, useState, useRef } from 'react';
import { UserData, PrayerStatus, PrayerReminder, FastingLog, AlarmSettings, UserProfile, Language } from '../types';
import { PRAYERS, PRAYER_METHODS, BUILTIN_ALARM_SOUNDS } from '../constants';

interface MyAccountProps {
  state: UserData;
  setCurrentView: (view: any) => void;
  t: (key: string) => string;
  onLogout: () => void;
  toggleTheme: () => void;
  toggleEcoMode: () => void;
  toggleNotifications: () => void;
  updatePrayerReminder: (prayer: string, time: string, enabled: boolean) => void;
  setCalculationMethod: (method: number) => void;
  refreshTimings: () => void;
  updateAlarmSettings: (cfg: Partial<AlarmSettings>) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

type Period = 'weekly' | 'monthly' | 'yearly';

const MyAccount: React.FC<MyAccountProps> = ({ 
  state, setCurrentView, t, onLogout, toggleTheme, toggleEcoMode, 
  toggleNotifications, updatePrayerReminder, setCalculationMethod, refreshTimings, updateAlarmSettings, updateProfile
}) => {
  const [activePeriod, setActivePeriod] = useState<Period>('weekly');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: state.profile.name,
    age: state.profile.age.toString(),
    place: state.profile.place,
    preferredLanguage: state.profile.preferredLanguage
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const alarmCfg = state.settings.alarm || {
    ringtoneId: 'azan_makkah',
    customRingtoneData: null,
    vibrationEnabled: true,
    autoAlarmEnabled: true
  };

  const stats = useMemo(() => {
    let totalFard = 0, completedFard = 0;
    Object.values(state.prayerLogs).forEach(log => {
      Object.values(log).forEach(status => {
        totalFard++;
        if (status === PrayerStatus.COMPLETED) completedFard++;
      });
    });
    const ratio = totalFard > 0 ? (completedFard / totalFard) : 0;
    let level = 'levelBeginner', color = 'text-slate-400', icon = 'fa-seedling';
    if (ratio >= 0.9) { level = 'levelElite'; color = 'text-amber-500'; icon = 'fa-crown'; }
    else if (ratio >= 0.7) { level = 'levelAdvanced'; color = 'text-emerald-500'; icon = 'fa-shield-heart'; }
    else if (ratio >= 0.4) { level = 'levelConsistent'; color = 'text-teal-500'; icon = 'fa-leaf'; }
    return { ratio, level, color, icon };
  }, [state.prayerLogs]);

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
      const fLog = state.prayerLogs[date];
      if (fLog) PRAYERS.forEach(p => { if (fLog[p] === PrayerStatus.COMPLETED) fardComp++; });
      if (state.sunnahLogs[date]?.length > 0) sunnahDays++;
      const fastLog = Object.entries(state.fastingLogs).find(([k]) => k.includes(date))?.[1] as FastingLog | undefined;
      if (fastLog?.status === 'completed') fastingComp++;
    });
    const dhikrHistoryInRange = state.dhikrHistory.filter(h => dateRange.includes(h.date.split('T')[0]));
    dhikrDays = new Set(dhikrHistoryInRange.map(h => h.date.split('T')[0])).size;
    return {
      fard: Math.min(100, (fardComp / (days * 5)) * 100),
      sunnah: Math.min(100, (sunnahDays / days) * 100),
      fasting: Math.min(100, (fastingComp / (activePeriod === 'yearly' ? 30 : days)) * 100),
      dhikr: Math.min(100, (dhikrDays / days) * 100)
    };
  }, [activePeriod, state]);

  const isDark = state.settings.theme === 'dark';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result as string;
      updateAlarmSettings({ ringtoneId: 'custom', customRingtoneData: data });
    };
    reader.readAsDataURL(file);
  };

  const testAlarm = () => {
    let url = '';
    if (alarmCfg.ringtoneId === 'custom' && alarmCfg.customRingtoneData) {
      url = alarmCfg.customRingtoneData;
    } else {
      url = BUILTIN_ALARM_SOUNDS.find(s => s.id === alarmCfg.ringtoneId)?.url || '';
    }
    if (url) {
      const audio = new Audio(url);
      audio.play();
      setTimeout(() => audio.pause(), 3000);
    }
    if (alarmCfg.vibrationEnabled && "vibrate" in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  const handleProfileSave = () => {
    updateProfile({
      name: profileForm.name,
      age: parseInt(profileForm.age) || state.profile.age,
      place: profileForm.place,
      preferredLanguage: profileForm.preferredLanguage as Language
    });
    setIsEditingProfile(false);
  };

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
        <div className={`h-full ${color.replace('text', 'bg')} transition-all duration-1000 ease-out`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );

  return (
    <div className="scroll-container px-6 pt-12 content-limit w-full">
      <div className="flex items-center justify-between mb-10 animate-fade-up">
         <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl border border-emerald-500/20">
                <i className="fas fa-user-circle"></i>
              </div>
              <button 
                onClick={() => setIsEditingProfile(!isEditingProfile)} 
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-600 text-white rounded-lg flex items-center justify-center text-[10px] shadow-lg border border-white dark:border-slate-900 active:scale-90 transition-transform"
              >
                <i className={`fas ${isEditingProfile ? 'fa-times' : 'fa-pen'}`}></i>
              </button>
            </div>
            <div>
              <h1 className="text-2xl font-black text-emerald-950 dark:text-white tracking-tighter">{state.profile.name}</h1>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">@{state.profile.username}</p>
            </div>
         </div>
         <button onClick={onLogout} className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center border border-rose-500/20 active:scale-90 transition-transform">
           <i className="fas fa-power-off"></i>
         </button>
      </div>

      {isEditingProfile ? (
        <div className="card-premium mb-10 animate-fade-up !p-6 space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Edit Profile</h4>
            <span className="h-px flex-1 bg-emerald-500/10"></span>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
              <input 
                type="text" 
                value={profileForm.name} 
                onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                className="w-full p-3 bg-slate-50 dark:bg-white/5 border border-transparent focus:border-emerald-500 rounded-xl text-xs font-black text-emerald-950 dark:text-emerald-50 outline-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Age</label>
                <input 
                  type="number" 
                  value={profileForm.age} 
                  onChange={e => setProfileForm({...profileForm, age: e.target.value})}
                  className="w-full p-3 bg-slate-50 dark:bg-white/5 border border-transparent focus:border-emerald-500 rounded-xl text-xs font-black text-emerald-950 dark:text-emerald-50 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Place</label>
                <input 
                  type="text" 
                  value={profileForm.place} 
                  onChange={e => setProfileForm({...profileForm, place: e.target.value})}
                  className="w-full p-3 bg-slate-50 dark:bg-white/5 border border-transparent focus:border-emerald-500 rounded-xl text-xs font-black text-emerald-950 dark:text-emerald-50 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Preferred Language</label>
              <div className="relative">
                <select 
                  value={profileForm.preferredLanguage}
                  onChange={e => setProfileForm({...profileForm, preferredLanguage: e.target.value as Language})}
                  className="w-full p-3 bg-slate-50 dark:bg-white/5 border border-transparent focus:border-emerald-500 rounded-xl text-xs font-black text-emerald-950 dark:text-emerald-50 outline-none appearance-none"
                >
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                  <option value="ml">മലയാളം</option>
                  <option value="ta">தமிழ்</option>
                </select>
                <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-500 pointer-events-none"></i>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button 
              onClick={handleProfileSave}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              Save Changes
            </button>
            <button 
              onClick={() => setIsEditingProfile(false)}
              className="px-6 py-3 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* Commitment Card */
        <div className="card-premium mb-10 flex items-center gap-6 !p-8 animate-fade-up stagger-1">
           <div className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center text-4xl shadow-2xl bg-white/5 border border-white/10 ${stats.color}`}>
             <i className={`fas ${stats.icon}`}></i>
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t('consistency')}</p>
              <h3 className={`text-2xl font-black tracking-tight ${stats.color}`}>{t(stats.level)}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">{(stats.ratio * 100).toFixed(0)}% Commitment</p>
           </div>
        </div>
      )}

      {/* Alarm Settings Section */}
      <div className="space-y-6 mb-12 animate-fade-up stagger-2.5">
         <div className="flex items-center gap-4 px-1">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{t('alarmSettings')}</h4>
            <span className="h-px flex-1 bg-black/5 dark:bg-white/5"></span>
         </div>
         <div className="card-premium !p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-black text-xs text-emerald-950 dark:text-emerald-50 mb-1">{t('autoAlarm')}</h5>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Automatic Azan Alerts</p>
              </div>
              <button 
                onClick={() => updateAlarmSettings({ autoAlarmEnabled: !alarmCfg.autoAlarmEnabled })}
                className={`w-12 h-6 rounded-full p-1 transition-all ${alarmCfg.autoAlarmEnabled ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-white/10'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${alarmCfg.autoAlarmEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('ringtone')}</label>
              <div className="relative">
                <select 
                  value={alarmCfg.ringtoneId}
                  onChange={(e) => updateAlarmSettings({ ringtoneId: e.target.value })}
                  className="w-full p-4 bg-slate-50 dark:bg-white/5 border border-transparent focus:border-emerald-500 rounded-2xl text-[10px] font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-50 appearance-none outline-none"
                >
                  {BUILTIN_ALARM_SOUNDS.map(s => <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900">{s.name}</option>)}
                  <option value="custom" className="bg-white dark:bg-slate-900">Custom Ringtone</option>
                </select>
                <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none text-[10px]"></i>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="py-4 bg-slate-100 dark:bg-white/5 text-emerald-700 dark:text-emerald-400 rounded-2xl font-black text-[9px] uppercase tracking-widest border border-emerald-500/10 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <i className="fas fa-file-audio"></i> {t('customRingtone')}
              </button>
              <button 
                onClick={testAlarm}
                className="py-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-2xl font-black text-[9px] uppercase tracking-widest border border-emerald-500/10 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <i className="fas fa-play"></i> {t('testAlarm')}
              </button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*" className="hidden" />

            <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
              <div>
                <h5 className="font-black text-xs text-emerald-950 dark:text-emerald-50 mb-1">{t('vibration')}</h5>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Haptic Feedback</p>
              </div>
              <button 
                onClick={() => updateAlarmSettings({ vibrationEnabled: !alarmCfg.vibrationEnabled })}
                className={`w-12 h-6 rounded-full p-1 transition-all ${alarmCfg.vibrationEnabled ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-white/10'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${alarmCfg.vibrationEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>
         </div>
      </div>

      {/* Calculation Method Section */}
      <div className="space-y-6 mb-12 animate-fade-up stagger-3">
         <div className="flex items-center gap-4 px-1">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{t('calcMethod')}</h4>
            <span className="h-px flex-1 bg-black/5 dark:bg-white/5"></span>
         </div>
         <div className="card-premium !p-6 space-y-4">
            <div className="relative">
              <select 
                value={state.settings.calculationMethod || 3}
                onChange={(e) => setCalculationMethod(parseInt(e.target.value))}
                className="w-full p-4 bg-slate-50 dark:bg-white/5 border border-transparent focus:border-emerald-500 rounded-2xl text-[10px] font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-50 appearance-none outline-none"
              >
                {PRAYER_METHODS.map(m => <option key={m.id} value={m.id} className="bg-white dark:bg-slate-900">{m.name}</option>)}
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none text-[10px]"></i>
            </div>
            <button onClick={refreshTimings} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
              <i className="fas fa-location-dot"></i> {t('locationRefresh')}
            </button>
         </div>
      </div>

      {/* Progress Overview Section */}
      <div className="mb-12 animate-fade-up stagger-3.5">
        <div className="flex items-center justify-between mb-6 px-1">
          <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Progress Overview</h4>
          <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
            {(['weekly', 'monthly', 'yearly'] as Period[]).map(p => (
              <button key={p} onClick={() => setActivePeriod(p)} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${activePeriod === p ? 'bg-white dark:bg-emerald-600 text-emerald-600 dark:text-white shadow-sm' : 'text-slate-400'}`}>{p}</button>
            ))}
          </div>
        </div>
        <div className="card-premium space-y-6 !p-7">
          <ProgressStat label={t('fard')} value={periodStats.fard} color="text-emerald-500" icon="fa-kaaba" />
          <ProgressStat label={t('sunnah')} value={periodStats.sunnah} color="text-teal-500" icon="fa-sun" />
          <ProgressStat label={t('fasting')} value={periodStats.fasting} color="text-amber-500" icon="fa-moon" />
          <ProgressStat label={t('dhikr')} value={periodStats.dhikr} color="text-blue-500" icon="fa-fingerprint" />
        </div>
      </div>

      {/* Preferences */}
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
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isDark ? 'bg-indigo-600' : 'bg-amber-500'}`}><div className={`w-4 h-4 bg-white rounded-full transition-transform ${isDark ? 'translate-x-6' : 'translate-x-0'}`}></div></div>
         </button>
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
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${state.settings.notificationsEnabled ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-white/10'}`}><div className={`w-4 h-4 bg-white rounded-full transition-transform ${state.settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div></div>
         </button>
      </div>
    </div>
  );
};

export default MyAccount;