export interface PlayerProfile {
  name: string
  icon: string
  color: string
  font: string
}

const KEY = 'calledout_profile'
const DEFAULT: PlayerProfile = { name: '', icon: '🙂', color: '#2196F3', font: 'font-sans' }

export function getSavedProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT }
  } catch {
    return { ...DEFAULT }
  }
}

export function saveProfileLocally(profile: PlayerProfile): void {
  localStorage.setItem(KEY, JSON.stringify(profile))
}
