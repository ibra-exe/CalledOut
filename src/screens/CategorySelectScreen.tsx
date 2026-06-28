import { useState } from 'react'
import { ref, update } from 'firebase/database'
import { db } from '../firebase'
import { CATEGORIES, shuffleQuestions } from '../questions'
import { fetchQuestionsForGame } from '../questionBank'
import { useT } from '../i18n'

interface Props {
  code: string
  onClose: () => void
}

type Mode = 'all' | 'random' | 'custom'

const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20, 30]
const TIMER_OPTIONS = [5, 10, 15, 20, 25]

export function CategorySelectScreen({ code, onClose }: Props) {
  const tr = useT()
  const [mode, setMode] = useState<Mode>('all')
  const [selected, setSelected] = useState<string[]>([])
  const [questionCount, setQuestionCount] = useState(15)
  const [timerSeconds, setTimerSeconds] = useState(15)
  const [allowRevoting, setAllowRevoting] = useState(false)
  const [loading, setLoading] = useState(false)

  const toggleCategory = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const startGame = async () => {
    setLoading(true)
    let categoryIds: string[] = []

    if (mode === 'all') {
      categoryIds = CATEGORIES.map(c => c.id)
    } else if (mode === 'random') {
      const shuffled = [...CATEGORIES].sort(() => Math.random() - 0.5)
      categoryIds = shuffled.slice(0, 4).map(c => c.id)
    } else {
      categoryIds = selected
    }

    const pool = await fetchQuestionsForGame(categoryIds)
    const questions = shuffleQuestions(pool)
    const limited = questions.slice(0, questionCount)

    const questionHistory: Record<string, { id: string; text: string; textAr: string; category: string; userSuggested: boolean; votes: Record<string, number> }> = {}
    limited.forEach((q, i) => {
      questionHistory[i] = { id: q.id, text: q.en, textAr: q.ar ?? q.en, category: q.category, userSuggested: !!q.userSuggested, votes: {} }
    })

    const first = limited[0]
    await update(ref(db, `rooms/${code}`), {
      status: 'playing',
      categories: categoryIds,
      currentQuestionIndex: 0,
      currentQuestion: { id: first.id, text: first.en, textAr: first.ar ?? first.en, category: first.category, userSuggested: !!first.userSuggested },
      questionOrder: limited.map((_, i) => i),
      questionHistory,
      settings: { timerSeconds, allowRevoting },
    })

    setLoading(false)
  }

  const canStart = mode !== 'custom' || selected.length >= 1

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col justify-end animate-backdrop-in">
      <div className="bg-[#0F0F0F] rounded-t-3xl w-full max-h-[90dvh] flex flex-col animate-sheet-in">
        <div className="flex-1 min-h-0 overflow-y-auto p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white">{tr('gameSetup')}</h2>
          <button onClick={onClose} className="text-gray-400 text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        {/* Question count */}
        <div>
          <p className="text-white font-bold text-sm mb-3">{tr('numQuestions')}</p>
          <div className="flex gap-2">
            {QUESTION_COUNT_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => setQuestionCount(n)}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                  questionCount === n
                    ? 'border-[#FFE500] bg-[#FFE500]/10 text-[#FFE500]'
                    : 'border-white/10 bg-[#1A1A1A] text-gray-400 hover:border-white/20'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Timer */}
        <div>
          <p className="text-white font-bold text-sm mb-3">{tr('timerPerQ')}</p>
          <div className="flex gap-2">
            {TIMER_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => setTimerSeconds(s)}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                  timerSeconds === s
                    ? 'border-[#FFE500] bg-[#FFE500]/10 text-[#FFE500]'
                    : 'border-white/10 bg-[#1A1A1A] text-gray-400 hover:border-white/20'
                }`}
              >
                {s}s
              </button>
            ))}
          </div>
        </div>

        {/* Allow revoting */}
        <div>
          <p className="text-white font-bold text-sm mb-1">{tr('allowRevoting')}</p>
          <p className="text-gray-500 text-xs mb-3">
            {allowRevoting ? tr('revotingOn') : tr('revotingOff')}
          </p>
          <div className="flex gap-2">
            {([{ value: false, label: tr('off') }, { value: true, label: tr('on') }] as const).map(({ value, label }) => (
              <button
                key={label}
                onClick={() => setAllowRevoting(value)}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                  allowRevoting === value
                    ? 'border-[#FFE500] bg-[#FFE500]/10 text-[#FFE500]'
                    : 'border-white/10 bg-[#1A1A1A] text-gray-400 hover:border-white/20'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-white/10" />

        {/* Category mode */}
        <div>
          <p className="text-white font-bold text-sm mb-3">{tr('categories')}</p>
          <div className="flex flex-col gap-3">
            {[
              { id: 'all' as Mode, emoji: '🎯', title: tr('allCategories'), desc: tr('allCategoriesDesc') },
              { id: 'random' as Mode, emoji: '🎲', title: tr('randomMix'), desc: tr('randomMixDesc') },
              { id: 'custom' as Mode, emoji: '✏️', title: tr('customMode'), desc: tr('customModeDesc') },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${mode === m.id ? 'border-[#FFE500] bg-[#FFE500]/5' : 'border-white/10 bg-[#1A1A1A]'}`}
              >
                <span className="text-3xl">{m.emoji}</span>
                <div>
                  <p className={`font-bold text-sm ${mode === m.id ? 'text-[#FFE500]' : 'text-white'}`}>{m.title}</p>
                  <p className="text-gray-500 text-xs">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {mode === 'custom' && (
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold flex items-center gap-2 transition-all ${selected.includes(cat.id) ? 'border-[#FFE500] bg-[#FFE500]/10 text-[#FFE500]' : 'border-white/10 bg-[#1A1A1A] text-gray-300'}`}
              >
                <span>{cat.emoji}</span> {tr(`cat_${cat.id}`)}
              </button>
            ))}
          </div>
        )}

        </div>

        {/* Pinned footer — always visible, never scrolls out of bounds */}
        <div
          className="shrink-0 border-t border-white/5 px-6 pt-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)' }}
        >
          {!canStart && mode === 'custom' && (
            <p className="text-center text-gray-500 text-xs mb-2">{tr('selectAtLeast1')}</p>
          )}
          <button
            onClick={startGame}
            disabled={!canStart || loading}
            className="btn-shine w-full py-5 rounded-2xl bg-[#FFE500] text-[#0F0F0F] font-black text-lg hover:bg-yellow-300 active:scale-[0.97] transition-all disabled:opacity-40"
          >
            {loading ? tr('starting') : tr('startGameTpl', { n: questionCount })}
          </button>
        </div>
      </div>
    </div>
  )
}
