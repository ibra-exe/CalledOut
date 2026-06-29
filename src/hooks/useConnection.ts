import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '../firebase'

// Tracks the Firebase Realtime DB connection via the special `.info/connected`
// path. Starts optimistic (true) so the reconnect banner never flashes on a
// normal cold load. Only import this from lazy screens — it pulls in Firebase,
// which must stay off the first-paint chunk.
export function useConnection(): boolean {
  const [connected, setConnected] = useState(true)
  useEffect(() => {
    const unsub = onValue(ref(db, '.info/connected'), snap => {
      setConnected(snap.val() === true)
    })
    return unsub
  }, [])
  return connected
}
