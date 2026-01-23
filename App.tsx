import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AppState, UserProfile, UserData, Language, PrayerStatus, DhikrChallenge, PrayerTimings, PrayerLog, AlarmSettings } from './types';
import { TRANSLATIONS, PRAYERS, BUILTIN_ALARM_SOUNDS } from './constants';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import PrayerCalendar from './components/PrayerCalendar';
import WomensSpace from './components/WomensSpace';
import DhikrCounter from './components/DhikrCounter';
import QuranTracker from './components/QuranTracker';
import FastingTracker from './components/FastingTracker';
import Welcome from './components/Welcome';
import QiblaFinder from './components/QiblaFinder';
import AboutHelp from './components/AboutHelp';
import MyAccount from './components/MyAccount';

const USERS_DB_KEY = 'ibadathi_v6_users_database';
const SESSION_KEY = 'ibadathi_v6_active_session';

const INITIAL_ALARM: AlarmSettings = {
  ringtoneId: 'azan_makkah',
  customRingtoneData: null,
  vibrationEnabled: true,
  autoAlarmEnabled: true
};

const INITIAL_OFFSETS = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };

const INITIAL_DHIKRS: DhikrChallenge[] = [
  { id: 'salawat', title: 'dhikrSalawat', arabic: 'اللهم صل على محمد', target: 100, current: 0 },
  { id: 'subhanallah', title: 'dhikrSubhanAllah', arabic: 'سبحان الله', target: 33, current: 0 },
  { id: 'alhamdulillah', title: 'dhikrAlhamdulillah', arabic: 'الحمد لله', target: 33, current: 0 },
  { id: 'allahuakbar', title: 'dhikrAllahuAkbar', arabic: 'الله أكبر', target: 34, current: 0 },
  { id: 'astaghfirullah', title: 'dhikrAstaghfirullah', arabic: 'أستغفر الله', target: 100, current: 0 },
  { id: 'lailaha', title: 'dhikrLaIlaha', arabic: 'ലാ ഇലാഹ ഇല്ലല്ലാഹ്', target: 100, current: 0 }
];

const DEFAULT_TIMINGS: PrayerTimings = {
  Fajr: "05:12", Sunrise: "06:34", Dhuhr: "12:28", Asr: "15:42", Maghrib: "18:22", Isha: "19:38"
};

