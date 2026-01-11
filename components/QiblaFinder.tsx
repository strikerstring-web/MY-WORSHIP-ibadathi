import React, { useState, useEffect, useCallback } from 'react';

interface QiblaFinderProps {
  setCurrentView: (view: any) => void;
  t: (key: string) => string;
}

const KAABA_COORDS = { lat: 21.422487, lng: 39.826206 };

const QiblaFinder: React.FC<QiblaFinderProps> = ({ setCurrentView, t }) => {
  const [qiblaAngle, setQiblaAngle] = useState<number | null>(null);
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [locationLoaded, setLocationLoaded] = useState(false);
  
  // Manual Input State
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLng, setManualLng] = useState<string>('');

  const calculateQibla = useCallback((lat: number, lng: number) => {
    const phiK = (KAABA_COORDS.lat * Math.PI) / 180;
    const phi = (lat * Math.PI) / 180;
    const deltaL = ((KAABA_COORDS.lng - lng) * Math.PI) / 180;
    const angle = Math.atan2(Math.sin(deltaL), Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(deltaL));
    let qiblaDegree = (angle * 180) / Math.PI;
    if (qiblaDegree < 0) qiblaDegree += 360;
    setQiblaAngle(qiblaDegree);
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => { 
          calculateQibla(position.coords.latitude, position.coords.longitude); 
          setLocationLoaded(true); 
          setError(null);
        },
        (err) => { 
          setError("Location access denied. Please enter coordinates manually."); 
          setIsManualMode(true);
          console.error(err); 
        }
      );
    } else { 
      setError("Geolocation not supported. Please enter coordinates manually."); 
      setIsManualMode(true);
    }
  }, [calculateQibla]);

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      let heading = 0;
      if ((event as any).webkitCompassHeading !== undefined) {
        heading = (event as any).webkitCompassHeading;
      } else if (event.alpha !== null) {
        heading = 360 - event.alpha;
      }
      setCompassHeading(heading);
    };
    
    const requestPermission = async () => {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const state = await (DeviceOrientationEvent as any).requestPermission();
          if (state === 'granted') window.addEventListener('deviceorientation', handleOrientation);
        } catch (e) {
          console.error("Compass permission error", e);
        }
      } else { 
        window.addEventListener('deviceorientation', handleOrientation); 
      }
    };

    requestPermission();
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      calculateQibla(lat, lng);
      setLocationLoaded(true);
      setIsManualMode(false);
      setError(null);
    } else {
      setError("Please enter valid numeric coordinates.");
    }
  };

  const relativeQibla = qiblaAngle !== null ? (qiblaAngle - compassHeading + 360) % 360 : 0;
  const isAligned = Math.abs(relativeQibla) < 5 || Math.abs(relativeQibla - 360) < 5;

  return (
    <div className="flex flex-col h-full bg-[#fdfbf7] dark:bg-slate-900 animate-fade-up overflow-hidden">
      <header className="p-4 pt-10 pb-5 bg-emerald-900 text-white flex items-center gap-3 shadow-lg rounded-b-[24px] z-20 shrink-0">
        <button onClick={() => setCurrentView('dashboard')} className="w-9 h-9 flex items-center justify-center bg-white/10 rounded-xl border border-white/10 active:scale-90 transition-transform">
          <i className="fas fa-chevron-left text-xs"></i>
        </button>
        <div>
          <h1 className="text-lg font-black tracking-tight">{t('qibla')}</h1>
          <p className="text-[8px] text-emerald-300 font-black uppercase tracking-widest mt-0.5">Direction Finder</p>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-8">
        {/* Compass Visual Section */}
        <div className="relative flex flex-col items-center">
          <div className="text-center mb-6">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Heading</p>
            <h3 className="text-xl font-black text-emerald-900 dark:text-emerald-50 tabular-nums">{Math.round(compassHeading)}°</h3>
          </div>

          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Outer Compass Ring */}
            <div className="absolute inset-0 border-[12px] border-emerald-50 dark:border-slate-800 rounded-full transition-transform duration-200 shadow-inner" style={{ transform: `rotate(${-compassHeading}deg)` }}>
              <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-black text-emerald-800 dark:text-emerald-600">N</span>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-black text-emerald-800 dark:text-emerald-600">S</span>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-800 dark:text-emerald-600">E</span>
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-800 dark:text-emerald-600">W</span>
              
              {/* Compass Ticks */}
              {[...Array(36)].map((_, i) => (
                <div key={i} className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-px flex flex-col justify-between py-1" style={{ transform: `rotate(${i * 10}deg)` }}>
                  <div className={`w-px ${i % 9 === 0 ? 'h-3 bg-emerald-400' : 'h-1.5 bg-emerald-200 dark:bg-slate-700'}`}></div>
                  <div className={`w-px ${i % 9 === 0 ? 'h-3 bg-emerald-400' : 'h-1.5 bg-emerald-200 dark:bg-slate-700'}`}></div>
                </div>
              ))}
            </div>

            {/* Qibla Needle */}
            <div className="absolute inset-0 flex items-center justify-center transition-all duration-300" style={{ transform: `rotate(${relativeQibla}deg)` }}>
              <div className="flex flex-col items-center relative">
                {/* Glow behind Kaaba when aligned */}
                {isAligned && <div className="absolute -top-10 w-16 h-16 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>}
                
                <div className={`flex flex-col items-center transition-all duration-500 ${isAligned ? 'scale-125' : 'scale-100'}`}>
                  <i className={`fas fa-kaaba text-2xl mb-1 ${isAligned ? 'text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'text-slate-300 dark:text-slate-700'}`}></i>
                  <div className={`w-1 h-24 rounded-full ${isAligned ? 'bg-gradient-to-t from-transparent to-emerald-500' : 'bg-gradient-to-t from-transparent to-slate-200 dark:to-slate-800'}`}></div>
                </div>

                {isAligned && (
                  <div className="absolute -top-8 whitespace-nowrap px-4 py-1.5 bg-emerald-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl animate-bounce">
                    Aligned with Qibla
                  </div>
                )}
              </div>
            </div>

            {/* Center Cap */}
            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-2xl border-2 border-emerald-50 dark:border-slate-800 flex items-center justify-center z-10">
               <i className={`fas fa-star-and-crescent ${isAligned ? 'text-emerald-500' : 'text-slate-300'} transition-colors`}></i>
            </div>
          </div>
        </div>

        {/* Location Info & Manual Inputs */}
        <div className="w-full max-w-[320px] space-y-4 animate-fade-up stagger-1">
          {isManualMode ? (
            <form onSubmit={handleManualSubmit} className="card-premium !p-6 space-y-4 shadow-xl border-emerald-500/20">
              <h4 className="text-[10px] font-black text-emerald-950 dark:text-emerald-50 uppercase tracking-widest text-center">Enter Coordinates</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Latitude</label>
                  <input 
                    type="number" step="any" placeholder="e.g. 21.42" 
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-colors dark:text-white"
                    value={manualLat} onChange={(e) => setManualLat(e.target.value)} required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Longitude</label>
                  <input 
                    type="number" step="any" placeholder="e.g. 39.82" 
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-colors dark:text-white"
                    value={manualLng} onChange={(e) => setManualLng(e.target.value)} required
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                Update Location
              </button>
              <button type="button" onClick={() => setIsManualMode(false)} className="w-full text-[8px] font-black text-slate-400 uppercase tracking-widest py-1">Cancel</button>
            </form>
          ) : (
            <>
              {error && (
                <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 p-4 rounded-3xl text-center">
                  <i className="fas fa-exclamation-triangle text-rose-500 mb-2"></i>
                  <p className="text-rose-900 dark:text-rose-200 text-[10px] font-bold">{error}</p>
                </div>
              )}
              
              <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 text-center relative overflow-hidden">
                {!locationLoaded && !error ? (
                  <div className="flex flex-col items-center py-4">
                    <i className="fas fa-spinner fa-spin text-emerald-500 mb-3"></i>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Locating GPS...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] leading-relaxed font-medium">
                      {isAligned ? 'Masha Allah! You are facing the Qibla.' : 'Hold your device flat and rotate until the Kaaba needle points up.'}
                    </p>
                    <button 
                      onClick={() => setIsManualMode(true)}
                      className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest py-2 px-4 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors"
                    >
                      <i className="fas fa-map-marker-alt mr-2"></i> Set Location Manually
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          
          <div className="text-center">
            <p className="text-[7px] text-slate-300 dark:text-slate-700 font-black uppercase tracking-[0.3em]">
              Precision depends on your local geomagnetic field
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QiblaFinder;