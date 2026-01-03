
import React from 'react';

interface AuthSelectionProps {
  t: (key: string) => string;
  onSelect: (mode: 'login' | 'register') => void;
  onBack: () => void;
}

const AuthSelection: React.FC<AuthSelectionProps> = ({ t, onSelect, onBack }) => {
  return (
    <div className="flex flex-col items-center justify-between h-full w-full p-6 text-center relative overflow-hidden bg-slate-900 transition-all duration-500">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-[120px]"></div>
      </div>

      <header className="w-full flex justify-start z-20 pt-4">
        <button onClick={onBack} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40 border border-white/10 active:scale-90 transition-all">
          <i className="fas fa-chevron-left"></i>
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center space-y-10 z-10 w-full animate-fade-up">
        <div className="space-y-3">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-800 rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-6">
            <i className="fas fa-lock text-2xl text-white"></i>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter">Secure Access</h2>
          <p className="text-slate-400 text-[10px] font-medium uppercase tracking-[0.3em] opacity-60">Join the Circle of Worshipers</p>
        </div>

        <div className="w-full max-w-[280px] space-y-3">
          <button 
            onClick={() => onSelect('login')}
            className="w-full bg-white text-emerald-950 font-black py-4 rounded-2xl flex items-center justify-between px-6 active:scale-[0.98] transition-all group"
          >
            <span className="uppercase tracking-widest text-[11px]">{t('login')}</span>
            <i className="fas fa-sign-in-alt text-[10px] opacity-20 group-hover:opacity-100 transition-opacity"></i>
          </button>
          
          <button 
            onClick={() => onSelect('register')}
            className="w-full bg-white/5 text-white border border-white/10 font-black py-4 rounded-2xl flex items-center justify-between px-6 active:scale-[0.98] transition-all group"
          >
            <span className="uppercase tracking-widest text-[11px]">{t('register')}</span>
            <i className="fas fa-user-plus text-[10px] opacity-20 group-hover:opacity-100 transition-opacity"></i>
          </button>
        </div>
      </div>

      <div className="pb-10 z-10">
        <p className="text-slate-600 text-[7px] font-black uppercase tracking-[0.5em] opacity-40">Your data is secured locally</p>
      </div>
    </div>
  );
};

export default AuthSelection;
