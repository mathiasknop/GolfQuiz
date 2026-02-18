import { useState } from "react";

export default function GuideView({ C, HERO_BG, LogoMark, btnGhost, onBack }) {
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
  const pill = (color) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: color + "22", color, marginRight: 6 });

  const sections = [
    {
      key: "start", title: "Getting Started",
      body: (
        <>
          <p>Open the app in any browser. The <span style={strong}>Lobby</span> gives you three options:</p>
          <div style={tableWrap}>
            <table style={table}>
              <thead><tr><th style={th}>Action</th><th style={th}>Who it's for</th></tr></thead>
              <tbody>
                <tr><td style={td}><span style={strong}>New Quiz Session</span></td><td style={td}>Host starting a fresh quiz night</td></tr>
                <tr><td style={td}><span style={strong}>Join Existing Session</span></td><td style={td}>Host resuming a previous session</td></tr>
              </tbody>
            </table>
          </div>
          <p>At the bottom of the lobby you'll also find links to <span style={strong}>View All Sessions</span> and this guide.</p>
        </>
      ),
    },
    {
      key: "host", title: "For the Host",
      body: (
        <>
          <p style={{ ...h3Style, fontSize: 12, marginBottom: 8, marginTop: 4 }}>1. Create a Session</p>
          <p>Tap <span style={strong}>New Quiz Session</span>. The app generates a unique session code (e.g. <code style={{ background: C.greenMid, padding: "1px 6px", borderRadius: 3, fontSize: 12 }}>GQ-K7MP</code>). Share this code with all participants.</p>

          <p style={{ ...h3Style, fontSize: 12, marginBottom: 8, marginTop: 16 }}>2. Set Up Teams</p>
          <p>On the <span style={strong}>Setup</span> screen, use the slider to set the number of teams (2-20) and edit each team name. Tap <span style={strong}>Start Scoring</span> when ready. All changes are saved automatically.</p>

          <p style={{ ...h3Style, fontSize: 12, marginBottom: 8, marginTop: 16 }}>3. Score the Quiz</p>
          <p>The <span style={strong}>Scoring</span> screen shows round tabs across the top. For each question, tap <span style={{ color: C.correct }}>&#10003;</span> (correct) or <span style={{ color: C.wrong }}>&#10007;</span> (wrong). Tap again to undo.</p>
          <div style={tableWrap}>
            <table style={table}>
              <thead><tr><th style={th}>Button</th><th style={th}>What it does</th></tr></thead>
              <tbody>
                <tr><td style={td}><span style={strong}>Show / Hide Answers</span></td><td style={td}>Toggle a row showing the correct answer per question</td></tr>
                <tr><td style={td}><span style={strong}>Setup</span></td><td style={td}>Go back to edit teams</td></tr>
                <tr><td style={td}><span style={strong}>Leaderboard</span></td><td style={td}>Open the leaderboard reveal</td></tr>
                <tr><td style={td}><span style={strong}>Close / Reopen</span></td><td style={td}>Lock or unlock the session</td></tr>
              </tbody>
            </table>
          </div>

          <p style={{ ...h3Style, fontSize: 12, marginBottom: 8, marginTop: 16 }}>4. Reveal the Leaderboard</p>
          <p>Tap <span style={strong}>Reveal #N</span> to show teams one at a time from last place to first, or tap <span style={strong}>Show All</span> to reveal everyone at once. Top 3 teams get gold, silver and bronze medals.</p>

          <p style={{ ...h3Style, fontSize: 12, marginBottom: 8, marginTop: 16 }}>5. Resume a Session</p>
          <p>If you close the browser, return to the lobby and enter your session code under <span style={strong}>Join Existing Session</span>. The app picks up exactly where you left off. You can also use <span style={strong}>View All Sessions</span> to see and rejoin any session.</p>
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
          <li style={{ marginBottom: 8 }}><span style={strong}>Mid-quiz break:</span> Close the session to lock answers, reopen when you resume.</li>
          <li style={{ marginBottom: 8 }}><span style={strong}>Multiple hosts:</span> Any device that joins with the session code can score — but avoid two hosts scoring at the same time.</li>
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
