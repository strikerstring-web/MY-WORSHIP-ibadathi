
import React, { useState } from 'react';

interface ZakatCalculatorProps {
  setCurrentView: (view: any) => void;
  t: (key: string) => string;
}

const ZakatCalculator: React.FC<ZakatCalculatorProps> = ({ setCurrentView, t }) => {
  const [wealth, setWealth] = useState<string>('');
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const amount = parseFloat(wealth);
    if (!isNaN(amount)) {
      setResult(amount * 0.025);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#fdfbf7] view-transition">
      <div className="p-4 pt-10 pb-6 flex items-center gap-3 bg-rose-600 text-white shadow-xl rounded-b-[40px] z-20 shrink-0">
        <button onClick={() => setCurrentView('dashboard')} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl hover:bg-white/20 transition-all border border-white/10 active:scale-90 rtl:rotate-180">
          <i className="fas fa-chevron-left text-xs"></i>
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{t('zakat')}</h1>
          <p className="text-[9px] text-rose-200/80 font-bold uppercase tracking-[0.2em] mt-0.5">Financial Obligation</p>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-hidden flex flex-col justify-around"> {/* No scroll here */}
        <div className="mb-4 bg-rose-50 p-4 rounded-[28px] border border-rose-100 flex items-center gap-4 shadow-sm shrink-0">
          <div className="w-14 h-14 bg-rose-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg shadow-rose-200">
            <i className="fas fa-coins"></i>
          </div>
          <div>
            <h2 className="font-black text-rose-900 text-base">{t('zakat')}</h2>
            <p className="text-xs text-rose-700 font-medium italic">"And establish prayer and give zakah..." (Qur'an 2:110)</p>
          </div>
        </div>

        <div className="space-y-4 flex-1 flex flex-col justify-center shrink-0">
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">{t('totalWealth')}</label>
            <input 
              type="number" 
              placeholder="0.00"
              className="w-full p-4 bg-white border border-emerald-50 rounded-[20px] text-xl font-bold focus:ring-2 focus:ring-rose-600/10 outline-none shadow-sm text-emerald-900"
              value={wealth}
              onChange={(e) => setWealth(e.target.value)}
            />
          </div>

          <button 
            onClick={calculate}
            className="w-full py-4 bg-rose-600 text-white rounded-[20px] font-black text-sm uppercase tracking-widest shadow-xl shadow-rose-900/20 active:scale-95 transition-all"
          >
            {t('calculate')}
          </button>

          {result !== null && (
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-[28px] text-center animate-fade-up shadow-lg">
              <p className="text-emerald-600 text-[9px] font-black uppercase tracking-widest mb-1">{t('zakatAmount')}</p>
              <h2 className="text-3xl font-black text-emerald-800">
                {result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-[9px] text-slate-400 bg-slate-50 p-4 rounded-[28px] border border-slate-100 shadow-sm shrink-0">
          <h3 className="font-bold text-slate-600 mb-1.5 uppercase tracking-widest text-[8px]">Important Note</h3>
          <p className="leading-relaxed font-medium">Zakat is mandatory on wealth that has reached the Nisab (minimum threshold) and has been held for one complete lunar year. This calculator provides a basic estimate based on the standard 2.5% rate on total wealth. Please consult with a knowledgeable scholar for precise calculations and rulings for your specific situation.</p>
        </div>
      </div>
    </div>
  );
};

export default ZakatCalculator;
