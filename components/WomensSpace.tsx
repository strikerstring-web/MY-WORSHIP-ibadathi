import React, { useState } from 'react';
import { UserData, PrayerTimings, HealthPeriod } from '../types';

interface WomensSpaceProps {
  state: UserData & { todayTimings: PrayerTimings | null };
  toggleHayd: (active: boolean) => void;
  addHealthPeriod: (start: string, end: string | null) => void;
  removeHealthPeriod: (id: string) => void;
  setCurrentView: (view: any) => void;
  t: (key: string) => string;
}

const WomensSpace: React.FC<WomensSpaceProps> = ({ state, toggleHayd, addHealthPeriod, removeHealthPeriod, setCurrentView, t }) => {
  const [newStart, setNewStart] = useState(new Date().toISOString().split('T')[0]);
  const [newEnd, setNewEnd] = useState<string>('');
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = () => {
    if (!newStart) return;
    addHealthPeriod(newStart, newEnd || null);
    setShowAdd(false);
    setNewEnd('');
  };

  const recentPeriods = state.healthPeriods.slice(-2).reverse();

  return (
    <div className="flex flex-col h-full bg-[#fdfbf7] dark:bg-slate-950 view-transition overflow-hidden">
      <div className="p-4 pt-10 pb-6 bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 text-white shrink-0 shadow-lg rounded-b-[32px]">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentView('dashboard')} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl active:scale-95 transition-transform"><i className="fas fa-chevron-left text-xs"></i></button>
          <h1 className="text-lg font-black tracking-tight">{t('womensSpace')}</h1>
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col justify-around overflow-hidden gap-4">
        <div className={`p-6 rounded-3xl text-center border-2 transition-all duration-500 ${state.isHaydNifas ? 'border-rose-200 bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-slate-900' : 'border-emerald-50 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/10 dark:to-slate-900 shadow-sm'} shrink-0`}>
          <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3 text-2xl transition-all duration-500 ${state.isHaydNifas ? 'bg-rose-500 text-white shadow-lg rotate-12 scale-110' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700'}`}><i className="fas fa-droplet"></i></div>
          <h2 className="text-xs font-black text-emerald-950 dark:text-emerald-50 mb-3">{t('haydMode')}</h2>
          <button onClick={() => toggleHayd(!state.isHaydNifas)} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 ${state.isHaydNifas ? 'bg-rose-600 text-white shadow-rose-900/20' : 'bg-emerald-950 dark:bg-emerald-600 text-white shadow-emerald-950/20'}`}>{state.isHaydNifas ? t('inactive') : t('active')}</button>
        </div>

        <div className="flex-1 flex flex-col justify-start overflow-hidden">
          <div className="flex items-center justify-between mb-3 shrink-0 px-1">
            <h3 className="text-[10px] font-black text-emerald-950 dark:text-emerald-50 uppercase tracking-widest flex items-center gap-2"><i className="fas fa-history text-gold-500"></i> Recent Records</h3>
            <button onClick={() => setShowAdd(!showAdd)} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${showAdd ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 border border-emerald-100 dark:border-emerald-800'}`}><i className={`fas ${showAdd ? 'fa-times' : 'fa-plus'} text-[10px]`}></i></button>
          </div>

          <div className="flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar">
            {showAdd ? (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-emerald-100 dark:border-emerald-800 shadow-xl animate-fade-up space-y-4 shrink-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label><input type="date" value={newStart} onChange={e => setNewStart(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] outline-none font-black text-emerald-950 dark:text-emerald-50" /></div>
                  <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label><input type="date" value={newEnd} onChange={e => setNewEnd(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] outline-none font-black text-emerald-950 dark:text-emerald-50" /></div>
                </div>
                <button onClick={handleAdd} className="w-full py-4 bg-emerald-950 dark:bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-transform">Save Entry</button>
              </div>
            ) : (
              recentPeriods.map(p => (
                <div key={p.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-50 dark:border-emerald-900/10 shadow-sm flex items-center justify-between shrink-0 hover:bg-emerald-50/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl flex items-center justify-center text-sm shadow-sm"><i className="fas fa-tint"></i></div>
                    <div>
                      <p className="text-[11px] font-black text-emerald-950 dark:text-emerald-50 leading-none mb-1">{p.start.split('T')[0]}</p>
                      <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Excused Period</p>
                    </div>
                  </div>
                  <button onClick={() => removeHealthPeriod(p.id)} className="w-8 h-8 text-rose-300 hover:text-rose-500 transition-colors active:scale-90"><i className="fas fa-trash text-[10px]"></i></button>
                </div>
              ))
            )}
            {!showAdd && recentPeriods.length === 0 && <div className="flex-1 min-h-[100px] border-2 border-dashed border-emerald-100 dark:border-emerald-900/20 rounded-[32px] flex flex-col items-center justify-center text-[10px] text-slate-300 font-black uppercase tracking-widest gap-2 opacity-50"><i className="fas fa-scroll text-xl"></i> No history</div>}
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/10 dark:to-slate-900 p-4 rounded-3xl border border-amber-100 dark:border-amber-900/20 shrink-0">
          <h3 className="font-black text-amber-800 dark:text-amber-500 text-[10px] mb-2 flex items-center gap-2 uppercase tracking-widest"><i className="fas fa-circle-info"></i> Divine Ease</h3>
          <ul className="space-y-2 text-[9px] text-amber-900/80 dark:text-slate-400 font-bold leading-relaxed">
            <li className="flex gap-2"><i className="fas fa-check-circle text-amber-500 shrink-0"></i> <span>Daily prayers during periods are <b>exempted</b> and do not need to be made up.</span></li>
            <li className="flex gap-2"><i className="fas fa-exclamation-circle text-amber-500 shrink-0"></i> <span>Ramadan fasts missed must be made up (Qada) later in the year.</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WomensSpace;