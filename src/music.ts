import { getSettings } from './utils/settingsUtils'

// Background music manager. One looping <audio> element, swapped between the
// home/ambient track and the in-game track. Respects the music setting and the
// browser autoplay policy (starts on the first user gesture if blocked).

const SRC = {
  home: '/audio/main-screen.mp3',
  game: '/audio/in-game.mp3',
} as const
const VOL = {
  home: 0.45,
  game: 0.25, // quieter under conversation during a round
} as const

type Track = keyof typeof SRC

let audio: HTMLAudioElement | null = null
let current: Track | null = null
let enabled = getSettings().musicEnabled
let gestureHooked = false

function el(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio()
    audio.loop = true
    audio.preload = 'auto'
  }
  return audio
}

function attempt(): void {
  if (!enabled || !current) return
  const a = el()
  const want = SRC[current]
  if (!a.src || !a.src.endsWith(want)) a.src = want
  a.volume = VOL[current]
  const p = a.play()
  if (p && typeof p.catch === 'function') p.catch(hookGesture)
}

// Browsers block audio until a user gesture — start on the next tap.
function hookGesture(): void {
  if (gestureHooked) return
  gestureHooked = true
  const handler = () => {
    gestureHooked = false
    window.removeEventListener('pointerdown', handler)
    attempt()
  }
  window.addEventListener('pointerdown', handler, { once: true })
}

export function playTrack(track: Track): void {
  if (current === track && audio && !audio.paused) return // already playing it
  current = track
  attempt()
}

export function stopMusic(): void {
  current = null
  audio?.pause()
}

export function setMusicEnabled(on: boolean): void {
  enabled = on
  if (!on) audio?.pause()
  else attempt()
}
