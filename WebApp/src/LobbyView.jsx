import { useState } from "react";
import { C, HERO_BG, LogoMark, btnPrimary, btnGhost } from "./styles.jsx";

export default function LobbyView({ onNewSession, onJoinSession, onViewSessions, onJoinAsPlayer, onManageQuiz, onGuide, onAdmin }) {
  const [joinCode, setJoinCode] = useState("");
  const [joinPin, setJoinPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [joinError, setJoinError] = useState(null);

  // Player join state
  const [playerCode, setPlayerCode] = useState("");
  const [playerTeams, setPlayerTeams] = useState(null);
  const [playerTeamIdx, setPlayerTeamIdx] = useState(null);
  const [playerError, setPlayerError] = useState(null);
  const [playerBusy, setPlayerBusy] = useState(false);

  const handleNew = () => {
    setBusy(true);
    onNewSession().catch(() => setBusy(false));
  };

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    const pin = joinPin.trim();
    if (!code || !pin) return;
    setBusy(true);
    setJoinError(null);
    onJoinSession(code, pin).catch(() => {
      setJoinError("Session not found. Check the code and try again.");
      setBusy(false);
    });
  };

  const handleFindSession = () => {
    const code = playerCode.trim().toUpperCase();
    if (!code) return;
    setPlayerBusy(true);
    setPlayerError(null);
    setPlayerTeams(null);
    setPlayerTeamIdx(null);
    fetch(`/api/session/${code}`)
      .then(r => r.ok ? r.json() : Promise.reject("not found"))
      .then(d => {
        const sess = d.session;
        if (sess.status === "closed") throw new Error("This session is closed.");
        setPlayerTeams(sess.teams.slice(0, sess.teamCount));
        setPlayerBusy(false);
      })
      .catch(err => {
        setPlayerError(typeof err === "string" ? "Session not found." : err.message);
        setPlayerBusy(false);
      });
  };

  const handlePlay = () => {
    if (playerTeamIdx === null) return;
    setPlayerBusy(true);
    onJoinAsPlayer(playerCode.trim().toUpperCase(), playerTeamIdx)
      .catch(() => { setPlayerError("Failed to join."); setPlayerBusy(false); });
  };

  return (
    <div style={{ minHeight: "100vh", background: `url(${HERO_BG}) center/cover no-repeat fixed`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ position: "fixed", inset: 0, background: C.overlay, zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 400, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <LogoMark size="lg" />
          <div style={{ marginTop: 24, fontFamily: "'Inter', sans-serif", fontSize: 12, letterSpacing: 5, textTransform: "uppercase", color: C.sage, fontWeight: 300 }}>
            Quiz Session
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Host: New session */}
          <div style={{ background: C.greenDark, borderRadius: 4, padding: "24px", border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ fontSize: 13, color: C.sage, marginBottom: 14, fontFamily: "'Inter', sans-serif" }}>Start fresh with a new session code</div>
            <button onClick={handleNew} disabled={busy} style={{ ...btnPrimary, width: "100%", opacity: busy ? 0.6 : 1 }}>
              {busy ? "Creating..." : "New Quiz Session"}
            </button>
          </div>

          <div style={{ textAlign: "center", fontSize: 11, color: C.sageDark, fontFamily: "'Inter', sans-serif", letterSpacing: 2, textTransform: "uppercase" }}>or</div>

          {/* Host: Join existing */}
          <div style={{ background: C.greenDark, borderRadius: 4, padding: "24px", border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ fontSize: 13, color: C.sage, marginBottom: 14, fontFamily: "'Inter', sans-serif" }}>Join an existing session as host</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                value={joinCode} placeholder="e.g. GQ-7K3M"
                onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError(null); }}
                onKeyDown={e => e.key === "Enter" && handleJoin()}
                style={{ flex: 1, padding: "10px 14px", border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 15, background: C.greenDeep, color: C.cream, outline: "none", fontFamily: "'Inter', sans-serif", letterSpacing: 2, textAlign: "center" }}
                onFocus={e => e.target.style.borderColor = C.greenSoft}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={joinPin} placeholder="Host PIN"
                type="password" inputMode="numeric" maxLength={4}
                onChange={e => { setJoinPin(e.target.value.replace(/[^0-9]/g, "")); setJoinError(null); }}
                onKeyDown={e => e.key === "Enter" && handleJoin()}
                style={{ width: 100, padding: "10px 14px", border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 15, background: C.greenDeep, color: C.cream, outline: "none", fontFamily: "'Inter', sans-serif", letterSpacing: 4, textAlign: "center" }}
                onFocus={e => e.target.style.borderColor = C.greenSoft}
                onBlur={e => e.target.style.borderColor = C.border}
              />
              <button onClick={handleJoin} disabled={busy || !joinCode.trim() || !joinPin.trim()} style={{ ...btnPrimary, flex: 1, opacity: (busy || !joinCode.trim() || !joinPin.trim()) ? 0.6 : 1, padding: "10px 20px" }}>Join as Host</button>
            </div>
            {joinError && <div style={{ marginTop: 10, fontSize: 12, color: C.wrong, fontFamily: "'Inter', sans-serif" }}>{joinError}</div>}
          </div>

          <div style={{ textAlign: "center", fontSize: 11, color: C.sageDark, fontFamily: "'Inter', sans-serif", letterSpacing: 2, textTransform: "uppercase" }}>or</div>

          {/* Player: Join as player */}
          <div style={{ background: C.greenDark, borderRadius: 4, padding: "24px", border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ fontSize: 13, color: C.sage, marginBottom: 14, fontFamily: "'Inter', sans-serif" }}>Join as a player</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={playerCode} placeholder="e.g. GQ-7K3M"
                onChange={e => { setPlayerCode(e.target.value.toUpperCase()); setPlayerError(null); setPlayerTeams(null); setPlayerTeamIdx(null); }}
                onKeyDown={e => e.key === "Enter" && handleFindSession()}
                style={{ flex: 1, padding: "10px 14px", border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 15, background: C.greenDeep, color: C.cream, outline: "none", fontFamily: "'Inter', sans-serif", letterSpacing: 2, textAlign: "center" }}
                onFocus={e => e.target.style.borderColor = C.greenSoft}
                onBlur={e => e.target.style.borderColor = C.border}
              />
              <button onClick={handleFindSession} disabled={playerBusy || !playerCode.trim()} style={{ ...btnPrimary, opacity: (playerBusy || !playerCode.trim()) ? 0.6 : 1, padding: "10px 20px" }}>
                Find
              </button>
            </div>
            {playerError && <div style={{ marginTop: 10, fontSize: 12, color: C.wrong, fontFamily: "'Inter', sans-serif" }}>{playerError}</div>}

            {playerTeams && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, color: C.sage, marginBottom: 8, fontFamily: "'Inter', sans-serif", letterSpacing: 1.5, textTransform: "uppercase" }}>Select your team</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {playerTeams.map((name, idx) => (
                    <button key={idx} onClick={() => setPlayerTeamIdx(idx)} style={{
                      padding: "8px 14px", borderRadius: 3, cursor: "pointer", fontSize: 12, fontFamily: "'Inter', sans-serif",
                      background: playerTeamIdx === idx ? C.cream : C.greenMid,
                      color: playerTeamIdx === idx ? C.greenDeep : C.sage,
                      border: playerTeamIdx === idx ? "none" : `1px solid ${C.border}`,
                      fontWeight: playerTeamIdx === idx ? 600 : 400,
                      transition: "all 0.15s",
                    }}>
                      {name || `Team ${idx + 1}`}
                    </button>
                  ))}
                </div>
                <button onClick={handlePlay} disabled={playerTeamIdx === null || playerBusy} style={{ ...btnPrimary, width: "100%", marginTop: 12, opacity: (playerTeamIdx === null || playerBusy) ? 0.6 : 1 }}>
                  {playerBusy ? "Joining..." : "Join as Player"}
                </button>
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: 8, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <button onClick={onViewSessions} style={{ ...btnGhost, fontSize: 11, letterSpacing: 2 }}>View All Sessions</button>
            <button onClick={onManageQuiz} style={{ ...btnGhost, fontSize: 11, letterSpacing: 2 }}>Manage Quiz</button>
            <button onClick={onGuide} style={{ ...btnGhost, fontSize: 11, letterSpacing: 2 }}>Help &amp; Guide</button>
            <button onClick={onAdmin} style={{ ...btnGhost, fontSize: 11, letterSpacing: 2 }}>Admin</button>
          </div>
        </div>
      </div>
    </div>
  );
}
