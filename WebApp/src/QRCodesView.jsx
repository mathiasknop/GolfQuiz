import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { C, LogoMark, btnPrimary, btnGhost } from "./styles.jsx";

export default function QRCodesView({ sessionCode, teams, teamCount, hostPin, onClose }) {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Inject print styles
    const style = document.createElement("style");
    style.textContent = `
      @media print {
        .qr-no-print { display: none !important; }
        body { background: white !important; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    fetch(`/api/session/${sessionCode}/pins`, {
      headers: { "x-host-pin": hostPin || "" },
    })
      .then(r => { if (!r.ok) throw new Error("Failed to load PINs"); return r.json(); })
      .then(async (data) => {
        const pins = data.teamPins || {};
        const baseUrl = window.location.origin;
        const codes = [];
        for (let i = 0; i < teamCount; i++) {
          const pin = pins[String(i)];
          if (!pin) continue;
          const url = `${baseUrl}/?s=${sessionCode}&t=${i}&p=${pin}`;
          const dataUri = await QRCode.toDataURL(url, {
            width: 256,
            margin: 2,
            color: { dark: "#000000", light: "#ffffff" },
          });
          codes.push({ teamIdx: i, teamName: teams[i] || `Team ${i + 1}`, pin, dataUri });
        }
        setQrCodes(codes);
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [sessionCode, teamCount, teams, hostPin]);

  if (loading) return (
    <div style={overlayStyle}>
      <div style={{ textAlign: "center", color: C.sage, padding: 80, fontFamily: "'Inter',sans-serif", fontSize: 14 }}>
        Loading QR codes...
      </div>
    </div>
  );

  if (error) return (
    <div style={overlayStyle}>
      <div style={{ textAlign: "center", padding: 80, fontFamily: "'Inter',sans-serif" }}>
        <div style={{ color: C.wrong, fontSize: 14 }}>{error}</div>
        <button onClick={onClose} style={{ ...btnGhost, marginTop: 16, color: "#333" }}>Close</button>
      </div>
    </div>
  );

  return (
    <div style={overlayStyle}>
      {/* Screen-only header */}
      <div className="qr-no-print" style={{ padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ddd", background: "#f9f9f9" }}>
        <button onClick={onClose} style={{ ...btnGhost, color: "#333", fontSize: 13 }}>{"\u2190"} Close</button>
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 600, color: "#333" }}>
          QR Codes — {sessionCode}
        </div>
        <button onClick={() => window.print()} style={{ ...btnPrimary, fontSize: 13, padding: "8px 20px" }}>Print</button>
      </div>

      {/* Printable grid */}
      <div style={gridStyle}>
        {qrCodes.map(qr => (
          <div key={qr.teamIdx} style={cardStyle}>
            <LogoMark size="sm" />
            <div style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 16, color: "#111", textAlign: "center", marginTop: 8, marginBottom: 8 }}>
              {qr.teamName}
            </div>
            <img src={qr.dataUri} alt={`QR for ${qr.teamName}`} style={{ width: 180, height: 180 }} />
            <div style={{ fontFamily: "monospace", fontSize: 13, color: "#555", marginTop: 8, textAlign: "center" }}>
              PIN: <strong>{qr.pin}</strong>
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: "#999", marginTop: 2, textAlign: "center" }}>
              {sessionCode}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed", inset: 0, zIndex: 9999,
  background: "#fff", overflowY: "auto",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: 24,
  padding: 24,
  maxWidth: 900,
  margin: "0 auto",
};

const cardStyle = {
  display: "flex", flexDirection: "column", alignItems: "center",
  padding: 20, border: "1px solid #ddd", borderRadius: 8,
  pageBreakInside: "avoid",
};
