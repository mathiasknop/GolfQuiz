import { useState, useEffect, useMemo } from "react";
import { C, HERO_BG, LogoMark, SessionBadge } from "./styles.jsx";

export default function PublicLeaderboard({ roundsData, roundOrder }) {
  const sessionCode = new URLSearchParams(window.location.search).get("s")?.toUpperCase();
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);

  // Poll session every 3s
  useEffect(() => {
    if (!sessionCode) return;
    let active = true;
    const load = () =>
      fetch(`/api/session/${sessionCode}`)
        .then(r => { if (!r.ok) throw new Error("Session not found"); return r.json(); })
        .then(d => { if (active) { setSession(d.session); setError(null); } })
        .catch(e => { if (active) setError(e.message); });
    load();
    const id = setInterval(load, 3000);
    return () => { active = false; clearInterval(id); };
  }, [sessionCode]);

  const leaderboard = useMemo(() => {
    if (!session || !roundsData) return [];
    const teams = session.teams || [];
    const teamCount = session.teamCount || teams.length;
    const scores = session.scores || {};
    const teamPlayers = session.teamPlayers || {};

    const getTeamRoundScore = (tIdx, rid) => {
      if (!roundsData[rid]) return 0;
      return roundsData[rid].questions.reduce((sum, q) => sum + (scores[`${tIdx}-${q.id}`] === 1 ? 1 : 0), 0);
    };
    const getTotal = (tIdx) => roundOrder.reduce((sum, rid) => sum + getTeamRoundScore(tIdx, rid), 0);

    const data = teams.slice(0, teamCount).map((name, idx) => ({
      name, idx, total: getTotal(idx),
      players: teamPlayers[String(idx)] || "",
      rounds: roundOrder.reduce((a, rid) => { a[rid] = getTeamRoundScore(idx, rid); return a; }, {}),
    }));
    data.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
    let rank = 1;
    data.forEach((item, i) => { if (i > 0 && item.total < data[i - 1].total) rank = i + 1; item.rank = rank; });
    return data;
  }, [session, roundsData, roundOrder]);

  const maxTotal = roundOrder.reduce((sum, rid) => sum + (roundsData[rid]?.maxPts || 0), 0);

  if (!sessionCode) return (
    <div style={{ minHeight: "100vh", background: C.greenDeep, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: C.sage, fontFamily: "'Inter', sans-serif", fontSize: 14 }}>
        Missing session code. Use <span style={{ color: C.cream }}>/leaderboard?s=GQ-XXXX</span>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: C.greenDeep, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: C.wrong, fontFamily: "'Inter', sans-serif", fontSize: 14 }}>{error}</div>
    </div>
  );

  if (!session) return (
    <div style={{ minHeight: "100vh", background: C.greenDeep, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <LogoMark size="lg" />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: `url(${HERO_BG}) center/cover no-repeat fixed`, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: "fixed", inset: 0, background: C.overlay, zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Title */}
        <div style={{ textAlign: "center", padding: "32px 16px 28px" }}>
          <LogoMark size="md" />
          <div style={{ marginTop: 24 }}>
            <h1 style={{ fontSize: 18, fontWeight: 300, color: C.cream, margin: 0, letterSpacing: 8, textTransform: "uppercase" }}>Leaderboard</h1>
            <p style={{ color: C.sage, fontSize: 12, margin: "6px 0 0", letterSpacing: 1 }}>
              {leaderboard.length} teams {"\u00B7"} {maxTotal} points possible
            </p>
            <SessionBadge code={sessionCode} />
          </div>
        </div>

        {/* Team cards */}
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px 40px", display: "flex", flexDirection: "column", gap: 6 }}>
          {leaderboard.map((team) => {
            const barWidth = maxTotal > 0 ? (team.total / maxTotal) * 100 : 0;
            const isPodium = team.rank <= 3;
            const podiumColor = team.rank === 1 ? C.gold : team.rank === 2 ? C.silver : C.bronze;
            const icons = { 1: "\uD83E\uDD47", 2: "\uD83E\uDD48", 3: "\uD83E\uDD49" };

            return (
              <div key={team.idx} style={{
                background: C.greenDark, borderRadius: 4, padding: "14px 16px",
                border: `1px solid ${isPodium ? podiumColor + "44" : C.borderLight}`,
                boxShadow: isPodium ? `0 0 24px ${podiumColor}18` : "none",
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
    </div>
  );
}
