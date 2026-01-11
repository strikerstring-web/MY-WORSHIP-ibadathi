
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppState, UserProfile, UserData, Language, PrayerStatus, DhikrChallenge, PrayerTimings } from './types';
import { TRANSLATIONS, PRAYERS } from './constants';
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

  // Initialize client-side data
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedUsers = localStorage.getItem(USERS_DB_KEY);
      const activeSession = localStorage.getItem(SESSION_KEY);
      let parsedUsers: Record<string, UserData> = {};
      if (savedUsers) parsedUsers = JSON.parse(savedUsers);
      const currentUser = (activeSession && parsedUsers[activeSession.toLowerCase()]) ? activeSession.toLowerCase() : null;
      
      setState(prev => ({
        ...prev,
        users: parsedUsers,
        currentUser: currentUser
      }));
    } catch (e) {
      console.error("Local Storage Initialization Error", e);
    }

    const clockInterval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(clockInterval);
  }, []);

  // Check for auto-deactivation and excused status
  const isCurrentlyExcused = useMemo(() => {
    if (!state.currentUser || !state.users[state.currentUser]) return false;
    const user = state.users[state.currentUser];
    if (user.profile.sex !== 'female') return false;
    
    // Check toggle first
    if (user.isHaydNifas) return true;

    // Check health periods
    const nowTime = currentTime.getTime();
    return user.healthPeriods.some(p => {
      const start = new Date(p.start).getTime();
      const end = p.end ? new Date(p.end).getTime() : Infinity;
      return nowTime >= start && nowTime <= end;
    });
  }, [state.currentUser, state.users, currentTime]);

  // Handle Automatic Marking for Excused Days
  useEffect(() => {
    if (!isMounted || !state.currentUser || !state.todayTimings || !isCurrentlyExcused) return;
    
    const user = state.users[state.currentUser!];
    const todayStr = currentTime.toISOString().split('T')[0];
    const logs = user.prayerLogs[todayStr] || {};
    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    let hasUpdates = false;
    const newLogs = { ...logs };

    PRAYERS.forEach(p => {
      const key = p.charAt(0).toUpperCase() + p.slice(1) as keyof PrayerTimings;
      const [h, m] = (state.todayTimings![key] || "00:00").split(':').map(Number);
      const prayerMinutes = h * 60 + m;

      // If time has passed and prayer is still pending, mark as excused
      if (nowMinutes > prayerMinutes && (!logs[p as keyof typeof logs] || logs[p as keyof typeof logs] === PrayerStatus.PENDING)) {
        newLogs[p as keyof typeof logs] = PrayerStatus.EXCUSED;
        hasUpdates = true;
      }
    });

    // Handle Ramadan Fasting auto-marking as "Missed" (for Qada later) if in Ramadan month (simplified logic)
    // Note: Fasting logs are keyed by 'ramadan-1446H-DAY' in this app's logic
    // We check if a Ramadan day corresponds to today and mark it if needed
    // In a real scenario, this would check if today is a Ramadan date.

    if (hasUpdates) {
      updateActiveUser(u => ({
        ...u,
        prayerLogs: { ...u.prayerLogs, [todayStr]: newLogs as any }
      }));
    }
  }, [isCurrentlyExcused, currentTime, state.todayTimings, isMounted]);

  // Sync Global Theme & Body Classes
  useEffect(() => {
    if (!isMounted) return;
    
    if (state.currentUser && state.users[state.currentUser]) {
      const user = state.users[state.currentUser];
      setCurrentLanguage(user.profile.preferredLanguage);
      const isDark = user.settings.theme === 'dark';
      document.body.classList.toggle('dark', isDark);
      document.body.classList.toggle('dark-mode-active', isDark);
      
      if (user.settings.ecoMode) {
        document.body.classList.add('eco-mode');
      } else {
        document.body.classList.remove('eco-mode');
      }
    } else {
      document.body.classList.add('dark', 'dark-mode-active');
    }
  }, [state.currentUser, state.users, isMounted]);

  // Persist Data Changes
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(state.users));
      if (state.currentUser) {
        localStorage.setItem(SESSION_KEY, state.currentUser);
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch (e) {
      console.warn("Storage Sync Failed", e);
    }
  }, [state.users, state.currentUser, isMounted]);

  // Isolated Background Alarm System - Safe execution after load
  useEffect(() => {
    if (!isMounted || !state.currentUser || !state.todayTimings) return;
    
    const checkAlarms = () => {
      const user = state.users[state.currentUser!];
      if (!user?.settings.notificationsEnabled || isCurrentlyExcused) return;

      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

      const matchingPrayer = PRAYERS.find(p => {
        const key = p.charAt(0).toUpperCase() + p.slice(1) as keyof PrayerTimings;
        return state.todayTimings![key] === timeStr;
      });

      if (matchingPrayer && lastAlertedPrayer.current !== `${matchingPrayer}-${timeStr}`) {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(TRANSLATIONS[currentLanguage]['prayerAlertTitle'] || 'Ibadathi (عبادتي)', {
            body: (TRANSLATIONS[currentLanguage]['prayerAlertBody'] || 'It is time for {prayer} prayer.').replace('{prayer}', TRANSLATIONS[currentLanguage][matchingPrayer] || matchingPrayer),
            icon: 'https://picsum.photos/192/192'
          });
        }
        
        if (!audioRef.current) {
          audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audioRef.current.volume = 0.4;
        }
        audioRef.current.play().catch(() => {});
        
        lastAlertedPrayer.current = `${matchingPrayer}-${timeStr}`;
      }
    };

    const interval = setInterval(checkAlarms, 30000);
    return () => clearInterval(interval);
  }, [state.todayTimings, state.currentUser, state.users, currentLanguage, isMounted, isCurrentlyExcused]);

  const updateActiveUser = (updater: (prev: UserData) => UserData) => {
    if (!state.currentUser) return;
    setState(prev => {
      const current = prev.currentUser!;
      if (!prev.users[current]) return prev;
      return { ...prev, users: { ...prev.users, [current]: updater(prev.users[current]) } };
    });
  };

  const updatePrayerReminder = (prayer: string, time: string, enabled: boolean) => {
    updateActiveUser(u => {
      const reminders = u.settings.prayerReminders || [];
      const index = reminders.findIndex(r => r.prayer === prayer);
      const newReminders = [...reminders];
      if (index > -1) {
        newReminders[index] = { prayer, time, enabled };
      } else {
        newReminders.push({ prayer, time, enabled });
      }
      return { ...u, settings: { ...u.settings, prayerReminders: newReminders } };
    });
  };

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
          notificationsEnabled: true, 
          locationEnabled: true, 
          theme: 'dark', 
          ecoMode: false,
          qadaReminders: [],
          prayerReminders: []
        }
      };
      setState(prev => ({ ...prev, currentUser: userKey, users: { ...prev.users, [userKey]: newUserData } }));
    } else {
      setState(prev => ({ ...prev, currentUser: userKey }));
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

  const compositeData = { 
    ...currentUserData!, 
    todayTimings: state.todayTimings,
    // Inject excused state globally for UI
    isExcusedToday: isCurrentlyExcused
  };

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
          state={compositeData} 
          updateProgress={(id, d) => updateActiveUser(u => ({ ...u, activeChallenges: u.activeChallenges.map(c => c.id === id ? { ...c, current: c.current + d } : c), dhikrCount: u.dhikrCount + d }))}
          updatePersonalProgress={(id, d) => updateActiveUser(u => {
            const today = new Date().toISOString().split('T')[0];
            return { ...u, personalDhikrs: u.personalDhikrs.map(pd => pd.id === id ? { ...pd, totalCount: pd.totalCount + d, dailyCount: (pd.lastUpdated.split('T')[0] !== today ? d : pd.dailyCount + d), sessionCount: pd.sessionCount + d, lastUpdated: new Date().toISOString() } : pd), dhikrCount: u.dhikrCount + d };
          })}
          addPersonalDhikr={(n) => updateActiveUser(u => ({ ...u, personalDhikrs: [{ id: `p-${Date.now()}`, name: n, totalCount: 0, dailyCount: 0, sessionCount: 0, lastUpdated: new Date().toISOString() }, ...u.personalDhikrs] }))}
          resetPersonalSession={(id) => updateActiveUser(u => ({ ...u, personalDhikrs: u.personalDhikrs.map(d => d.id === id ? { ...d, sessionCount: 0 } : d) }))}
          deletePersonalDhikr={(id) => updateActiveUser(u => ({ ...u, personalDhikrs: u.personalDhikrs.filter(d => d.id !== id) }))}
          archiveChallenge={(id) => updateActiveUser(u => {
            const c = u.activeChallenges.find(x => x.id === id);
            if (!c) return u;
            return { ...u, activeChallenges: u.activeChallenges.map(x => x.id === id ? { ...x, current: 0 } : x), dhikrHistory: [...u.dhikrHistory, { id: `${id}-${Date.now()}`, title: c.title, target: c.target, current: c.current, date: new Date().toISOString() }], activeDhikrId: null };
          })}
          setActiveDhikr={(id) => updateActiveUser(u => ({ ...u, activeDhikrId: id }))}
          setCurrentView={setSubView} t={t} 
        />
      );
      case 'tracker': return (
        <div className="scroll-container px-6 pt-12 content-limit w-full">
          <h1 className="text-4xl font-black text-emerald-950 dark:text-emerald-50 mb-8 tracking-tighter">My Path</h1>
          <div className="grid grid-cols-1 gap-4">
             {[
               { view: 'quran', icon: 'fa-book-open', title: 'quran', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30' },
               { view: 'fasting', icon: 'fa-moon', title: 'fasting', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
               ...(currentUserData?.profile.sex === 'female' ? [{ view: 'women', icon: 'fa-leaf', title: 'womensSpace', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/30' }] : [])
             ].map(item => (
                <div key={item.view} onClick={() => setSubView(item.view)} className="card-premium flex items-center gap-6 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all !p-5">
                   <div className={`w-16 h-16 ${item.bg} ${item.color} rounded-3xl flex items-center justify-center text-3xl`}><i className={`fas ${item.icon}`}></i></div>
                   <div className="flex-1">
                     <h3 className="font-black text-emerald-950 dark:text-emerald-50 text-xl tracking-tight">{t(item.title)}</h3>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Worship Insights</p>
                   </div>
                   <i className="fas fa-chevron-right text-slate-200"></i>
                </div>
             ))}
          </div>
        </div>
      );
      case 'account': return <MyAccount state={compositeData} setCurrentView={setSubView} t={t} onLogout={() => setState(prev => ({ ...prev, currentUser: null }))} toggleTheme={() => updateActiveUser(u => ({ ...u, settings: { ...u.settings, theme: u.settings.theme === 'dark' ? 'light' : 'dark' } }))} toggleEcoMode={() => updateActiveUser(u => ({ ...u, settings: { ...u.settings, ecoMode: !u.settings.ecoMode } }))} toggleNotifications={() => updateActiveUser(u => ({ ...u, settings: { ...u.settings, notificationsEnabled: !u.settings.notificationsEnabled } }))} updatePrayerReminder={updatePrayerReminder} />;
      default: return null;
    }
  };

  return (
    <div className={`app-viewport ${compositeData.settings.theme === 'dark' ? 'dark bg-slate-950' : 'bg-ivory'}`} dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
      <main className="flex-1 overflow-hidden relative w-full h-full flex flex-col">
        {renderActiveView()}
      </main>
      {!subView && (
        <nav className="bottom-nav">
          {[
            { id: 'home', icon: 'fa-mosque' },
            { id: 'prayer', icon: 'fa-kaaba' },
            { id: 'tracker', icon: 'fa-compass' },
            { id: 'challenges', icon: 'fa-star-and-crescent' },
            { id: 'account', icon: 'fa-user' }
          ].map(tab => (
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
