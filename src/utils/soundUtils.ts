import { getSettings } from './settingsUtils'

let _ctx: AudioContext | null = null

function ctx(): AudioContext {
  if (!_ctx) _ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

function enabled(): boolean {
  return getSettings().soundEnabled
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  vol = 0.25,
  startDelay = 0,
) {
  if (!enabled()) return
  const c = ctx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.connect(gain)
  gain.connect(c.destination)
  osc.type = type
  osc.frequency.setValueAtTime(freq, c.currentTime + startDelay)
  gain.gain.setValueAtTime(vol, c.currentTime + startDelay)
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + startDelay + duration)
  osc.start(c.currentTime + startDelay)
  osc.stop(c.currentTime + startDelay + duration + 0.01)
}

function sweep(
  startFreq: number,
  endFreq: number,
  duration: number,
  type: OscillatorType = 'sine',
  vol = 0.2,
  startDelay = 0,
) {
  if (!enabled()) return
  const c = ctx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.connect(gain)
  gain.connect(c.destination)
  osc.type = type
  osc.frequency.setValueAtTime(startFreq, c.currentTime + startDelay)
  osc.frequency.exponentialRampToValueAtTime(endFreq, c.currentTime + startDelay + duration)
  gain.gain.setValueAtTime(vol, c.currentTime + startDelay)
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + startDelay + duration)
  osc.start(c.currentTime + startDelay)
  osc.stop(c.currentTime + startDelay + duration + 0.01)
}

// ─── Individual sounds ────────────────────────────────────────────────────────

/** Subtle tap feedback for major buttons */
export function playButtonTap() {
  tone(700, 0.05, 'sine', 0.08)
}

/** Satisfying pop when casting a vote */
export function playVoteCast() {
  tone(520, 0.07, 'sine', 0.18)
  tone(780, 0.05, 'sine', 0.12, 0.05)
}

/** Dramatic whoosh when a new question appears */
export function playQuestionReveal() {
  sweep(180, 720, 0.18, 'sine', 0.22)
  tone(720, 0.25, 'sine', 0.18, 0.18)
}

/** Energetic fanfare at the very start of the game */
export function playGameStarting() {
  const notes = [261, 329, 392, 523] // C4 E4 G4 C5
  notes.forEach((freq, i) => tone(freq, 0.18, 'sine', 0.22, i * 0.11))
}

/** Quiet metronome tick for the last 5 seconds */
export function playTimerTick() {
  tone(1100, 0.04, 'square', 0.07)
}

/** Buzzer when time runs out */
export function playTimerExpire() {
  tone(280, 0.14, 'square', 0.28)
  tone(180, 0.22, 'square', 0.22, 0.14)
}

/** Chime when every player has voted */
export function playAllVotesIn() {
  tone(523, 0.1,  'sine', 0.2)        // C5
  tone(659, 0.1,  'sine', 0.2, 0.1)   // E5
  tone(784, 0.22, 'sine', 0.22, 0.2)  // G5
}

/** Notification ping when a player joins the lobby */
export function playPlayerJoin() {
  tone(659, 0.1,  'sine', 0.18)       // E5
  tone(784, 0.18, 'sine', 0.18, 0.1)  // G5
}

/** Confirmation when saving a profile */
export function playProfileSaved() {
  tone(523, 0.08, 'sine', 0.15)       // C5
  tone(784, 0.16, 'sine', 0.15, 0.08) // G5
}

/** Dramatic reveal when results animate in */
export function playResultsReveal() {
  sweep(120, 640, 0.28, 'sine', 0.24)
  sweep(160, 900, 0.22, 'sine', 0.14, 0.06)
}

/** Triumphant fanfare for the round winner */
export function playWinnerFanfare() {
  const notes = [523, 659, 784, 1047] // C5 E5 G5 C6
  notes.forEach((freq, i) => tone(freq, 0.22, 'sine', 0.28, i * 0.13))
  // Sparkle at the top
  tone(1568, 0.18, 'sine', 0.14, 0.52) // G6
}

/** Comic sound for a tied round */
export function playTie() {
  tone(523, 0.14, 'sine', 0.2)
  tone(523, 0.14, 'sine', 0.2, 0.2)
}

/** Resolution jingle at the end of the game */
export function playGameOver() {
  const notes = [784, 659, 523, 392] // G5 E5 C5 G4 — descending
  notes.forEach((freq, i) => tone(freq, 0.22, 'sine', 0.24, i * 0.16))
}

/** Small pop as each player's title card appears */
export function playTitleAssigned() {
  tone(880,  0.06, 'sine', 0.14)       // A5
  tone(1047, 0.12, 'sine', 0.1,  0.06) // C6
}

/** Error / room not found */
export function playError() {
  tone(380, 0.1,  'square', 0.2)
  tone(240, 0.18, 'square', 0.2, 0.1)
}
