# Called Out — Improvements Plan

A running backlog of feature ideas, game modes, and enhancements. Tags: **(effort)** low / med / high · **(impact)** how much it moves the needle. ⭐ = recommended next.

---

## 🎯 Recommended next slice

1. ⭐ **Running scoreboard + points** — score each round, live leaderboard, a real winner. Turns the poll into a *game*. _(med effort, high impact)_
2. ⭐ **Predict the Crowd mode** — players also guess who the majority will vote for; points for reading the room. Reuses the voting flow. _(low effort, high impact)_
3. ⭐ **Shareable results card** — exportable image of everyone's end-game titles. Cheapest growth lever. _(low–med effort, high impact)_
4. ⭐ **Live emoji reactions** on the reveal screen — cheap delight, high payoff.

**Bigger bets:** Pass-the-phone single-device mode · TV/host-screen (Jackbox-style) mode.

---

## 🔬 Visual & performance audit (2026-06-29)

Multi-agent audit of the codebase; 48 findings verified against real code. Status: ✅ done · 🔜 doing now · ⬜ planned.

### 🐞 Bug fixes (correctness — do first)

- ✅ **CreateRoom can hang forever** — no try/catch around the room writes; a transient/offline failure on the *first step of hosting* strands the user on the loader with no escape. Fixed: try/catch + 10s timeout race + retry/go-home UI. `src/screens/CreateRoomScreen.tsx`, `src/strings.ts` _(S, high)_
- ✅ **Reveal ignores `notFound`** — when the host ends the game from the reveal screen, every other player froze on a dead screen (Game/Stats already handle this). Fixed: render the not-found / go-home state like GameScreen. `src/screens/RevealScreen.tsx` _(S, med)_
- ⬜ **Stats can miss the deciding vote** — in `GameScreen`, the `allVoted` auto-advance effect (revoting off) calls `advanceToReveal()` which tallies `votesRef.current`, but the ref-sync effect is declared *after* the advance effect, so it lags one render — the final vote that triggers the advance is omitted from the `questionHistory/{q}/votes` tally used for end-game titles. Live reveal is unaffected (reads `useVotes`). Pre-existing; surfaced during perf testing. Fix: tally from the freshest `votes` in the effect, or sync the ref before advancing. `src/screens/GameScreen.tsx:88-100` _(S, low)_
- ✅ **Ghost players stall rounds** — a player who closed their tab stayed in `players`, keeping `voteCount < N` so every round ran to the timer and the lone-host guard miscounted. Fixed: Firebase `onDisconnect` presence via a new `usePresence` hook, armed for non-host players on Lobby/Game/Reveal (host refresh stays safe). `src/hooks/usePresence.ts`, Lobby/Game/Reveal _(M, med)_

### ⚡ Performance

**Quick wins:**
- ✅ Re-encode music — converted to mono AAC `.m4a` via macOS `afconvert` (no ffmpeg needed): main-screen 3.0 MB → 1.5 MB, in-game 936 KB → 478 KB (~2.0 MB / ~50% saved). `music.ts` points at the `.m4a`; old MP3s removed. Verified the browser decodes them. `public/audio/*`, `src/music.ts` _(S, high)_
- ✅ Defer the home-music download — `audio.preload='none'` so the multi-MB track isn't fetched at cold start (playback is gesture-gated). `src/music.ts` _(S, med)_
- ✅ Lazy-load `canvas-confetti` — handled by route-split: confetti now lives only in the Reveal (via GameRouter) chunk, off first paint. _(S, low)_
- ✅ Collapse the duplicate room subscription — impact neutralized: `useRoom` now skips re-renders on vote/player churn (see below), so the two same-node listeners both no-op per vote. Literal de-dup (lift sub into `GameRouter`, pass `room` down) left as optional cleanup with ~zero runtime benefit now. _(S–M, low)_

