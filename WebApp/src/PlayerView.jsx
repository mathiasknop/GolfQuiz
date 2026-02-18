import { useState, useEffect, useCallback } from "react";
import { C, HERO_BG, LogoMark, SessionBadge, btnPrimary, btnGhost } from "./styles.jsx";

export default function PlayerView({
  sessionCode,
  teamIdx,
  teamName,
  activeRound,
  roundsData,
  roundOrder,
  answers,
  sessionStatus,
  onLeave,
}) {
  const [localAnswers, setLocalAnswers] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [selectedTab, setSelectedTab] = useState(activeRound || (roundOrder && roundOrder[0]) || null);

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

  // Keep selected tab in sync with activeRound from host
  useEffect(() => {
    if (activeRound) setSelectedTab(activeRound);
  }, [activeRound]);

  const round = roundsData && selectedTab ? roundsData[selectedTab] : null;

  const submitAnswer = useCallback(
    async (questionId, value) => {
      if (sessionStatus === "closed") return;
      setSubmitting((prev) => ({ ...prev, [questionId]: true }));
      try {
        const res = await fetch(`/api/session/${sessionCode}/answer`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamIdx, questionId, answer: value }),
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
    [sessionCode, teamIdx, sessionStatus]
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

      {/* Closed banner */}
      {isClosed && (
        <div
          style={{
            background: "#b91c1c",
            color: "#fff",
            textAlign: "center",
            padding: "10px 12px",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Session is closed — answers are locked
        </div>
      )}

      {/* Round tabs */}
      {roundOrder && roundOrder.length > 0 && (
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
          {roundOrder.map((key) => {
            const isActive = key === selectedTab;
            return (
              <button
                key={key}
                onClick={() => setSelectedTab(key)}
                style={{
                  flex: "0 0 auto",
                  padding: "8px 14px",
                  minHeight: 44,
                  borderRadius: 3,
                  border: isActive ? `1px solid ${C.gold}` : `1px solid ${C.border}`,
                  background: isActive ? C.greenMid : "transparent",
                  color: isActive ? C.cream : C.sage,
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 13,
                  fontFamily: "'Inter', sans-serif",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {getTabLabel(key)}
              </button>
            );
          })}
        </div>
      )}

      {/* Question cards */}
      <div style={{ padding: "12px 12px 80px 12px" }}>
        {round && round.questions && round.questions.length > 0 ? (
          round.questions.map((q) => {
            const serverAnswer = answers ? answers[`${teamIdx}-${q.id}`] : undefined;
            const localVal = localAnswers[q.id] || "";
            const isSubmitted = serverAnswer !== undefined && serverAnswer !== null;
            const isLoading = submitting[q.id] || false;

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
                <div style={{ color: C.sage, fontSize: 13, marginBottom: 12 }}>{q.text}</div>

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
                          disabled={isClosed}
                          onClick={() =>
                            setLocalAnswers((prev) => ({ ...prev, [q.id]: opt }))
                          }
                          style={{
                            padding: 12,
                            borderRadius: 3,
                            fontSize: 13,
                            fontFamily: "'Inter', sans-serif",
                            cursor: isClosed ? "not-allowed" : "pointer",
                            minHeight: 44,
                            border: isSelected ? "none" : `1px solid ${C.border}`,
                            background: isSelected ? C.cream : C.greenMid,
                            color: isSelected ? C.greenDeep : C.sage,
                            fontWeight: isSelected ? 600 : 400,
                            opacity: isClosed ? 0.6 : 1,
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
                      disabled={isClosed}
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
                        opacity: isClosed ? 0.6 : 1,
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
                          disabled={isClosed}
                          onClick={() =>
                            setLocalAnswers((prev) => ({ ...prev, [q.id]: opt }))
                          }
                          style={{
                            padding: "8px 12px",
                            borderRadius: 3,
                            fontSize: 12,
                            fontFamily: "'Inter', sans-serif",
                            cursor: isClosed ? "not-allowed" : "pointer",
                            minHeight: 44,
                            border: isSelected ? "none" : `1px solid ${C.border}`,
                            background: isSelected ? C.cream : C.greenMid,
                            color: isSelected ? C.greenDeep : C.sage,
                            fontWeight: isSelected ? 600 : 400,
                            opacity: isClosed ? 0.6 : 1,
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Submit button + submitted indicator */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    disabled={isClosed || isLoading || !localVal}
                    onClick={() => submitAnswer(q.id, localVal)}
                    style={{
                      ...btnPrimary,
                      fontSize: 11,
                      padding: "8px 16px",
                      minHeight: 44,
                      opacity: isClosed || isLoading || !localVal ? 0.5 : 1,
                      cursor: isClosed || isLoading || !localVal ? "not-allowed" : "pointer",
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
              </div>
            );
          })
        ) : (
          <div
            style={{
              textAlign: "center",
              color: C.sage,
              fontSize: 14,
              padding: "40px 20px",
            }}
          >
            {round ? "No questions in this round yet." : "Waiting for the host to start a round..."}
          </div>
        )}
      </div>
    </div>
  );
}
