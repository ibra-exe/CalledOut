import { useEffect, useRef, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '../firebase'
import type { Room } from '../types'

// A lightweight signature of the room fields the UI actually renders. Votes and
// players are intentionally excluded — they have their own scoped hooks
// (useVotes / usePlayers), so when only those churn (every vote cast, every
// join/leave) the signature is unchanged and we skip setRoom. That stops the
// whole game/reveal tree from re-rendering on each vote. questionHistory and
// playAgain are covered transitively: they only ever change alongside a
// status / currentQuestionIndex / playAgain change, all of which are in the sig.
function roomSig(r: Room): string {
  return [
    r.status,
    r.currentQuestionIndex,
    r.currentQuestion?.id ?? r.currentQuestion?.text ?? '',
    r.settings?.timerSeconds ?? '',
    r.settings?.allowRevoting ?? '',
    Object.keys(r.playAgain ?? {}).sort().join(','),
  ].join('|')
}

export function useRoom(code: string) {
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const lastSig = useRef<string | null>(null)

  useEffect(() => {
    if (!code) return
    lastSig.current = null
    const roomRef = ref(db, `rooms/${code}`)
    const unsub = onValue(roomRef, snap => {
      if (!snap.exists()) {
        setNotFound(true)
        setLoading(false)
        return
      }
      const val = snap.val() as Room
      const sig = roomSig(val)
      if (sig !== lastSig.current) {
        lastSig.current = sig
        setRoom(val) // only re-render when a UI-relevant field actually changed
      }
      setNotFound(false)
      setLoading(false)
    }, err => {
      console.error('useRoom listener cancelled:', err)
      setLoading(false) // don't strand the screen on the loader if the listener is denied
    })
    return unsub
  }, [code])

  return { room, loading, notFound }
}
