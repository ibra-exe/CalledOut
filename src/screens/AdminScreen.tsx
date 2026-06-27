import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ref, onValue } from 'firebase/database'
import { db } from '../firebase'
import { CATEGORIES } from '../questions'
import {
  seedQuestionBankIfEmpty, reseedQuestionBank,
  adminUpsertQuestion, adminDeleteQuestion, adminSetArConfirmed, bankToQuestions, genQuestionId,
  suggestionsToList, approveSuggestion, declineSuggestion, deleteSuggestion, updateSuggestion,
} from '../questionBank'
import type { Question, Suggestion } from '../types'

const ADMIN_PW = import.meta.env.VITE_ADMIN_PASSWORD || 'changeme'
const AUTH_KEY = 'calledout_admin_ok'

const catMeta = (id: string) => CATEGORIES.find(c => c.id === id)
const catLabel = (id: string) => `${catMeta(id)?.emoji ?? ''} ${catMeta(id)?.label ?? id}`

export function AdminScreen() {
  const navigate = useNavigate()
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === '1')
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState(false)

  const [view, setView] = useState<'bank' | 'inbox'>('bank')
  const [questions, setQuestions] = useState<Question[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [unconfirmedOnly, setUnconfirmedOnly] = useState(false)
  const [userSuggestedOnly, setUserSuggestedOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Question | null>(null)
  const [origLoc, setOrigLoc] = useState<{ category: string; id: string } | null>(null)
  const [editSug, setEditSug] = useState<Suggestion | null>(null)
  const [inboxTab, setInboxTab] = useState<'pending' | 'declined'>('pending')
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
    let unsubBank = () => {}
    seedQuestionBankIfEmpty().catch(() => {}).finally(() => {
      unsubBank = onValue(
        ref(db, 'questionBank'),
        snap => {
          setQuestions(bankToQuestions(snap.exists() ? snap.val() : null))
          setLoading(false)
          setLoadError(false)
        },
        () => { setLoading(false); setLoadError(true) },
      )
    })
    const unsubSug = onValue(
      ref(db, 'questionSuggestions'),
      snap => setSuggestions(suggestionsToList(snap.exists() ? snap.val() : null)),
      () => {},
    )
    return () => { unsubBank(); unsubSug() }
  }, [authed])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const q of questions) c[q.category] = (c[q.category] || 0) + 1
    return c
  }, [questions])

  const unconfirmedCount = useMemo(() => questions.filter(q => !q.arConfirmed).length, [questions])
  const userSuggestedCount = useMemo(() => questions.filter(q => q.userSuggested).length, [questions])
  const pendingCount = useMemo(() => suggestions.filter(s => s.status === 'pending').length, [suggestions])
  const inboxList = useMemo(() => suggestions.filter(s => s.status === inboxTab), [suggestions, inboxTab])

  const filtered = useMemo(() => {
    let qs = questions
    if (filter !== 'all') qs = qs.filter(q => q.category === filter)
    if (unconfirmedOnly) qs = qs.filter(q => !q.arConfirmed)
    if (userSuggestedOnly) qs = qs.filter(q => q.userSuggested)
    const s = search.trim().toLowerCase()
    if (s) qs = qs.filter(q => q.en.toLowerCase().includes(s) || q.ar.includes(search.trim()))
    return [...qs].sort((a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id))
  }, [questions, filter, unconfirmedOnly, userSuggestedOnly, search])

  // ── question CRUD ──
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
    const q: Question = { ...editing, en: editing.en.trim(), ar: editing.ar.trim(), id: editing.id || genQuestionId(editing.category) }
    await adminUpsertQuestion(q)
    if (origLoc && (origLoc.category !== q.category || origLoc.id !== q.id)) {
      await adminDeleteQuestion(origLoc.category, origLoc.id)
    }
    setBusy(false); setEditing(null); setOrigLoc(null)
  }
  const del = async (q: Question) => {
    if (!window.confirm(`Delete this ${q.category} question?\n\n"${q.en}"`)) return
    await adminDeleteQuestion(q.category, q.id)
  }
  const resetAll = async () => {
    if (!window.confirm('Reset the ENTIRE question bank to the built-in defaults? This wipes all custom edits AND approved player suggestions.')) return
    setBusy(true); await reseedQuestionBank(); setBusy(false)
  }
  const logout = () => { sessionStorage.removeItem(AUTH_KEY); setAuthed(false); setPw('') }

  // ── suggestion actions ──
  const approve = async (s: Suggestion) => { setBusy(true); await approveSuggestion(s); setBusy(false) }
  const decline = (s: Suggestion) => declineSuggestion(s.id)
  const delSug = (s: Suggestion) => { if (window.confirm('Delete this suggestion permanently?')) deleteSuggestion(s.id) }
  const saveSug = async () => {
    if (!editSug || !editSug.en.trim() || !editSug.ar.trim()) return
    setBusy(true)
    await updateSuggestion(editSug.id, { category: editSug.category, en: editSug.en.trim(), ar: editSug.ar.trim() })
    setBusy(false); setEditSug(null)
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
        <button onClick={submitPw} className="w-full max-w-xs py-3 rounded-xl bg-[#FFE500] text-[#0F0F0F] font-black hover:bg-yellow-300 active:scale-[0.98] transition-all">Unlock</button>
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
          <h1 className="text-xl font-black">{view === 'inbox' ? 'Inbox' : 'Question Manager'}</h1>
          <div className="flex items-center gap-2">
            {view === 'bank' ? (
              <button
                onClick={() => setView('inbox')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border ${pendingCount > 0 ? 'bg-[#9C7BFF]/15 text-[#B79CFF] border-[#9C7BFF]/40' : 'bg-[#1A1A1A] text-gray-400 border-white/10'}`}
              >
                📥 Inbox ({pendingCount})
              </button>
            ) : (
              <button onClick={() => setView('bank')} className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#1A1A1A] text-gray-300 border border-white/10">← Questions</button>
            )}
            <button onClick={logout} className="text-gray-500 text-xs hover:text-white">Lock</button>
          </div>
        </div>

        {view === 'bank' && (
          <>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search English or Arabic…"
              className="w-full py-2.5 px-4 bg-[#1A1A1A] rounded-xl text-white text-sm border border-white/10 focus:border-[#FFE500] outline-none placeholder-gray-600 mb-3"
            />
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
              <button onClick={() => setUnconfirmedOnly(v => !v)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${unconfirmedOnly ? 'bg-[#FF9F1C] text-[#0F0F0F] border-[#FF9F1C]' : 'bg-[#1A1A1A] text-[#FF9F1C] border-[#FF9F1C]/40'}`}>⚠ Unconfirmed ({unconfirmedCount})</button>
              <button onClick={() => setUserSuggestedOnly(v => !v)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${userSuggestedOnly ? 'bg-[#9C7BFF] text-[#0F0F0F] border-[#9C7BFF]' : 'bg-[#1A1A1A] text-[#B79CFF] border-[#9C7BFF]/40'}`}>✨ User Suggested ({userSuggestedCount})</button>
              <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${filter === 'all' ? 'bg-[#FFE500] text-[#0F0F0F] border-[#FFE500]' : 'bg-[#1A1A1A] text-gray-400 border-white/10'}`}>All ({questions.length})</button>
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setFilter(c.id)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${filter === c.id ? 'bg-[#FFE500] text-[#0F0F0F] border-[#FFE500]' : 'bg-[#1A1A1A] text-gray-400 border-white/10'}`}>{c.emoji} {c.label} ({counts[c.id] ?? 0})</button>
              ))}
            </div>
          </>
        )}

        {view === 'inbox' && (
          <div className="flex gap-2">
            <button onClick={() => setInboxTab('pending')} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${inboxTab === 'pending' ? 'bg-[#FFE500] text-[#0F0F0F] border-[#FFE500]' : 'bg-[#1A1A1A] text-gray-400 border-white/10'}`}>Pending ({suggestions.filter(s => s.status === 'pending').length})</button>
            <button onClick={() => setInboxTab('declined')} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${inboxTab === 'declined' ? 'bg-[#FFE500] text-[#0F0F0F] border-[#FFE500]' : 'bg-[#1A1A1A] text-gray-400 border-white/10'}`}>Declined ({suggestions.filter(s => s.status === 'declined').length})</button>
          </div>
        )}
      </div>

      {/* Body */}
      {loadError ? (
        <div className="px-6 py-16 text-center flex flex-col items-center gap-3">
          <div className="text-4xl">🚧</div>
          <p className="text-white font-bold">Can't reach the question bank</p>
          <p className="text-gray-500 text-sm max-w-xs">The database rules haven't been deployed yet. Run <code className="text-gray-300">firebase deploy --only database</code>, then reload.</p>
        </div>
      ) : view === 'inbox' ? (
        <div className="px-4 pt-4 flex flex-col gap-2">
          {inboxList.length === 0 && <p className="text-center text-gray-600 py-10 text-sm">{inboxTab === 'pending' ? 'No pending suggestions.' : 'No declined suggestions.'}</p>}
          {inboxList.map(s => (
            <div key={s.id} className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#FFE500] text-[10px] font-bold uppercase tracking-wide">{catLabel(s.category)}</span>
                <span className="text-gray-500 text-[10px]">by {s.name || 'anon'}</span>
              </div>
              <p className="text-white text-sm">{s.en}</p>
              <p className="text-gray-400 text-sm mt-1" dir="rtl">{s.ar || <span className="text-[#FF9F1C] italic">— no Arabic —</span>}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => approve(s)} disabled={busy} className="px-3 py-1.5 rounded-lg bg-[#4CAF50]/15 text-[#4CAF50] text-xs font-bold border border-[#4CAF50]/40">✓ Approve</button>
                <button onClick={() => setEditSug({ ...s })} className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 text-xs font-bold border border-white/10">Edit</button>
                {s.status === 'pending'
                  ? <button onClick={() => decline(s)} className="px-3 py-1.5 rounded-lg bg-[#FF9F1C]/10 text-[#FF9F1C] text-xs font-bold border border-[#FF9F1C]/30">Decline</button>
                  : <button onClick={() => delSug(s)} className="px-3 py-1.5 rounded-lg bg-[#FF4D4D]/10 text-[#FF4D4D] text-xs font-bold border border-[#FF4D4D]/20">Delete</button>}
              </div>
            </div>
          ))}
        </div>
      ) : loading ? (
        <div className="text-center text-gray-500 py-20 animate-pulse">Loading…</div>
      ) : (
        <div className="px-4 pt-4 flex flex-col gap-2">
          {filtered.length === 0 && <p className="text-center text-gray-600 py-10 text-sm">No questions match.</p>}
          {filtered.map(q => (
            <div key={`${q.category}/${q.id}`} className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#FFE500] text-[10px] font-bold uppercase tracking-wide">{catLabel(q.category)}</span>
                  {q.userSuggested && <span className="text-[#B79CFF] text-[10px] font-bold uppercase tracking-wide">✨ User Suggested</span>}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => startEdit(q)} className="text-gray-400 text-xs hover:text-white">Edit</button>
                  <button onClick={() => del(q)} className="text-[#FF4D4D] text-xs hover:text-[#FF6B6B]">Delete</button>
                </div>
              </div>
              <p className="text-white text-sm">{q.en}</p>
              <p className="text-gray-400 text-sm mt-1" dir="rtl">{q.ar || <span className="text-[#FF9F1C] italic">— no Arabic —</span>}</p>
              <button
                onClick={() => toggleConfirmed(q)}
                className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${q.arConfirmed ? 'bg-[#4CAF50]/15 text-[#4CAF50] border border-[#4CAF50]/40' : 'bg-white/5 text-gray-500 border border-white/10'}`}
              >
                {q.arConfirmed ? '✓ Arabic confirmed' : 'Arabic unconfirmed'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Footer (bank only) */}
      {view === 'bank' && (
        <div className="fixed bottom-0 inset-x-0 bg-[#0F0F0F]/95 backdrop-blur border-t border-white/10 px-4 py-3 flex items-center gap-3">
          <button onClick={startAdd} className="flex-1 py-3 rounded-xl bg-[#FFE500] text-[#0F0F0F] font-black text-sm hover:bg-yellow-300 active:scale-[0.98] transition-all">+ Add Question</button>
          <button onClick={resetAll} disabled={busy} className="px-4 py-3 rounded-xl bg-[#FF4D4D]/10 text-[#FF4D4D] font-bold text-xs border border-[#FF4D4D]/20 hover:bg-[#FF4D4D]/20">Reset</button>
        </div>
      )}

      {/* Edit / Add question modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col justify-end" onClick={() => setEditing(null)}>
          <div className="bg-[#1A1A1A] rounded-t-3xl p-5 w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
            <h2 className="text-lg font-black mb-4">{origLoc ? 'Edit Question' : 'Add Question'}</h2>
            <label className="text-gray-400 text-xs font-semibold">Category</label>
            <select value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} className="w-full mt-1 mb-4 py-3 px-3 bg-[#0F0F0F] rounded-xl text-white text-sm border border-white/10 focus:border-[#FFE500] outline-none">
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
            </select>
            <label className="text-gray-400 text-xs font-semibold">English</label>
            <textarea value={editing.en} onChange={e => setEditing({ ...editing, en: e.target.value })} rows={2} placeholder="Who is most likely to…" className="w-full mt-1 mb-4 py-3 px-3 bg-[#0F0F0F] rounded-xl text-white text-sm border border-white/10 focus:border-[#FFE500] outline-none placeholder-gray-600 resize-none" />
            <label className="text-gray-400 text-xs font-semibold">Arabic (Saudi)</label>
            <textarea value={editing.ar} onChange={e => setEditing({ ...editing, ar: e.target.value })} rows={2} dir="rtl" placeholder="مين فينا…" className="w-full mt-1 mb-4 py-3 px-3 bg-[#0F0F0F] rounded-xl text-white text-sm border border-white/10 focus:border-[#FFE500] outline-none placeholder-gray-600 resize-none" />
            <button onClick={() => setEditing({ ...editing, arConfirmed: !editing.arConfirmed })} className="w-full flex items-center justify-between p-3 bg-[#0F0F0F] rounded-xl mb-5 border border-white/10">
              <span className="text-white text-sm font-semibold">Arabic confirmed</span>
              <span className={`relative w-12 h-6 rounded-full transition-colors ${editing.arConfirmed ? 'bg-[#4CAF50]' : 'bg-white/20'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${editing.arConfirmed ? 'translate-x-6' : 'translate-x-0'}`} />
              </span>
            </button>
            <div className="flex gap-3">
              <button onClick={() => setEditing(null)} className="flex-1 py-3 rounded-xl bg-white/5 text-gray-300 font-bold text-sm border border-white/10">Cancel</button>
              <button onClick={saveEditing} disabled={!editing.en.trim() || busy} className="flex-1 py-3 rounded-xl bg-[#FFE500] text-[#0F0F0F] font-black text-sm disabled:opacity-40">{busy ? 'Saving…' : 'Save'}</button>
            </div>
            <div className="h-safe-area-bottom mt-2" />
          </div>
        </div>
      )}

      {/* Edit suggestion modal */}
      {editSug && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col justify-end" onClick={() => setEditSug(null)}>
          <div className="bg-[#1A1A1A] rounded-t-3xl p-5 w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
            <h2 className="text-lg font-black mb-1">Edit Suggestion</h2>
            <p className="text-gray-500 text-xs mb-4">by {editSug.name || 'anon'}</p>
            <label className="text-gray-400 text-xs font-semibold">Category</label>
            <select value={editSug.category} onChange={e => setEditSug({ ...editSug, category: e.target.value })} className="w-full mt-1 mb-4 py-3 px-3 bg-[#0F0F0F] rounded-xl text-white text-sm border border-white/10 focus:border-[#FFE500] outline-none">
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
            </select>
            <label className="text-gray-400 text-xs font-semibold">English</label>
            <textarea value={editSug.en} onChange={e => setEditSug({ ...editSug, en: e.target.value })} rows={2} className="w-full mt-1 mb-4 py-3 px-3 bg-[#0F0F0F] rounded-xl text-white text-sm border border-white/10 focus:border-[#FFE500] outline-none resize-none" />
            <label className="text-gray-400 text-xs font-semibold">Arabic (Saudi)</label>
            <textarea value={editSug.ar} onChange={e => setEditSug({ ...editSug, ar: e.target.value })} rows={2} dir="rtl" className="w-full mt-1 mb-5 py-3 px-3 bg-[#0F0F0F] rounded-xl text-white text-sm border border-white/10 focus:border-[#FFE500] outline-none resize-none" />
            <div className="flex gap-2">
              <button onClick={() => setEditSug(null)} className="flex-1 py-3 rounded-xl bg-white/5 text-gray-300 font-bold text-sm border border-white/10">Cancel</button>
              <button onClick={saveSug} disabled={!editSug.en.trim() || !editSug.ar.trim() || busy} className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold text-sm disabled:opacity-40">Save</button>
              <button
                onClick={async () => {
                  if (!editSug.en.trim() || !editSug.ar.trim()) return
                  setBusy(true)
                  await approveSuggestion({ ...editSug, en: editSug.en.trim(), ar: editSug.ar.trim() })
                  setBusy(false); setEditSug(null)
                }}
                disabled={!editSug.en.trim() || !editSug.ar.trim() || busy}
                className="flex-1 py-3 rounded-xl bg-[#4CAF50] text-[#0F0F0F] font-black text-sm disabled:opacity-40"
              >
                Save & Approve
              </button>
            </div>
            <div className="h-safe-area-bottom mt-2" />
          </div>
        </div>
      )}
    </div>
  )
}
