import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { C, HERO_BG, LOGO_DATA_URI, btnPrimary, btnGhost } from "./styles.jsx";

export default function QRCodesView({ sessionCode, teams, teamCount, hostPin, onClose }) {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @media print {
        .qr-no-print { display: none !important; }
        body { background: white !important; margin: 0 !important; padding: 0 !important; }
        .qr-page { page-break-after: always; break-after: page; }
        .qr-page:last-child { page-break-after: avoid; break-after: avoid; }
      }
      @page { size: A4 portrait; margin: 0; }
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
            width: 400,
            margin: 2,
            color: { dark: C.greenDeep, light: "#ffffff" },
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
      <div className="qr-no-print" style={{ position: "sticky", top: 0, zIndex: 10, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}`, background: C.greenDark }}>
        <button onClick={onClose} style={{ ...btnGhost, fontSize: 13 }}>{"\u2190"} Close</button>
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 600, color: C.cream }}>
          QR Codes — {sessionCode}
        </div>
        <button onClick={() => window.print()} style={{ ...btnPrimary, fontSize: 13, padding: "8px 20px" }}>Print</button>
      </div>

      {/* One A4 page per team */}
      {qrCodes.map(qr => (
        <div key={qr.teamIdx} className="qr-page" style={pageStyle}>
          {/* Background overlay */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${HERO_BG})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.15, zIndex: 0 }} />
          <div style={{ position: "absolute", inset: 0, background: C.greenDeep, opacity: 0.92, zIndex: 1 }} />

          {/* Content */}
          <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "40px 32px" }}>
            {/* Logo */}
            <img src={LOGO_DATA_URI} alt="The National Golf Brussels" style={{ width: 200, height: "auto", marginBottom: 32 }} />

            {/* Session badge */}
            <div style={{ fontFamily: "monospace", fontSize: 14, color: C.sage, letterSpacing: 3, marginBottom: 40 }}>
              {sessionCode}
            </div>

            {/* Team name */}
            <h1 style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 42, color: C.cream, textAlign: "center", margin: "0 0 40px", letterSpacing: 2, textTransform: "uppercase" }}>
              {qr.teamName}
            </h1>

            {/* QR code in white card */}
            <div style={{ background: "#fff", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
              <img src={qr.dataUri} alt={`QR for ${qr.teamName}`} style={{ width: 240, height: 240 }} />
            </div>

            {/* Instructions */}
            <div style={{ marginTop: 36, textAlign: "center" }}>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 18, color: C.cream, fontWeight: 600, marginBottom: 8 }}>
                Scan to join the quiz
              </div>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: C.sage }}>
                Or enter code <strong style={{ color: C.cream }}>{sessionCode}</strong> with PIN <strong style={{ color: C.cream }}>{qr.pin}</strong>
              </div>
            </div>

            {/* Footer divider + branding */}
            <div style={{ marginTop: "auto", paddingTop: 32, textAlign: "center" }}>
              <div style={{ width: 60, height: 1, background: C.sage, margin: "0 auto 16px", opacity: 0.4 }} />
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: C.sageMuted, letterSpacing: 2, textTransform: "uppercase" }}>
                Golf Quiz
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const overlayStyle = {
  position: "fixed", inset: 0, zIndex: 9999,
  background: C.greenDeep, overflowY: "auto",
};

const pageStyle = {
  position: "relative",
  width: "210mm",
  minHeight: "297mm",
  margin: "0 auto",
  overflow: "hidden",
};