const App: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [state, setState] = useState<AppState>({
    currentUser: null,
    users: {},
    todayTimings: DEFAULT_TIMINGS
  });

  const [activeTab, setActiveTab] = useState<'home' | 'prayer' | 'tracker' | 'challenges' | 'account'>('home');
  const [subView, setSubView] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastAlertedPrayer = useRef<string | null>(null);

  const fetchTimings = useCallback(async (lat: number, lng: number, method: number = 1) => {
    try {
      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
      const response = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=${method}`);
      const data = await response.json();
      if (data && data.data && data.data.timings) {
        const t = data.data.timings;
        const newTimings: PrayerTimings = {
          Fajr: t.Fajr, Sunrise: t.Sunrise, Dhuhr: t.Dhuhr, Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha
        };
        setState(prev => ({ ...prev, todayTimings: newTimings }));
      }
    } catch (error) {
      console.error("Failed to fetch timings:", error);
    }
  }, []);

  const refreshLocationAndTimings = useCallback(() => {
    const user = state.currentUser ? state.users[state.currentUser] : null;
    const method = user?.settings.calculationMethod || 1;
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchTimings(pos.coords.latitude, pos.coords.longitude, method),
        (err) => console.warn("Location permission denied", err),
        { enableHighAccuracy: true }
      );
    }
  }, [state.currentUser, state.users, fetchTimings]);

  useEffect(() => {
    setIsMounted(true);
    try {
      const savedUsers = localStorage.getItem(USERS_DB_KEY);
      const activeSession = localStorage.getItem(SESSION_KEY);
      let parsedUsers: Record<string, UserData> = {};
      if (savedUsers) parsedUsers = JSON.parse(savedUsers);
      const currentUser = (activeSession && parsedUsers[activeSession.toLowerCase()]) ? activeSession.toLowerCase() : null;
      setState(prev => ({ ...prev, users: parsedUsers, currentUser: currentUser }));
      
      if (currentUser) {
        const user = parsedUsers[currentUser];
        if (user) setCurrentLanguage(user.profile.preferredLanguage);
        
        if ("geolocation" in navigator) {
          const userMethod = user?.settings.calculationMethod || 1;
          navigator.geolocation.getCurrentPosition(
            (pos) => fetchTimings(pos.coords.latitude, pos.coords.longitude, userMethod),
            (err) => console.warn("Location not permitted on startup", err),
            { enableHighAccuracy: true }
          );
        }
      }
    } catch (e) {
      console.error("Local Storage Initialization Error", e);
    }
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(clockInterval);
  }, [fetchTimings]);

  // Sync language with user profile changes
  useEffect(() => {
    if (state.currentUser && state.users[state.currentUser]) {
      const userLang = state.users[state.currentUser].profile.preferredLanguage;
      if (userLang !== currentLanguage) {
        setCurrentLanguage(userLang);
      }
    }
  }, [state.currentUser, state.users, currentLanguage]);

  const updateActiveUser = (updater: (prev: UserData) => UserData) => {
    if (!state.currentUser) return;
    setState(prev => {
      const current = prev.currentUser!;
      if (!prev.users[current]) return prev;
      return { ...prev, users: { ...prev.users, [current]: updater(prev.users[current]) } };
    });
  };

  const adjustedTimings = useMemo(() => {
    if (!state.todayTimings || !state.currentUser) return state.todayTimings;
    const user = state.users[state.currentUser];
    const offsets = user.settings.prayerOffsets || INITIAL_OFFSETS;
    
    const newTimings = { ...state.todayTimings };
    PRAYERS.forEach(p => {
      const key = p.charAt(0).toUpperCase() + p.slice(1) as keyof PrayerTimings;
      const originalTime = newTimings[key];
      if (!originalTime) return;
      
      const [h, m] = originalTime.split(':').map(Number);
      const date = new Date();
      date.setHours(h, m, 0, 0);
      date.setMinutes(date.getMinutes() + (offsets[p] || 0));
      
      newTimings[key] = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    });
    return newTimings;
  }, [state.todayTimings, state.currentUser, state.users]);

  const isCurrentlyExcused = useMemo(() => {
    if (!state.currentUser || !state.users[state.currentUser]) return false;
    const user = state.users[state.currentUser];
    if (user.profile.sex !== 'female') return false;
    if (user.isHaydNifas) return true;
    const nowTime = currentTime.getTime();
    return user.healthPeriods.some(p => {
      const start = new Date(p.start).getTime();
      const end = p.end ? new Date(p.end).getTime() : Infinity;
      return nowTime >= start && nowTime <= end;
    });
  }, [state.currentUser, state.users, currentTime]);

  useEffect(() => {
    if (!isMounted || !state.currentUser || !adjustedTimings) return;
    
    const checkAlarms = () => {
      const user = state.users[state.currentUser!];
      const alarmCfg = user?.settings.alarm || INITIAL_ALARM;
      if (!alarmCfg.autoAlarmEnabled || isCurrentlyExcused) return;

      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      const timeStr = `${h}:${m}`;
      
      const matchingPrayer = PRAYERS.find(p => {
        const key = p.charAt(0).toUpperCase() + p.slice(1) as keyof PrayerTimings;
        return adjustedTimings![key] === timeStr;
      });

      if (matchingPrayer && lastAlertedPrayer.current !== `${matchingPrayer}-${timeStr}`) {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(TRANSLATIONS[currentLanguage]['prayerAlertTitle'] || 'Ibadathi', {
            body: (TRANSLATIONS[currentLanguage]['prayerAlertBody'] || 'Time for {prayer}').replace('{prayer}', TRANSLATIONS[currentLanguage][matchingPrayer] || matchingPrayer),
          });
        }
        
        let soundUrl = '';
        if (alarmCfg.ringtoneId === 'custom' && alarmCfg.customRingtoneData) {
          soundUrl = alarmCfg.customRingtoneData;
        } else {
          soundUrl = BUILTIN_ALARM_SOUNDS.find(s => s.id === alarmCfg.ringtoneId)?.url || BUILTIN_ALARM_SOUNDS[0].url;
        }

        if (soundUrl) {
          if (!audioRef.current) audioRef.current = new Audio();
          audioRef.current.src = soundUrl;
          audioRef.current.play().catch(e => console.warn("Autoplay blocked", e));
        }

        if (alarmCfg.vibrationEnabled && "vibrate" in navigator) {
          navigator.vibrate([1000, 500, 1000, 500, 1000]);
        }
        
        lastAlertedPrayer.current = `${matchingPrayer}-${timeStr}`;
      }
    };
    
    checkAlarms();
  }, [adjustedTimings, state.currentUser, state.users, currentLanguage, isMounted, isCurrentlyExcused, currentTime]);

  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(state.users));
      if (state.currentUser) localStorage.setItem(SESSION_KEY, state.currentUser);
      else localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      console.warn("Storage Sync Failed", e);
    }
  }, [state.users, state.currentUser, isMounted]);

  const handleLogin = (profile: UserProfile, isNew: boolean) => {
    const userKey = profile.username.toLowerCase();
    if (isNew) {
      const newUserData: UserData = {
        profile: { ...profile, username: userKey },
        prayerLogs: {}, sunnahLogs: {}, fastingLogs: {},
        quranProgress: { surah: '', ayah: '', juz: '', lastUpdated: '' },
        dhikrCount: 0, activeChallenges: INITIAL_DHIKRS, personalDhikrs: [],
        activeDhikrId: null, dhikrHistory: [], isHaydNifas: false, haydStartDate: null, healthPeriods: [],
        settings: { 
          notificationsEnabled: true, locationEnabled: true, theme: 'dark', ecoMode: false,
          qadaReminders: [], prayerReminders: [], calculationMethod: 1, alarm: INITIAL_ALARM,
          prayerOffsets: INITIAL_OFFSETS
        }
      };
      setState(prev => ({ ...prev, currentUser: userKey, users: { ...prev.users, [userKey]: newUserData } }));
      setCurrentLanguage(newUserData.profile.preferredLanguage);
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => fetchTimings(pos.coords.latitude, pos.coords.longitude, 1), null, { enableHighAccuracy: true });
      }
    } else {
      setState(prev => ({ ...prev, currentUser: userKey }));
      const user = state.users[userKey];
      if (user) setCurrentLanguage(user.profile.preferredLanguage);
      if ("geolocation" in navigator) {
        const userMethod = user?.settings.calculationMethod || 1;
        navigator.geolocation.getCurrentPosition((pos) => fetchTimings(pos.coords.latitude, pos.coords.longitude, userMethod), null, { enableHighAccuracy: true });
      }
    }
    setSubView(null);
    setActiveTab('home');
    if ("Notification" in window) Notification.requestPermission();
  };

  const t = (key: string) => TRANSLATIONS[currentLanguage][key] || key;
  const currentUserData = state.currentUser ? state.users[state.currentUser] : null;

  if (!isMounted) return <div className="app-viewport bg-slate-950"></div>;
  if (!state.currentUser) {
    return (
      <div className="app-viewport dark bg-slate-950 animate-fade-in">
        {subView === 'auth' ? (
          <Login onLogin={handleLogin} t={t} initialLanguage={currentLanguage} users={state.users} onBack={() => setSubView(null)} />
        ) : (
          <Welcome onEnter={() => setSubView('auth')} language={currentLanguage} setLanguage={setCurrentLanguage} t={t} />
        )}
      </div>
    );
  }

  const compositeData = { ...currentUserData!, todayTimings: adjustedTimings, isExcusedToday: isCurrentlyExcused };

  const renderActiveView = () => {
    if (subView === 'qibla') return <QiblaFinder setCurrentView={() => setSubView(null)} t={t} />;
    if (subView === 'about') return <AboutHelp setCurrentView={() => setSubView(null)} t={t} />;
    if (subView === 'quran') return <QuranTracker state={compositeData} onUpdate={(p) => updateActiveUser(u => ({ ...u, quranProgress: p }))} setCurrentView={() => setSubView(null)} t={t} />;
    if (subView === 'fasting') return <FastingTracker state={compositeData} updateFasting={(d, l) => updateActiveUser(u => ({ ...u, fastingLogs: { ...u.fastingLogs, [d]: l } }))} setCurrentView={() => setSubView(null)} t={t} />;
    if (subView === 'women') return <WomensSpace state={compositeData} toggleHayd={(a) => updateActiveUser(u => ({ ...u, isHaydNifas: a }))} addHealthPeriod={(s, e) => updateActiveUser(u => ({ ...u, healthPeriods: [...u.healthPeriods, { id: Date.now().toString(), start: s, end: e }] }))} removeHealthPeriod={(id) => updateActiveUser(u => ({ ...u, healthPeriods: u.healthPeriods.filter(p => p.id !== id) }))} setCurrentView={() => setSubView(null)} t={t} />;

    switch (activeTab) {
      case 'home': return <Dashboard state={compositeData} setCurrentView={setSubView} t={t} updatePrayerStatus={(d, p, s) => updateActiveUser(u => ({ ...u, prayerLogs: { ...u.prayerLogs, [d]: { ...(u.prayerLogs[d] || {}), [p]: s } as any } }))} onLogout={() => setState(prev => ({ ...prev, currentUser: null }))} />;
      case 'prayer': return <PrayerCalendar state={compositeData} updatePrayerStatus={(d, p, s) => updateActiveUser(u => ({ ...u, prayerLogs: { ...u.prayerLogs, [d]: { ...(u.prayerLogs[d] || {}), [p]: s } as any } }))} setCurrentView={setSubView} t={t} />;
      case 'challenges': return (
        <DhikrCounter 
          state={compositeData} updateProgress={(id, d) => updateActiveUser(u => ({ ...u, activeChallenges: u.activeChallenges.map(c => c.id === id ? { ...c, current: c.current + d } : c), dhikrCount: u.dhikrCount + d }))}
          updatePersonalProgress={(id, d) => updateActiveUser(u => { const today = new Date().toISOString().split('T')[0]; return { ...u, personalDhikrs: u.personalDhikrs.map(pd => pd.id === id ? { ...pd, totalCount: pd.totalCount + d, dailyCount: (pd.lastUpdated.split('T')[0] !== today ? d : pd.dailyCount + d), sessionCount: pd.sessionCount + d, lastUpdated: new Date().toISOString() } : pd), dhikrCount: u.dhikrCount + d }; })}
          addPersonalDhikr={(n) => updateActiveUser(u => ({ ...u, personalDhikrs: [{ id: `p-${Date.now()}`, name: n, totalCount: 0, dailyCount: 0, sessionCount: 0, lastUpdated: new Date().toISOString() }, ...u.personalDhikrs] }))}
          resetPersonalSession={(id) => updateActiveUser(u => ({ ...u, personalDhikrs: u.personalDhikrs.map(d => d.id === id ? { ...d, sessionCount: 0 } : d) }))}
          deletePersonalDhikr={(id) => updateActiveUser(u => ({ ...u, personalDhikrs: u.personalDhikrs.filter(d => d.id !== id) }))}
          archiveChallenge={(id) => updateActiveUser(u => { const c = u.activeChallenges.find(x => x.id === id); if (!c) return u; return { ...u, activeChallenges: u.activeChallenges.map(x => x.id === id ? { ...x, current: 0 } : x), dhikrHistory: [...u.dhikrHistory, { id: `${id}-${Date.now()}`, title: c.title, target: c.target, current: c.current, date: new Date().toISOString() }], activeDhikrId: null }; })}
          setActiveDhikr={(id) => updateActiveUser(u => ({ ...u, activeDhikrId: id }))} setCurrentView={setSubView} t={t} 
        />
      );
      case 'tracker': return (
        <div className="scroll-container px-6 pt-12 content-limit w-full">
          <h1 className="text-4xl font-black text-emerald-950 dark:text-emerald-50 mb-8 tracking-tighter">My Path</h1>
          <div className="grid grid-cols-1 gap-4">
             {[
               { view: 'quran', icon: 'fa-book-open', title: 'quran', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30' },
               { view: 'fasting', icon: 'fa-moon', title: 'fasting', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
               { view: 'qibla', icon: 'fa-compass', title: 'qibla', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
               ...(currentUserData?.profile.sex === 'female' ? [{ view: 'women', icon: 'fa-leaf', title: 'womensSpace', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/30' }] : [])
             ].map(item => (
                <div key={item.view} onClick={() => setSubView(item.view)} className="card-premium flex items-center gap-6 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all !p-5">
                   <div className={`w-16 h-16 ${item.bg} ${item.color} rounded-3xl flex items-center justify-center text-3xl`}><i className={`fas ${item.icon}`}></i></div>
                   <div className="flex-1"><h3 className="font-black text-emerald-950 dark:text-emerald-50 text-xl tracking-tight">{t(item.title)}</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Worship Insights</p></div>
                   <i className="fas fa-chevron-right text-slate-200"></i>
                </div>
             ))}
          </div>
        </div>
      );
      case 'account': return (
        <MyAccount 
          state={compositeData} setCurrentView={setSubView} t={t} onLogout={() => setState(prev => ({ ...prev, currentUser: null }))} 
          toggleTheme={() => updateActiveUser(u => ({ ...u, settings: { ...u.settings, theme: u.settings.theme === 'dark' ? 'light' : 'dark' } }))} 
          toggleEcoMode={() => updateActiveUser(u => ({ ...u, settings: { ...u.settings, ecoMode: !u.settings.ecoMode } }))} 
          toggleNotifications={() => updateActiveUser(u => ({ ...u, settings: { ...u.settings, notificationsEnabled: !u.settings.notificationsEnabled } }))} 
          updatePrayerReminder={(p, time, enabled) => updateActiveUser(u => { const r = u.settings.prayerReminders || []; const i = r.findIndex(x => x.prayer === p); const nr = [...r]; if (i > -1) nr[i] = { prayer: p, time, enabled }; else nr.push({ prayer: p, time, enabled }); return { ...u, settings: { ...u.settings, prayerReminders: nr } }; })} 
          setCalculationMethod={(m) => { updateActiveUser(u => ({ ...u, settings: { ...u.settings, calculationMethod: m } })); refreshLocationAndTimings(); }} 
          refreshTimings={refreshLocationAndTimings}
          updateAlarmSettings={(cfg) => updateActiveUser(u => ({ ...u, settings: { ...u.settings, alarm: { ...u.settings.alarm, ...cfg } } }))}
          updateProfile={(p) => updateActiveUser(u => ({ ...u, profile: { ...u.profile, ...p } }))}
        />
      );
      default: return null;
    }
  };

  return (
    <div className={`app-viewport ${compositeData.settings.theme === 'dark' ? 'dark bg-slate-950' : 'bg-ivory'}`} dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
      <main className="flex-1 overflow-hidden relative w-full h-full flex flex-col">{renderActiveView()}</main>
      {!subView && (
        <nav className="bottom-nav">
          {[ { id: 'home', icon: 'fa-mosque' }, { id: 'prayer', icon: 'fa-kaaba' }, { id: 'tracker', icon: 'fa-chart-line' }, { id: 'challenges', icon: 'fa-star-and-crescent' }, { id: 'account', icon: 'fa-user' } ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}>
              <i className={`fas ${tab.icon}`}></i>
              <span className="text-[9px] font-black uppercase tracking-widest">{tab.id}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};

export default App;