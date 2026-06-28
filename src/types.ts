export type RoomStatus = 'lobby' | 'category-select' | 'playing' | 'reveal' | 'stats'

export interface RoomSettings {
  timerSeconds: number
  allowRevoting: boolean
}

export interface Player {
  name: string
  icon: string
  color: string
  font: string
  isHost: boolean
  isKicked: boolean
  joinedAt: number
}

// A question in the static/admin bank (English + Arabic source of truth)
export interface Question {
  id: string
  en: string
  ar: string
  category: string
  arConfirmed?: boolean // admin has verified the Arabic translation
  userSuggested?: boolean // came from a player suggestion, approved by admin
  suggestedBy?: string // name of the person who suggested it
}

// The active question stored on the room during play (display shape)
export interface CurrentQuestion {
  id?: string
  text: string
  textAr?: string
  category: string
  userSuggested?: boolean
}

export interface QuestionHistoryEntry {
  id?: string
  text: string
  textAr?: string
  category: string
  userSuggested?: boolean
  votes: Record<string, number>
  selfVotes?: Record<string, number>
}

// A player-submitted question awaiting admin review
export interface Suggestion {
  id: string
  category: string
  en: string
  ar: string
  name: string
  createdAt: number
  status: 'pending' | 'declined'
}

export interface Room {
  status: RoomStatus
  hostId: string
  currentQuestionIndex: number
  currentQuestion: CurrentQuestion
  categories: string[]
  questionOrder: number[]
  createdAt: number
  settings: RoomSettings
  players: Record<string, Player>
  votes: Record<string, Record<string, string>>
  questionHistory: Record<string, QuestionHistoryEntry>
  playAgain?: Record<string, boolean>
}

export type FontOption = 'font-sans' | 'font-poppins' | 'font-lobster' | 'font-mono'

export interface PlayerTitle {
  playerId: string
  titleId: string
  params?: Record<string, number>
}
