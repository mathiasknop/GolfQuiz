import { useEffect } from "react";
import { C, LOGO_DATA_URI, btnPrimary, btnGhost } from "./styles.jsx";

export default function AnswerSheetsView({ roundsData, roundOrder, teams, teamCount, sessionCode, onClose }) {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @media print {
        .as-no-print { display: none !important; }
        .as-overlay {
          position: absolute !important;
          top: 0 !important; left: 0 !important;
          width: 100% !important;
          overflow: visible !important;
          height: auto !important;
          z-index: 99999 !important;
          background: white !important;
        }
        body { margin: 0 !important; padding: 0 !important; }
        .as-page {
          page-break-after: always; break-after: page;
          height: 297mm !important; width: 210mm !important;
          print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important;
        }
        .as-page * { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
        .as-page:last-child { page-break-after: avoid; break-after: avoid; }
      }
      @page { size: A4 portrait; margin: 0; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const rounds = roundOrder.map(rid => roundsData[rid]).filter(Boolean);

  return (
    <div className="as-overlay" style={overlayStyle}>
      {/* Screen-only header */}
      <div className="as-no-print" style={{ position: "sticky", top: 0, zIndex: 10, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}`, background: C.greenDark }}>
        <button onClick={onClose} style={{ ...btnGhost, fontSize: 13 }}>{"\u2190"} Close</button>
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 600, color: C.cream }}>
          Answer Sheets {"\u2014"} {sessionCode} {"\u2014"} {teamCount} teams {"\u00D7"} {rounds.length} rounds
        </div>
        <button onClick={() => window.print()} style={{ ...btnPrimary, fontSize: 13, padding: "8px 20px" }}>Print</button>
      </div>

      {/* One A4 page per team per round */}
      {Array.from({ length: teamCount }, (_, tIdx) =>
        rounds.map((round, rIdx) => {
          const isLast = tIdx === teamCount - 1 && rIdx === rounds.length - 1;
          return (
            <div key={`${tIdx}-${round.id}`} className={isLast ? "" : "as-page"} style={isLast ? { ...pageStyle } : pageStyle}>
              {/* Header bar */}
              <div style={{ background: C.greenDeep, padding: "5mm 10mm", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <img src={LOGO_DATA_URI} alt="Logo" style={{ height: "8mm" }} />
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: "9pt", color: C.sage, letterSpacing: 2 }}>
                  {sessionCode}
                </div>
              </div>

              {/* Team + Round info */}
              <div style={{ padding: "6mm 10mm 0" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "2mm" }}>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: "18pt", fontWeight: 700, color: C.greenDeep }}>
                    {teams[tIdx] || `Team ${tIdx + 1}`}
                  </div>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: "9pt", color: "#888" }}>
                    Answer Sheet
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderBottom: `2px solid ${C.greenDeep}`, paddingBottom: "2mm", marginBottom: "5mm" }}>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: "13pt", fontWeight: 600, color: C.greenDeep, letterSpacing: 1 }}>
                    {round.name} {"\u2014"} {round.subtitle}
                  </div>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: "10pt", color: "#666" }}>
                    {round.maxPts} {round.maxPts === 1 ? "pt" : "pts"}
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div style={{ padding: "0 10mm", flex: 1 }}>
                {round.questions.map((q, qIdx) => (
                  <QuestionRow key={q.id} q={q} qIdx={qIdx} totalQuestions={round.questions.length} />
                ))}
              </div>

              {/* Footer */}
              <div style={{ padding: "0 10mm 6mm", marginTop: "auto", textAlign: "center" }}>
                <div style={{ width: "20mm", height: "0.3mm", background: "#ddd", margin: "0 auto 2mm" }} />
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: "7pt", color: "#bbb", letterSpacing: 2, textTransform: "uppercase" }}>
                  Golf Quiz {"\u00B7"} The National Golf Brussels
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function QuestionRow({ q, qIdx, totalQuestions }) {
  // More space per question when fewer questions in the round
  const spacious = totalQuestions <= 10;

  if (q.type === "multiple-choice") {
    return (
      <div style={{ padding: spacious ? "3mm 0" : "2mm 0", borderBottom: "0.5px solid #e5e5e5" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "3mm", marginBottom: "2mm" }}>
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "10pt", fontWeight: 700, color: C.greenDeep, minWidth: "8mm" }}>
            {q.label}
          </span>
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "9pt", color: "#333", lineHeight: 1.4 }}>
            {q.text}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5mm 8mm", paddingLeft: "11mm" }}>
          {q.options.map((opt, i) => (
            <div key={i} style={{ fontFamily: "'Inter',sans-serif", fontSize: "9pt", color: "#444", display: "flex", alignItems: "baseline", gap: "2mm" }}>
              <span style={{ fontSize: "10pt", color: "#bbb" }}>{"\u25CB"}</span>
              <span>{opt}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // open, image, pick-from-list — question text + write-in line
  return (
    <div style={{ padding: spacious ? "3mm 0" : "2mm 0", borderBottom: "0.5px solid #e5e5e5" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "3mm", marginBottom: "1.5mm" }}>
        <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "10pt", fontWeight: 700, color: C.greenDeep, minWidth: "8mm", flexShrink: 0 }}>
          {q.label}
        </span>
        <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "9pt", color: "#333", lineHeight: 1.4 }}>
          {q.text}
        </span>
      </div>
      <div style={{ marginLeft: "11mm", borderBottom: "0.5px dotted #999", height: spacious ? "6mm" : "5mm" }} />
    </div>
  );
}

const overlayStyle = {
  position: "fixed", inset: 0, zIndex: 9999,
  background: "#fff", overflowY: "auto",
};

const pageStyle = {
  position: "relative",
  width: "210mm",
  minHeight: "297mm",
  margin: "0 auto",
  overflow: "hidden",
  background: "#fff",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 2px 20px rgba(0,0,0,0.1)",
};
