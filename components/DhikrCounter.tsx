
import React, { useState, useMemo } from 'react';
import { UserData, DhikrChallenge, PersonalDhikr, PrayerTimings } from '../types';

interface DhikrCounterProps {
  state: UserData & { todayTimings: PrayerTimings | null };
  updateProgress: (id: string, delta: number) => void;
  updatePersonalProgress: (id: string, delta: number) => void;
  addPersonalDhikr: (name: string) => void;
  resetPersonalSession: (id: string) => void;
  deletePersonalDhikr: (id: string) => void;
  archiveChallenge: (id: string) => void;
  setActiveDhikr: (id: string | null) => void;
  setCurrentView: (view: any) => void;
  t: (key: string) => string;
}

const DhikrCounter: React.FC<DhikrCounterProps> = ({ 
  state, updateProgress, updatePersonalProgress, addPersonalDhikr, resetPersonalSession, deletePersonalDhikr, archiveChallenge, setActiveDhikr, setCurrentView, t 
}) => {
  const [activeTab, setActiveTab] = useState<'challenges' | 'personal'>('challenges');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  const activeChallenge = state.activeChallenges.find(c => c.id === state.activeDhikrId);

  if (activeChallenge) {
    const perc = Math.min(100, (activeChallenge.current / activeChallenge.target) * 100);
    return (
      <div className="h-full flex flex-col bg-[#020617] text-white overflow-hidden animate-fade-in">
        <header className="p-4 pt-10 flex justify-between items-center z-10">
          <button onClick={() => setActiveDhikr(null)} className="w-10 h-10 glass-morphism rounded-xl flex items-center justify-center"><i className="fas fa-chevron-left"></i></button>
          <div className="text-right">
             <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Active Dhikr</p>
             <h3 className="text-xs font-black truncate max-w-[150px]">{t(activeChallenge.title)}</h3>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-8 relative">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border-2 border-emerald-500/10 rounded-full animate-pulse"></div>
           
           <div className="text-center z-10 mb-12">
              <p className="arabic-font text-5xl font-black mb-6 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]" dir="rtl">{activeChallenge.arabic}</p>
              <div className="flex justify-center gap-2 mb-2">
                 {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-emerald-500/40"></div>)}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{t(activeChallenge.title)}</p>
           </div>

           <button 
             onClick={() => { if ('vibrate' in navigator) navigator.vibrate(50); updateProgress(activeChallenge.id, 1); }}
             className="w-64 h-64 rounded-full bg-white text-slate-900 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.2)] transition-all active:scale-95 z-10 group"
           >
              <span className="text-8xl font-black tabular-nums tracking-tighter group-active:text-emerald-600 transition-colors">{activeChallenge.current}</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Recite</span>
           </button>

           <div className="w-full max-w-xs mt-16 space-y-2">
              <div className="flex justify-between px-1">
                 <span className="text-[8px] font-black text-slate-500 uppercase">Progress</span>
                 <span className="text-[8px] font-black text-emerald-500 uppercase">{perc.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${perc}%` }}></div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll-container px-4 pt-10 content-limit w-full pb-32">
      <h1 className="text-3xl font-black text-emerald-950 dark:text-emerald-50 mb-8 tracking-tighter">Divine Remembrance</h1>
      
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl mb-8">
        <button onClick={() => setActiveTab('challenges')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'challenges' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}>Daily Tasks</button>
        <button onClick={() => setActiveTab('personal')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'personal' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}>My Counters</button>
      </div>

      {activeTab === 'challenges' ? (
        <div className="grid grid-cols-1 gap-4 animate-fade-up">
           {state.activeChallenges.map((c, i) => (
             <button 
               key={c.id} 
               onClick={() => setActiveDhikr(c.id)}
               className="card-premium flex items-center justify-between group hover:border-emerald-200 transition-all active:scale-[0.98]"
             >
                <div className="flex items-center gap-4 text-left overflow-hidden">
                   <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl flex items-center justify-center text-xl shrink-0"><i className="fas fa-play"></i></div>
                   <div className="overflow-hidden">
                      <h4 className="font-black text-emerald-950 dark:text-emerald-50 text-xs truncate">{t(c.title)}</h4>
                      <p className="arabic-font text-slate-400 text-sm truncate" dir="rtl">{c.arabic}</p>
                   </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                   <p className="text-[10px] font-black text-emerald-600">{c.current}/{c.target}</p>
                   <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${(c.current/c.target)*100}%` }}></div>
                   </div>
                </div>
             </button>
           ))}
        </div>
      ) : (
        <div className="animate-fade-up">
           <div className="grid grid-cols-1 gap-4 mb-6">
              {state.personalDhikrs.map(d => (
                <div key={d.id} className="card-premium flex items-center justify-between">
                   <div className="flex-1">
                      <h4 className="font-black text-emerald-950 dark:text-emerald-50 text-xs mb-1">{d.name}</h4>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Today: {d.dailyCount} • Total: {d.totalCount}</p>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => updatePersonalProgress(d.id, 1)} className="w-10 h-10 bg-emerald-500 text-white rounded-xl shadow-md active:scale-90"><i className="fas fa-plus"></i></button>
                      <button onClick={() => deletePersonalDhikr(d.id)} className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl active:scale-90"><i className="fas fa-trash"></i></button>
                   </div>
                </div>
              ))}
           </div>
           
           {!showAdd ? (
             <button onClick={() => setShowAdd(true)} className="w-full py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 font-black uppercase text-[10px] tracking-widest hover:border-emerald-300 transition-all active:scale-95"><i className="fas fa-plus mr-2"></i> Add New Counter</button>
           ) : (
             <div className="card-premium space-y-4 animate-fade-in border-emerald-500/30">
                <input 
                  type="text" 
                  placeholder="Enter Dhikr Name..." 
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs font-black outline-none border border-transparent focus:border-emerald-500/30 transition-all text-emerald-950 dark:text-emerald-50"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <div className="flex gap-2">
                   <button onClick={() => { addPersonalDhikr(newName); setShowAdd(false); setNewName(''); }} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black uppercase text-[9px] tracking-widest">Create</button>
                   <button onClick={() => setShowAdd(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-400 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest">Cancel</button>
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default DhikrCounter;
