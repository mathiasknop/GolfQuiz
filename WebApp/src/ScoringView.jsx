import { C, LogoMark, SessionBadge, btnPrimary, btnAccent, btnGhost, thStyle, ansCell, tdStyle } from "./styles.jsx";

function ScoreButton({ value, onChange, disabled }) {
  const isCorrect = value === 1;
  const isWrong = value === 0;
  return (
    <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
      <button onClick={() => !disabled && onChange(1)} style={{
        width: 30, height: 30, borderRadius: 3, border: "none", cursor: disabled ? "default" : "pointer", fontSize: 13, fontWeight: 700,
        background: isCorrect ? C.correct : C.greenMid, color: isCorrect ? C.creamBright : C.sageMuted,
        transition: "all 0.12s", fontFamily: "'Inter', sans-serif", opacity: disabled && !isCorrect ? 0.5 : 1,
      }}>{"\u2713"}</button>
      <button onClick={() => !disabled && onChange(0)} style={{
        width: 30, height: 30, borderRadius: 3, border: "none", cursor: disabled ? "default" : "pointer", fontSize: 13, fontWeight: 700,
        background: isWrong ? C.wrong : C.greenMid, color: isWrong ? C.creamBright : C.sageMuted,
        transition: "all 0.12s", fontFamily: "'Inter', sans-serif", opacity: disabled && !isWrong ? 0.5 : 1,
      }}>{"\u2717"}</button>
    </div>
  );
}

export default function ScoringView({ activeRound, setActiveRound, activeTeams, scores, setScore, getTeamRoundScore, showAnswers, setShowAnswers, onLeaderboard, onSetup, onLeaveSession, roundsData, roundOrder, sessionCode, sessionStatus, onToggleStatus, answers }) {
  const round = roundsData[activeRound];
  const isClosed = sessionStatus === "closed";
  return (
    <div style={{ minHeight: "100vh", background: C.greenDeep, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      {/* Top bar */}
      <div style={{ background: C.greenDark, padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogoMark size="sm" />
          <SessionBadge code={sessionCode} />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={onLeaveSession} style={{ ...btnGhost, fontSize: 9 }}>Exit</button>
          <button onClick={onToggleStatus} style={{ ...btnGhost, fontSize: 9, color: isClosed ? C.correct : C.wrong }}>
            {isClosed ? "Reopen" : "Close"}
          </button>
          <button onClick={onSetup} style={btnGhost}>Setup</button>
          <button onClick={onLeaderboard} style={btnAccent}>Leaderboard</button>
        </div>
      </div>

      {isClosed && (
        <div style={{ background: "rgba(196, 92, 92, 0.12)", borderBottom: "1px solid rgba(196, 92, 92, 0.3)", padding: "8px 16px", textAlign: "center", fontSize: 12, color: C.wrong, fontFamily: "'Inter', sans-serif" }}>
          Session closed {"\u2014"} scoring is locked
        </div>
      )}

      {/* Round tabs */}
      <div style={{ padding: "10px 12px 8px", overflowX: "auto", whiteSpace: "nowrap", background: C.greenDeep, borderBottom: `1px solid ${C.borderLight}` }}>
        <div style={{ display: "inline-flex", gap: 4 }}>
          {roundOrder.map(rid => {
            const r = roundsData[rid];
            const isActive = rid === activeRound;
            const lbl = r.type === "series" ? `S${rid.slice(-1)}` : r.type === "varia" ? "Varia" : "Photo";
            return (
              <button key={rid} onClick={() => setActiveRound(rid)} style={{
                padding: "6px 14px", borderRadius: 3, cursor: "pointer", fontSize: 11, fontWeight: isActive ? 600 : 400,
                letterSpacing: 1.5, textTransform: "uppercase", transition: "all 0.15s",
                background: isActive ? C.cream : "transparent", color: isActive ? C.greenDeep : C.sage,
                border: isActive ? "none" : `1px solid ${C.borderLight}`,
                fontFamily: "'Inter', sans-serif",
              }}>{lbl}</button>
            );
          })}
        </div>
      </div>

      {/* Round header */}
      <div style={{ padding: "16px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 300, color: C.cream, letterSpacing: 3, textTransform: "uppercase" }}>{round.name}</h2>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: C.sage, letterSpacing: 1 }}>{round.subtitle} {"\u00B7"} {round.maxPts} pts</p>
        </div>
        <button onClick={() => setShowAnswers(!showAnswers)} style={{
          ...btnGhost, fontSize: 10,
          color: showAnswers ? C.cream : C.sageDark,
          borderColor: showAnswers ? C.borderMed : C.borderLight,
        }}>
          {showAnswers ? "Hide Answers" : "Show Answers"}
        </button>
      </div>

      {/* Scoring table */}
      <div style={{ padding: "0 12px 100px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, position: "sticky", left: 0, zIndex: 10, minWidth: 120, textAlign: "left", paddingLeft: 12 }}>Team</th>
              {round.questions.map(q => (
                <th key={q.id} style={{ ...thStyle, minWidth: 44 }}>{q.label}</th>
              ))}
              <th style={{ ...thStyle, minWidth: 44, background: C.greenAccent }}>Tot</th>
            </tr>
            {showAnswers && (
              <tr>
                <td style={{ ...ansCell, position: "sticky", left: 0, zIndex: 10, fontWeight: 600, fontSize: 10, textAlign: "left", paddingLeft: 12 }}>Answers</td>
                {round.questions.map(q => (
                  <td key={q.id} style={{ ...ansCell, fontSize: 9, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis" }} title={q.answer}>{q.answer}</td>
                ))}
                <td style={ansCell}></td>
              </tr>
            )}
          </thead>
          <tbody>
            {activeTeams.map((team, tIdx) => {
              const roundScore = getTeamRoundScore(tIdx, activeRound);
              const bg = tIdx % 2 === 0 ? C.greenDark : C.greenDeep;
              return (
                <tr key={tIdx}>
                  <td style={{ ...tdStyle, position: "sticky", left: 0, zIndex: 5, background: bg, fontWeight: 500, color: C.cream, paddingLeft: 12, textAlign: "left" }}>
                    {team || `Team ${tIdx + 1}`}
                  </td>
                  {round.questions.map(q => {
                    const val = scores[`${tIdx}-${q.id}`];
                    const playerAnswer = answers?.[`${tIdx}-${q.id}`];
                    return (
                      <td key={q.id} style={{ ...tdStyle, background: bg, padding: 3 }}>
                        <ScoreButton value={val} onChange={v => setScore(tIdx, q.id, v)} disabled={isClosed} />
                        {playerAnswer && (
                          <div style={{ fontSize: 8, color: C.sage, marginTop: 2, maxWidth: 60, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }} title={playerAnswer}>
                            {playerAnswer}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700, fontSize: 15, background: bg, color: roundScore > 0 ? C.creamBright : C.sageDark }}>
                    {roundScore}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
