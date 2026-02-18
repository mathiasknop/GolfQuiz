import { useState, useEffect, useCallback } from "react";
import { C, HERO_BG, LogoMark, btnPrimary, btnGhost } from "./styles.jsx";

const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: `1.5px solid ${C.sage}44`, background: "rgba(255,255,255,0.08)",
  color: C.cream, fontFamily: "'Inter',sans-serif", fontSize: 14,
  outline: "none", boxSizing: "border-box",
};

export default function SessionsOverview({ onBack }) {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem("gq-admin-key") || "");
  const [unlocked, setUnlocked] = useState(() => !!sessionStorage.getItem("gq-admin-key"));
  const [unlockInput, setUnlockInput] = useState("");
  const [unlockError, setUnlockError] = useState(null);
  const [unlockBusy, setUnlockBusy] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        if (!r.ok) throw new Error("Failed to load sessions");
        return r.json();
      })
      .then(d => { setSessions(d.sessions || []); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [adminKey]);

  useEffect(() => {
    if (unlocked) loadSessions();
  }, [unlocked, loadSessions]);

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

  const formatDate = (iso) => {
    if (!iso) return "\u2014";
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  // Unlock screen
  if (!unlocked) {
    return (
      <div style={{ minHeight: "100vh", background: `url(${HERO_BG}) center/cover no-repeat fixed`, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ position: "fixed", inset: 0, background: C.overlay, zIndex: 0 }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 20 }}>
          <div style={{ maxWidth: 380, width: "100%", textAlign: "center" }}>
            <LogoMark size="lg" />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.cream, marginTop: 24, marginBottom: 8, letterSpacing: 3, textTransform: "uppercase" }}>All Sessions</h2>
            <p style={{ fontSize: 13, color: C.sage, marginBottom: 24 }}>Enter the admin key to view sessions.</p>
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
              return (
                <div key={s.id} style={{ background: C.greenDark, borderRadius: 4, padding: "14px 18px", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
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
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => handleToggleStatus(s.id, s.status || "open")} style={{ ...btnGhost, fontSize: 9, padding: "5px 10px" }}>
                      {isClosed ? "Reopen" : "Close"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
