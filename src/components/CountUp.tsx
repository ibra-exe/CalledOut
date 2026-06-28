import { useEffect, useRef, useState } from 'react'

interface Props {
  end: number
  active?: boolean // start counting when this becomes true
  duration?: number
}

// Animated number that eases up from 0 to `end` when `active`.
export function CountUp({ end, active = true, duration = 700 }: Props) {
  const [val, setVal] = useState(active ? 0 : end)
  const raf = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!active) { setVal(end); return }
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setVal(Math.round(end * eased))
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [end, active, duration])

  return <>{val}</>
}
