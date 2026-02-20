import { useState } from "react";
import { C, HERO_BG, LogoMark, btnPrimary, btnGhost } from "./styles.jsx";

const LANG_KEY = "gq-lang";

export default function LobbyView({ onJoinSession, onJoinAsPlayer, onGuide }) {
  const [joinCode, setJoinCode] = useState("GQ-");
  const [joinPin, setJoinPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [joinError, setJoinError] = useState(null);

  // Player join state
  const [playerCode, setPlayerCode] = useState("GQ-");
  const [playerTeams, setPlayerTeams] = useState(null);
  const [playerTeamIdx, setPlayerTeamIdx] = useState(null);
  const [playerPin, setPlayerPin] = useState("");
  const [playerError, setPlayerError] = useState(null);
  const [playerBusy, setPlayerBusy] = useState(false);
  const [playerLang, setPlayerLang] = useState(() => localStorage.getItem(LANG_KEY) || "en");

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    const pin = joinPin.trim();
    if (code.length <= 3 || !pin) return;
    setBusy(true);
    setJoinError(null);
    onJoinSession(code, pin).catch(() => {
      setJoinError("Session not found. Check the code and try again.");
      setBusy(false);
    });
  };

  const handleFindSession = () => {
    const code = playerCode.trim().toUpperCase();
    if (code.length <= 3) return;
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
    if (playerTeamIdx === null || !playerPin.trim() || playerPin.length < 4) return;
    setPlayerBusy(true);
    localStorage.setItem(LANG_KEY, playerLang);
    onJoinAsPlayer(playerCode.trim().toUpperCase(), playerTeamIdx, playerPin.trim())
      .catch(() => { setPlayerError("Invalid PIN or failed to join."); setPlayerBusy(false); });
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
          {/* Host: Join existing */}
          <div style={{ background: C.greenDark, borderRadius: 4, padding: "24px", border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ fontSize: 13, color: C.sage, marginBottom: 14, fontFamily: "'Inter', sans-serif" }}>Join an existing session as host</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                value={joinCode} placeholder="e.g. GQ-7K3M"
                onChange={e => { const v = e.target.value.toUpperCase(); setJoinCode(v.startsWith("GQ-") ? v : "GQ-"); setJoinError(null); }}
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
                style={{ width: 130, padding: "10px 14px", border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 15, background: C.greenDeep, color: C.cream, outline: "none", fontFamily: "'Inter', sans-serif", letterSpacing: 4, textAlign: "center" }}
                onFocus={e => e.target.style.borderColor = C.greenSoft}
                onBlur={e => e.target.style.borderColor = C.border}
              />
              <button onClick={handleJoin} disabled={busy || joinCode.trim().length <= 3 || !joinPin.trim()} style={{ ...btnPrimary, flex: 1, opacity: (busy || joinCode.trim().length <= 3 || !joinPin.trim()) ? 0.6 : 1, padding: "10px 20px" }}>Join as Host</button>
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
                onChange={e => { const v = e.target.value.toUpperCase(); setPlayerCode(v.startsWith("GQ-") ? v : "GQ-"); setPlayerError(null); setPlayerTeams(null); setPlayerTeamIdx(null); setPlayerPin(""); }}
                onKeyDown={e => e.key === "Enter" && handleFindSession()}
                style={{ flex: 1, padding: "10px 14px", border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 15, background: C.greenDeep, color: C.cream, outline: "none", fontFamily: "'Inter', sans-serif", letterSpacing: 2, textAlign: "center" }}
                onFocus={e => e.target.style.borderColor = C.greenSoft}
                onBlur={e => e.target.style.borderColor = C.border}
              />
              <button onClick={handleFindSession} disabled={playerBusy || playerCode.trim().length <= 3} style={{ ...btnPrimary, opacity: (playerBusy || playerCode.trim().length <= 3) ? 0.6 : 1, padding: "10px 20px" }}>
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
                {/* Language picker */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, color: C.sage, marginBottom: 6, fontFamily: "'Inter', sans-serif", letterSpacing: 1.5, textTransform: "uppercase" }}>Language</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[["en", "English"], ["nl", "Nederlands"], ["fr", "Français"]].map(([code, label]) => (
                      <button key={code} onClick={() => setPlayerLang(code)} style={{
                        padding: "8px 14px", borderRadius: 3, cursor: "pointer", fontSize: 12, fontFamily: "'Inter', sans-serif",
                        background: playerLang === code ? C.cream : C.greenMid,
                        color: playerLang === code ? C.greenDeep : C.sage,
                        border: playerLang === code ? "none" : `1px solid ${C.border}`,
                        fontWeight: playerLang === code ? 600 : 400,
                        transition: "all 0.15s", flex: 1,
                      }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {playerTeamIdx !== null && (
                  <div style={{ marginTop: 10 }}>
                    <input
                      value={playerPin} placeholder="Team PIN" type="text" inputMode="numeric" maxLength={4}
                      onChange={e => { setPlayerPin(e.target.value.replace(/[^0-9]/g, "")); setPlayerError(null); }}
                      onKeyDown={e => e.key === "Enter" && handlePlay()}
                      style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 18, background: C.greenDeep, color: C.cream, outline: "none", fontFamily: "'Inter', sans-serif", letterSpacing: 6, textAlign: "center" }}
                      onFocus={e => e.target.style.borderColor = C.greenSoft}
                      onBlur={e => e.target.style.borderColor = C.border}
                    />
                  </div>
                )}
                <button onClick={handlePlay} disabled={playerTeamIdx === null || !playerPin.trim() || playerPin.length < 4 || playerBusy} style={{ ...btnPrimary, width: "100%", marginTop: 12, opacity: (playerTeamIdx === null || !playerPin.trim() || playerPin.length < 4 || playerBusy) ? 0.6 : 1 }}>
                  {playerBusy ? "Joining..." : "Join as Player"}
                </button>
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button onClick={onGuide} style={{ ...btnGhost, fontSize: 11, letterSpacing: 2 }}>Help &amp; Guide</button>
          </div>

          <div style={{ textAlign: "center", marginTop: 32, fontFamily: "'Inter', sans-serif", fontSize: 10, color: C.sageMuted, lineHeight: 1.6, letterSpacing: 0.5 }}>
            Quiz by Erwin Deseyn &middot; App by Mathias Knop
          </div>
        </div>
      </div>
    </div>
  );
}
