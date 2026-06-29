import { useT } from '../i18n'

interface Props {
  isHost: boolean
  onEndGame: () => void
  onLeave: () => void
  onCancel: () => void
}

export function ExitModal({ isHost, onEndGame, onLeave, onCancel }: Props) {
  const tr = useT()
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4 animate-backdrop-in">
      <div className="bg-[#1A1A1A] rounded-3xl w-full max-w-sm p-6 flex flex-col gap-3 animate-sheet-in">
        <p className="text-white font-black text-lg text-center mb-1">
          {tr('leaveTheGame')}
        </p>
        <p className="text-gray-400 text-sm text-center -mt-1 mb-2">
          {isHost ? tr('hostEndWarning') : tr('removedFromSession')}
        </p>

        <button
          onClick={isHost ? onEndGame : onLeave}
          className="w-full py-4 rounded-2xl bg-[#FF4D4D]/15 text-[#FF4D4D] font-bold border border-[#FF4D4D]/30 hover:bg-[#FF4D4D]/25 active:scale-[0.98] transition-all"
        >
          {isHost ? tr('endForEveryone') : tr('leaveGame')}
        </button>

        <button
          onClick={onCancel}
          className="w-full py-4 rounded-2xl text-gray-400 font-semibold hover:text-white transition-colors"
        >
          {tr('stayInGame')}
        </button>
      </div>
    </div>
  )
}
