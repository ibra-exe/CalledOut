import { useNavigate } from 'react-router-dom'

function AlienIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 26" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path
        d="M10 1C17 1 19 7 19 12C19 18.5 11.5 25 10 25C8.5 25 1 18.5 1 12C1 7 3 1 10 1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse cx="6.5" cy="13" rx="3.2" ry="1.9" transform="rotate(22 6.5 13)" fill="currentColor" />
      <ellipse cx="13.5" cy="13" rx="3.2" ry="1.9" transform="rotate(-22 13.5 13)" fill="currentColor" />
    </svg>
  )
}

const STEPS = [
  { emoji: '🎭', title: 'Set up a room', text: 'One person creates a room and shares the code. Everyone else joins on their own phone.' },
  { emoji: '❓', title: 'Read the prompt', text: 'Each round shows a "Who is most likely to…" style question across categories like Spicy, Funny, Deep and more.' },
  { emoji: '👆', title: 'Vote it out', text: "Tap the person in the group the question fits best. Yes, you can vote for yourself. No judgement. (Okay, some judgement.)" },
  { emoji: '👑', title: 'Get called out', text: 'Votes are revealed and the most-voted person gets crowned for that round.' },
  { emoji: '🏆', title: 'Earn your title', text: 'At the end, everyone is awarded a title based on how they were voted — from The Main Character to The Forgotten One.' },
]

export function AboutScreen() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col px-6 pt-8 pb-12">
      {/* Back */}
      <button
        onClick={() => navigate('/')}
        className="self-start mb-6 px-3 py-2 rounded-xl bg-[#1A1A1A] border border-white/10 text-gray-400 text-sm font-semibold hover:text-white hover:bg-white/10 transition-all"
      >
        ← Back
      </button>

      {/* Header */}
      <div className="text-center mb-10">
        <div className="text-6xl mb-4">🎤</div>
        <h1 className="text-4xl font-black text-white tracking-tight">
          Called<span className="text-[#FFE500]"> Out</span>
        </h1>
        <p className="text-gray-400 text-sm mt-3 max-w-xs mx-auto">
          The party game where your friends decide who you really are.
        </p>
      </div>

      {/* What is it */}
      <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5 mb-8">
        <p className="text-gray-300 text-sm leading-relaxed">
          <span className="text-white font-bold">Called Out</span> is a mobile-first party game for groups.
          Everyone answers the same prompt by voting for whoever in the room fits it best.
          It's fast, a little chaotic, and best played out loud with people you don't mind roasting.
        </p>
      </div>

      {/* How to play */}
      <p className="text-white font-black text-lg mb-4">How to play</p>
      <div className="flex flex-col gap-3 mb-10">
        {STEPS.map((step, i) => (
          <div key={i} className="flex items-start gap-4 bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
            <div className="w-10 h-10 rounded-full bg-[#FFE500]/10 flex items-center justify-center text-xl shrink-0">
              {step.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">{step.title}</p>
              <p className="text-gray-400 text-xs leading-relaxed mt-1">{step.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="bg-[#FFE500]/5 border border-[#FFE500]/20 rounded-2xl p-5 mb-10">
        <p className="text-[#FFE500] font-bold text-sm mb-2">💡 Good to know</p>
        <ul className="text-gray-300 text-xs leading-relaxed space-y-1.5 list-disc list-inside">
          <li>Best with 3+ players, all in the same room.</li>
          <li>The host can pick categories, question count and round timer in setup.</li>
          <li>Turn on <span className="text-white font-semibold">Allow Revoting</span> to let people change their pick until the timer runs out.</li>
        </ul>
      </div>

      {/* Contact */}
      <a
        href="https://github.com/ibra-exe"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#1A1A1A] text-white font-bold text-sm border border-white/10 hover:bg-white/5 active:scale-[0.98] transition-all"
      >
        Contact Ibra
        <AlienIcon className="w-4 h-4 text-[#FFE500]" />
      </a>

      {/* Footer credit */}
      <div className="mt-8 flex items-center justify-center gap-2 text-gray-600 font-mono text-xs select-none">
        Created By Ibra
        <AlienIcon className="w-4 h-4 text-gray-600" />
      </div>
    </div>
  )
}
