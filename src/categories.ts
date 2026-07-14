import type { Question } from './types'

// Category metadata + the shuffle helper, kept separate from the heavy QUESTIONS
// array (questions.ts). Importing category labels or shuffling a game pool is
// needed all over the UI; isolating them here means none of that pulls the
// ~900-question bundle into a chunk. QUESTIONS is loaded via dynamic import in
// questionBank.ts only when actually seeding or falling back.
export const CATEGORIES = [
  { id: 'spicy', label: 'Unfiltered', emoji: '🔥' },
  { id: 'funny', label: 'Funny', emoji: '😂' },
  { id: 'deep', label: 'Deep', emoji: '🧠' },
  { id: 'chaotic', label: 'Chaotic', emoji: '💀' },
  { id: 'romantic', label: 'Romantic', emoji: '💘' },
  { id: 'achievements', label: 'Achievements', emoji: '🏆' },
  { id: 'awkward', label: 'Awkward', emoji: '😬' },
  { id: 'bold', label: 'Bold', emoji: '💪' },
  { id: 'foodie', label: 'Foodie', emoji: '🍕' },
  { id: 'dark', label: 'Dark Humor', emoji: '🖤' },
]

// Categories hidden from game setup when the "Family-friendly" setting is on
// (the default). Keeps the deployed/portfolio build clean; toggle off to include them.
export const MATURE_CATEGORY_IDS = ['spicy', 'dark']

export function shuffleQuestions(questions: Question[]): Question[] {
  const arr = [...questions]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
