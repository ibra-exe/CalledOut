import { CATEGORIES } from '../questions'

interface Props {
  text: string
  category: string
  questionNumber: number
  totalQuestions: number
}

export function QuestionCard({ text, category, questionNumber, totalQuestions }: Props) {
  const cat = CATEGORIES.find(c => c.id === category)

  return (
    <div className="bg-[#1A1A1A] rounded-3xl p-6 mx-auto w-full">
      <div className="flex items-center justify-between mb-4">
        <span className="px-3 py-1 rounded-full bg-[#FFE500]/10 text-[#FFE500] text-xs font-bold uppercase tracking-wide">
          {cat?.emoji} {cat?.label ?? category}
        </span>
        <span className="text-gray-500 text-xs font-medium">
          {questionNumber} / {totalQuestions}
        </span>
      </div>
      <p className="text-white text-xl font-bold leading-snug text-center py-4">
        {text}
      </p>
    </div>
  )
}