**Bigger bets:**
- ✅ **Route-split all screens** (`React.lazy` + `Suspense`) — Home stays eager; the other 9 screens + `GameRouter` are lazy, `SettingsModal` lazy on Home. Moved Firebase (232 kB), html5-qrcode (375 kB), the question bank, and all screen code off `/`. **First-paint JS ~190 kB gzip → ~66 kB gzip.** Added chunk prefetch so in-game transitions don't flash a loader. `src/App.tsx`, `src/screens/GameRouter.tsx`, `src/screens/prefetch.ts` _(M, high)_
- ✅ **Un-bundle the 909-question array** — split `CATEGORIES`/`shuffleQuestions` into `src/categories.ts`; `QUESTIONS` is now its own chunk (135 kB / 43 kB gzip) loaded via dynamic import only on the seed/fallback paths. `src/questions.ts`, `src/questionBank.ts`, `src/categories.ts` _(M, high)_
- ✅ De-render the per-vote re-render storm — `useRoom` now compares a lightweight signature of the UI-relevant fields (status, qIndex, currentQuestion, settings, playAgain) and skips `setRoom` when only votes/players changed. Kills the 2–3 re-renders/vote (incl. the duplicate listener). Verified across a full game flow. `src/hooks/useRoom.ts` _(M, high)_
- ✅ Defer the 11-family render-blocking font link — `media="print" onload="this.media='all'"` swap + `<noscript>` fallback; core UI is the system stack so first paint no longer waits on fonts. `index.html` _(S, high)_
- ⬜ Service worker / offline app-shell (precache shell, runtime-cache audio). `vite.config.ts`, `public/manifest.json` _(M, med)_

### ✨ Visual & UX

**Quick wins:**
- ✅ Add `viewport-fit=cover` — now in the viewport meta, so `env(safe-area-inset-*)` resolves on notched devices. `index.html` _(S, med)_
- ✅ `min-h-screen` → `min-h-dvh` across all 17 screen wrappers (100vh no longer clips under mobile chrome). _(S, med)_
- ✅ Top safe-area padding — `.safe-top`/`.safe-bottom` utilities on Game/Reveal/Lobby/Stats roots + Home's absolute buttons use `max(2rem, inset+0.5rem)` so they clear the notch (desktop look unchanged). `src/index.css` _(S, med)_
- ✅ Global `:focus-visible` ring (brand-yellow outline; keyboard focus now visible app-wide). `src/index.css` _(S, med)_
- ✅ Bump `gray-500` secondary text → `gray-400` (meaningful status text now passes WCAG AA; dimmest `gray-600` decorative tier intentionally kept). _(S, med)_
- ✅ Animate the 4 modal/sheet entrances — `backdrop-in` + `sheet-in`/`card-in` on Exit/Profile/Settings/QRScanner. _(S, low–med)_
- 🟡 A11y attribute pass — partial: reconnect banner has `role="status"`/`aria-live`; icon buttons already labelled. Still open: `role="switch"`/`aria-checked` on toggles, `aria-pressed` on segmented controls, form `htmlFor`. _(S, low)_

**Bigger bets:**
- ✅ Reconnect banner + `onValue` error callbacks — `.info/connected` banner (`useConnection` + `ConnectionBanner`, debounced 2s) on Lobby + in-game; cancel callbacks on all 3 hooks so a denied/dropped listener can't strand the screen. Verified via forced offline. _(M, med)_
- 🟡 Extract `PrimaryButton`/`Avatar` — `Avatar` ✅ done (PlayerCard, VoteButton, Reveal, Stats now share one ringed-chip component). `PrimaryButton` ⬜ deferred: 22 `bg-[#FFE500] text-[#0F0F0F]` sites mix true CTAs with selected-toggle states; needs careful per-site disambiguation — best as a focused pass. _(M, med)_
- ✅ Real PWA icons — generated brand-yellow + dark-mic PNGs (192/512 "any", 512 maskable w/ safe-zone, 180 apple-touch) and wired into the manifest + `apple-touch-icon` link. `public/icon-*.png`, `public/apple-touch-icon.png`, `public/manifest.json`, `index.html` _(S, low)_

### 🗑️ Considered & dropped (not worth it)

`manualChunks` (no first-load benefit) · per-category bank fetch (payload too small) · trimming font *weights* (risks faux-bold) · micro-memoizations on Reveal/Game (sub-ms at party-game scale).

### 🎯 Recommended order

