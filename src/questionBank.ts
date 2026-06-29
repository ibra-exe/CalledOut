import { ref, get, set, update, remove, push } from 'firebase/database'
import { db } from './firebase'
import { CATEGORIES } from './categories'
import type { Question, Suggestion } from './types'

// Firebase layout: questionBank/{category}/{id} = { en, ar, arConfirmed?, userSuggested? }
// The static QUESTIONS bundle is the default bank. The admin panel can seed an
// editable copy into Firebase; once seeded, games read from there instead.

type BankNode = Record<string, { en: string; ar: string; arConfirmed?: boolean; userSuggested?: boolean; suggestedBy?: string }>
type Bank = Record<string, BankNode>

const ALL_CATEGORY_IDS = CATEGORIES.map(c => c.id)

export function genQuestionId(category: string): string {
  const rand = Math.random().toString(36).slice(2, 7)
  return `${category}-${Date.now().toString(36)}-${rand}`
}

// Seed Firebase from the static bundle, but only if it's empty.
export async function seedQuestionBankIfEmpty(): Promise<void> {
  const snap = await get(ref(db, 'questionBank'))
  if (snap.exists()) return
  const { QUESTIONS } = await import('./questions')
  const payload: Bank = {}
  for (const q of QUESTIONS) {
    payload[q.category] ??= {}
    payload[q.category][q.id] = { en: q.en, ar: q.ar }
  }
  await set(ref(db, 'questionBank'), payload)
}

// Force re-seed from the static bundle (admin "reset to defaults").
export async function reseedQuestionBank(): Promise<void> {
  const { QUESTIONS } = await import('./questions')
  const payload: Bank = {}
  for (const q of QUESTIONS) {
    payload[q.category] ??= {}
    payload[q.category][q.id] = { en: q.en, ar: q.ar }
  }
  await set(ref(db, 'questionBank'), payload)
}

// Load questions for a game. Reads the editable bank from Firebase; for any
// category not present there, falls back to the static bundle.
export async function fetchQuestionsForGame(categoryIds: string[]): Promise<Question[]> {
  const cats = categoryIds.length ? categoryIds : ALL_CATEGORY_IDS
  let bank: Bank | null = null
  try {
    const snap = await get(ref(db, 'questionBank'))
    if (snap.exists()) bank = snap.val() as Bank
  } catch {
    bank = null
  }
  const out: Question[] = []
  let statics: Question[] | null = null // lazily loaded only if a category falls back
  for (const cat of cats) {
    const node = bank?.[cat]
    if (node && Object.keys(node).length > 0) {
      for (const [id, q] of Object.entries(node)) {
        if (q && q.en) out.push({ id, en: q.en, ar: q.ar ?? q.en, category: cat, userSuggested: !!q.userSuggested })
      }
    } else {
      if (!statics) statics = (await import('./questions')).QUESTIONS
      out.push(...statics.filter(q => q.category === cat))
    }
  }
  return out
}

// ── Admin CRUD ──
export function adminUpsertQuestion(q: Question): Promise<void> {
  return set(ref(db, `questionBank/${q.category}/${q.id}`), {
    en: q.en, ar: q.ar, arConfirmed: q.arConfirmed ?? false,
    userSuggested: q.userSuggested ?? false,
    suggestedBy: q.userSuggested ? (q.suggestedBy ?? '').trim() : '',
  })
}

export function adminDeleteQuestion(category: string, id: string): Promise<void> {
  return remove(ref(db, `questionBank/${category}/${id}`))
}

// Flip just the "Arabic confirmed" flag without touching the text.
export function adminSetArConfirmed(category: string, id: string, value: boolean): Promise<void> {
  return update(ref(db, `questionBank/${category}/${id}`), { arConfirmed: value })
}

// Flatten a Firebase bank snapshot into a Question[] (for the admin list).
export function bankToQuestions(bank: Bank | null): Question[] {
  if (!bank) return []
  const out: Question[] = []
  for (const [category, node] of Object.entries(bank)) {
    if (!node) continue
    for (const [id, q] of Object.entries(node)) {
      if (q && q.en) out.push({ id, en: q.en, ar: q.ar ?? '', category, arConfirmed: !!q.arConfirmed, userSuggested: !!q.userSuggested, suggestedBy: q.suggestedBy ?? '' })
    }
  }
  return out
}

// ── Player suggestions (inbox) ──
// Firebase layout: questionSuggestions/{pushId} = { category, en, ar, name, createdAt, status }

export function submitSuggestion(data: { category: string; en: string; ar: string; name: string }): Promise<unknown> {
  const node = push(ref(db, 'questionSuggestions'))
  return set(node, {
    category: data.category,
    en: data.en.trim(),
    ar: data.ar.trim(),
    name: data.name.trim(),
    createdAt: Date.now(),
    status: 'pending',
  })
}

export function suggestionsToList(raw: Record<string, Omit<Suggestion, 'id'>> | null): Suggestion[] {
  if (!raw) return []
  return Object.entries(raw)
    .map(([id, s]) => ({ id, ...s, status: s.status ?? 'pending' }))
    .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
}

export function declineSuggestion(id: string): Promise<void> {
  return update(ref(db, `questionSuggestions/${id}`), { status: 'declined' })
}

export function deleteSuggestion(id: string): Promise<void> {
  return remove(ref(db, `questionSuggestions/${id}`))
}

export function updateSuggestion(id: string, patch: Partial<Pick<Suggestion, 'category' | 'en' | 'ar'>>): Promise<void> {
  return update(ref(db, `questionSuggestions/${id}`), patch)
}

// Approve a suggestion: add it to the bank tagged userSuggested, then remove from the inbox.
export async function approveSuggestion(s: Suggestion): Promise<void> {
  const id = genQuestionId(s.category)
  await set(ref(db, `questionBank/${s.category}/${id}`), {
    en: s.en.trim(), ar: s.ar.trim(), arConfirmed: false, userSuggested: true, suggestedBy: (s.name ?? '').trim(),
  })
  await remove(ref(db, `questionSuggestions/${s.id}`))
}
