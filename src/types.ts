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
}

// The active question stored on the room during play (display shape)
export interface CurrentQuestion {
  id?: string
  text: string
  textAr?: string
  category: string
}

export interface QuestionHistoryEntry {
  id?: string
  text: string
  textAr?: string
  category: string
  votes: Record<string, number>
  selfVotes?: Record<string, number>
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
