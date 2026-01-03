
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
        (position) => { calculateQibla(position.coords.latitude, position.coords.longitude); setLocationLoaded(true); },
        (err) => { setError("Please enable location services."); console.error(err); }
      );
    } else { setError("Geolocation not supported."); }
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
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission().then((state: string) => {
        if (state === 'granted') window.addEventListener('deviceorientation', handleOrientation);
      }).catch(console.error);
    } else { window.addEventListener('deviceorientation', handleOrientation); }
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  const relativeQibla = qiblaAngle !== null ? (qiblaAngle - compassHeading + 360) % 360 : 0;
  const isAligned = Math.abs(relativeQibla) < 5 || Math.abs(relativeQibla - 360) < 5;

  return (
    <div className="flex flex-col h-full bg-[#fdfbf7] dark:bg-slate-900 animate-fade-up overflow-hidden">
      <header className="p-4 pt-10 pb-5 bg-emerald-900 text-white flex items-center gap-3 shadow-lg rounded-b-[24px] z-20 shrink-0">
        <button onClick={() => setCurrentView('dashboard')} className="w-9 h-9 flex items-center justify-center bg-white/10 rounded-xl border border-white/10 active:scale-90"><i className="fas fa-chevron-left text-xs"></i></button>
        <div>
          <h1 className="text-lg font-black tracking-tight">{t('qibla')}</h1>
          <p className="text-[8px] text-emerald-300 font-black uppercase tracking-widest mt-0.5">Direction Finder</p>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
        <div className="text-center space-y-0.5">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Target Location</p>
          <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-50 leading-tight">Holy Masjid al-Haram</h2>
          <p className="text-[9px] text-slate-400 italic">Makkah, KSA</p>
        </div>

        {error ? (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 p-4 rounded-2xl text-center max-w-xs">
            <i className="fas fa-location-slash text-rose-500 mb-2"></i>
            <p className="text-rose-900 dark:text-rose-200 text-[10px] font-bold">{error}</p>
          </div>
        ) : (
          <div className="relative w-40 h-40 flex items-center justify-center">
            <div className="absolute inset-0 border-[6px] border-emerald-50 dark:border-slate-800 rounded-full transition-transform duration-200" style={{ transform: `rotate(${-compassHeading}deg)` }}>
              <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[7px] font-black text-emerald-800 dark:text-emerald-600">N</span>
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[7px] font-black text-emerald-800 dark:text-emerald-600">S</span>
            </div>

            <div className="absolute inset-0 flex items-center justify-center transition-all duration-300" style={{ transform: `rotate(${relativeQibla}deg)` }}>
              <div className="flex flex-col items-center relative">
                <i className={`fas fa-kaaba text-lg mb-[-2px] ${isAligned ? 'text-emerald-500 animate-bounce' : 'text-slate-300 dark:text-slate-700'}`}></i>
                <div className={`w-0.5 h-16 rounded-full ${isAligned ? 'bg-emerald-500 shadow-lg' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                {isAligned && <span className="absolute -top-6 whitespace-nowrap px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[7px] font-black uppercase shadow-sm">Aligned</span>}
              </div>
            </div>

            <div className="w-8 h-8 bg-white dark:bg-slate-700 rounded-full shadow-lg border-2 border-emerald-50 dark:border-slate-800 flex items-center justify-center z-10">
               <i className="fas fa-star-and-crescent text-emerald-600"></i>
            </div>
          </div>
        )}

        <div className="w-full max-w-[280px] bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-700 text-center">
           {!locationLoaded && !error && <div className="text-[10px] text-emerald-600 font-bold"><i className="fas fa-spinner fa-spin mr-1.5"></i>Locating...</div>}
           {locationLoaded && <p className="text-slate-500 dark:text-slate-400 text-[10px] leading-tight font-medium">Hold your device flat and rotate until the icon points up.</p>}
        </div>
        <p className="text-[7px] text-slate-300 dark:text-slate-700 font-bold uppercase tracking-widest">Precision depends on device sensors</p>
      </div>
    </div>
  );
};

export default QiblaFinder;
