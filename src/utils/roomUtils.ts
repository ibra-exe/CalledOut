import { v4 as uuidv4 } from 'uuid'

const PLAYER_ID_KEY = 'calledout_playerId'

export function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function getOrCreatePlayerId(): string {
  let id = localStorage.getItem(PLAYER_ID_KEY)
  if (!id) {
    id = uuidv4()
    localStorage.setItem(PLAYER_ID_KEY, id)
  }
  return id
}

export function getPlayerId(): string | null {
  return localStorage.getItem(PLAYER_ID_KEY)
}

export const PLAYER_COLORS = [
  '#FF3B3B', '#FF6B35', '#FF9F1C', '#FFE500', '#D4FF00', '#4CAF50',
  '#00E676', '#00BFA5', '#00BCD4', '#00B0FF', '#2196F3', '#1565C0',
  '#7C4DFF', '#9C27B0', '#E040FB', '#F72585', '#E91E63', '#FF4081',
  '#FF6B6B', '#FF8A65', '#FFAB40', '#FFD600', '#CCFF90', '#69F0AE',
  '#84FFFF', '#B388FF', '#80ED99', '#48CAE4', '#FFFFFF', '#9E9E9E',
]

export const PLAYER_EMOJIS = [
  '😎', '🤩', '🥳', '😈', '🦁', '🐯',
  '🐼', '🦊', '🐸', '🐙', '🦋', '🌵',
  '🍕', '🎸', '🚀', '🔥', '💎', '⚡',
  '🎭', '🎯', '🏆', '🌈', '👑', '🎪',
  '🦄', '🐲', '🌙', '☀️', '🌊', '🎲',
  '👽', '🤖', '🦸', '🐺', '🍄', '🎃',
]

export const FONT_OPTIONS = [
  { id: 'font-sans',             label: 'Default'   },
  { id: 'font-poppins',          label: 'Poppins'   },
  { id: 'font-lobster',          label: 'Lobster'   },
  { id: 'font-mono',             label: 'Mono'      },
  { id: 'font-press-start',      label: 'Pixel'     },
  { id: 'font-orbitron',         label: 'Orbitron'  },
  { id: 'font-bangers',          label: 'Bangers'   },
  { id: 'font-pacifico',         label: 'Pacifico'  },
  { id: 'font-permanent-marker', label: 'Marker'    },
  { id: 'font-boogaloo',         label: 'Boogaloo'  },
  { id: 'font-fredoka',          label: 'Fredoka'   },
  { id: 'font-righteous',        label: 'Righteous' },
]
