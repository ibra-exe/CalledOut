import { CATEGORIES } from '../questions'
import { useLang, useT } from '../i18n'

interface Props {
  text: string
  textAr?: string
  category: string
  questionNumber: number
  totalQuestions: number
  userSuggested?: boolean
}

export function QuestionCard({ text, textAr, category, questionNumber, totalQuestions, userSuggested }: Props) {
  const lang = useLang()
  const tr = useT()
  const cat = CATEGORIES.find(c => c.id === category)
  const label = tr(`cat_${category}`)
  const shown = lang === 'ar' && textAr ? textAr : text

  return (
    <div className="bg-[#1A1A1A] rounded-3xl p-6 mx-auto w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-full bg-[#FFE500]/10 text-[#FFE500] text-xs font-bold uppercase tracking-wide">
            {cat?.emoji} {label}
          </span>
          {userSuggested && (
            <span className="px-3 py-1 rounded-full bg-[#9C7BFF]/15 text-[#B79CFF] text-xs font-bold uppercase tracking-wide">
              ✨ {tr('userSuggestedTag')}
            </span>
          )}
        </div>
        <span className="text-gray-500 text-xs font-medium">
          {questionNumber} / {totalQuestions}
        </span>
      </div>
      <p className="text-white text-xl font-bold leading-snug text-center py-4">
        {shown}
      </p>
    </div>
  )
}
