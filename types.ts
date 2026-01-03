export type Language = 'en' | 'ml' | 'ta' | 'ar';

export enum PrayerStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  MISSED = 'missed',
  EXCUSED = 'excused'
}

export interface UserProfile {
  username: string;
  name: string;
  age: number;
  sex: 'male' | 'female';
  place: string;
  preferredLanguage: Language;
  password?: string; // Stored in mock backend
}

export interface PrayerLog {
  fajr: PrayerStatus;
  dhuhr: PrayerStatus;
  asr: PrayerStatus;
  maghrib: PrayerStatus;
  isha: PrayerStatus;
}

export interface FastingLog {
  status: 'none' | 'completed' | 'missed' | 'excused';
  type: 'ramadan' | 'sunnah';
}

export interface QuranProgress {
  surah: string;
  ayah: string;
  // Added juz property to track Quran progress by Juz
  juz: string;
  lastUpdated: string;
}

export interface DhikrChallenge {
  id: string;
  title: string;
  arabic: string;
  target: number;
  current: number;
  lastReset?: string;
}

export interface PersonalDhikr {
  id: string;
  name: string;
  totalCount: number;
  dailyCount: number;
  sessionCount: number;
  lastUpdated: string;
}

export interface DhikrHistoryEntry {
  id: string;
  title: string;
  target: number;
  current: number;
  date: string;
}

export interface PrayerTimings {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Sunrise: string;
}

export interface QadaReminder {
  id: string;
  time: string;
  enabled: boolean;
}

export interface PrayerReminder {
  prayer: string;
  time: string;
  enabled: boolean;
}

export interface HealthPeriod {
  id: string;
  start: string; // ISO Date string
  end: string | null; // null if active
}

// This represents the data for a SINGLE user
export interface UserData {
  profile: UserProfile;
  prayerLogs: Record<string, PrayerLog>;
  sunnahLogs: Record<string, string[]>;
  fastingLogs: Record<string, FastingLog>;
  quranProgress: QuranProgress;
  dhikrCount: number;
  activeChallenges: DhikrChallenge[];
  personalDhikrs: PersonalDhikr[];
  activeDhikrId: string | null; // Tracked active challenge for the counter
  dhikrHistory: DhikrHistoryEntry[];
  isHaydNifas: boolean;
  haydStartDate: string | null;
  healthPeriods: HealthPeriod[];
  settings: {
    notificationsEnabled: boolean;
    locationEnabled: boolean;
    theme: 'light' | 'dark';
    ecoMode: boolean; // Optimize for low-end devices
    qadaReminders: QadaReminder[];
    prayerReminders: PrayerReminder[];
  };
}

export interface AppState {
  currentUser: string | null; // username
  users: Record<string, UserData>; // Mock database
  todayTimings: PrayerTimings | null;
}
