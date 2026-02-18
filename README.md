# GolfQuiz

A real-time golf quiz and scoring app built for **The National Golf Brussels**.

## About

Interactive quiz night application featuring 9 rounds of golf trivia with live scoring, team answer submission, and a dramatic leaderboard reveal. Supports up to 20 teams with multiple players per team.

### Quiz Rounds

- **Series 1-7** — Themed question rounds (Ryder Cup, New Superstars, Women's Golf, Golf in Belgium, Old Superstars, The Open, The Majors)
- **Varia** — 15 mixed golf knowledge questions (runs alongside Series 2-4)
- **Photo** — Identify 10 golf legends from photos (runs alongside Series 5-6)

Maximum total score: **67 points**

## How It Works

### Host Flow
1. Create a session via the admin panel (`/admin`) — generates a session code (`GQ-XXXX`) and a 4-digit Host PIN
2. Set up teams (names, count) on the Setup screen
3. Print QR codes for each team table (one per team, contains session code + Team PIN)
4. Score answers during each round — tap correct/wrong per team per question
5. Reveal the leaderboard at the end (one team at a time, or all at once)

### Player Flow
1. Scan the QR code on the table (auto-joins) or enter the session code + Team PIN manually
2. Answer questions on your phone — open text, multiple choice, image, or pick-from-list
3. Multiple players per team can join simultaneously and see each other's answers in real time

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
│   ├── ScoringView.jsx       # Score entry grid
│   ├── PlayerView.jsx        # Player answer submission
│   ├── LeaderboardView.jsx   # Leaderboard reveal
│   ├── QRCodesView.jsx       # Printable QR code sheet
│   ├── AdminView.jsx         # Admin panel (PINs, session management)
│   ├── GuideView.jsx         # Help & guide
│   └── ...
├── api/src/functions/
│   ├── session.js            # Session CRUD, auth, answer submission
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
- All PINs are stripped from public API responses
