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
  const [isLocating, setIsLocating] = useState(true);

  const calculateQibla = useCallback((lat: number, lng: number) => {
    const phiK = (KAABA_COORDS.lat * Math.PI) / 180;
    const phi = (lat * Math.PI) / 180;
    const deltaL = ((KAABA_COORDS.lng - lng) * Math.PI) / 180;
    const angle = Math.atan2(Math.sin(deltaL), Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(deltaL));
    let qiblaDegree = (angle * 180) / Math.PI;
    if (qiblaDegree < 0) qiblaDegree += 360;
    setQiblaAngle(qiblaDegree);
  }, []);

  const requestLocation = useCallback(() => {
    setIsLocating(true);
    setError(null);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => { 
          calculateQibla(position.coords.latitude, position.coords.longitude); 
          setIsLocating(false);
          setError(null);
        },
        (err) => { 
          setIsLocating(false);
          setError("Unable to find your location automatically. Please enable location services in your device settings.");
          console.error(err); 
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else { 
      setIsLocating(false);
      setError("Your browser does not support automatic location detection.");
    }
  }, [calculateQibla]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

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
        <div className={`relative flex flex-col items-center transition-all duration-700 ${isLocating ? 'opacity-20 blur-sm grayscale' : 'opacity-100'}`}>
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
            {qiblaAngle !== null && (
              <div className="absolute inset-0 flex items-center justify-center transition-all duration-300" style={{ transform: `rotate(${relativeQibla}deg)` }}>
                <div className="flex flex-col items-center relative">
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
            )}

            {/* Center Cap */}
            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-2xl border-2 border-emerald-50 dark:border-slate-800 flex items-center justify-center z-10">
               <i className={`fas fa-star-and-crescent ${isAligned ? 'text-emerald-500' : 'text-slate-300'} transition-colors`}></i>
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className="w-full max-w-[320px] space-y-4 animate-fade-up stagger-1">
          {isLocating ? (
            <div className="card-premium !p-8 flex flex-col items-center justify-center gap-4 text-center border-emerald-500/20">
               <div className="relative">
                 <div className="w-12 h-12 border-4 border-emerald-100 dark:border-emerald-900 border-t-emerald-500 rounded-full animate-spin"></div>
                 <i className="fas fa-map-marker-alt absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500 text-xs"></i>
               </div>
               <div>
                 <h4 className="text-[10px] font-black text-emerald-950 dark:text-emerald-50 uppercase tracking-widest mb-1">Acquiring Satellites</h4>
                 <p className="text-[9px] text-slate-400 font-medium">Finding your precise coordinate for Qibla calculation...</p>
               </div>
            </div>
          ) : error ? (
            <div className="card-premium !p-8 flex flex-col items-center justify-center gap-4 text-center border-rose-500/20 bg-rose-50/10">
               <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-2xl flex items-center justify-center text-xl">
                 <i className="fas fa-location-slash"></i>
               </div>
               <div>
                 <h4 className="text-[10px] font-black text-rose-950 dark:text-rose-200 uppercase tracking-widest mb-1">Location Error</h4>
                 <p className="text-[9px] text-rose-800/60 dark:text-rose-400/60 font-medium mb-4 leading-relaxed">{error}</p>
                 <button 
                   onClick={requestLocation}
                   className="px-6 py-2.5 bg-rose-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                 >
                   Retry Detection
                 </button>
               </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 text-center relative overflow-hidden animate-pop">
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 mb-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Live GPS Active</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] leading-relaxed font-medium">
                  {isAligned ? 'Masha Allah! You are facing the Qibla.' : 'Hold your device flat and rotate until the Kaaba needle points up.'}
                </p>
                <p className="text-[8px] text-slate-300 dark:text-slate-600 font-black uppercase tracking-[0.2em] pt-2 border-t border-slate-50 dark:border-slate-700/50">
                   Kaaba Coordinates Locked
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QiblaFinder;
