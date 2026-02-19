import { useState } from "react";
import { C, HERO_BG, LogoMark, btnGhost } from "./styles.jsx";

export default function GuideView({ onBack }) {
  const [open, setOpen] = useState(null);
  const toggle = (key) => setOpen(prev => prev === key ? null : key);

  const overlay = { position: "fixed", inset: 0, zIndex: 0, backgroundImage: `url(${HERO_BG})`, backgroundSize: "cover", backgroundPosition: "center" };
  const darkOverlay = { position: "fixed", inset: 0, zIndex: 1, background: "rgba(0,0,0,0.72)" };
  const scrollWrap = { position: "relative", zIndex: 2, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 16px 48px", fontFamily: "'Inter',sans-serif", color: C.cream };

  const sectionCard = { background: C.greenDark, borderRadius: 6, border: `1px solid ${C.border}`, marginBottom: 12, overflow: "hidden" };
  const sectionHeader = (isOpen) => ({
    padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
    background: isOpen ? C.greenMid : "transparent", transition: "background 0.15s",
  });
  const sectionBody = { padding: "0 20px 20px", lineHeight: 1.7, fontSize: 14, color: C.sage };
  const h3Style = { fontSize: 14, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: 0, color: C.cream };
  const chevron = (isOpen) => ({ fontSize: 11, color: C.sage, transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" });
  const strong = { color: C.cream, fontWeight: 600 };
  const tableWrap = { overflowX: "auto", margin: "12px 0" };
  const table = { width: "100%", borderCollapse: "collapse", fontSize: 13 };
  const th = { textAlign: "left", padding: "8px 12px", borderBottom: `1px solid ${C.border}`, color: C.cream, fontWeight: 600, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" };
  const td = { padding: "8px 12px", borderBottom: `1px solid ${C.borderLight}`, color: C.sage, verticalAlign: "top" };

  const sections = [
    {
      key: "start", title: "Getting Started",
      body: (
        <>
          <p>Open the app in any browser. The <span style={strong}>Lobby</span> gives you two options:</p>
          <div style={tableWrap}>
            <table style={table}>
              <thead><tr><th style={th}>Action</th><th style={th}>Who it's for</th></tr></thead>
              <tbody>
                <tr><td style={td}><span style={strong}>Join as Host</span></td><td style={td}>Quiz master — enter session code + Host PIN</td></tr>
                <tr><td style={td}><span style={strong}>Join as Player</span></td><td style={td}>Team members — enter session code, pick team, enter Team PIN</td></tr>
              </tbody>
            </table>
          </div>
          <p>The <span style={strong}>admin panel</span> (accessible at <code style={{ background: C.greenMid, padding: "1px 6px", borderRadius: 3, fontSize: 12 }}>/admin</code>) is where you create new sessions, view all sessions, manage quiz rounds, and reset PINs.</p>
        </>
      ),
    },
    {
      key: "host", title: "For the Host",
      body: (
        <>
          <p style={{ ...h3Style, fontSize: 12, marginBottom: 8, marginTop: 4 }}>1. Create a Session</p>
          <p>Go to <code style={{ background: C.greenMid, padding: "1px 6px", borderRadius: 3, fontSize: 12 }}>/admin</code> and tap <span style={strong}>New Quiz Session</span>. The app generates a unique session code (e.g. <code style={{ background: C.greenMid, padding: "1px 6px", borderRadius: 3, fontSize: 12 }}>GQ-K7MP</code>) and a 4-digit <span style={strong}>Host PIN</span>. Save both — you need the Host PIN to rejoin as host.</p>

          <p style={{ ...h3Style, fontSize: 12, marginBottom: 8, marginTop: 16 }}>2. Set Up Teams</p>
          <p>On the <span style={strong}>Setup</span> screen, use the slider to set the number of teams (2-20) and edit each team name. All changes are saved automatically.</p>

          <p style={{ ...h3Style, fontSize: 12, marginBottom: 8, marginTop: 16 }}>3. Print QR Codes</p>
          <p>Tap <span style={strong}>Print QR Codes</span> on the Setup screen. Each team gets a full <span style={strong}>A4 page</span> with the club branding, team name, QR code, and join instructions. Print and place one page on each table before the quiz starts.</p>

          <p style={{ ...h3Style, fontSize: 12, marginBottom: 8, marginTop: 16 }}>4. Control the Rounds</p>
          <p>The host controls which round is open for answers. Navigate to any round tab and tap <span style={strong}>Open Round</span> to start it — rounds can be opened in any order. A per-round <span style={strong}>timer</span> starts automatically when you open a round.</p>
          <p>Tap <span style={{ color: C.gold, fontWeight: 600 }}>Close Round</span> to lock answers without opening the next round — useful when you want to show answer slides in your presentation first. Tap <span style={strong}>Next Round</span> when you're ready to move on, or <span style={strong}>Reopen</span> if you closed by mistake (the timer resumes from where it stopped).</p>
          <p>A <span style={{ color: C.correctBright }}>green dot</span> next to each team name shows which teams have an active player connected. A <span style={{ color: C.sageMuted }}>gray dot</span> means no player has been seen in the last 15 seconds.</p>

          <p style={{ ...h3Style, fontSize: 12, marginBottom: 8, marginTop: 16 }}>5. Score the Quiz</p>
          <p>The <span style={strong}>Scoring</span> screen shows round tabs across the top. For each question, tap <span style={{ color: C.correct }}>&#10003;</span> (correct) or <span style={{ color: C.wrong }}>&#10007;</span> (wrong). Tap again to undo. Player answers are shown below each score button so you can verify them.</p>
          <div style={tableWrap}>
            <table style={table}>
              <thead><tr><th style={th}>Button</th><th style={th}>What it does</th></tr></thead>
              <tbody>
                <tr><td style={td}><span style={strong}>Open Round</span></td><td style={td}>Open the currently viewed round for player answers (works on any round)</td></tr>
                <tr><td style={td}><span style={{ color: C.gold, fontWeight: 600 }}>Close Round</span></td><td style={td}>Lock answers for the current round without opening the next one</td></tr>
                <tr><td style={td}><span style={strong}>Reopen</span></td><td style={td}>Undo a round close — timer resumes from where it stopped</td></tr>
                <tr><td style={td}><span style={strong}>Next Round</span></td><td style={td}>Close the current round and open the next sequential round</td></tr>
                <tr><td style={td}><span style={{ color: C.gold, fontWeight: 600 }}>Auto-score</span></td><td style={td}>Automatically scores unanswered questions using fuzzy matching (typos, partial names, accents). Override any result.</td></tr>
                <tr><td style={td}><span style={strong}>Show / Hide Answers</span></td><td style={td}>Toggle a row showing the correct answer per question</td></tr>
                <tr><td style={td}><span style={strong}>Setup</span></td><td style={td}>Go back to edit teams</td></tr>
                <tr><td style={td}><span style={strong}>Leaderboard</span></td><td style={td}>Open the leaderboard reveal</td></tr>
                <tr><td style={td}><span style={strong}>Close / Reopen</span></td><td style={td}>Lock or unlock the entire session</td></tr>
              </tbody>
            </table>
          </div>

          <p style={{ ...h3Style, fontSize: 12, marginBottom: 8, marginTop: 16 }}>6. Reveal the Leaderboard</p>
          <p>Tap <span style={strong}>Reveal #N</span> to show teams one at a time from last place to first, or tap <span style={strong}>Show All</span> to reveal everyone at once. Top 3 teams get gold, silver and bronze medals.</p>

          <p style={{ ...h3Style, fontSize: 12, marginBottom: 8, marginTop: 16 }}>7. Resume a Session</p>
          <p>If you close the browser, return to the lobby and enter your session code and <span style={strong}>Host PIN</span> to rejoin. The app picks up exactly where you left off.</p>
        </>
      ),
    },
    {
      key: "player", title: "For Players",
      body: (
        <>
          <p style={{ ...h3Style, fontSize: 12, marginBottom: 8, marginTop: 4 }}>1. Join a Session</p>
          <p>There are two ways to join:</p>
          <div style={tableWrap}>
            <table style={table}>
              <thead><tr><th style={th}>Method</th><th style={th}>How</th></tr></thead>
              <tbody>
                <tr><td style={td}><span style={strong}>Scan QR code</span></td><td style={td}>Scan the QR code on your table — it joins you automatically</td></tr>
                <tr><td style={td}><span style={strong}>Manual entry</span></td><td style={td}>Enter the session code, tap <span style={strong}>Find</span>, select your team, then enter your 4-digit Team PIN</td></tr>
              </tbody>
            </table>
          </div>
          <p>Multiple players on the same team can join at the same time — everyone sees each other's answers in real time.</p>

          <p style={{ ...h3Style, fontSize: 12, marginBottom: 8, marginTop: 16 }}>2. Answer Questions</p>
          <p>You'll see a "Waiting for the host to start the quiz..." message until the host opens the first round. Once a round is open, it appears automatically. Depending on the question type:</p>
          <div style={tableWrap}>
            <table style={table}>
              <thead><tr><th style={th}>Type</th><th style={th}>How to answer</th></tr></thead>
              <tbody>
                <tr><td style={td}><span style={strong}>Open</span></td><td style={td}>Type your answer in the text field</td></tr>
                <tr><td style={td}><span style={strong}>Multiple choice</span></td><td style={td}>Tap one of the four options</td></tr>
                <tr><td style={td}><span style={strong}>Image</span></td><td style={td}>Look at the projected screen, then type your answer</td></tr>
                <tr><td style={td}><span style={strong}>Pick from list</span></td><td style={td}>Tap the correct name from the pill list</td></tr>
              </tbody>
            </table>
          </div>
          <p>Tap <span style={strong}>Submit</span> to send your answer. You can change it and tap <span style={strong}>Update</span> while the round is still open.</p>

          <p style={{ ...h3Style, fontSize: 12, marginBottom: 8, marginTop: 16 }}>3. Review Previous Rounds</p>
          <p>When the host moves to the next round, previous rounds become read-only. You can tap any closed round tab to review the questions and see the <span style={{ color: C.correctBright }}>correct answers</span> alongside your submitted answer.</p>

          <p style={{ ...h3Style, fontSize: 12, marginBottom: 8, marginTop: 16 }}>4. Session Closed</p>
          <p>When the host closes the session, a red banner appears and all inputs are locked. Tap <span style={strong}>Leave</span> to return to the lobby.</p>
        </>
      ),
    },
    {
      key: "rounds", title: "Quiz Rounds",
      body: (
        <>
          <p>The quiz consists of 9 rounds:</p>
          <div style={tableWrap}>
            <table style={table}>
              <thead><tr><th style={th}>Round</th><th style={th}>Topic</th><th style={th}>Max Points</th></tr></thead>
              <tbody>
                <tr><td style={td}>Series 1</td><td style={td}>Ryder Cup</td><td style={td}>6</td></tr>
                <tr><td style={td}>Series 2</td><td style={td}>New Superstars</td><td style={td}>6</td></tr>
                <tr><td style={td}>Series 3</td><td style={td}>Women's Golf</td><td style={td}>6</td></tr>
                <tr><td style={td}>Series 4</td><td style={td}>Golf in Belgium</td><td style={td}>6</td></tr>
                <tr><td style={td}>Series 5</td><td style={td}>Old Superstars</td><td style={td}>6</td></tr>
                <tr><td style={td}>Series 6</td><td style={td}>The Open</td><td style={td}>6</td></tr>
                <tr><td style={td}>Series 7</td><td style={td}>The Majors</td><td style={td}>6</td></tr>
                <tr><td style={td}>Varia</td><td style={td}>During Series 2-3-4</td><td style={td}>15</td></tr>
                <tr><td style={td}>Photo</td><td style={td}>During Series 5-6</td><td style={td}>10</td></tr>
              </tbody>
            </table>
          </div>
          <p>Maximum total score: <span style={strong}>67 points</span></p>
        </>
      ),
    },
    {
      key: "quick", title: "Quick Reference",
      body: (
        <>
          <div style={tableWrap}>
            <table style={table}>
              <thead><tr><th style={th}>Topic</th><th style={th}>Detail</th></tr></thead>
              <tbody>
                <tr><td style={td}><span style={strong}>Session code</span></td><td style={td}><code style={{ background: C.greenMid, padding: "1px 6px", borderRadius: 3, fontSize: 12 }}>GQ-XXXX</code> (4 characters)</td></tr>
                <tr><td style={td}><span style={strong}>Host PIN</span></td><td style={td}>4-digit code to rejoin as host</td></tr>
                <tr><td style={td}><span style={strong}>Team PINs</span></td><td style={td}>4-digit code per team — printed on QR cards or entered manually</td></tr>
                <tr><td style={td}><span style={strong}>Max teams</span></td><td style={td}>20</td></tr>
                <tr><td style={td}><span style={strong}>Sync</span></td><td style={td}>Automatic every 3 seconds across all devices</td></tr>
                <tr><td style={td}><span style={strong}>Browser support</span></td><td style={td}>Any modern browser (Chrome, Safari, Firefox, Edge)</td></tr>
                <tr><td style={td}><span style={strong}>Works offline?</span></td><td style={td}>No — requires an internet connection</td></tr>
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      key: "tips", title: "Tips",
      body: (
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li style={{ marginBottom: 8 }}><span style={strong}>Projector setup:</span> Open the app on a laptop connected to the projector. Use the Scoring view during rounds and switch to the Leaderboard for the reveal.</li>
          <li style={{ marginBottom: 8 }}><span style={strong}>Print QR codes beforehand:</span> Print the QR pages from the Setup screen (one A4 per team) and place them on each table before the quiz starts.</li>
          <li style={{ marginBottom: 8 }}><span style={strong}>Player devices:</span> Players only need their phone — scan the QR code or enter the code and PIN manually. The interface is mobile-optimised.</li>
          <li style={{ marginBottom: 8 }}><span style={strong}>Use Auto-score:</span> After players submit their answers, tap Auto-score to let fuzzy matching handle most scoring automatically. It handles typos, accents, and partial names. Review the results and override where needed.</li>
          <li style={{ marginBottom: 8 }}><span style={strong}>Close Round for answer slides:</span> Close the round to lock answers, show your PowerPoint answer slides, then open the next round when ready. The per-round timer tracks how long each round takes.</li>
          <li style={{ marginBottom: 8 }}><span style={strong}>Mid-quiz break:</span> Close the session to lock answers, reopen when you resume.</li>
          <li style={{ marginBottom: 8 }}><span style={strong}>Multiple hosts:</span> Any device with the Host PIN can rejoin as host — but avoid two hosts scoring at the same time.</li>
        </ul>
      ),
    },
  ];

  return (
    <div>
      <div style={overlay} />
      <div style={darkOverlay} />
      <div style={scrollWrap}>
        <div style={{ width: "100%", maxWidth: 600, paddingTop: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
            <LogoMark size="md" />
            <h1 style={{ fontSize: 20, fontWeight: 800, textTransform: "uppercase", letterSpacing: 4, color: C.cream, margin: 0 }}>
              Help &amp; Guide
            </h1>
          </div>
          <button onClick={onBack} style={{ ...btnGhost, marginTop: 8, marginBottom: 24, fontSize: 13 }}>
            &larr; Back
          </button>

          {sections.map(s => (
            <div key={s.key} style={sectionCard}>
              <div style={sectionHeader(open === s.key)} onClick={() => toggle(s.key)}>
                <h3 style={h3Style}>{s.title}</h3>
                <span style={chevron(open === s.key)}>&#9654;</span>
              </div>
              {open === s.key && <div style={sectionBody}>{s.body}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
