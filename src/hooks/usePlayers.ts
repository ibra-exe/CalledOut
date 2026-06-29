import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '../firebase'
import type { Player } from '../types'

export function usePlayers(code: string) {
  const [players, setPlayers] = useState<Record<string, Player>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!code) return
    const playersRef = ref(db, `rooms/${code}/players`)
    const unsub = onValue(playersRef, snap => {
      setPlayers(snap.exists() ? (snap.val() as Record<string, Player>) : {})
      setLoading(false)
    }, err => {
      console.error('usePlayers listener cancelled:', err)
      setLoading(false)
    })
    return unsub
  }, [code])

  return { players, loading }
}
