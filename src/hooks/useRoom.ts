import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '../firebase'
import type { Room } from '../types'

export function useRoom(code: string) {
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!code) return
    const roomRef = ref(db, `rooms/${code}`)
    const unsub = onValue(roomRef, snap => {
      if (!snap.exists()) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setRoom(snap.val() as Room)
      setNotFound(false)
      setLoading(false)
    })
    return unsub
  }, [code])

  return { room, loading, notFound }
}
