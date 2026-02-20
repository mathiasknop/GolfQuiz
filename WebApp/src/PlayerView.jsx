import { useState, useEffect, useCallback } from "react";
import { C, HERO_BG, LogoMark, SessionBadge, TEAM_PIN_KEY, btnPrimary, btnGhost } from "./styles.jsx";

const LANG_KEY = "gq-lang";

const UI = {
  en: {
    typeAnswer: "Type your answer...",
    lookScreen: "(Look at the projected screen)",
    submitted: "Submitted",
    sending: "Sending...",
    update: "Update",
    submit: "Submit",
    yourAnswer: "Your answer:",
    waitingHost: "Waiting for the host to start the quiz...",
    selectRound: "Select a round above.",
    waitingQuestions: "Waiting for the host to reveal questions...",
    noQuestions: "No questions in this round yet.",
    waitingRound: "Waiting for the host to start a round...",
    sessionClosed: "Session is closed \u2014 answers are locked",
    roundClosed: "Round closed \u2014 answers will be revealed shortly",
    reviewAnswers: "Round closed \u2014 review correct answers below",
    welcome: "Welcome,",
    chooseTeamName: "Choose a creative team name to get started.",
    enterTeamName: "Enter your team name...",
    saving: "Saving...",
    letsGo: "Let's Go!",
    leave: "Leave",
  },
  nl: {
    typeAnswer: "Typ je antwoord...",
    lookScreen: "(Kijk naar het projectiescherm)",
    submitted: "Ingediend",
    sending: "Verzenden...",
    update: "Wijzigen",
    submit: "Indienen",
    yourAnswer: "Jouw antwoord:",
    waitingHost: "Wachten tot de host de quiz start...",
    selectRound: "Selecteer een ronde hierboven.",
    waitingQuestions: "Wachten tot de host de vragen toont...",
    noQuestions: "Nog geen vragen in deze ronde.",
    waitingRound: "Wachten tot de host een ronde start...",
    sessionClosed: "Sessie is gesloten \u2014 antwoorden zijn vergrendeld",
    roundClosed: "Ronde gesloten \u2014 antwoorden worden binnenkort onthuld",
    reviewAnswers: "Ronde gesloten \u2014 bekijk de juiste antwoorden hieronder",
    welcome: "Welkom,",
    chooseTeamName: "Kies een creatieve teamnaam om te beginnen.",
    enterTeamName: "Voer je teamnaam in...",
    saving: "Opslaan...",
    letsGo: "Let's Go!",
    leave: "Verlaten",
  },
  fr: {
    typeAnswer: "Tapez votre réponse...",
    lookScreen: "(Regardez l'écran de projection)",
    submitted: "Envoyé",
    sending: "Envoi...",
    update: "Modifier",
    submit: "Envoyer",
    yourAnswer: "Votre réponse :",
    waitingHost: "En attente du lancement du quiz par l'hôte...",
    selectRound: "Sélectionnez une manche ci-dessus.",
    waitingQuestions: "En attente de la révélation des questions...",
    noQuestions: "Pas encore de questions dans cette manche.",
    waitingRound: "En attente du lancement d'une manche...",
    sessionClosed: "Session fermée \u2014 les réponses sont verrouillées",
    roundClosed: "Manche fermée \u2014 les réponses seront bientôt révélées",
    reviewAnswers: "Manche fermée \u2014 consultez les bonnes réponses ci-dessous",
    welcome: "Bienvenue,",
    chooseTeamName: "Choisissez un nom d'équipe créatif pour commencer.",
    enterTeamName: "Entrez le nom de votre équipe...",
    saving: "Enregistrement...",
    letsGo: "C'est parti !",
    leave: "Quitter",
  },
};

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
  revealedQuestions,
  onLeave,
}) {
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || "en");
  const ui = UI[lang] || UI.en;
  const t = (field) => typeof field === "object" && field !== null ? (field[lang] ?? field.en ?? String(field)) : field;
  const optKey = (opt) => typeof opt === "object" && opt !== null ? (opt.en ?? String(opt)) : opt;
  const changeLang = (l) => { setLang(l); localStorage.setItem(LANG_KEY, l); };

  const [localAnswers, setLocalAnswers] = useState({});
  const [submitting, setSubmitting] = useState({});
  const visibleRounds = roundOrder ? roundOrder.filter(rid => (openRounds || []).includes(rid)) : [];
  const currentRound = openRounds && openRounds.length > 0 ? openRounds[openRounds.length - 1] : null;
  const [selectedTab, setSelectedTab] = useState(currentRound || activeRound || (roundOrder && roundOrder[0]) || null);
  const isRoundAnswerable = (rid) => rid === currentRound && sessionStatus === "open" && !roundClosed;
  const isRoundClosed = (rid) => (openRounds || []).includes(rid) && (rid !== currentRound || roundClosed);
  const isAnswerRevealed = (rid) => (openRounds || []).includes(rid) && rid !== currentRound;

  // Team name editing
  const isDefaultName = /^Team \d+$/.test(teamName);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(isDefaultName ? "" : teamName);
  const [nameSaving, setNameSaving] = useState(false);

  useEffect(() => {
    if (!editingName && !isDefaultName) setNameInput(teamName);
  }, [teamName, editingName, isDefaultName]);

  const submitTeamName = useCallback(async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setNameSaving(true);
    try {
      const pin = localStorage.getItem(TEAM_PIN_KEY) || "";
      const res = await fetch(`/api/session/${sessionCode}/team-name`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-team-pin": pin },
        body: JSON.stringify({ teamIdx, name: trimmed }),
      });
      if (res.ok) setEditingName(false);
    } catch (e) {
      console.error("Name update failed:", e);
    } finally {
      setNameSaving(false);
    }
  }, [nameInput, sessionCode, teamIdx]);

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

  const langPicker = (
    <div style={{ display: "flex", gap: 2 }}>
      {["en", "nl", "fr"].map(l => (
        <button key={l} onClick={() => changeLang(l)} style={{
          padding: "4px 6px", fontSize: 10, fontWeight: lang === l ? 700 : 400,
          background: lang === l ? C.cream : "transparent",
          color: lang === l ? C.greenDeep : C.sage,
          border: lang === l ? "none" : `1px solid ${C.border}`,
          borderRadius: 2, cursor: "pointer", fontFamily: "'Inter', sans-serif",
          textTransform: "uppercase", minWidth: 28, minHeight: 28,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{l}</button>
      ))}
    </div>
  );

  // Mandatory team name prompt — blocks the quiz until team enters a name
  if (isDefaultName && !isClosed) {
    return (
      <div style={{ minHeight: "100vh", background: `url(${HERO_BG}) center/cover no-repeat fixed`, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ position: "fixed", inset: 0, background: C.overlay, zIndex: 0 }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 20 }}>
          <div style={{ maxWidth: 380, width: "100%", textAlign: "center" }}>
            <LogoMark size="lg" />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.cream, marginTop: 24, marginBottom: 8, letterSpacing: 3, textTransform: "uppercase" }}>
              {ui.welcome} {teamName}!
            </h2>
            <p style={{ fontSize: 13, color: C.sage, marginBottom: 16 }}>
              {ui.chooseTeamName}
            </p>
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>{langPicker}</div>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && nameInput.trim() && submitTeamName()}
              maxLength={30}
              autoFocus
              placeholder={ui.enterTeamName}
              style={{
                width: "100%", boxSizing: "border-box", padding: "12px 16px",
                borderRadius: 8, border: `1.5px solid ${C.sage}44`,
                background: "rgba(255,255,255,0.08)", color: C.cream,
                fontFamily: "'Inter',sans-serif", fontSize: 16, fontWeight: 600,
                outline: "none", textAlign: "center",
              }}
            />
            <button
              onClick={submitTeamName}
              disabled={nameSaving || !nameInput.trim()}
              style={{
                ...btnPrimary, marginTop: 16, width: "100%", padding: "14px 20px",
                fontSize: 15, fontWeight: 700,
                opacity: (nameSaving || !nameInput.trim()) ? 0.5 : 1,
              }}
            >
              {nameSaving ? ui.saving : ui.letsGo}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        {editingName ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitTeamName(); if (e.key === "Escape") { setEditingName(false); setNameInput(teamName); } }}
              maxLength={30}
              autoFocus
              style={{
                width: 110, padding: "4px 8px", borderRadius: 3,
                border: `1px solid ${C.gold}`, background: C.cream,
                color: C.greenDeep, fontSize: 12, fontWeight: 600,
                fontFamily: "'Inter', sans-serif", outline: "none",
              }}
            />
            <button onClick={submitTeamName} disabled={nameSaving} style={{ ...btnGhost, fontSize: 10, padding: "4px 8px", minHeight: 28, minWidth: 28 }}>
              {nameSaving ? "..." : "\u2713"}
            </button>
            <button onClick={() => { setEditingName(false); setNameInput(teamName); }} style={{ ...btnGhost, fontSize: 10, padding: "4px 8px", minHeight: 28, minWidth: 28 }}>
              {"\u2717"}
            </button>
          </div>
        ) : (
          <div
            onClick={() => !isClosed && setEditingName(true)}
            style={{
              background: C.cream, color: C.greenDeep, fontWeight: 600, fontSize: 12,
              padding: "4px 10px", borderRadius: 3, whiteSpace: "nowrap",
              overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120,
              cursor: isClosed ? "default" : "pointer",
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            {teamName}
            {!isClosed && <span style={{ fontSize: 10, opacity: 0.5 }}>{"\u270E"}</span>}
          </div>
        )}
        <div style={{ flex: 1 }} />
        {langPicker}
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
          {"\u2190"} {ui.leave}
        </button>
      </div>

      {/* Status banner */}
      {isClosed && (
        <div style={{ background: "#b91c1c", color: "#fff", textAlign: "center", padding: "10px 12px", fontSize: 13, fontWeight: 600 }}>
          {ui.sessionClosed}
        </div>
      )}
      {!isClosed && selectedTab && isRoundClosed(selectedTab) && !isAnswerRevealed(selectedTab) && (
        <div style={{ background: "rgba(212, 175, 55, 0.12)", color: C.gold, textAlign: "center", padding: "10px 12px", fontSize: 13, fontWeight: 600 }}>
          {ui.roundClosed}
        </div>
      )}
      {!isClosed && selectedTab && isAnswerRevealed(selectedTab) && (
        <div style={{ background: "rgba(90, 158, 106, 0.15)", color: C.correctBright, textAlign: "center", padding: "10px 12px", fontSize: 13, fontWeight: 600 }}>
          {ui.reviewAnswers}
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
          {ui.waitingHost}
        </div>
      )}

      {/* Question cards */}
      <div style={{ padding: "12px 12px 80px 12px" }}>
        {!selectedTab || !visibleRounds.includes(selectedTab) ? (
          visibleRounds.length > 0 ? (
            <div style={{ textAlign: "center", color: C.sage, fontSize: 14, padding: "40px 20px" }}>
              {ui.selectRound}
            </div>
          ) : null
        ) : round && round.questions && round.questions.length > 0 ? (
          (() => {
            const isCurrentLive = selectedTab === currentRound && !roundClosed;
            const revealCount = revealedQuestions?.[selectedTab];
            const visibleQuestions = isCurrentLive && revealCount != null
              ? round.questions.slice(0, revealCount)
              : round.questions;
            return visibleQuestions.length === 0
              ? <div style={{ textAlign: "center", color: C.sage, fontSize: 14, padding: "40px 20px" }}>{ui.waitingQuestions}</div>
              : visibleQuestions.map((q) => {
            const serverAnswer = answers ? answers[`${teamIdx}-${q.id}`] : undefined;
            const localVal = localAnswers[q.id] || "";
            const isSubmitted = serverAnswer !== undefined && serverAnswer !== null;
            const isLoading = submitting[q.id] || false;
            const answerable = isRoundAnswerable(selectedTab);
            const disabled = !answerable;
            const answersRevealed = isAnswerRevealed(selectedTab) || isClosed;

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
                <div style={{ color: C.sage, fontSize: 13, marginBottom: answersRevealed && q.answer ? 6 : 12 }}>{t(q.text)}</div>

                {/* Correct answer reveal — only after next round opens or session closes */}
                {answersRevealed && q.answer && (
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
                    {ui.lookScreen}
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
                      const key = optKey(opt);
                      const isSelected = localVal === key;
                      return (
                        <button
                          key={i}
                          disabled={disabled}
                          onClick={() =>
                            setLocalAnswers((prev) => ({ ...prev, [q.id]: key }))
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
                          {t(opt)}
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
                      placeholder={ui.typeAnswer}
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
                      const key = optKey(opt);
                      const isSelected = localVal === key;
                      return (
                        <button
                          key={i}
                          disabled={disabled}
                          onClick={() =>
                            setLocalAnswers((prev) => ({ ...prev, [q.id]: key }))
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
                          {t(opt)}
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
                      {isLoading ? ui.sending : isSubmitted ? ui.update : ui.submit}
                    </button>
                    {isSubmitted && (
                      <span style={{ color: C.gold, fontSize: 12, fontWeight: 600 }}>
                        {"\u2713"} {ui.submitted}
                      </span>
                    )}
                  </div>
                )}
                {!answerable && isSubmitted && (
                  <div style={{ fontSize: 12, color: C.sage, fontStyle: "italic" }}>
                    {ui.yourAnswer} {serverAnswer}
                  </div>
                )}
              </div>
            );
          });
          })()
        ) : (
          <div style={{ textAlign: "center", color: C.sage, fontSize: 14, padding: "40px 20px" }}>
            {round ? ui.noQuestions : ui.waitingRound}
          </div>
        )}
      </div>
    </div>
  );
}
