import { useState } from 'react'
import { ref, update } from 'firebase/database'
import { db } from '../firebase'
import { CATEGORIES, shuffleQuestions, getQuestionsByCategories } from '../questions'

interface Props {
  code: string
  onClose: () => void
}

type Mode = 'all' | 'random' | 'custom'

const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20, 30]
const TIMER_OPTIONS = [5, 10, 15, 20, 25]

export function CategorySelectScreen({ code, onClose }: Props) {
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

    const questions = shuffleQuestions(getQuestionsByCategories(categoryIds))
    const limited = questions.slice(0, questionCount)

    const questionHistory: Record<string, { text: string; category: string; votes: Record<string, number> }> = {}
    limited.forEach((q, i) => {
      questionHistory[i] = { text: q.text, category: q.category, votes: {} }
    })

    await update(ref(db, `rooms/${code}`), {
      status: 'playing',
      categories: categoryIds,
      currentQuestionIndex: 0,
      currentQuestion: limited[0],
      questionOrder: limited.map((_, i) => i),
      questionHistory,
      settings: { timerSeconds, allowRevoting },
    })

    setLoading(false)
  }

  const canStart = mode !== 'custom' || selected.length >= 1

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-end justify-end">
      <div className="bg-[#0F0F0F] rounded-t-3xl w-full max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white">Game Setup</h2>
          <button onClick={onClose} className="text-gray-400 text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        {/* Question count */}
        <div>
          <p className="text-white font-bold text-sm mb-3">Number of Questions</p>
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
          <p className="text-white font-bold text-sm mb-3">Timer per Question</p>
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
          <p className="text-white font-bold text-sm mb-1">Allow Revoting</p>
          <p className="text-gray-500 text-xs mb-3">
            {allowRevoting
              ? 'Players can change their vote anytime — round ends on timer only.'
              : 'First vote locks in — round ends as soon as everyone has voted.'}
          </p>
          <div className="flex gap-2">
            {([{ value: false, label: 'Off' }, { value: true, label: 'On' }] as const).map(({ value, label }) => (
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
          <p className="text-white font-bold text-sm mb-3">Categories</p>
          <div className="flex flex-col gap-3">
            {[
              { id: 'all' as Mode, emoji: '🎯', title: 'All Categories', desc: 'Every type of question' },
              { id: 'random' as Mode, emoji: '🎲', title: 'Random Mix', desc: '4 random categories selected for you' },
              { id: 'custom' as Mode, emoji: '✏️', title: 'Custom', desc: 'Hand-pick which categories to include' },
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
                <span>{cat.emoji}</span> {cat.label}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={startGame}
          disabled={!canStart || loading}
          className="w-full py-5 rounded-2xl bg-[#FFE500] text-[#0F0F0F] font-black text-lg hover:bg-yellow-300 active:scale-[0.97] transition-all disabled:opacity-40"
        >
          {loading ? 'Starting...' : `Start Game · ${questionCount} questions 🎤`}
        </button>

        {!canStart && mode === 'custom' && (
          <p className="text-center text-gray-500 text-xs -mt-3">Select at least 1 category</p>
        )}

        <div className="h-safe-area-bottom" />
      </div>
    </div>
  )
}
