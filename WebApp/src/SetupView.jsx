import { useState } from "react";
import { C, HERO_BG, LogoMark, CopyButton, SessionBadge, labelStyle, btnPrimary, btnGhost } from "./styles.jsx";
import QRCodesView from "./QRCodesView.jsx";
import AnswerSheetsView from "./AnswerSheetsView.jsx";

export default function SetupView({ teams, setTeams, teamCount, setTeamCount, onStart, onLeaveSession, sessionCode, readOnly, hasScores, hostPin, roundsData, roundOrder }) {
  const [showQR, setShowQR] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showAnswerSheets, setShowAnswerSheets] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: `url(${HERO_BG}) center/cover no-repeat fixed`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ position: "fixed", inset: 0, background: C.overlay, zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 440, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <LogoMark size="lg" />
          <div style={{ marginTop: 16 }}><SessionBadge code={sessionCode} /></div>
          {hostPin && (
            <div style={{ marginTop: 12, fontFamily: "'Inter', sans-serif", textAlign: "center" }}>
              {showPin ? (
                <>
                  <div style={{ fontSize: 11, color: C.sage, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Host PIN</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.10)", borderRadius: 6, padding: "8px 20px" }}>
                    <span style={{ color: C.cream, fontWeight: 800, letterSpacing: 6, fontSize: 24 }}>{hostPin}</span>
                    <CopyButton text={hostPin} size={18} />
                  </div>
                  <div style={{ fontSize: 10, color: C.sageDark, marginTop: 6, cursor: "pointer", textDecoration: "underline" }} onClick={() => setShowPin(false)}>Hide PIN</div>
                </>
              ) : (
                <div style={{ fontSize: 11, color: C.sageDark, cursor: "pointer", textDecoration: "underline" }} onClick={() => setShowPin(true)}>
                  Show Host PIN
                </div>
              )}
            </div>
          )}
          <div style={{ marginTop: 12, fontFamily: "'Inter', sans-serif", fontSize: 12, letterSpacing: 5, textTransform: "uppercase", color: C.sage, fontWeight: 300 }}>
            Quiz Session
          </div>
        </div>

        {readOnly && (
          <div style={{ background: "rgba(196, 92, 92, 0.12)", border: "1px solid rgba(196, 92, 92, 0.3)", borderRadius: 4, padding: "10px 16px", marginBottom: 16, textAlign: "center", fontSize: 12, color: C.wrong, fontFamily: "'Inter', sans-serif" }}>
            This session is closed. Editing is disabled.
          </div>
        )}

        <div style={{ background: C.greenDark, borderRadius: 4, padding: "28px 24px", border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.4)", opacity: readOnly ? 0.7 : 1 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Number of teams: <span style={{ color: C.cream, fontWeight: 500 }}>{teamCount}</span></label>
            <input type="range" min={2} max={20} value={teamCount} onChange={e => setTeamCount(Number(e.target.value))}
              disabled={readOnly}
              style={{ width: "100%", accentColor: C.greenSoft, marginTop: 6 }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.sageDark, marginTop: 2 }}><span>2</span><span>20</span></div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Team names</label>
            <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, marginTop: 8, paddingRight: 4 }}>
              {Array.from({ length: teamCount }, (_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 22, textAlign: "right", fontSize: 11, color: C.sageDark, fontWeight: 500, flexShrink: 0 }}>{i + 1}</span>
                  <input
                    value={teams[i] || ""} placeholder={`Team ${i + 1}`}
                    onChange={e => { const n = [...teams]; while (n.length <= i) n.push(""); n[i] = e.target.value; setTeams(n); }}
                    disabled={readOnly}
                    style={{ flex: 1, padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 13, background: C.greenDeep, color: C.cream, outline: "none", fontFamily: "'Inter', sans-serif" }}
                    onFocus={e => e.target.style.borderColor = C.greenSoft}
                    onBlur={e => e.target.style.borderColor = C.border}
                  />
                </div>
              ))}
            </div>
          </div>

          <button onClick={onStart} style={{ ...btnPrimary, width: "100%" }}>{readOnly ? "View Scores" : hasScores ? "Back to Scoring" : "Start Scoring"}</button>
          {hostPin && <button onClick={() => setShowQR(true)} style={{ ...btnGhost, width: "100%", marginTop: 8, fontSize: 12 }}>Print QR Codes</button>}
          {roundOrder && roundOrder.length > 0 && <button onClick={() => setShowAnswerSheets(true)} style={{ ...btnGhost, width: "100%", marginTop: 8, fontSize: 12 }}>Print Answer Sheets</button>}
          <button onClick={onLeaveSession} style={{ ...btnGhost, width: "100%", marginTop: 8, fontSize: 12 }}>Leave Session</button>
        </div>
      </div>
      {showQR && <QRCodesView sessionCode={sessionCode} teams={teams} teamCount={teamCount} hostPin={hostPin} onClose={() => setShowQR(false)} />}
      {showAnswerSheets && <AnswerSheetsView roundsData={roundsData} roundOrder={roundOrder} teams={teams} teamCount={teamCount} sessionCode={sessionCode} onClose={() => setShowAnswerSheets(false)} />}
    </div>
  );
}
