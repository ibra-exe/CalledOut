// Slow-drifting blurred color blobs for depth. Render as the first child of a
// `relative overflow-hidden` container; give sibling content `relative z-10`.
const BLOBS = [
  { c: '#FFE500', size: 320, top: '6%', left: '-14%', dur: 17, delay: 0 },
  { c: '#9C7BFF', size: 300, top: '52%', left: '68%', dur: 21, delay: 3 },
  { c: '#FF4D4D', size: 260, top: '80%', left: '-10%', dur: 19, delay: 6 },
]

export function AmbientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }} aria-hidden>
      {BLOBS.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-3xl animate-float"
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
            backgroundColor: b.c,
            opacity: 0.1,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
