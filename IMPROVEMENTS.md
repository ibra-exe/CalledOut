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

## ⚙️ Performance (from earlier audit)

- **Lazy-load routes** (Admin + QR scanner ship to every player today). _(low)_
- **Move the ~180 KB static question bank out of the initial bundle** (dynamic import / fetched asset). _(low)_
- **Read only selected categories** at game start instead of the whole `questionBank`. _(low)_
- **Stop live-syncing `questionHistory` during play** — split room listeners; only read history at Stats. _(med, biggest realtime win)_
- **Rebalance categories** toward ~100 each (Spicy 75 / Awkward 131) if single-category games matter. _(low)_

## ✨ Juice / polish

- Drumroll + spotlight before winner reveal · confetti variety · distinct vibration patterns · "Called Out!" stamp animation · sound themes · the **alien mascot** as an animated host/guide.
