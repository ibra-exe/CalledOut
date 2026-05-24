import { useEffect, useRef, useState } from 'react'

interface Props {
  durationSeconds: number
  onExpire: () => void
  onTick?: (remaining: number) => void
  running: boolean
}

export function TimerBar({ durationSeconds, onExpire, onTick, running }: Props) {
  const [remaining, setRemaining] = useState(durationSeconds)

  // Keep callback refs current so the interval never needs to restart when they change
  const onExpireRef = useRef(onExpire)
  const onTickRef = useRef(onTick)
  useEffect(() => { onExpireRef.current = onExpire }, [onExpire])
  useEffect(() => { onTickRef.current = onTick }, [onTick])

  useEffect(() => {
    setRemaining(durationSeconds)
  }, [durationSeconds])

  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          onExpireRef.current()
          return 0
        }
        const next = prev - 1
        onTickRef.current?.(next)
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [running]) // only restart the interval when running changes — callbacks via refs

  const pct = (remaining / durationSeconds) * 100
  const color = pct > 50 ? '#FFE500' : pct > 25 ? '#FF9F1C' : '#FF4D4D'

  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-linear"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}
