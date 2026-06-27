import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ref, onValue } from 'firebase/database'
import { db } from '../firebase'
import { CATEGORIES } from '../questions'
import {
  seedQuestionBankIfEmpty, reseedQuestionBank,
  adminUpsertQuestion, adminDeleteQuestion, adminSetArConfirmed, bankToQuestions, genQuestionId,
} from '../questionBank'
import type { Question } from '../types'

const ADMIN_PW = import.meta.env.VITE_ADMIN_PASSWORD || 'changeme'
const AUTH_KEY = 'calledout_admin_ok'

const catMeta = (id: string) => CATEGORIES.find(c => c.id === id)

export function AdminScreen() {
  const navigate = useNavigate()
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === '1')
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState(false)

  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [unconfirmedOnly, setUnconfirmedOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Question | null>(null)
  const [origLoc, setOrigLoc] = useState<{ category: string; id: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const submitPw = () => {
    if (pw === ADMIN_PW) {
      sessionStorage.setItem(AUTH_KEY, '1')
      setAuthed(true)
    } else {
      setPwError(true)
    }
  }

  useEffect(() => {
    if (!authed) return
    let unsub = () => {}
    seedQuestionBankIfEmpty().catch(() => {}).finally(() => {
      unsub = onValue(
        ref(db, 'questionBank'),
        snap => {
          setQuestions(bankToQuestions(snap.exists() ? snap.val() : null))
          setLoading(false)
          setLoadError(false)
        },
        () => { setLoading(false); setLoadError(true) }, // permission denied → rules not deployed
      )
    })
    return () => unsub()
  }, [authed])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const q of questions) c[q.category] = (c[q.category] || 0) + 1
    return c
  }, [questions])

  const unconfirmedCount = useMemo(() => questions.filter(q => !q.arConfirmed).length, [questions])

  const filtered = useMemo(() => {
    let qs = questions
    if (filter !== 'all') qs = qs.filter(q => q.category === filter)
    if (unconfirmedOnly) qs = qs.filter(q => !q.arConfirmed)
    const s = search.trim().toLowerCase()
    if (s) qs = qs.filter(q => q.en.toLowerCase().includes(s) || q.ar.includes(search.trim()))
    return [...qs].sort((a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id))
  }, [questions, filter, unconfirmedOnly, search])

  const startAdd = () => {
    setOrigLoc(null)
    setEditing({ id: '', en: '', ar: '', category: filter !== 'all' ? filter : 'spicy', arConfirmed: false })
  }
  const toggleConfirmed = (q: Question) => adminSetArConfirmed(q.category, q.id, !q.arConfirmed)
  const startEdit = (q: Question) => {
    setOrigLoc({ category: q.category, id: q.id })
    setEditing({ ...q })
  }
  const saveEditing = async () => {
    if (!editing || !editing.en.trim()) return
    setBusy(true)
    const q: Question = {
      ...editing,
      en: editing.en.trim(),
      ar: editing.ar.trim(),
      id: editing.id || genQuestionId(editing.category),
    }
    await adminUpsertQuestion(q)
    // If the category changed, remove the question from its old location
    if (origLoc && (origLoc.category !== q.category || origLoc.id !== q.id)) {
      await adminDeleteQuestion(origLoc.category, origLoc.id)
    }
    setBusy(false)
    setEditing(null)
    setOrigLoc(null)
  }
  const del = async (q: Question) => {
    if (!window.confirm(`Delete this ${q.category} question?\n\n"${q.en}"`)) return
    await adminDeleteQuestion(q.category, q.id)
  }
  const resetAll = async () => {
    if (!window.confirm('Reset the ENTIRE question bank to the built-in defaults? This wipes all your custom edits.')) return
    setBusy(true)
    await reseedQuestionBank()
    setBusy(false)
  }
  const logout = () => {
    sessionStorage.removeItem(AUTH_KEY)
    setAuthed(false)
    setPw('')
  }

  // ── Password gate ──
  if (!authed) {
    return (
      <div dir="ltr" className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center px-6 gap-5">
        <div className="text-5xl">🔐</div>
        <h1 className="text-2xl font-black text-white">Admin Access</h1>
        <input
          type="password"
          value={pw}
          onChange={e => { setPw(e.target.value); setPwError(false) }}
          onKeyDown={e => e.key === 'Enter' && submitPw()}
          placeholder="Password"
          className="w-full max-w-xs py-3 px-4 bg-[#1A1A1A] rounded-xl text-white font-semibold border-2 border-transparent focus:border-[#FFE500] outline-none placeholder-gray-600 text-center"
          autoFocus
        />
        {pwError && <p className="text-[#FF4D4D] text-sm">Wrong password</p>}
        <button
          onClick={submitPw}
          className="w-full max-w-xs py-3 rounded-xl bg-[#FFE500] text-[#0F0F0F] font-black hover:bg-yellow-300 active:scale-[0.98] transition-all"
        >
          Unlock
        </button>
        <button onClick={() => navigate('/')} className="text-gray-500 text-sm">← Back to app</button>
      </div>
    )
  }

  // ── Manager ──
  return (
    <div dir="ltr" className="min-h-screen bg-[#0F0F0F] text-white pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0F0F0F]/95 backdrop-blur border-b border-white/10 px-4 pt-6 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-black">Question Manager</h1>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs">{questions.length} total</span>
            <button onClick={logout} className="text-gray-500 text-xs hover:text-white">Lock</button>
          </div>
        </div>

        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search English or Arabic…"
          className="w-full py-2.5 px-4 bg-[#1A1A1A] rounded-xl text-white text-sm border border-white/10 focus:border-[#FFE500] outline-none placeholder-gray-600 mb-3"
        />

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          <button
            onClick={() => setUnconfirmedOnly(v => !v)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${unconfirmedOnly ? 'bg-[#FF9F1C] text-[#0F0F0F] border-[#FF9F1C]' : 'bg-[#1A1A1A] text-[#FF9F1C] border-[#FF9F1C]/40'}`}
          >
            ⚠ Unconfirmed ({unconfirmedCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${filter === 'all' ? 'bg-[#FFE500] text-[#0F0F0F] border-[#FFE500]' : 'bg-[#1A1A1A] text-gray-400 border-white/10'}`}
          >
            All ({questions.length})
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${filter === c.id ? 'bg-[#FFE500] text-[#0F0F0F] border-[#FFE500]' : 'bg-[#1A1A1A] text-gray-400 border-white/10'}`}
            >
              {c.emoji} {c.label} ({counts[c.id] ?? 0})
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loadError ? (
        <div className="px-6 py-16 text-center flex flex-col items-center gap-3">
          <div className="text-4xl">🚧</div>
          <p className="text-white font-bold">Can't reach the question bank</p>
          <p className="text-gray-500 text-sm max-w-xs">
            The database rules for <code className="text-[#FFE500]">questionBank</code> haven't been deployed yet.
            Run <code className="text-gray-300">firebase deploy --only database</code>, then reload.
          </p>
        </div>
      ) : loading ? (
        <div className="text-center text-gray-500 py-20 animate-pulse">Loading…</div>
      ) : (
        <div className="px-4 pt-4 flex flex-col gap-2">
          {filtered.length === 0 && <p className="text-center text-gray-600 py-10 text-sm">No questions match.</p>}
          {filtered.map(q => (
            <div key={`${q.category}/${q.id}`} className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#FFE500] text-[10px] font-bold uppercase tracking-wide">
                  {catMeta(q.category)?.emoji} {catMeta(q.category)?.label ?? q.category}
                </span>
                <div className="flex gap-3">
                  <button onClick={() => startEdit(q)} className="text-gray-400 text-xs hover:text-white">Edit</button>
                  <button onClick={() => del(q)} className="text-[#FF4D4D] text-xs hover:text-[#FF6B6B]">Delete</button>
                </div>
              </div>
              <p className="text-white text-sm">{q.en}</p>
              <p className="text-gray-400 text-sm mt-1" dir="rtl">{q.ar || <span className="text-[#FF9F1C] italic">— no Arabic —</span>}</p>
              <button
                onClick={() => toggleConfirmed(q)}
                className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  q.arConfirmed
                    ? 'bg-[#4CAF50]/15 text-[#4CAF50] border border-[#4CAF50]/40'
                    : 'bg-white/5 text-gray-500 border border-white/10'
                }`}
              >
                {q.arConfirmed ? '✓ Arabic confirmed' : 'Arabic unconfirmed'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Footer actions */}
      <div className="fixed bottom-0 inset-x-0 bg-[#0F0F0F]/95 backdrop-blur border-t border-white/10 px-4 py-3 flex items-center gap-3">
        <button
          onClick={startAdd}
          className="flex-1 py-3 rounded-xl bg-[#FFE500] text-[#0F0F0F] font-black text-sm hover:bg-yellow-300 active:scale-[0.98] transition-all"
        >
          + Add Question
        </button>
        <button
          onClick={resetAll}
          disabled={busy}
          className="px-4 py-3 rounded-xl bg-[#FF4D4D]/10 text-[#FF4D4D] font-bold text-xs border border-[#FF4D4D]/20 hover:bg-[#FF4D4D]/20"
        >
          Reset
        </button>
      </div>

      {/* Edit / Add modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col justify-end" onClick={() => setEditing(null)}>
          <div className="bg-[#1A1A1A] rounded-t-3xl p-5 w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
            <h2 className="text-lg font-black mb-4">{origLoc ? 'Edit Question' : 'Add Question'}</h2>

            <label className="text-gray-400 text-xs font-semibold">Category</label>
            <select
              value={editing.category}
              onChange={e => setEditing({ ...editing, category: e.target.value })}
              className="w-full mt-1 mb-4 py-3 px-3 bg-[#0F0F0F] rounded-xl text-white text-sm border border-white/10 focus:border-[#FFE500] outline-none"
            >
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
            </select>

            <label className="text-gray-400 text-xs font-semibold">English</label>
            <textarea
              value={editing.en}
              onChange={e => setEditing({ ...editing, en: e.target.value })}
              rows={2}
              placeholder="Who is most likely to…"
              className="w-full mt-1 mb-4 py-3 px-3 bg-[#0F0F0F] rounded-xl text-white text-sm border border-white/10 focus:border-[#FFE500] outline-none placeholder-gray-600 resize-none"
            />

            <label className="text-gray-400 text-xs font-semibold">Arabic (Saudi)</label>
            <textarea
              value={editing.ar}
              onChange={e => setEditing({ ...editing, ar: e.target.value })}
              rows={2}
              dir="rtl"
              placeholder="مين فينا…"
              className="w-full mt-1 mb-4 py-3 px-3 bg-[#0F0F0F] rounded-xl text-white text-sm border border-white/10 focus:border-[#FFE500] outline-none placeholder-gray-600 resize-none"
            />

            <button
              onClick={() => setEditing({ ...editing, arConfirmed: !editing.arConfirmed })}
              className="w-full flex items-center justify-between p-3 bg-[#0F0F0F] rounded-xl mb-5 border border-white/10"
            >
              <span className="text-white text-sm font-semibold">Arabic confirmed</span>
              <span className={`relative w-12 h-6 rounded-full transition-colors ${editing.arConfirmed ? 'bg-[#4CAF50]' : 'bg-white/20'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${editing.arConfirmed ? 'translate-x-6' : 'translate-x-0'}`} />
              </span>
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 py-3 rounded-xl bg-white/5 text-gray-300 font-bold text-sm border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={saveEditing}
                disabled={!editing.en.trim() || busy}
                className="flex-1 py-3 rounded-xl bg-[#FFE500] text-[#0F0F0F] font-black text-sm disabled:opacity-40"
              >
                {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
            <div className="h-safe-area-bottom mt-2" />
          </div>
        </div>
      )}
    </div>
  )
}
