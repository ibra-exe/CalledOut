interface Props {
  isHost: boolean
  onEndGame: () => void
  onLeave: () => void
  onCancel: () => void
}

export function ExitModal({ isHost, onEndGame, onLeave, onCancel }: Props) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4">
      <div className="bg-[#1A1A1A] rounded-3xl w-full max-w-sm p-6 flex flex-col gap-3">
        <p className="text-white font-black text-lg text-center mb-1">
          {isHost ? 'Leave the game?' : 'Leave the game?'}
        </p>
        <p className="text-gray-500 text-sm text-center -mt-1 mb-2">
          {isHost ? 'You\'re the host — ending the game kicks everyone out.' : 'You\'ll be removed from the session.'}
        </p>

        {isHost && (
          <button
            onClick={onEndGame}
            className="w-full py-4 rounded-2xl bg-[#FF4D4D]/15 text-[#FF4D4D] font-bold border border-[#FF4D4D]/30 hover:bg-[#FF4D4D]/25 active:scale-[0.98] transition-all"
          >
            End Game for Everyone
          </button>
        )}

        <button
          onClick={onLeave}
          className="w-full py-4 rounded-2xl bg-white/5 text-white font-bold border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all"
        >
          {isHost ? 'Leave Quietly (pass host)' : 'Leave Game'}
        </button>

        <button
          onClick={onCancel}
          className="w-full py-4 rounded-2xl text-gray-500 font-semibold hover:text-white transition-colors"
        >
          Stay in Game
        </button>
      </div>
    </div>
  )
}
