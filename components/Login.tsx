import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, UserData, Language } from '../types';

interface LoginProps {
  onLogin: (profile: UserProfile, isNew: boolean) => void;
  t: (key: string) => string;
  initialLanguage: Language;
  users: Record<string, UserData>;
  initialMode?: 'login' | 'register';
  onBack?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, t, initialLanguage, users, initialMode = 'login', onBack }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    age: '',
    sex: 'male' as 'male' | 'female',
    place: '',
    password: '',
    preferredLanguage: initialLanguage
  });
  const [error, setError] = useState<string | null>(null);

  const usernameNormalized = useMemo(() => formData.username.trim().toLowerCase(), [formData.username]);
  
  const validate = () => {
    if (!usernameNormalized) return "Username required.";
    if (!formData.password) return "Password required.";
    if (mode === 'register') {
      if (!formData.name.trim()) return "Full name required.";
      if (!formData.age || isNaN(parseInt(formData.age))) return "Valid age required.";
      if (!formData.place.trim()) return "Place required.";
      if (users[usernameNormalized]) return "This username is already taken.";
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsAuthenticating(true);
    setTimeout(() => {
      if (mode === 'login') {
        const user = users[usernameNormalized];
        if (!user || user.profile.password !== formData.password) {
          setError(!user ? "User not found." : "Incorrect password.");
          setIsAuthenticating(false);
          return;
        }
        onLogin(user.profile, false);
      } else {
        const newProfile: UserProfile = {
          username: usernameNormalized,
          name: formData.name.trim(),
          age: parseInt(formData.age),
          sex: formData.sex,
          place: formData.place.trim(),
          preferredLanguage: formData.preferredLanguage,
          password: formData.password
        };
        onLogin(newProfile, true);
      }
      setIsAuthenticating(false);
    }, 800);
  };

  const inputClasses = "w-full px-6 py-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-emerald-950 dark:text-emerald-50 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500";
  const labelClasses = "block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2";

  return (
    <div className="flex flex-col h-full bg-ivory dark:bg-[#020617] w-full overflow-hidden animate-fade-up relative">
      <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none"></div>

      <header className="px-8 pt-12 pb-6 flex items-center justify-between shrink-0 relative z-10">
        <button 
          onClick={onBack} 
          className="w-12 h-12 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-center border border-black/10 dark:border-white/10 active:scale-90 transition-transform"
        >
          <i className="fas fa-chevron-left text-sm text-emerald-900 dark:text-slate-400"></i>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-4 flex flex-col items-center no-scrollbar relative z-10">
        <div className="w-full max-w-[400px]">
          <h2 className="text-3xl font-black text-emerald-950 dark:text-white tracking-tighter mb-2">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-slate-500 text-xs font-medium mb-8">{mode === 'login' ? 'Continue your journey of worship.' : 'Join the global community of Ibadathi.'}</p>

          <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-2xl mb-8 border border-black/5 dark:border-white/10">
            <button 
              onClick={() => setMode('login')} 
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'login' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500'}`}
            >
              Login
            </button>
            <button 
              onClick={() => setMode('register')} 
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'register' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-500/10 text-rose-600 dark:text-rose-500 p-4 rounded-2xl text-[10px] font-bold text-center border border-rose-500/20 animate-pop">
                <i className="fas fa-circle-exclamation mr-2"></i> {error}
              </div>
            )}

            <div className="space-y-2">
              <label className={labelClasses}>Username</label>
              <input 
                type="text" 
                placeholder="e.g. believer_1"
                className={inputClasses} 
                value={formData.username} 
                onChange={e => setFormData({...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})} 
                required 
              />
            </div>

            {mode === 'register' && (
              <>
                <div className="space-y-2">
                  <label className={labelClasses}>Full Name</label>
                  <input type="text" placeholder="Your Name" className={inputClasses} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={labelClasses}>Age</label>
                    <input type="number" placeholder="24" className={inputClasses} value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClasses}>Gender</label>
                    <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-black/5 dark:border-white/10 h-[58px]">
                      <button type="button" onClick={() => setFormData({...formData, sex: 'male'})} className={`flex-1 rounded-xl text-[10px] font-black uppercase transition-all ${formData.sex === 'male' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500'}`}>M</button>
                      <button type="button" onClick={() => setFormData({...formData, sex: 'female'})} className={`flex-1 rounded-xl text-[10px] font-black uppercase transition-all ${formData.sex === 'female' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500'}`}>F</button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={labelClasses}>Place</label>
                  <input type="text" placeholder="e.g. Kerala" className={inputClasses} value={formData.place} onChange={e => setFormData({...formData, place: e.target.value})} required />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className={labelClasses}>Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className={inputClasses} 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                required 
              />
            </div>

            <button 
              type="submit"
              disabled={isAuthenticating}
              className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 mt-8"
            >
              {isAuthenticating ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <>
                  {mode === 'login' ? 'Login' : 'Create Account'}
                  <i className="fas fa-arrow-right text-[8px] opacity-40"></i>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;