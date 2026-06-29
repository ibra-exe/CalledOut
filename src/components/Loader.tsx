interface Props {
  label?: string
}

// Branded full-screen loader: a mic + bouncing yellow dots.
export function Loader({ label }: Props) {
  return (
    <div className="min-h-dvh bg-[#0F0F0F] flex flex-col items-center justify-center gap-5">
      <div className="text-4xl animate-pop-in">🎤</div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-[#FFE500] animate-loader-dot"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      {label && <p className="text-gray-400 text-sm font-semibold">{label}</p>}
    </div>
  )
}
