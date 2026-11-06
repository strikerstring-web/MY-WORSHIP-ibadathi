import React, { useState } from 'react';
import { LocationInfo } from '../types';
import { POPULAR_CITIES, PRAYER_METHODS } from '../constants';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation?: LocationInfo;
  currentMethod: number;
  onSelectCoords: (lat: number, lng: number, cityName?: string) => Promise<void>;
  onSelectCity: (cityName: string, method?: number) => Promise<void>;
  onSelectMethod: (method: number) => void;
}

const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  currentMethod,
  onSelectCoords,
  onSelectCity,
  onSelectMethod
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  const [isLoadingCity, setIsLoadingCity] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleUseGPS = () => {
    setIsLoadingGPS(true);
    setStatusMessage(null);

    if (!('geolocation' in navigator)) {
      setIsLoadingGPS(false);
      setStatusMessage({ type: 'error', text: 'Geolocation is not supported by your browser.' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await onSelectCoords(pos.coords.latitude, pos.coords.longitude, 'My GPS Location');
          setIsLoadingGPS(false);
          setStatusMessage({ type: 'success', text: 'Location detected successfully! Azan timings updated.' });
          setTimeout(() => {
            onClose();
          }, 1200);
        } catch (e) {
          setIsLoadingGPS(false);
          setStatusMessage({ type: 'error', text: 'Failed to fetch timings for your GPS location.' });
        }
      },
      (err) => {
        setIsLoadingGPS(false);
        console.warn('Geolocation error:', err);
        setStatusMessage({ 
          type: 'error', 
          text: 'GPS permission denied or timed out. Please search for your city below.' 
        });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (!query) return;

    setIsLoadingCity(true);
    setStatusMessage(null);
    try {
      await onSelectCity(query);
      setIsLoadingCity(false);
      setStatusMessage({ type: 'success', text: `Azan timings loaded for "${query}"!` });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (e) {
      setIsLoadingCity(false);
      setStatusMessage({ type: 'error', text: `Could not find timings for "${query}". Please check spelling.` });
    }
  };

  const handlePopularCityClick = async (city: typeof POPULAR_CITIES[0]) => {
    setIsLoadingCity(true);
    setStatusMessage(null);
    try {
      if (city.method) {
        onSelectMethod(city.method);
      }
      await onSelectCity(`${city.name}, ${city.country}`, city.method);
      setIsLoadingCity(false);
      setStatusMessage({ type: 'success', text: `Azan timings updated for ${city.name}!` });
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (e) {
      setIsLoadingCity(false);
      setStatusMessage({ type: 'error', text: `Failed to load timings for ${city.name}.` });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-pop max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg">
              <i className="fas fa-location-dot"></i>
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Azan Timings Location
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Automatic or City-based
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 text-slate-400 hover:text-slate-600 flex items-center justify-center"
          >
            <i className="fas fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Current Active Location Banner */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Current Location
              </p>
              <h4 className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[220px]">
                {currentLocation?.city || 'Detecting...'}
              </h4>
              {currentLocation?.timezone && (
                <p className="text-[8px] font-bold text-slate-400">
                  Timezone: {currentLocation.timezone}
                </p>
              )}
            </div>
          </div>
          <span className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider">
            {currentLocation?.source === 'gps' ? 'GPS' : 'CITY'}
          </span>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-pop ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300' 
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}>
            <i className={`fas ${statusMessage.type === 'success' ? 'fa-check-circle' : 'fa-triangle-exclamation'}`}></i>
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* 1. AUTO DETECT GPS BUTTON */}
        <div>
          <button
            onClick={handleUseGPS}
            disabled={isLoadingGPS}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2.5 disabled:opacity-70 cursor-pointer"
          >
            {isLoadingGPS ? (
              <>
                <i className="fas fa-spinner fa-spin text-sm"></i>
                <span>Locating with GPS...</span>
              </>
            ) : (
              <>
                <i className="fas fa-crosshairs text-sm"></i>
                <span>Use My Exact GPS Location</span>
              </>
            )}
          </button>
        </div>

        {/* 2. SEARCH ANY CITY IN THE WORLD */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
            Search City or Country
          </label>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="e.g. Kozhikode, Dubai, London, Cairo..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full p-3 pl-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
              <i className="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            </div>
            <button
              type="submit"
              disabled={isLoadingCity || !searchInput.trim()}
              className="px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-xs uppercase tracking-wider active:scale-95 transition-all disabled:opacity-50"
            >
              {isLoadingCity ? <i className="fas fa-spinner fa-spin"></i> : 'Set'}
            </button>
          </form>
        </div>

        {/* 3. POPULAR ISLAMIC CITIES */}
        <div className="space-y-2">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
            Popular Cities (1-Tap Select)
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto no-scrollbar">
            {POPULAR_CITIES.map((c) => {
              const isSelected = currentLocation?.city?.toLowerCase().includes(c.name.toLowerCase());
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => handlePopularCityClick(c)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 shadow-sm'
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                    isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    <i className={`fas ${c.icon}`}></i>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black truncate">{c.name}</p>
                    <p className="text-[8px] font-bold text-slate-400 truncate">{c.country}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. CALCULATION METHOD SELECTOR */}
        <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-1.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
            Calculation Method
          </label>
          <div className="relative">
            <select
              value={currentMethod}
              onChange={(e) => onSelectMethod(parseInt(e.target.value, 10))}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 appearance-none outline-none focus:border-emerald-500"
            >
              {PRAYER_METHODS.map(m => (
                <option key={m.id} value={m.id} className="bg-white dark:bg-slate-900">
                  {m.name}
                </option>
              ))}
            </select>
            <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none text-xs"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
