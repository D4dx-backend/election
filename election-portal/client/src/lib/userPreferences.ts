const PREFS_KEY = "voteplus_preferences";

export interface UserPreferences {
  emailAlerts: boolean;
  desktopNotifications: boolean;
  compactTables: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  emailAlerts: true,
  desktopNotifications: false,
  compactTables: false,
};

export function loadUserPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function saveUserPreferences(partial: Partial<UserPreferences>) {
  const next = { ...loadUserPreferences(), ...partial };
  localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  return next;
}

export function clearNotificationReadState() {
  localStorage.removeItem("voteplus_read_notification_ids");
}
