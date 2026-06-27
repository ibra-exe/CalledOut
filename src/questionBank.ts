import { ref, get, set, update, remove } from 'firebase/database'
import { db } from './firebase'
import { QUESTIONS, CATEGORIES } from './questions'
import type { Question } from './types'

// Firebase layout: questionBank/{category}/{id} = { en, ar, arConfirmed? }
// The static QUESTIONS bundle is the default bank. The admin panel can seed an
// editable copy into Firebase; once seeded, games read from there instead.

type BankNode = Record<string, { en: string; ar: string; arConfirmed?: boolean }>
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
  const payload: Bank = {}
  for (const q of QUESTIONS) {
    payload[q.category] ??= {}
    payload[q.category][q.id] = { en: q.en, ar: q.ar }
  }
  await set(ref(db, 'questionBank'), payload)
}

// Force re-seed from the static bundle (admin "reset to defaults").
export async function reseedQuestionBank(): Promise<void> {
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
  for (const cat of cats) {
    const node = bank?.[cat]
    if (node && Object.keys(node).length > 0) {
      for (const [id, q] of Object.entries(node)) {
        if (q && q.en) out.push({ id, en: q.en, ar: q.ar ?? q.en, category: cat })
      }
    } else {
      out.push(...QUESTIONS.filter(q => q.category === cat))
    }
  }
  return out
}

// ── Admin CRUD ──
export function adminUpsertQuestion(q: Question): Promise<void> {
  return set(ref(db, `questionBank/${q.category}/${q.id}`), {
    en: q.en, ar: q.ar, arConfirmed: q.arConfirmed ?? false,
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
      if (q && q.en) out.push({ id, en: q.en, ar: q.ar ?? '', category, arConfirmed: !!q.arConfirmed })
    }
  }
  return out
}
