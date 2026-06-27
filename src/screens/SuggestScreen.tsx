import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CATEGORIES } from '../questions'
import { submitSuggestion } from '../questionBank'
import { getSavedProfile, saveProfileLocally } from '../utils/profileUtils'
import { playProfileSaved } from '../utils/soundUtils'
import { useT } from '../i18n'

export function SuggestScreen() {
  const navigate = useNavigate()
  const tr = useT()
  const saved = getSavedProfile()

  const [name, setName] = useState(saved.name)
  const [category, setCategory] = useState('')
  const [en, setEn] = useState('')
  const [ar, setAr] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  const canSubmit = name.trim() && category && en.trim() && ar.trim() && !sending

  const submit = async () => {
    if (!canSubmit) return
    setSending(true)
    // Persist the name to the player's profile so unnamed players become named
    if (name.trim() !== saved.name) saveProfileLocally({ ...saved, name: name.trim() })
    await submitSuggestion({ category, en, ar, name })
    playProfileSaved()
    setSending(false)
    setDone(true)
  }

  const reset = () => {
    setCategory('')
    setEn('')
    setAr('')
    setDone(false)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center px-6 gap-5 text-center">
        <div className="text-6xl">🎉</div>
        <p className="text-white font-black text-xl max-w-xs">{tr('suggestThanks')}</p>
        <button
          onClick={reset}
          className="w-full max-w-xs py-4 rounded-2xl bg-[#FFE500] text-[#0F0F0F] font-black hover:bg-yellow-300 active:scale-[0.98] transition-all"
        >
          {tr('suggestAnother')}
        </button>
        <button onClick={() => navigate('/')} className="text-gray-500 text-sm">← {tr('back')}</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col px-6 pt-8 pb-12">
      <button
        onClick={() => navigate('/')}
        className="self-start mb-6 px-3 py-2 rounded-xl bg-[#1A1A1A] border border-white/10 text-gray-400 text-sm font-semibold hover:text-white hover:bg-white/10 transition-all"
      >
        ← {tr('back')}
      </button>

      <div className="text-center mb-8">
        <div className="text-5xl mb-3">💡</div>
        <h1 className="text-3xl font-black text-white">{tr('suggestQuestion')}</h1>
        <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">{tr('suggestSubtitle')}</p>
      </div>

      <div className="flex flex-col gap-5 max-w-md w-full mx-auto">
        {/* Name */}
        <div>
          <label className="text-white font-bold text-sm">{tr('suggestYourName')}</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value.slice(0, 20))}
            placeholder={tr('yourName')}
            maxLength={20}
            className="w-full mt-2 py-3 px-4 bg-[#1A1A1A] rounded-xl text-white font-semibold border-2 border-transparent focus:border-[#FFE500] outline-none placeholder-gray-600"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-white font-bold text-sm">{tr('suggestCategory')}</label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold flex items-center gap-2 transition-all ${category === cat.id ? 'border-[#FFE500] bg-[#FFE500]/10 text-[#FFE500]' : 'border-white/10 bg-[#1A1A1A] text-gray-300'}`}
              >
                <span>{cat.emoji}</span> {tr(`cat_${cat.id}`)}
              </button>
            ))}
          </div>
        </div>

        {/* English */}
        <div>
          <label className="text-white font-bold text-sm">{tr('suggestEnglish')}</label>
          <textarea
            value={en}
            onChange={e => setEn(e.target.value)}
            rows={2}
            dir="ltr"
            placeholder="Who is most likely to…"
            className="w-full mt-2 py-3 px-4 bg-[#1A1A1A] rounded-xl text-white text-sm border-2 border-transparent focus:border-[#FFE500] outline-none placeholder-gray-600 resize-none"
          />
        </div>

        {/* Arabic */}
        <div>
          <label className="text-white font-bold text-sm">{tr('suggestArabic')}</label>
          <textarea
            value={ar}
            onChange={e => setAr(e.target.value)}
            rows={2}
            dir="rtl"
            placeholder="مين فينا…"
            className="w-full mt-2 py-3 px-4 bg-[#1A1A1A] rounded-xl text-white text-sm border-2 border-transparent focus:border-[#FFE500] outline-none placeholder-gray-600 resize-none"
          />
        </div>

        <button
          onClick={submit}
          disabled={!canSubmit}
          className="w-full py-5 rounded-2xl bg-[#FFE500] text-[#0F0F0F] font-black text-lg hover:bg-yellow-300 active:scale-[0.97] transition-all disabled:opacity-40"
        >
          {sending ? tr('suggestSubmitting') : tr('submitSuggestion')}
        </button>
        {!name.trim() && (
          <p className="text-center text-[#FF9F1C] text-xs -mt-3">{tr('suggestNameRequired')}</p>
        )}
      </div>
    </div>
  )
}
