import { useState, useEffect, useCallback } from "react";
import { C, HERO_BG, LogoMark, btnPrimary, btnGhost } from "./styles.jsx";

export default function SessionsOverview({ adminKey, onBack, onJoinSession }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [sessionDetails, setSessionDetails] = useState({});
  const [actionBusy, setActionBusy] = useState({});

  const loadSessions = useCallback(() => {
    setLoading(true);
    fetch("/api/sessions", { headers: { "x-admin-key": adminKey } })
      .then(r => { if (!r.ok) throw new Error("Failed to load sessions"); return r.json(); })
      .then(d => { setSessions(d.sessions || []); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [adminKey]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  function loadSessionDetail(code) {
    fetch(`/api/session/${code}/admin`, { headers: { "x-admin-key": adminKey } })
      .then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then(d => { setSessionDetails(prev => ({ ...prev, [code]: d.session })); })
      .catch(() => {});
  }

  function toggleExpand(code) {
    if (expandedId === code) {
      setExpandedId(null);
    } else {
      setExpandedId(code);
      if (!sessionDetails[code]) loadSessionDetail(code);
    }
  }

  const handleToggleStatus = (code, currentStatus) => {
    const newStatus = currentStatus === "open" ? "closed" : "open";
    fetch(`/api/session/${code}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ status: newStatus }),
    })
      .then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then(() => {
        setSessions(prev => prev.map(s => s.id === code ? { ...s, status: newStatus } : s));
      })
      .catch(() => {});
  };

  function resetPin(code) {
    setActionBusy(prev => ({ ...prev, [`pin-${code}`]: true }));
    fetch(`/api/session/${code}/admin`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ action: "reset-pin" }),
    })
      .then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then(d => {
        setSessionDetails(prev => ({
          ...prev,
          [code]: prev[code] ? { ...prev[code], hostPin: d.hostPin } : prev[code],
        }));
      })
      .catch(() => {})
      .finally(() => setActionBusy(prev => ({ ...prev, [`pin-${code}`]: false })));
  }

  function resetTeamPin(code, teamIdx) {
    const key = `tpin-${code}-${teamIdx}`;
    setActionBusy(prev => ({ ...prev, [key]: true }));
    fetch(`/api/session/${code}/admin`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ action: "reset-team-pin", teamIdx }),
    })
      .then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then(d => {
        setSessionDetails(prev => {
          if (!prev[code]) return prev;
          const pins = { ...(prev[code].teamPins || {}) };
          pins[String(teamIdx)] = d.teamPin;
          return { ...prev, [code]: { ...prev[code], teamPins: pins } };
        });
      })
      .catch(() => {})
      .finally(() => setActionBusy(prev => ({ ...prev, [key]: false })));
  }

  const formatDate = (iso) => {
    if (!iso) return "\u2014";
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{ minHeight: "100vh", background: `url(${HERO_BG}) center/cover no-repeat fixed`, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: "fixed", inset: 0, background: C.overlay, zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto", padding: 20 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <LogoMark size="lg" />
          <div style={{ marginTop: 24, fontFamily: "'Inter', sans-serif", fontSize: 12, letterSpacing: 5, textTransform: "uppercase", color: C.sage, fontWeight: 300 }}>
            All Sessions
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <button onClick={onBack} style={btnGhost}>&larr; Back</button>
        </div>

        {loading && <div style={{ textAlign: "center", color: C.sage, fontSize: 14 }}>Loading sessions...</div>}
        {error && <div style={{ textAlign: "center", color: C.wrong, fontSize: 14 }}>{error}</div>}

        {!loading && !error && sessions.length === 0 && (
          <div style={{ textAlign: "center", color: C.sageDark, fontSize: 14, marginTop: 32 }}>No sessions yet.</div>
        )}

        {!loading && !error && sessions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sessions.map(s => {
              const isClosed = (s.status || "open") === "closed";
              const isExpanded = expandedId === s.id;
              const detail = sessionDetails[s.id];
              return (
                <div key={s.id} style={{ background: C.greenDark, borderRadius: 4, padding: "14px 18px", border: `1px solid ${isExpanded ? C.cream + "44" : C.border}`, cursor: "pointer" }} onClick={() => toggleExpand(s.id)}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: 2, color: C.cream }}>{s.id}</span>
                        <span style={{
                          fontSize: 9, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", padding: "2px 8px", borderRadius: 3,
                          background: isClosed ? "rgba(196, 92, 92, 0.15)" : "rgba(90, 158, 106, 0.15)",
                          color: isClosed ? C.wrong : C.correct,
                          border: `1px solid ${isClosed ? "rgba(196, 92, 92, 0.3)" : "rgba(90, 158, 106, 0.3)"}`,
                        }}>
                          {isClosed ? "Closed" : "Open"}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: C.sageDark, marginTop: 4 }}>
                        {s.teamCount || 0} teams &middot; {formatDate(s.updatedAt)}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: C.sage, transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>&#9654;</span>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: 14, borderTop: `1px solid ${C.sage}33`, paddingTop: 14 }} onClick={e => e.stopPropagation()}>
                      {!detail ? (
                        <div style={{ fontSize: 12, color: C.sage }}>Loading details...</div>
                      ) : (
                        <>
                          {/* Actions */}
                          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                            <button onClick={() => onJoinSession(s.id, detail.hostPin)} style={{ ...btnPrimary, fontSize: 12, padding: "8px 16px" }}>
                              Join as Host
                            </button>
                            <button onClick={() => handleToggleStatus(s.id, s.status || "open")} style={{ ...btnGhost, fontSize: 12, padding: "8px 16px" }}>
                              {isClosed ? "Reopen" : "Close"}
                            </button>
                          </div>

                          {/* Host PIN */}
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 11, color: C.sage, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6, fontWeight: 700 }}>Host PIN</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 4, color: C.cream }}>{detail.hostPin || "\u2014"}</span>
                              <button
                                onClick={() => resetPin(s.id)}
                                disabled={actionBusy[`pin-${s.id}`]}
                                style={{ ...btnGhost, fontSize: 10, padding: "4px 10px", opacity: actionBusy[`pin-${s.id}`] ? 0.5 : 1 }}
                              >
                                {actionBusy[`pin-${s.id}`] ? "Resetting..." : "Reset PIN"}
                              </button>
                            </div>
                          </div>

                          {/* Team PINs */}
                          <div>
                            <div style={{ fontSize: 11, color: C.sage, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, fontWeight: 700 }}>Team PINs</div>
                            {Object.keys(detail.teamPins || {}).length === 0 ? (
                              <div style={{ fontSize: 12, color: C.sage, opacity: 0.6 }}>No team PINs generated.</div>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {Object.entries(detail.teamPins || {}).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([idx, pin]) => {
                                  const teamName = (detail.teams || [])[parseInt(idx)] || `Team ${parseInt(idx) + 1}`;
                                  const busyKey = `tpin-${s.id}-${idx}`;
                                  return (
                                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 6 }}>
                                      <span style={{ fontSize: 12, fontWeight: 600, minWidth: 80 }}>{teamName}</span>
                                      <span style={{ fontSize: 14, color: C.cream, fontWeight: 700, letterSpacing: 3, fontFamily: "monospace" }}>
                                        {pin}
                                      </span>
                                      <div style={{ flex: 1 }} />
                                      <button
                                        onClick={() => resetTeamPin(s.id, parseInt(idx))}
                                        disabled={actionBusy[busyKey]}
                                        style={{ ...btnGhost, fontSize: 10, padding: "3px 8px", opacity: actionBusy[busyKey] ? 0.5 : 1 }}
                                      >
                                        {actionBusy[busyKey] ? "..." : "Reset"}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
