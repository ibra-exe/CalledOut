# 🎤 Called Out

> *Rated E for Everyone Gets Exposed.*

### ▶️ Play now → **[called-out-game.web.app](https://called-out-game.web.app)**

**Called Out** is a real-time social party game for groups. Each round, a question appears and everyone votes for which player fits it best. At the end you see who got called out the most — and why — and each player walks away with a personality title they probably didn't ask for.

---

## How It Works

1. **One player creates a room** and shares the 6-character code or QR with everyone
2. **Players join** on their own devices and set up a profile (name, icon, color, font)
3. **The host picks categories** (Spicy, Funny, Deep, Chaotic, Romantic, and more) and configures the session — number of questions, timer length, and whether rounds auto-advance
4. **Each round**, a question appears on everyone's screen (e.g. *"Most likely to start a cult"*). Everyone votes for a player
5. **Results are revealed** with a vote breakdown and winner highlight
6. **At the end**, every player receives a unique personality title based on how they were voted across the session

No app install needed — it runs in any mobile browser and can be added to the home screen as a PWA.

---

## Features

- 🔴 **Real-time multiplayer** — all game state synced live via Firebase Realtime Database
- 📱 **Mobile-first & installable** — designed for phones, runs in any browser, and installs as a PWA (real app icons, works from the home screen)
- 🌐 **Bilingual (English + Arabic)** — full UI and question translations in Saudi colloquial Arabic, with right-to-left layout
- 📸 **QR code join** — scan to jump straight into a room
- 🎨 **Player profiles** — custom name, emoji icon, color, and font (retro, pixel, and handwritten typefaces)
- 🗂 **~980 questions** across 10 categories — Unfiltered, Funny, Deep, Chaotic, Romantic, Achievements, Awkward, Bold, Foodie, and Dark Humor
- 👪 **Family-friendly mode** — on by default; hides the mature-leaning categories from game setup (toggle off in Settings to include them)
- ⏱ **Configurable sessions** — question count, timer length, and a revoting mode (timer-only vs. end the round once everyone has voted)
- 🏆 **Dynamic end-game titles** — personality labels assigned from how each player was actually voted (Main Character, The Sleeper, Their Own Biggest Fan, The Forgotten One…)
- 🎵 **Music & sound** — background tracks and gameplay sound effects, both toggleable
- 💡 **Suggest a question** — players can submit prompts; approved ones join the bank tagged "User Suggested"
- 🔒 **Admin question manager** — password-gated panel to add/edit/delete questions (EN + AR) and review suggestions
- 🔗 **Rich link previews** — Open Graph image so shared links show a branded card
- 🎉 **Confetti** — because winners deserve it

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React 18](https://react.dev) + [TypeScript](https://www.typescriptlang.org) |
| Build tool | [Vite 5](https://vitejs.dev) |
| Styling | [Tailwind CSS v3](https://tailwindcss.com) |
| Routing | [React Router v6](https://reactrouter.com) |
| Database | [Firebase Realtime Database](https://firebase.google.com/products/realtime-database) |
| QR generation | [qrcode.react](https://github.com/zpao/qrcode.react) |
| QR scanning | [html5-qrcode](https://github.com/mebjas/html5-qrcode) |
| Confetti | [canvas-confetti](https://github.com/catdad/canvas-confetti) |
| Audio | HTML5 `<audio>` (AAC) for music + Web Audio for sound effects |
| i18n | Custom EN/AR dictionaries with right-to-left layout |
| Hosting | [Firebase Hosting](https://firebase.google.com/products/hosting) |
| Fonts | Google Fonts (Poppins, Lobster, Space Mono, Orbitron, Bangers, Pacifico, Press Start 2P, and more) |

All game state lives in Firebase — no backend server needed. Each client subscribes to the room in real time via `onValue` listeners.

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Configure Firebase — copy the template, then fill in your project values
cp .env.example .env.local
#    edit .env.local with your Firebase config + an admin password (see below)

# 3. Start the dev server (accessible on your local network for phone testing)
npm run dev -- --host
```

The `--host` flag exposes the server on your local IP so you can test joining from a phone on the same Wi-Fi.

> **Note:** QR camera scanning requires HTTPS. On a local IP (`http://192.168.x.x`) the camera is blocked by browsers — use the "Upload QR" fallback instead, or deploy to an HTTPS host for full functionality.

---

## Project Structure

```
src/
├── components/          # Reusable UI (PlayerCard, Avatar, QRScanner, ConnectionBanner, pickers…)
├── hooks/               # Firebase real-time hooks (useRoom, usePlayers, useVotes, usePresence, useConnection)
├── screens/             # Full-page views (Home, Lobby, Game, Reveal, Stats, Admin, Suggest…)
├── utils/               # Room codes/IDs, profile persistence, vote tallying, end-game titles, sound
├── questions.ts         # ~900 questions across 9 categories (bilingual EN/AR)
├── categories.ts        # Category metadata + shuffle helper
├── questionBank.ts      # Firebase-backed editable bank, admin CRUD & suggestions
├── i18n.ts / strings.ts # Language switching (EN/AR) + translation dictionaries
├── music.ts             # Background music manager
├── types.ts             # Shared TypeScript interfaces
└── firebase.ts          # Firebase init (config from env vars)
```

---

## Firebase Setup

The app uses Firebase Realtime Database. The database schema per room looks like:

```
rooms/{code}/
  status: 'lobby' | 'category-select' | 'playing' | 'reveal' | 'stats'
  hostId: string
  currentQuestionIndex: number
  currentQuestion: { id, text, textAr, category, userSuggested }
  settings: { timerSeconds, allowRevoting }
  players/{playerId}: { name, icon, color, font, isHost, isKicked, joinedAt }
  votes/{questionIndex}/{voterId}: playerId
  questionHistory/{questionIndex}: { id, text, textAr, category, votes, selfVotes }
  playAgain/{playerId}: true
```

The editable question bank lives at `questionBank/{category}/{id}` and
player-submitted prompts at `questionSuggestions/{id}`.

Firebase config is read from environment variables (see `.env.example`) — copy it
to `.env.local` and fill in the values from your own Firebase project. The
`.env.local` file is gitignored, so credentials never land in the repo.

---

## Deploying

The app is a static build served by Firebase Hosting:

```bash
npm run build                    # outputs to dist/
firebase deploy --only hosting
```

Live at **[called-out-game.web.app](https://called-out-game.web.app)**.

---

## Built with Claude Code
