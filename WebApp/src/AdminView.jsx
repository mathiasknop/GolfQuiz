import { useState, useEffect, useCallback } from "react";
import { C, HERO_BG, LogoMark, btnPrimary, btnGhost } from "./styles.jsx";

const overlay = {
  position: "fixed", inset: 0, zIndex: 0,
  backgroundImage: `url(${HERO_BG})`, backgroundSize: "cover", backgroundPosition: "center",
};
const darkOverlay = {
  position: "fixed", inset: 0, zIndex: 1,
  background: "rgba(0,0,0,0.72)",
};
const scrollWrap = {
  position: "relative", zIndex: 2,
  minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
  padding: "0 12px 48px",
  fontFamily: "'Inter',sans-serif", color: C.cream,
};
const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: `1.5px solid ${C.sage}44`, background: "rgba(255,255,255,0.08)",
  color: C.cream, fontFamily: "'Inter',sans-serif", fontSize: 14,
  outline: "none", boxSizing: "border-box",
};
const card = {
  background: "rgba(255,255,255,0.07)",
  borderRadius: 14, padding: "14px 18px", marginBottom: 10,
  border: "1.5px solid transparent",
};

export default function AdminView({ onBack }) {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem("gq-admin-key") || "");
  const [unlocked, setUnlocked] = useState(() => !!sessionStorage.getItem("gq-admin-key"));
  const [unlockInput, setUnlockInput] = useState("");
  const [unlockError, setUnlockError] = useState(null);
  const [unlockBusy, setUnlockBusy] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [sessionDetails, setSessionDetails] = useState({});
  const [actionBusy, setActionBusy] = useState({});

  function handleUnlock() {
    const key = unlockInput.trim();
    if (!key) return;
    setUnlockBusy(true);
    setUnlockError(null);
    fetch("/api/sessions", { headers: { "x-admin-key": key } })
      .then(r => {
        if (r.status === 403) throw new Error("Invalid admin key");
        if (!r.ok) throw new Error("Failed to verify");
        return r.json();
      })
      .then(d => {
        sessionStorage.setItem("gq-admin-key", key);
        setAdminKey(key);
        setUnlocked(true);
        setSessions(d.sessions || []);
        setUnlockBusy(false);
      })
      .catch(err => {
        setUnlockError(err.message);
        setUnlockBusy(false);
      });
  }

  const loadSessions = useCallback(() => {
    if (!adminKey) return;
    setLoading(true);
    fetch("/api/sessions", { headers: { "x-admin-key": adminKey } })
      .then(r => {
        if (r.status === 403) throw new Error("Admin key expired");
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then(d => { setSessions(d.sessions || []); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [adminKey]);

  useEffect(() => {
    if (unlocked) loadSessions();
  }, [unlocked, loadSessions]);

  function loadSessionDetail(code) {
    fetch(`/api/session/${code}/admin`, { headers: { "x-admin-key": adminKey } })
      .then(r => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then(d => {
        setSessionDetails(prev => ({ ...prev, [code]: d.session }));
      })
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

  function resetToken(code, teamIdx) {
    const key = `token-${code}-${teamIdx}`;
    setActionBusy(prev => ({ ...prev, [key]: true }));
    fetch(`/api/session/${code}/admin`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ action: "reset-token", teamIdx }),
    })
      .then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then(d => {
        setSessionDetails(prev => {
          if (!prev[code]) return prev;
          const tokens = { ...(prev[code].playerTokens || {}) };
          tokens[teamIdx] = d.playerToken;
          return { ...prev, [code]: { ...prev[code], playerTokens: tokens } };
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

  // Unlock screen
  if (!unlocked) {
    return (
      <div>
        <div style={overlay} />
        <div style={darkOverlay} />
        <div style={{ ...scrollWrap, justifyContent: "center", minHeight: "100vh" }}>
          <div style={{ maxWidth: 380, width: "100%", textAlign: "center" }}>
            <LogoMark size="lg" />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.cream, marginTop: 24, marginBottom: 8, letterSpacing: 3, textTransform: "uppercase" }}>Admin Panel</h2>
            <p style={{ fontSize: 13, color: C.sage, marginBottom: 24 }}>Enter the admin key to access the admin panel.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={unlockInput}
                onChange={e => { setUnlockInput(e.target.value); setUnlockError(null); }}
                onKeyDown={e => e.key === "Enter" && handleUnlock()}
                type="password"
                placeholder="Admin key"
                style={{ ...inputStyle, flex: 1, textAlign: "center" }}
              />
              <button onClick={handleUnlock} disabled={unlockBusy || !unlockInput.trim()} style={{ ...btnPrimary, padding: "10px 20px", opacity: (unlockBusy || !unlockInput.trim()) ? 0.6 : 1 }}>
                {unlockBusy ? "..." : "Unlock"}
              </button>
            </div>
            {unlockError && <div style={{ marginTop: 10, fontSize: 12, color: C.wrong }}>{unlockError}</div>}
            <button onClick={onBack} style={{ ...btnGhost, marginTop: 20, fontSize: 14 }}>{"\u2190"} Back</button>
          </div>
        </div>
      </div>
    );
  }

  // Main admin panel
  return (
    <div>
      <div style={overlay} />
      <div style={darkOverlay} />
      <div style={scrollWrap}>
        <div style={{ width: "100%", maxWidth: 700, paddingTop: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
            <LogoMark size="md" />
            <h1 style={{ fontSize: 22, fontWeight: 800, textTransform: "uppercase", letterSpacing: 5, color: C.cream, margin: 0 }}>Admin Panel</h1>
          </div>
          <button onClick={onBack} style={{ ...btnGhost, marginTop: 8, marginBottom: 24, fontSize: 14 }}>{"\u2190"} Back</button>

          {loading && <div style={{ textAlign: "center", color: C.sage, fontSize: 14 }}>Loading sessions...</div>}
          {error && <div style={{ textAlign: "center", color: C.wrong, fontSize: 14 }}>{error}</div>}

          {!loading && !error && sessions.length === 0 && (
            <div style={{ textAlign: "center", color: C.sage, fontSize: 14, marginTop: 32 }}>No sessions found.</div>
          )}

          {sessions.map(s => {
            const isExpanded = expandedId === s.id;
            const detail = sessionDetails[s.id];
            const isClosed = (s.status || "open") === "closed";
            return (
              <div key={s.id} style={{ ...card, borderColor: isExpanded ? C.cream + "44" : "transparent", cursor: "pointer" }} onClick={() => toggleExpand(s.id)}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: 2 }}>{s.id}</span>
                    <span style={{
                      marginLeft: 10, fontSize: 9, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", padding: "2px 8px", borderRadius: 3,
                      background: isClosed ? "rgba(196,92,92,0.15)" : "rgba(90,158,106,0.15)",
                      color: isClosed ? C.wrong : C.correct,
                    }}>
                      {isClosed ? "Closed" : "Open"}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: C.sage }}>
                    {s.teamCount || 0} teams &middot; {formatDate(s.updatedAt)}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: 14, borderTop: `1px solid ${C.sage}33`, paddingTop: 14 }} onClick={e => e.stopPropagation()}>
                    {!detail ? (
                      <div style={{ fontSize: 12, color: C.sage }}>Loading details...</div>
                    ) : (
                      <>
                        {/* Host PIN */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 11, color: C.sage, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6, fontWeight: 700 }}>Host PIN</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 4, color: C.cream }}>{detail.hostPin || "—"}</span>
                            <button
                              onClick={() => resetPin(s.id)}
                              disabled={actionBusy[`pin-${s.id}`]}
                              style={{ ...btnGhost, fontSize: 10, padding: "4px 10px", opacity: actionBusy[`pin-${s.id}`] ? 0.5 : 1 }}
                            >
                              {actionBusy[`pin-${s.id}`] ? "Resetting..." : "Reset PIN"}
                            </button>
                          </div>
                        </div>

                        {/* Player Tokens */}
                        <div>
                          <div style={{ fontSize: 11, color: C.sage, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, fontWeight: 700 }}>Player Tokens</div>
                          {Object.keys(detail.playerTokens || {}).length === 0 ? (
                            <div style={{ fontSize: 12, color: C.sage, opacity: 0.6 }}>No players have joined yet.</div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {Object.entries(detail.playerTokens).map(([idx, token]) => {
                                const teamName = (detail.teams || [])[parseInt(idx)] || `Team ${parseInt(idx) + 1}`;
                                const busyKey = `token-${s.id}-${idx}`;
                                return (
                                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 6 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, minWidth: 80 }}>{teamName}</span>
                                    <span style={{ fontSize: 11, color: C.sage, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>
                                      {token.slice(0, 8)}...{token.slice(-4)}
                                    </span>
                                    <button
                                      onClick={() => resetToken(s.id, parseInt(idx))}
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
      </div>
    </div>
  );
}