1. CreateRoom try/catch + recovery · 2. Reveal `notFound` guard · 3. Route-split · 4. Un-bundle questions · 5. Audio re-encode + `preload="none"` · 6. Safe-area trio (`viewport-fit` + top padding + `dvh`) · 7. A11y batch · 8. Over-fetch + presence · 9. Shared components + modal animations.

---

## 🎲 New game modes (variations on the voting core)

- **Predict the Crowd** — secretly predict the majority pick; score for matching. _(low)_
- **Quiplash-style open answers** — type a funny answer to a prompt, then vote for the best. Reuses suggestion text + voting infra. _(high, high fun ceiling)_
- **Wavelength / Spectrum** — place a player on a slider (Saint → Menace); score by closeness. _(med)_
- **Imposter round** — one player secretly gets a different prompt; group hunts the imposter after voting. _(med)_
- **Hot Seat** — one player on the seat each round; everyone answers about them; rotates. _(med)_
- **Guess Who Said It** — anonymous submitted answers, vote on who wrote each. _(med)_
- **Rapid Fire / Blitz** — 5s timer, rapid questions, momentum. _(low)_
- **Ranking mode** — pick top 3 for a prompt, weighted scoring. _(med)_

## 🏆 Stakes, scoring & round mechanics

- **Running scoreboard + points** + live leaderboard. _(med)_
- **"Defend yourself" beat** — called-out player gets ~15s to plead before advancing. _(low, big laughs)_
- **Power-up tokens** — one-time double-vote / immunity / steal per player. _(med)_
- **Anonymous ↔ revealed votes toggle** — show who voted for whom (arrows on reveal). _(low–med)_
- **Plot-twist rounds** — random modifiers ("counts double", "reverse: vote who least fits"). _(low)_
- **Streaks** — "on fire 🔥" for consecutive call-outs. _(low)_
- **Tie-breaker mini-round.** _(low)_

## 📱 Reach & platform

- **Pass-the-phone / single-device mode** — no second device needed. _(med, big reach)_
- **TV / host-screen mode** — host casts question + results to a TV, phones vote (Jackbox-style). _(high, differentiator)_
- **PWA + offline** — installable, instant reloads, offline question fallback. _(med)_
- **Reconnect / rejoin** after a dropped connection. _(med)_

## 🔗 Social & virality

- **Shareable results card** (image of titles). _(low–med)_
- **Live emoji reactions** floating on the reveal screen. _(low)_
- **Rematch with same crew** — one tap (play-again votes already exist). _(low)_
- **Crews / group profiles** + **Hall of Fame** across sessions (uses player IDs). _(med)_

## 📚 Content system (leverages existing bank/inbox/IDs)

- **No-repeat across sessions** — track seen question IDs per group in localStorage. _(low)_
- **Report / flag a question in-game** → routes into the admin Inbox. _(low)_
- **Question packs / themes** — Couples, Family-friendly, seasonal (Ramadan/holidays), 18+. _(med)_
- **Custom room pack** — host writes a private set for this group (reuses suggestion editor). _(med)_
- **Spice slider** — bias category mix tame → unhinged. _(low)_
- **More dialects/languages** — i18n + RTL infra ready (Egyptian/Levantine/English-only). _(med)_

## 🎨 Personalization & progression

- **Trophy case** — collect earned titles over many games; rare ones unlock cosmetics. _(med)_
- **Avatar upgrades** — frames/effects from milestones (alien mascot as unlockable). _(med)_
- **Per-player lifetime stats** — "called out 42×, Class Clown ×5." _(med)_
- **Achievements / quests.** _(med)_

## 🎛️ Host & room controls

- **Host transfer**, **pause/resume**, **skip question**, **mid-game settings tweak.** _(low–med)_
- **Public rooms / quick-match** with strangers. _(high, directional)_

## ⚙️ Performance & content (misc)

- Performance items are tracked in the **Visual & performance audit (2026-06-29)** section above (route-split, un-bundle questions, per-vote over-fetch, fonts, audio, service worker).
- **Rebalance categories** toward ~100 each (Spicy 75 / Awkward 131) if single-category games matter. _(low)_

## ✨ Juice / polish

- Drumroll + spotlight before winner reveal · confetti variety · distinct vibration patterns · "Called Out!" stamp animation · sound themes · the **alien mascot** as an animated host/guide.
