import { useEffect, useState } from 'react'
import { useConnection } from '../hooks/useConnection'
import { useT } from '../i18n'

// Shows a "Reconnecting…" banner when the realtime connection drops for more
// than a moment (debounced 2s to avoid flashing on brief blips). Without this a
// dropped connection silently freezes the screen with no cue.
export function ConnectionBanner() {
  const connected = useConnection()
  const tr = useT()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (connected) {
      setShow(false)
      return
    }
    const t = setTimeout(() => setShow(true), 2000)
    return () => clearTimeout(t)
  }, [connected])

  if (!show) return null

  return (
    <div
      className="fixed top-0 inset-x-0 z-[60] flex items-center justify-center gap-2 py-2 px-4 bg-[#FF4D4D] text-white text-xs font-bold safe-top animate-backdrop-in"
      role="status"
      aria-live="polite"
    >
      <span className="inline-block w-2 h-2 rounded-full bg-white/90 animate-pulse" />
      {tr('reconnecting')}
    </div>
  )
}
