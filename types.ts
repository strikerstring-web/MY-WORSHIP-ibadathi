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

export interface AlarmSettings {
  ringtoneId: string; // ID of predefined or 'custom'
  customRingtoneData: string | null; // Base64 or Blob URL
  vibrationEnabled: boolean;
  autoAlarmEnabled: boolean;
}

export interface UserData {
  profile: UserProfile;
  prayerLogs: Record<string, PrayerLog>;
  sunnahLogs: Record<string, string[]>;
  fastingLogs: Record<string, FastingLog>;
  quranProgress: QuranProgress;
  dhikrCount: number;
  activeChallenges: DhikrChallenge[];
  personalDhikrs: PersonalDhikr[];
  activeDhikrId: string | null;
  dhikrHistory: DhikrHistoryEntry[];
  isHaydNifas: boolean;
  haydStartDate: string | null;
  healthPeriods: HealthPeriod[];
  settings: {
    notificationsEnabled: boolean;
    locationEnabled: boolean;
    theme: 'light' | 'dark';
    ecoMode: boolean;
    qadaReminders: QadaReminder[];
    prayerReminders: PrayerReminder[];
    calculationMethod: number;
    alarm: AlarmSettings;
    prayerOffsets: Record<string, number>; // Manual adjustment in minutes
  };
}

export interface AppState {
  currentUser: string | null;
  users: Record<string, UserData>;
  todayTimings: PrayerTimings | null;
}