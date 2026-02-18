import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { DEFAULT_TEAMS, C, LogoMark, SESSION_KEY, ROLE_KEY, TEAM_IDX_KEY, btnPrimary } from "./styles.jsx";
import LobbyView from "./LobbyView.jsx";
import SessionsOverview from "./SessionsOverview.jsx";
import SetupView from "./SetupView.jsx";
import ScoringView from "./ScoringView.jsx";
import LeaderboardView from "./LeaderboardView.jsx";
import PlayerView from "./PlayerView.jsx";
import ManageView from "./ManageView.jsx";
import GuideView from "./GuideView.jsx";

function App() {
  const [roundsData, setRoundsData] = useState(null);
  const [roundOrder, setRoundOrder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sessionCode, setSessionCode] = useState(null);
  const [view, setView] = useState("lobby");
  const [teams, setTeams] = useState(DEFAULT_TEAMS);
  const [teamCount, setTeamCount] = useState(10);
  const [scores, setScores] = useState({});
  const [activeRound, setActiveRound] = useState(null);
  const [showAnswers, setShowAnswers] = useState(true);
  const [sessionStatus, setSessionStatus] = useState("open");
  const [revealCount, setRevealCount] = useState(0);
  const [revealed, setRevealed] = useState(false);

  // Player role state
  const [role, setRole] = useState("host"); // "host" | "player"
  const [playerTeamIdx, setPlayerTeamIdx] = useState(null);
  const [answers, setAnswers] = useState({});

  const initialized = useRef(false);
  const saveTimer = useRef(null);

  const restoreSession = useCallback((session, quizRoundOrder) => {
    setSessionCode(session.id);
    localStorage.setItem(SESSION_KEY, session.id);
    setTeams(session.teams || DEFAULT_TEAMS);
    setTeamCount(session.teamCount || 10);
    setScores(session.scores || {});
    setAnswers(session.answers || {});
    setActiveRound(session.activeRound || quizRoundOrder[0]);
    setView(session.view === "lobby" ? "setup" : (session.view || "setup"));
    setShowAnswers(session.showAnswers !== undefined ? session.showAnswers : true);
    setSessionStatus(session.status || "open");
    // Restore role from localStorage
    const savedRole = localStorage.getItem(ROLE_KEY);
    const savedTeamIdx = localStorage.getItem(TEAM_IDX_KEY);
    if (savedRole) setRole(savedRole);
    if (savedTeamIdx !== null) setPlayerTeamIdx(parseInt(savedTeamIdx));
  }, []);

  // Load quiz data + try to resume session from localStorage
  useEffect(() => {
    const savedCode = localStorage.getItem(SESSION_KEY);

    const quizPromise = fetch("/api/quiz-data").then(r => {
      if (!r.ok) throw new Error(`Failed to load quiz data (${r.status})`);
      return r.json();
    });

    const sessionPromise = savedCode
      ? fetch(`/api/session/${savedCode}`).then(r => r.ok ? r.json().then(d => d.session) : null)
      : Promise.resolve(null);

    Promise.all([quizPromise, sessionPromise])
      .then(([quizData, session]) => {
        setRoundsData(quizData.rounds);
        setRoundOrder(quizData.roundOrder);
        if (session) {
          restoreSession(session, quizData.roundOrder);
        } else {
          localStorage.removeItem(SESSION_KEY);
          localStorage.removeItem(ROLE_KEY);
          localStorage.removeItem(TEAM_IDX_KEY);
          setActiveRound(quizData.roundOrder[0]);
          setView("lobby");
        }
        setLoading(false);
        initialized.current = true;
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [restoreSession]);

  // Auto-save session to Cosmos DB (debounced 500ms) — host only
  useEffect(() => {
    if (!initialized.current || !sessionCode || view === "lobby" || sessionStatus === "closed" || role === "player") return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch(`/api/session/${sessionCode}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teams, teamCount, scores, activeRound, view, showAnswers }),
      }).catch(() => {}).finally(() => { saveTimer.current = null; });
    }, 500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [teams, teamCount, scores, activeRound, view, showAnswers, sessionCode, sessionStatus, role]);

  // Poll for remote changes every 3s (real-time sync across devices)
  useEffect(() => {
    if (!initialized.current || !sessionCode || view === "lobby" || view === "sessions" || view === "manage" || view === "guide") return;
    const poll = setInterval(() => {
      if (saveTimer.current) return;
      fetch(`/api/session/${sessionCode}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (!d?.session) return;
          const s = d.session;
          setScores(prev => JSON.stringify(prev) === JSON.stringify(s.scores || {}) ? prev : (s.scores || {}));
          setTeams(prev => JSON.stringify(prev) === JSON.stringify(s.teams) ? prev : (s.teams || prev));
          setTeamCount(prev => s.teamCount != null && s.teamCount !== prev ? s.teamCount : prev);
          setShowAnswers(prev => s.showAnswers !== undefined && s.showAnswers !== prev ? s.showAnswers : prev);
          setActiveRound(prev => s.activeRound && s.activeRound !== prev ? s.activeRound : prev);
          setSessionStatus(prev => { const st = s.status || "open"; return st !== prev ? st : prev; });
          setAnswers(prev => JSON.stringify(prev) === JSON.stringify(s.answers || {}) ? prev : (s.answers || {}));
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(poll);
  }, [sessionCode, view]);

  const handleNewSession = useCallback(() => {
    return fetch("/api/session", { method: "POST" })
      .then(r => { if (!r.ok) throw new Error("Failed to create session"); return r.json(); })
      .then(d => {
        setRole("host");
        localStorage.setItem(ROLE_KEY, "host");
        localStorage.removeItem(TEAM_IDX_KEY);
        restoreSession(d.session, roundOrder);
        setView("setup");
        initialized.current = true;
      });
  }, [roundOrder, restoreSession]);

  const handleJoinSession = useCallback((code) => {
    return fetch(`/api/session/${code}`)
      .then(r => { if (!r.ok) throw new Error("Session not found"); return r.json(); })
      .then(d => {
        setRole("host");
        localStorage.setItem(ROLE_KEY, "host");
        localStorage.removeItem(TEAM_IDX_KEY);
        restoreSession(d.session, roundOrder);
        initialized.current = true;
      });
  }, [roundOrder, restoreSession]);

  const handleJoinAsPlayer = useCallback((code, teamIdx) => {
    return fetch(`/api/session/${code}`)
      .then(r => { if (!r.ok) throw new Error("Session not found"); return r.json(); })
      .then(d => {
        restoreSession(d.session, roundOrder);
        setRole("player");
        setPlayerTeamIdx(teamIdx);
        setAnswers(d.session.answers || {});
        localStorage.setItem(ROLE_KEY, "player");
        localStorage.setItem(TEAM_IDX_KEY, String(teamIdx));
        initialized.current = true;
      });
  }, [roundOrder, restoreSession]);

  const handleLeaveSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(TEAM_IDX_KEY);
    setSessionCode(null);
    setView("lobby");
    setTeams([...DEFAULT_TEAMS]);
    setTeamCount(10);
    setScores({});
    setAnswers({});
    setActiveRound(roundOrder[0] || null);
    setShowAnswers(true);
    setSessionStatus("open");
    setRevealCount(0);
    setRevealed(false);
    setRole("host");
    setPlayerTeamIdx(null);
    initialized.current = false;
  }, [roundOrder]);

  const handleToggleSessionStatus = useCallback(() => {
    if (!sessionCode) return Promise.resolve();
    const newStatus = sessionStatus === "open" ? "closed" : "open";
    return fetch(`/api/session/${sessionCode}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
      .then(r => { if (!r.ok) throw new Error("Failed to update status"); return r.json(); })
      .then(() => { setSessionStatus(newStatus); });
  }, [sessionCode, sessionStatus]);

  const activeTeams = useMemo(() => teams.slice(0, teamCount), [teams, teamCount]);

  const setScore = useCallback((teamIdx, questionId, value) => {
    setScores(prev => {
      const key = `${teamIdx}-${questionId}`;
      const n = { ...prev };
      if (prev[key] === value) delete n[key]; else n[key] = value;
      return n;
    });
  }, []);

  const getTeamRoundScore = useCallback((teamIdx, roundId) => {
    if (!roundsData?.[roundId]) return 0;
    return roundsData[roundId].questions.reduce((sum, q) => sum + (scores[`${teamIdx}-${q.id}`] === 1 ? 1 : 0), 0);
  }, [scores, roundsData]);

  const getTeamTotal = useCallback((teamIdx) => {
    return roundOrder.reduce((sum, rid) => sum + getTeamRoundScore(teamIdx, rid), 0);
  }, [getTeamRoundScore, roundOrder]);

  const leaderboard = useMemo(() => {
    const data = activeTeams.map((name, idx) => ({
      name, idx, total: getTeamTotal(idx),
      rounds: roundOrder.reduce((a, rid) => { a[rid] = getTeamRoundScore(idx, rid); return a; }, {}),
    }));
    data.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
    let rank = 1;
    data.forEach((item, i) => { if (i > 0 && item.total < data[i - 1].total) rank = i + 1; item.rank = rank; });
    return data;
  }, [activeTeams, getTeamTotal, getTeamRoundScore, roundOrder]);

  const handleRoundsChanged = useCallback((newRoundsData, newRoundOrder) => {
    setRoundsData(newRoundsData);
    setRoundOrder(newRoundOrder);
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.greenDeep, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <LogoMark size="lg" />
        <div style={{ marginTop: 24, color: C.sage, fontFamily: "'Inter', sans-serif", fontSize: 14 }}>Loading...</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: C.greenDeep, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 400, padding: 20 }}>
        <LogoMark size="lg" />
        <div style={{ marginTop: 24, color: C.wrong, fontFamily: "'Inter', sans-serif", fontSize: 14 }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{ ...btnPrimary, marginTop: 16 }}>Retry</button>
      </div>
    </div>
  );

  // Player view — separate route that bypasses host views
  if (role === "player" && playerTeamIdx !== null && sessionCode) {
    return (
      <PlayerView
        sessionCode={sessionCode}
        teamIdx={playerTeamIdx}
        teamName={teams[playerTeamIdx] || `Team ${playerTeamIdx + 1}`}
        activeRound={activeRound}
        roundsData={roundsData}
        roundOrder={roundOrder}
        answers={answers}
        sessionStatus={sessionStatus}
        onLeave={handleLeaveSession}
      />
    );
  }

  if (view === "lobby") return <LobbyView onNewSession={handleNewSession} onJoinSession={handleJoinSession} onViewSessions={() => setView("sessions")} onJoinAsPlayer={handleJoinAsPlayer} onManageQuiz={() => setView("manage")} onGuide={() => setView("guide")} />;
  if (view === "sessions") return <SessionsOverview onBack={() => setView("lobby")} onJoinSession={handleJoinSession} />;
  if (view === "manage") return <ManageView roundsData={roundsData} roundOrder={roundOrder} onBack={() => setView("lobby")} onRoundsChanged={handleRoundsChanged} />;
  if (view === "guide") return <GuideView onBack={() => setView("lobby")} />;
  if (view === "setup") return <SetupView teams={teams} setTeams={setTeams} teamCount={teamCount} setTeamCount={setTeamCount} onStart={() => setView("scoring")} onLeaveSession={handleLeaveSession} sessionCode={sessionCode} readOnly={sessionStatus === "closed"} hasScores={Object.keys(scores).length > 0} />;
  if (view === "leaderboard") return <LeaderboardView leaderboard={leaderboard} onBack={() => setView("scoring")} revealed={revealed} setRevealed={setRevealed} revealCount={revealCount} setRevealCount={setRevealCount} roundsData={roundsData} roundOrder={roundOrder} sessionCode={sessionCode} />;
  return (
    <ScoringView
      activeRound={activeRound} setActiveRound={setActiveRound} activeTeams={activeTeams}
      scores={scores} setScore={setScore} getTeamRoundScore={getTeamRoundScore}
      showAnswers={showAnswers} setShowAnswers={setShowAnswers}
      onLeaderboard={() => { setRevealed(false); setRevealCount(0); setView("leaderboard"); }}
      onSetup={() => setView("setup")}
      roundsData={roundsData} roundOrder={roundOrder} sessionCode={sessionCode}
      sessionStatus={sessionStatus} onToggleStatus={handleToggleSessionStatus}
      answers={answers}
    />
  );
}

export default App;
