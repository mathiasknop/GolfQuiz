# GolfQuiz

A real-time golf quiz and scoring app built for **The National Golf Brussels**.

## About

Interactive quiz night application featuring 9 rounds of golf trivia with host-controlled rounds, live scoring with auto-score, team answer submission, and a dramatic leaderboard reveal. Supports up to 20 teams with multiple players per team.

### Quiz Rounds

- **Series 1-7** — Themed question rounds (Ryder Cup, New Superstars, Women's Golf, Golf in Belgium, Old Superstars, The Open, The Majors)
- **Varia** — 15 mixed golf knowledge questions (runs alongside Series 2-4)
- **Photo** — Identify 10 golf legends from photos (runs alongside Series 5-6)

Maximum total score: **67 points**

## How It Works

### Host Flow
1. Create a session via the admin panel (`/admin`) — generates a session code (`GQ-XXXX`) and a 4-digit Host PIN
2. Set up teams (names, count) on the Setup screen
3. Print QR codes — one branded A4 page per team with QR code, session code, and Team PIN
4. Open rounds in any order — navigate to a round tab and tap **Open Round**; a per-round timer starts automatically
5. Close rounds independently — tap **Close Round** to lock answers (e.g. to show PowerPoint answer slides) without opening the next round; tap **Reopen** if closed by mistake
6. Score answers — tap correct/wrong per team, or use **Auto-score** for fuzzy matching (handles typos, accents, partial names)
7. Monitor team status — green dots show which teams have active players online
8. Reveal the leaderboard at the end (one team at a time, or all at once)

### Player Flow
1. Scan the QR code on the table (auto-joins) or enter the session code + Team PIN manually
2. Wait for the host to open a round — questions appear automatically when a round opens
3. Answer questions on your phone — open text, multiple choice, image, or pick-from-list
4. Review previous rounds — after the host moves on, go back to see correct answers alongside your submissions
5. Multiple players per team can join simultaneously and see each other's answers in real time

## Tech Stack

- **Frontend:** React 19 (Vite), inline styles, no CSS files
- **Backend:** Azure Functions v4 (Node.js, ESM)
- **Database:** Azure Cosmos DB (sessions + rounds containers)
- **Hosting:** Azure Static Web Apps with GitHub Actions CI/CD
- **QR Codes:** `qrcode` npm package (client-side generation)

## Project Structure

```
WebApp/
├── src/
│   ├── golf-quiz.jsx        # Main App component, state management, polling
│   ├── styles.jsx            # Shared constants, palette, components
│   ├── LobbyView.jsx         # Session join screen (host + player)
│   ├── SetupView.jsx         # Team setup + QR code printing
│   ├── ScoringView.jsx       # Score entry grid, auto-score, round controls
│   ├── PlayerView.jsx        # Player answer submission, round visibility
│   ├── LeaderboardView.jsx   # Leaderboard reveal
│   ├── QRCodesView.jsx       # Printable QR codes (one A4 per team)
│   ├── AdminView.jsx         # Admin panel (PINs, session management)
│   ├── GuideView.jsx         # Help & guide
│   └── ...
├── api/src/functions/
│   ├── session.js            # Session CRUD, auth, answer submission, heartbeat
│   ├── rounds.js             # Quiz rounds CRUD
│   └── getQuizData.js        # Serves quiz data
└── package.json
```

## Development

```bash
cd WebApp
npm install
npm run dev
```

The API runs locally via Azure Static Web Apps CLI or Azure Functions Core Tools.

## Security

- **Host PIN** — 4-digit PIN required to join as host or save session data
- **Team PINs** — 4-digit PIN per team, required to submit answers
- **Admin Key** — protects admin panel operations (session listing, PIN resets)
- **Round validation** — server rejects answers for rounds that aren't currently open or are explicitly closed
- All PINs are stripped from public API responses
