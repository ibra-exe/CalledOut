# 🎤 Called Out

> *Rated E for Everyone Gets Exposed.*

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

- 🔴 **Real-time multiplayer** — all game state synced live via Firebase RTDB
- 📱 **Mobile-first** — designed for phones, playable in browser
- 📸 **QR code join** — scan to jump straight into a room
- 🎨 **Player profiles** — custom name, emoji icon, color, and font (12 typefaces including pixelated, retro, and handwritten styles)
- 🗂 **400 questions** across 8 categories (50 per category)
- ⏱ **Configurable sessions** — choose question count, timer duration, and auto-advance vs. host-controlled pacing
- 🏆 **End-game titles** — unique personality labels assigned per player (Main Character, Certified Chaotic, Hopeless Romantic, etc.)
- 🚪 **Mid-game exit** — host can end the game for everyone or quietly pass the host role and leave
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
| Fonts | Google Fonts (Poppins, Lobster, Space Mono, Orbitron, Bangers, Pacifico, Press Start 2P, and more) |

All game state lives in Firebase — no backend server needed. Each client subscribes to the room in real time via `onValue` listeners.

---

## Running Locally

```bash
# Install dependencies
npm install

# Start dev server (accessible on local network for phone testing)
npm run dev -- --host
```

The `--host` flag exposes the server on your local IP so you can test joining from a phone on the same Wi-Fi.

> **Note:** QR camera scanning requires HTTPS. On a local IP (`http://192.168.x.x`) the camera is blocked by browsers — use the "Upload QR" fallback instead, or deploy to an HTTPS host for full functionality.

---

## Project Structure

```
src/
├── components/       # Reusable UI (PlayerCard, QRScanner, ProfileModal, pickers…)
├── hooks/            # Firebase real-time hooks (useRoom, usePlayers, useVotes)
├── screens/          # Full-page views (Home, Lobby, Game, Reveal, Stats…)
├── utils/
│   ├── roomUtils.ts  # Room codes, player IDs, color/emoji/font constants
│   ├── profileUtils.ts # localStorage profile persistence
│   ├── voteUtils.ts  # Vote tallying and winner logic
│   └── statsUtils.ts # End-game title assignment
├── questions.ts      # 400 questions across 8 categories
├── types.ts          # Shared TypeScript interfaces
└── firebase.ts       # Firebase init
```

---

## Firebase Setup

The app uses Firebase Realtime Database. The database schema per room looks like:

```
rooms/{code}/
  status: 'lobby' | 'playing' | 'reveal' | 'stats'
  hostId: string
  currentQuestionIndex: number
  currentQuestion: { text, category }
  settings: { timerSeconds, autoAdvance }
  players/{playerId}: { name, icon, color, font, isHost, isKicked, joinedAt }
  votes/{questionIndex}/{voterId}: playerId
  questionHistory/{questionIndex}: { text, category, votes }
```

To use your own Firebase project, replace the config in `src/firebase.ts`.

---

## Built with Claude Code
