export interface AppSettings {
  soundEnabled: boolean
}

const KEY = 'calledout_settings'
const DEFAULT: AppSettings = { soundEnabled: true }

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT }
  } catch {
    return { ...DEFAULT }
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(KEY, JSON.stringify(settings))
}
