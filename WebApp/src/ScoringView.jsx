import { useState, useEffect } from "react";
import { C, LogoMark, SessionBadge, btnPrimary, btnAccent, btnGhost, thStyle, ansCell, tdStyle } from "./styles.jsx";

function normalize(s) {
  return s.toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ").trim();
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function fuzzyMatch(playerAnswer, correctAnswer) {
  const a = normalize(playerAnswer);
  const b = normalize(correctAnswer);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 4 && b.includes(a)) return true;
  if (b.length >= 4 && a.includes(b)) return true;
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return (1 - dist / maxLen) >= 0.7;
}

function formatElapsed(ms) {
  if (ms == null || ms < 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function ScoreButton({ value, onChange, disabled }) {
  const isCorrect = value === 1;
  const isWrong = value === 0;
  return (
    <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
      <button onClick={() => !disabled && onChange(1)} style={{
        width: 30, height: 30, borderRadius: 3, border: "none", cursor: disabled ? "default" : "pointer", fontSize: 13, fontWeight: 700,
        background: isCorrect ? C.correct : C.greenMid, color: isCorrect ? C.creamBright : C.sageMuted,
        transition: "background 0.12s, opacity 0.12s", fontFamily: "'Inter', sans-serif", opacity: disabled && !isCorrect ? 0.5 : 1,
      }}>{"\u2713"}</button>
      <button onClick={() => !disabled && onChange(0)} style={{
        width: 30, height: 30, borderRadius: 3, border: "none", cursor: disabled ? "default" : "pointer", fontSize: 13, fontWeight: 700,
        background: isWrong ? C.wrong : C.greenMid, color: isWrong ? C.creamBright : C.sageMuted,
        transition: "background 0.12s, opacity 0.12s", fontFamily: "'Inter', sans-serif", opacity: disabled && !isWrong ? 0.5 : 1,
      }}>{"\u2717"}</button>
    </div>
  );
}

export default function ScoringView({ activeRound, setActiveRound, activeTeams, scores, setScore, getTeamRoundScore, showAnswers, setShowAnswers, onLeaderboard, onSetup, onLeaveSession, roundsData, roundOrder, sessionCode, sessionStatus, onToggleStatus, answers, openRounds, setOpenRounds, roundClosed, setRoundClosed, roundTimers, setRoundTimers, lastSeen }) {
  const round = roundsData?.[activeRound];
  const isClosed = sessionStatus === "closed";
  const currentOpenRound = openRounds.length > 0 ? openRounds[openRounds.length - 1] : null;
  const nextRoundToOpen = roundOrder.find(rid => !openRounds.includes(rid)) || null;
  const isLive = currentOpenRound && !roundClosed;

  // Timer: ticks every second while a round is live
  const [elapsed, setElapsed] = useState(null);
  useEffect(() => {
    const timer = roundTimers?.[activeRound];
    if (!timer?.start) { setElapsed(null); return; }
    if (timer.end) {
      setElapsed(new Date(timer.end).getTime() - new Date(timer.start).getTime());
      return;
    }
    const tick = () => setElapsed(Date.now() - new Date(timer.start).getTime());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeRound, roundTimers]);

  const handleOpenRound = (roundId) => {
    if (!roundId || openRounds.includes(roundId)) return;
    const now = new Date().toISOString();
    // End timer for current round if it was live
    if (currentOpenRound && !roundTimers?.[currentOpenRound]?.end) {
      setRoundTimers(prev => ({ ...prev, [currentOpenRound]: { ...prev[currentOpenRound], end: now } }));
    }
    // Start timer for new round
    setRoundTimers(prev => ({ ...prev, [roundId]: { start: now } }));
    setOpenRounds(prev => [...prev, roundId]);
    setRoundClosed(false);
    setActiveRound(roundId);
  };

  const handleCloseRound = () => {
    if (!currentOpenRound || roundClosed) return;
    const now = new Date().toISOString();
    setRoundTimers(prev => ({ ...prev, [currentOpenRound]: { ...prev[currentOpenRound], end: now } }));
    setRoundClosed(true);
  };

  const handleReopenRound = () => {
    if (!currentOpenRound || !roundClosed) return;
    // Shift start forward by paused duration so timer resumes from where it stopped
    setRoundTimers(prev => {
      const timer = prev[currentOpenRound];
      if (!timer?.start || !timer?.end) return { ...prev, [currentOpenRound]: { start: timer?.start } };
      const pausedMs = Date.now() - new Date(timer.end).getTime();
      const adjustedStart = new Date(new Date(timer.start).getTime() + pausedMs).toISOString();
      return { ...prev, [currentOpenRound]: { start: adjustedStart } };
    });
    setRoundClosed(false);
  };

  const [autoScoring, setAutoScoring] = useState(false);
  const handleAutoScore = () => {
    if (!round || isClosed || autoScoring) return;
    setAutoScoring(true);
    activeTeams.forEach((_, tIdx) => {
      round.questions.forEach(q => {
        const key = `${tIdx}-${q.id}`;
        if (scores[key] !== undefined) return; // don't overwrite manual scores
        const playerAnswer = answers?.[key];
        if (!playerAnswer || !q.answer) return; // no answer to compare
        setScore(tIdx, q.id, fuzzyMatch(playerAnswer, q.answer) ? 1 : 0);
      });
    });
    setTimeout(() => setAutoScoring(false), 600);
  };
  if (!round) return (
    <div style={{ minHeight: "100vh", background: C.greenDeep, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: C.sage, fontFamily: "'Inter', sans-serif", fontSize: 14 }}>Loading round data...</div>
    </div>
  );

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
            const isOpen = openRounds.includes(rid);
            const isCurrent = rid === currentOpenRound;
            const lbl = r.type === "series" ? `S${rid.slice(-1)}` : r.type === "varia" ? "Varia" : "Photo";
            return (
              <button key={rid} onClick={() => setActiveRound(rid)} style={{
                padding: "6px 14px", borderRadius: 3, cursor: "pointer", fontSize: 11, fontWeight: isActive ? 600 : 400,
                letterSpacing: 1.5, textTransform: "uppercase", transition: "background 0.15s, opacity 0.15s",
                background: isActive ? C.cream : "transparent",
                color: isActive ? C.greenDeep : (isCurrent && !roundClosed) ? C.correctBright : C.sage,
                border: isActive ? "none" : (isCurrent && !roundClosed) ? `1px solid ${C.correct}` : isCurrent && roundClosed ? `1px solid ${C.gold}` : `1px solid ${C.borderLight}`,
                fontFamily: "'Inter', sans-serif",
                opacity: isOpen || isActive ? 1 : 0.45,
              }}>{lbl}{isCurrent && !isActive && !roundClosed ? " \u25CF" : ""}</button>
            );
          })}
        </div>
      </div>

      {/* Round header */}
      <div style={{ padding: "16px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 300, color: C.cream, letterSpacing: 3, textTransform: "uppercase" }}>{round.name}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
            <span style={{ fontSize: 12, color: C.sage, letterSpacing: 1 }}>{round.subtitle} {"\u00B7"} {round.maxPts} pts</span>
            {activeRound === currentOpenRound && !roundClosed && (
              <span style={{ fontSize: 10, color: C.correctBright, fontWeight: 600, letterSpacing: 1 }}>LIVE</span>
            )}
            {activeRound === currentOpenRound && roundClosed && (
              <span style={{ fontSize: 10, color: C.gold, fontWeight: 600, letterSpacing: 1 }}>CLOSED</span>
            )}
            {openRounds.includes(activeRound) && activeRound !== currentOpenRound && (
              <span style={{ fontSize: 10, color: C.sage, letterSpacing: 1 }}>CLOSED</span>
            )}
            {!openRounds.includes(activeRound) && (
              <span style={{ fontSize: 10, color: C.sageMuted, letterSpacing: 1 }}>NOT OPENED</span>
            )}
            {elapsed != null && (
              <span style={{ fontSize: 11, color: (activeRound === currentOpenRound && !roundClosed) ? C.correctBright : C.sage, fontFamily: "monospace", fontWeight: 600, letterSpacing: 1 }}>
                {formatElapsed(elapsed)}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Open this round (visible on any unopened round) */}
          {!openRounds.includes(activeRound) && !isClosed && (
            <button onClick={() => handleOpenRound(activeRound)} style={{
              ...btnPrimary, fontSize: 10, padding: "8px 14px",
              background: C.correct, color: C.creamBright,
            }}>
              Open Round
            </button>
          )}
          {/* Close current round (visible when a round is live) */}
          {isLive && !isClosed && (
            <button onClick={handleCloseRound} style={{
              ...btnGhost, fontSize: 10, color: C.gold, borderColor: C.gold,
            }}>
              Close Round
            </button>
          )}
          {/* Reopen current round (visible when viewing the just-closed round) */}
          {activeRound === currentOpenRound && roundClosed && !isClosed && (
            <button onClick={handleReopenRound} style={{
              ...btnGhost, fontSize: 10,
            }}>
              Reopen
            </button>
          )}
          {/* Next round: go to leaderboard first so host doesn't forget to show standings */}
          {activeRound === currentOpenRound && roundClosed && nextRoundToOpen && !isClosed && (
            <button onClick={onLeaderboard} style={{
              ...btnPrimary, fontSize: 10, padding: "8px 14px",
              background: C.correct, color: C.creamBright,
            }}>
              Next Round
            </button>
          )}
          {!isClosed && (
            <button onClick={handleAutoScore} disabled={autoScoring} style={{
              ...btnGhost, fontSize: 10, color: C.gold, borderColor: C.gold,
              opacity: autoScoring ? 0.5 : 1, cursor: autoScoring ? "default" : "pointer",
            }}>
              {autoScoring ? "Scoring..." : "Auto-score"}
            </button>
          )}
          <button onClick={() => setShowAnswers(!showAnswers)} style={{
            ...btnGhost, fontSize: 10,
            color: showAnswers ? C.cream : C.sageDark,
            borderColor: showAnswers ? C.borderMed : C.borderLight,
          }}>
            {showAnswers ? "Hide Answers" : "Show Answers"}
          </button>
        </div>
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
              const isOnline = lastSeen?.[tIdx] && (Date.now() - new Date(lastSeen[tIdx]).getTime()) < 15000;
              return (
                <tr key={tIdx}>
                  <td style={{ ...tdStyle, position: "sticky", left: 0, zIndex: 5, background: bg, fontWeight: 500, color: C.cream, paddingLeft: 12, textAlign: "left" }}>
                    <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: isOnline ? C.correct : C.sageMuted, marginRight: 6, verticalAlign: "middle" }} />
                    {team || `Team ${tIdx + 1}`}
                  </td>
                  {round.questions.map(q => {
                    const val = scores[`${tIdx}-${q.id}`];
                    const playerAnswer = answers?.[`${tIdx}-${q.id}`];
                    return (
                      <td key={q.id} style={{ ...tdStyle, background: bg, padding: 3 }}>
                        <ScoreButton value={val} onChange={v => setScore(tIdx, q.id, v)} disabled={isClosed} />
                        {playerAnswer && (
                          <div style={{ fontSize: 10, color: C.cream, marginTop: 2, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }} title={playerAnswer}>
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
