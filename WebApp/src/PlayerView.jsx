import { useState, useEffect, useCallback } from "react";
import { C, HERO_BG, LogoMark, SessionBadge, TEAM_PIN_KEY, btnPrimary, btnGhost } from "./styles.jsx";

export default function PlayerView({
  sessionCode,
  teamIdx,
  teamName,
  activeRound,
  roundsData,
  roundOrder,
  answers,
  sessionStatus,
  openRounds,
  roundClosed,
  onLeave,
}) {
  const [localAnswers, setLocalAnswers] = useState({});
  const [submitting, setSubmitting] = useState({});
  const visibleRounds = roundOrder ? roundOrder.filter(rid => (openRounds || []).includes(rid)) : [];
  const currentRound = openRounds && openRounds.length > 0 ? openRounds[openRounds.length - 1] : null;
  const [selectedTab, setSelectedTab] = useState(currentRound || activeRound || (roundOrder && roundOrder[0]) || null);
  const isRoundAnswerable = (rid) => rid === currentRound && sessionStatus === "open" && !roundClosed;
  const isRoundClosed = (rid) => (openRounds || []).includes(rid) && (rid !== currentRound || roundClosed);

  // Merge server answers into local state (only this team's answers)
  useEffect(() => {
    if (!answers) return;
    const merged = {};
    const prefix = `${teamIdx}-`;
    for (const key of Object.keys(answers)) {
      if (key.startsWith(prefix)) {
        const qId = key.slice(prefix.length);
        merged[qId] = answers[key];
      }
    }
    setLocalAnswers((prev) => ({ ...prev, ...merged }));
  }, [answers, teamIdx]);

  // Auto-navigate to newly opened round
  useEffect(() => {
    if (currentRound) setSelectedTab(currentRound);
  }, [currentRound]);

  const round = roundsData && selectedTab ? roundsData[selectedTab] : null;

  const submitAnswer = useCallback(
    async (questionId, value) => {
      if (sessionStatus === "closed") return;
      if (!isRoundAnswerable(selectedTab)) return;
      setSubmitting((prev) => ({ ...prev, [questionId]: true }));
      try {
        const pin = localStorage.getItem(TEAM_PIN_KEY) || "";
        const res = await fetch(`/api/session/${sessionCode}/answer`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-team-pin": pin },
          body: JSON.stringify({ teamIdx, questionId, answer: value, roundId: selectedTab }),
        });
        if (res.ok) {
          setLocalAnswers((prev) => ({ ...prev, [questionId]: value }));
        }
      } catch (e) {
        console.error("Submit failed:", e);
      } finally {
        setSubmitting((prev) => ({ ...prev, [questionId]: false }));
      }
    },
    [sessionCode, teamIdx, sessionStatus, currentRound, selectedTab] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const getTabLabel = (key) => {
    if (key === "varia") return "Varia";
    if (key === "photo") return "Photo";
    if (key.startsWith("s")) return key.toUpperCase();
    return key;
  };

  const isClosed = sessionStatus === "closed";

  return (
    <div style={{ minHeight: "100vh", background: C.greenDeep, fontFamily: "'Inter', sans-serif" }}>
      {/* Sticky header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: C.greenDeep,
          borderBottom: `1px solid ${C.border}`,
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <LogoMark size="sm" />
        <SessionBadge code={sessionCode} />
        <div
          style={{
            background: C.cream,
            color: C.greenDeep,
            fontWeight: 600,
            fontSize: 12,
            padding: "4px 10px",
            borderRadius: 3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: 120,
          }}
        >
          {teamName}
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={onLeave}
          style={{
            ...btnGhost,
            fontSize: 12,
            padding: "6px 12px",
            minHeight: 44,
            minWidth: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {"\u2190"} Leave
        </button>
      </div>

      {/* Status banner */}
      {isClosed && (
        <div style={{ background: "#b91c1c", color: "#fff", textAlign: "center", padding: "10px 12px", fontSize: 13, fontWeight: 600 }}>
          Session is closed {"\u2014"} answers are locked
        </div>
      )}
      {!isClosed && selectedTab && isRoundClosed(selectedTab) && (
        <div style={{ background: "rgba(90, 158, 106, 0.15)", color: C.correctBright, textAlign: "center", padding: "10px 12px", fontSize: 13, fontWeight: 600 }}>
          Round closed {"\u2014"} review correct answers below
        </div>
      )}

      {/* Round tabs */}
      {visibleRounds.length > 0 ? (
        <div
          style={{
            display: "flex",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            gap: 4,
            padding: "10px 12px",
            background: C.greenDeep,
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          {visibleRounds.map((key) => {
            const isActive = key === selectedTab;
            const isCurrent = key === currentRound;
            return (
              <button
                key={key}
                onClick={() => setSelectedTab(key)}
                style={{
                  flex: "0 0 auto",
                  padding: "8px 14px",
                  minHeight: 44,
                  borderRadius: 3,
                  border: isActive ? `1px solid ${C.gold}` : isCurrent ? `1px solid ${C.correct}` : `1px solid ${C.border}`,
                  background: isActive ? C.greenMid : "transparent",
                  color: isActive ? C.cream : isCurrent ? C.correctBright : C.sage,
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 13,
                  fontFamily: "'Inter', sans-serif",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {getTabLabel(key)}{isCurrent && !isActive ? " \u25CF" : ""}
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: "center", color: C.sage, fontSize: 14, padding: "40px 20px" }}>
          Waiting for the host to start the quiz...
        </div>
      )}

      {/* Question cards */}
      <div style={{ padding: "12px 12px 80px 12px" }}>
        {!selectedTab || !visibleRounds.includes(selectedTab) ? (
          visibleRounds.length > 0 ? (
            <div style={{ textAlign: "center", color: C.sage, fontSize: 14, padding: "40px 20px" }}>
              Select a round above.
            </div>
          ) : null
        ) : round && round.questions && round.questions.length > 0 ? (
          round.questions.map((q) => {
            const serverAnswer = answers ? answers[`${teamIdx}-${q.id}`] : undefined;
            const localVal = localAnswers[q.id] || "";
            const isSubmitted = serverAnswer !== undefined && serverAnswer !== null;
            const isLoading = submitting[q.id] || false;
            const answerable = isRoundAnswerable(selectedTab);
            const disabled = !answerable;
            const roundIsClosed = isRoundClosed(selectedTab);

            return (
              <div
                key={q.id}
                style={{
                  background: C.greenDark,
                  border: `1px solid ${C.border}`,
                  borderRadius: 4,
                  padding: 16,
                  marginBottom: 8,
                }}
              >
                {/* Question label & text */}
                <div style={{ fontWeight: 700, color: C.cream, fontSize: 14, marginBottom: 4 }}>
                  {q.label}
                </div>
                <div style={{ color: C.sage, fontSize: 13, marginBottom: roundIsClosed && q.answer ? 6 : 12 }}>{q.text}</div>

                {/* Correct answer reveal for closed rounds */}
                {roundIsClosed && q.answer && (
                  <div style={{
                    marginBottom: 12, padding: "8px 12px", borderRadius: 3,
                    background: "rgba(90, 158, 106, 0.12)", border: `1px solid rgba(90, 158, 106, 0.25)`,
                    color: C.correctBright, fontSize: 13, fontWeight: 600,
                  }}>
                    {"\u2713"} {q.answer}
                  </div>
                )}

                {q.type === "image" && (
                  <div style={{ color: C.sage, fontSize: 12, fontStyle: "italic", marginBottom: 10 }}>
                    (Look at the projected screen)
                  </div>
                )}

                {/* Input area: multiple-choice */}
                {q.type === "multiple-choice" && q.options && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    {q.options.map((opt, i) => {
                      const isSelected = localVal === opt;
                      return (
                        <button
                          key={i}
                          disabled={disabled}
                          onClick={() =>
                            setLocalAnswers((prev) => ({ ...prev, [q.id]: opt }))
                          }
                          style={{
                            padding: 12,
                            borderRadius: 3,
                            fontSize: 13,
                            fontFamily: "'Inter', sans-serif",
                            cursor: disabled ? "not-allowed" : "pointer",
                            minHeight: 44,
                            border: isSelected ? "none" : `1px solid ${C.border}`,
                            background: isSelected ? C.cream : C.greenMid,
                            color: isSelected ? C.greenDeep : C.sage,
                            fontWeight: isSelected ? 600 : 400,
                            opacity: disabled ? 0.6 : 1,
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Input area: open or image */}
                {(q.type === "open" || q.type === "image") && (
                  <div style={{ marginBottom: 12 }}>
                    <input
                      type="text"
                      value={localVal}
                      disabled={disabled}
                      onChange={(e) =>
                        setLocalAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      placeholder="Type your answer..."
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: 12,
                        background: C.greenDeep,
                        color: C.cream,
                        border: `1px solid ${C.border}`,
                        borderRadius: 3,
                        fontSize: 13,
                        fontFamily: "'Inter', sans-serif",
                        outline: "none",
                        opacity: disabled ? 0.6 : 1,
                      }}
                    />
                  </div>
                )}

                {/* Input area: pick-from-list */}
                {q.type === "pick-from-list" && q.options && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      marginBottom: 12,
                      maxHeight: 200,
                      overflowY: "auto",
                    }}
                  >
                    {q.options.map((opt, i) => {
                      const isSelected = localVal === opt;
                      return (
                        <button
                          key={i}
                          disabled={disabled}
                          onClick={() =>
                            setLocalAnswers((prev) => ({ ...prev, [q.id]: opt }))
                          }
                          style={{
                            padding: "8px 12px",
                            borderRadius: 3,
                            fontSize: 12,
                            fontFamily: "'Inter', sans-serif",
                            cursor: disabled ? "not-allowed" : "pointer",
                            minHeight: 44,
                            border: isSelected ? "none" : `1px solid ${C.border}`,
                            background: isSelected ? C.cream : C.greenMid,
                            color: isSelected ? C.greenDeep : C.sage,
                            fontWeight: isSelected ? 600 : 400,
                            opacity: disabled ? 0.6 : 1,
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Submit button + submitted indicator */}
                {answerable && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      disabled={isLoading || !localVal}
                      onClick={() => submitAnswer(q.id, localVal)}
                      style={{
                        ...btnPrimary,
                        fontSize: 11,
                        padding: "8px 16px",
                        minHeight: 44,
                        opacity: isLoading || !localVal ? 0.5 : 1,
                        cursor: isLoading || !localVal ? "not-allowed" : "pointer",
                      }}
                    >
                      {isLoading ? "Sending..." : isSubmitted ? "Update" : "Submit"}
                    </button>
                    {isSubmitted && (
                      <span style={{ color: C.gold, fontSize: 12, fontWeight: 600 }}>
                        {"\u2713"} Submitted
                      </span>
                    )}
                  </div>
                )}
                {!answerable && isSubmitted && (
                  <div style={{ fontSize: 12, color: C.sage, fontStyle: "italic" }}>
                    Your answer: {serverAnswer}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: "center", color: C.sage, fontSize: 14, padding: "40px 20px" }}>
            {round ? "No questions in this round yet." : "Waiting for the host to start a round..."}
          </div>
        )}
      </div>
    </div>
  );
}
