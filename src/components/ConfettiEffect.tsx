import { useEffect } from 'react'
import confetti from 'canvas-confetti'

interface Props {
  trigger: boolean
}

export function ConfettiEffect({ trigger }: Props) {
  useEffect(() => {
    if (!trigger) return

    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        origin: { y: 0.7 },
        ...opts,
        particleCount: Math.floor(200 * particleRatio),
      })
    }

    fire(0.25, { spread: 26, startVelocity: 55, colors: ['#FFE500', '#FF4D4D'] })
    fire(0.2, { spread: 60, colors: ['#FFE500', '#ffffff'] })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#FF4D4D', '#FF9F1C'] })
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
    fire(0.1, { spread: 120, startVelocity: 45 })
  }, [trigger])

  return null
}
