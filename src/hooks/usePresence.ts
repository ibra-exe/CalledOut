import { useEffect } from 'react'
import { ref, onDisconnect } from 'firebase/database'
import { db } from '../firebase'

/**
 * Auto-removes a player from the room if their connection drops (tab close,
 * network loss, sleep) so they don't linger as a "ghost" that keeps the round
 * waiting on a vote that will never come.
 *
 * Armed for NON-HOST players only: the host leaving is handled explicitly
 * (it ends the room for everyone), and we never want a host's own refresh or
 * brief drop to delete their slot and orphan the room.
 *
 * `enabled` should be `!!me && !me.isHost` — i.e. only once we know this player
 * exists in the room and is not the host. Firebase preserves onDisconnect
 * operation order on a connection, so the cancel()→remove() handoff across the
 * lobby→game→reveal screen transitions keeps presence continuously armed.
 */
export function usePresence(code: string, playerId: string, enabled: boolean) {
  useEffect(() => {
    if (!code || !playerId || !enabled) return
    const playerRef = ref(db, `rooms/${code}/players/${playerId}`)
    const handle = onDisconnect(playerRef)
    handle.remove()
    return () => {
      handle.cancel()
    }
  }, [code, playerId, enabled])
}
