import { useState } from "react";
import { C, HERO_BG, LogoMark, btnPrimary, btnGhost } from "./styles.jsx";

export default function AdminLobbyView({ onNewSession, onViewSessions, onManageQuiz, onAdmin, onGuide }) {
  const [busy, setBusy] = useState(false);

  const handleNew = () => {
    setBusy(true);
    onNewSession().catch(() => setBusy(false));
  };

  return (
    <div style={{ minHeight: "100vh", background: `url(${HERO_BG}) center/cover no-repeat fixed`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ position: "fixed", inset: 0, background: C.overlay, zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 400, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <LogoMark size="lg" />
          <div style={{ marginTop: 24, fontFamily: "'Inter', sans-serif", fontSize: 12, letterSpacing: 5, textTransform: "uppercase", color: C.sage, fontWeight: 300 }}>
            Admin
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* New session */}
          <div style={{ background: C.greenDark, borderRadius: 4, padding: "24px", border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ fontSize: 13, color: C.sage, marginBottom: 14, fontFamily: "'Inter', sans-serif" }}>Start fresh with a new session code</div>
            <button onClick={handleNew} disabled={busy} style={{ ...btnPrimary, width: "100%", opacity: busy ? 0.6 : 1 }}>
              {busy ? "Creating..." : "New Quiz Session"}
            </button>
          </div>

          {/* Admin navigation */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={onViewSessions} style={{ ...btnGhost, width: "100%", fontSize: 13, letterSpacing: 2, padding: "12px 16px" }}>View All Sessions</button>
            <button onClick={onManageQuiz} style={{ ...btnGhost, width: "100%", fontSize: 13, letterSpacing: 2, padding: "12px 16px" }}>Manage Quiz</button>
            <button onClick={onAdmin} style={{ ...btnGhost, width: "100%", fontSize: 13, letterSpacing: 2, padding: "12px 16px" }}>Admin Panel</button>
            <button onClick={onGuide} style={{ ...btnGhost, width: "100%", fontSize: 13, letterSpacing: 2, padding: "12px 16px" }}>Help &amp; Guide</button>
          </div>
        </div>
      </div>
    </div>
  );
}
