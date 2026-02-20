import { C, HERO_BG, LogoMark, SessionBadge, btnAccent, btnPrimary, btnGhost } from "./styles.jsx";

// --- Web Audio reveal sounds ---
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playRevealSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "triangle";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1320, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) { /* audio not available */ }
}

function playApplause() {
  try {
    const ctx = getAudioCtx();
    const duration = 3;
    const t = ctx.currentTime;
    // Create several noise sources for a dense crowd feel
    for (let i = 0; i < 6; i++) {
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) data[j] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      // Band-pass filter to shape noise into clap-like frequency range
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 800 + i * 400; // spread across 800–3200 Hz
      bp.Q.value = 0.5 + Math.random() * 0.5;
      // Amplitude modulation for rhythmic clap texture
      const modGain = ctx.createGain();
      const mod = ctx.createOscillator();
      const modDepth = ctx.createGain();
      mod.frequency.value = 3 + Math.random() * 6; // 3–9 Hz flutter
      modDepth.gain.value = 0.4;
      mod.connect(modDepth);
      modDepth.connect(modGain.gain);
      mod.start(t);
      mod.stop(t + duration);
      // Volume envelope: fade in, sustain, fade out
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.06, t + 0.3);
      gain.gain.setValueAtTime(0.06, t + duration * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      src.connect(bp);
      bp.connect(modGain);
      modGain.connect(gain);
      gain.connect(ctx.destination);
      src.start(t + Math.random() * 0.1); // slight stagger
      src.stop(t + duration);
    }
  } catch (e) { /* audio not available */ }
}

export default function LeaderboardView({ leaderboard, onBack, revealed, setRevealed, revealCount, setRevealCount, roundsData, roundOrder, sessionCode, onNextRound }) {
  const maxTotal = roundOrder.reduce((sum, rid) => sum + (roundsData[rid]?.maxPts || 0), 0);
  const totalTeams = leaderboard.length;

  const handleRevealNext = () => {
    if (revealCount >= totalTeams) { setRevealed(true); return; }
    const nextCount = revealCount + 1;
    if (nextCount === totalTeams) {
      playApplause();
      setRevealCount(totalTeams);
      setRevealed(true);
    } else {
      playRevealSound();
      setRevealCount(nextCount);
    }
  };
  const handleRevealAll = () => { playApplause(); setRevealCount(totalTeams); setRevealed(true); };

  const displayList = revealed
    ? leaderboard
    : [...leaderboard].slice(totalTeams - revealCount).reverse();

  return (
    <div style={{ minHeight: "100vh", background: `url(${HERO_BG}) center/cover no-repeat fixed`, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: "fixed", inset: 0, background: C.overlay, zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ padding: "16px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={onBack} style={btnGhost}>{"\u2190"} Scoring</button>
            <SessionBadge code={sessionCode} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {!revealed && (
              <>
                <button onClick={handleRevealNext} style={btnAccent}>Reveal #{totalTeams - revealCount}</button>
                <button onClick={handleRevealAll} style={btnGhost}>Show All</button>
              </>
            )}
            {onNextRound && (
              <button onClick={onNextRound} style={{ ...btnPrimary, fontSize: 11, padding: "8px 14px", background: C.correct, color: C.creamBright }}>
                Next Round
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", padding: "8px 16px 28px" }}>
          <LogoMark size="md" />
          <div style={{ marginTop: 24 }}>
            <h1 style={{ fontSize: 18, fontWeight: 300, color: C.cream, margin: 0, letterSpacing: 8, textTransform: "uppercase" }}>Leaderboard</h1>
            <p style={{ color: C.sage, fontSize: 12, margin: "6px 0 0", letterSpacing: 1 }}>
              {revealed ? `${totalTeams} teams \u00B7 ${maxTotal} points possible` : `${revealCount} of ${totalTeams} revealed`}
            </p>
          </div>
        </div>

        {/* Team cards */}
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px 40px", display: "flex", flexDirection: "column", gap: 6 }}>
          {displayList.map((team) => {
            const barWidth = maxTotal > 0 ? (team.total / maxTotal) * 100 : 0;
            const isPodium = team.rank <= 3;
            const podiumColor = team.rank === 1 ? C.gold : team.rank === 2 ? C.silver : C.bronze;
            const icons = { 1: "\uD83E\uDD47", 2: "\uD83E\uDD48", 3: "\uD83E\uDD49" };

            return (
              <div key={team.idx} style={{
                background: C.greenDark, borderRadius: 4, padding: "14px 16px",
                border: `1px solid ${isPodium ? podiumColor + "44" : C.borderLight}`,
                boxShadow: isPodium ? `0 0 24px ${podiumColor}18` : "none",
                transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                animation: !revealed ? "slideIn 0.4s ease-out" : undefined,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 36, textAlign: "center", flexShrink: 0 }}>
                    {icons[team.rank] ? (
                      <span style={{ fontSize: 22 }}>{icons[team.rank]}</span>
                    ) : (
                      <span style={{ fontSize: 15, fontWeight: 300, color: C.sage, letterSpacing: 1 }}>#{team.rank}</span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 14, color: C.cream, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: 0.5 }}>
                      {team.name}
                    </div>
                    {team.players && (
                      <div style={{ fontSize: 11, color: C.sage, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {team.players}
                      </div>
                    )}
                    <div style={{ marginTop: 6, height: 4, background: C.greenMid, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{
                        width: `${barWidth}%`, height: "100%", borderRadius: 2,
                        background: isPodium ? `linear-gradient(90deg, ${podiumColor}, ${podiumColor}99)` : C.greenSoft,
                        transition: "width 0.6s ease-out",
                      }} />
                    </div>
                    {revealed && (
                      <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
                        {roundOrder.map(rid => {
                          const r = roundsData[rid];
                          const s = team.rounds[rid];
                          const lbl = r.type === "series" ? `S${rid.slice(-1)}` : r.type === "varia" ? "V" : "P";
                          return (
                            <span key={rid} style={{
                              fontSize: 9, padding: "1px 5px", borderRadius: 2,
                              background: s > 0 ? "rgba(240,235,224,0.08)" : "transparent",
                              color: s > 0 ? C.sage : C.sageMuted, letterSpacing: 0.5,
                            }}>{lbl}:{s}</span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: 24, fontWeight: 300, color: isPodium ? podiumColor : C.cream, lineHeight: 1, letterSpacing: 1 }}>
                      {team.total}
                    </div>
                    <div style={{ fontSize: 9, color: C.sageDark, marginTop: 3, letterSpacing: 1 }}>/{maxTotal}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
