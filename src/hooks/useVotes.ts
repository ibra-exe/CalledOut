import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '../firebase'

export function useVotes(code: string, questionIndex: number) {
  const [votes, setVotes] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!code) return
    const votesRef = ref(db, `rooms/${code}/votes/${questionIndex}`)
    const unsub = onValue(votesRef, snap => {
      setVotes(snap.exists() ? (snap.val() as Record<string, string>) : {})
    })
    return unsub
  }, [code, questionIndex])

  return votes
}
