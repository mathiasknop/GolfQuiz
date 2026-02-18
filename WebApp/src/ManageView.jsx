import { useState } from "react";
import { C, HERO_BG, LogoMark, labelStyle, btnPrimary, btnAccent, btnGhost } from "./styles.jsx";

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
const card = {
  background: "rgba(255,255,255,0.07)",
  borderRadius: 14, padding: "14px 18px", marginBottom: 10,
  border: "1.5px solid transparent",
  transition: "border-color 0.2s",
  cursor: "pointer",
};
const cardSelected = {
  ...card,
  borderColor: C.cream,
};
const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: `1.5px solid ${C.sage}44`, background: "rgba(255,255,255,0.08)",
  color: C.cream, fontFamily: "'Inter',sans-serif", fontSize: 14,
  outline: "none", boxSizing: "border-box",
};
const toggleBtn = (active) => ({
  padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
  border: `1.5px solid ${active ? C.gold : C.sage + "55"}`,
  background: active ? C.gold + "22" : "transparent",
  color: active ? C.gold : C.cream + "99",
  cursor: "pointer", transition: "all 0.2s",
  fontFamily: "'Inter',sans-serif",
});
const typeBadge = (type) => ({
  display: "inline-block", padding: "2px 10px", borderRadius: 6,
  fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1,
  background: type === "series" ? C.sage + "33" : type === "photo" ? C.gold + "33" : C.wrong + "33",
  color: type === "series" ? C.sage : type === "photo" ? C.gold : C.wrong,
});
const sectionTitle = {
  fontSize: 13, fontWeight: 700, textTransform: "uppercase",
  letterSpacing: 2, color: C.cream + "88", marginBottom: 8, marginTop: 18,
};

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export default function ManageView({ roundsData, roundOrder, onBack, onRoundsChanged }) {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem("gq-admin-key") || "");
  const [unlocked, setUnlocked] = useState(() => !!sessionStorage.getItem("gq-admin-key"));
  const [unlockInput, setUnlockInput] = useState("");
  const [unlockError, setUnlockError] = useState(null);
  const [unlockBusy, setUnlockBusy] = useState(false);

  const [selectedRoundId, setSelectedRoundId] = useState(null);
  const [editingQuestionIdx, setEditingQuestionIdx] = useState(null);
  const [draftRound, setDraftRound] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

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
      .then(() => {
        sessionStorage.setItem("gq-admin-key", key);
        setAdminKey(key);
        setUnlocked(true);
        setUnlockBusy(false);
      })
      .catch(err => {
        setUnlockError(err.message);
        setUnlockBusy(false);
      });
  }

  function authHeaders() {
    return { "Content-Type": "application/json", "x-admin-key": adminKey };
  }

  function handleAuthError() {
    sessionStorage.removeItem("gq-admin-key");
    setAdminKey("");
    setUnlocked(false);
    setUnlockError("Session expired. Please enter the admin key again.");
  }

  const orderedRounds = (roundOrder || []).map((id) => ({ id, ...(roundsData || {})[id] })).filter((r) => r.name);

  /* ---- helpers ---- */
  function selectRound(id) {
    if (id === selectedRoundId) return;
    const src = roundsData[id];
    setSelectedRoundId(id);
    setDraftRound(deepClone({ id, ...src }));
    setEditingQuestionIdx(null);
    setDeleteConfirm(false);
  }

  function startNewRound() {
    const draft = {
      id: "__new__",
      name: "",
      subtitle: "",
      type: "varia",
      maxPts: 1,
      questions: [],
    };
    setSelectedRoundId("__new__");
    setDraftRound(draft);
    setEditingQuestionIdx(null);
    setDeleteConfirm(false);
  }

  function updateDraft(patch) {
    setDraftRound((prev) => ({ ...prev, ...patch }));
  }

  function updateDraftQuestion(idx, patch) {
    setDraftRound((prev) => {
      const qs = [...prev.questions];
      qs[idx] = { ...qs[idx], ...patch };
      return { ...prev, questions: qs };
    });
  }

  function addQuestion() {
    const rid = draftRound.id === "__new__" ? "new" : draftRound.id;
    const newQ = {
      id: `${rid}-q${Date.now()}`,
      label: `Q${draftRound.questions.length + 1}`,
      text: "",
      type: "open",
      options: [],
      answer: "",
    };
    setDraftRound((prev) => ({ ...prev, questions: [...prev.questions, newQ] }));
    setEditingQuestionIdx(draftRound.questions.length);
  }

  function removeQuestion(idx) {
    setDraftRound((prev) => {
      const qs = prev.questions.filter((_, i) => i !== idx);
      return { ...prev, questions: qs };
    });
    if (editingQuestionIdx === idx) setEditingQuestionIdx(null);
    else if (editingQuestionIdx !== null && editingQuestionIdx > idx) setEditingQuestionIdx(editingQuestionIdx - 1);
  }

  /* ---- API ---- */
  async function saveRound() {
    if (!draftRound || saving) return;
    setSaving(true);
    try {
      let finalId = draftRound.id;
      let newRoundsData = deepClone(roundsData || {});
      let newOrder = [...(roundOrder || [])];

      const body = {
        name: draftRound.name,
        subtitle: draftRound.subtitle || "",
        type: draftRound.type || "varia",
        maxPts: Number(draftRound.maxPts) || 1,
        questions: draftRound.questions || [],
      };

      if (draftRound.id === "__new__") {
        finalId = slugify(draftRound.name || "round");
        const res = await fetch("/api/rounds", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ ...body, id: finalId }),
        });
        if (res.status === 403) { handleAuthError(); return; }
        if (!res.ok) throw new Error("Create failed");
        const created = await res.json();
        newRoundsData[finalId] = created;
        newOrder.push(finalId);
      } else {
        const res = await fetch(`/api/rounds/${finalId}`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify(body),
        });
        if (res.status === 403) { handleAuthError(); return; }
        if (!res.ok) throw new Error("Save failed");
        const updated = await res.json();
        newRoundsData[finalId] = updated;
      }

      onRoundsChanged(newRoundsData, newOrder);
      setSelectedRoundId(finalId);
      setDraftRound({ id: finalId, ...newRoundsData[finalId] });
      setEditingQuestionIdx(null);
    } catch (e) {
      alert("Error saving round: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteRound() {
    if (!selectedRoundId || selectedRoundId === "__new__" || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/rounds/${selectedRoundId}`, { method: "DELETE", headers: { "x-admin-key": adminKey } });
      if (res.status === 403) { handleAuthError(); return; }
      if (!res.ok) throw new Error("Delete failed");
      const newRoundsData = deepClone(roundsData);
      delete newRoundsData[selectedRoundId];
      const newOrder = (roundOrder || []).filter((id) => id !== selectedRoundId);
      onRoundsChanged(newRoundsData, newOrder);
      setSelectedRoundId(null);
      setDraftRound(null);
      setDeleteConfirm(false);
    } catch (e) {
      alert("Error deleting round: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function moveRound(idx, dir) {
    const newOrder = [...(roundOrder || [])];
    const target = idx + dir;
    if (target < 0 || target >= newOrder.length) return;
    [newOrder[idx], newOrder[target]] = [newOrder[target], newOrder[idx]];
    try {
      const res = await fetch("/api/rounds/reorder", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ order: newOrder }),
      });
      if (res.status === 403) { handleAuthError(); return; }
      if (!res.ok) throw new Error("Reorder failed");
      onRoundsChanged(roundsData, newOrder);
    } catch (e) {
      alert("Error reordering: " + e.message);
    }
  }

  /* ---- render: header ---- */
  const header = (
    <div style={{ width: "100%", maxWidth: 700, marginBottom: 24, paddingTop: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
        <LogoMark size="md" />
        <h1 style={{
          fontSize: 22, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: 5, color: C.cream, margin: 0,
        }}>Quiz Management</h1>
      </div>
      <button onClick={onBack} style={{ ...btnGhost, marginTop: 8, fontSize: 14 }}>
        {"\u2190"} Back
      </button>
    </div>
  );

  /* ---- render: round list ---- */
  const roundList = (
    <div style={{ width: "100%", maxWidth: 700 }}>
      <div style={sectionTitle}>Rounds</div>
      {orderedRounds.map((r, idx) => (
        <div
          key={r.id}
          style={selectedRoundId === r.id ? cardSelected : card}
          onClick={() => selectRound(r.id)}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</span>
              {r.subtitle ? <span style={{ marginLeft: 10, fontSize: 12, opacity: 0.6 }}>{r.subtitle}</span> : null}
              <div style={{ marginTop: 4, display: "flex", gap: 8, alignItems: "center" }}>
                <span style={typeBadge(r.type || "varia")}>{r.type || "varia"}</span>
                <span style={{ fontSize: 12, opacity: 0.5 }}>
                  {(r.questions || []).length} question{(r.questions || []).length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
              <button
                style={{ ...btnGhost, padding: "4px 10px", fontSize: 16 }}
                onClick={() => moveRound(idx, -1)}
                disabled={idx === 0}
                title="Move up"
              >{"\u2191"}</button>
              <button
                style={{ ...btnGhost, padding: "4px 10px", fontSize: 16 }}
                onClick={() => moveRound(idx, 1)}
                disabled={idx === orderedRounds.length - 1}
                title="Move down"
              >{"\u2193"}</button>
              <button
                style={{ ...btnAccent, padding: "5px 14px", fontSize: 12 }}
                onClick={() => selectRound(r.id)}
              >Edit</button>
            </div>
          </div>
        </div>
      ))}
      <button onClick={startNewRound} style={{ ...btnPrimary, marginTop: 10, width: "100%" }}>
        + Add Round
      </button>
    </div>
  );

  /* ---- render: question editor ---- */
  function renderQuestionEditor(q, idx) {
    const needsOptions = q.type === "multiple-choice" || q.type === "pick-from-list";
    return (
      <div style={{
        background: "rgba(255,255,255,0.05)", borderRadius: 10,
        padding: 16, marginTop: 8, borderLeft: `3px solid ${C.gold}`,
      }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <div style={{ flex: "0 0 70px" }}>
            <div style={{ ...labelStyle, marginBottom: 4 }}>Label</div>
            <input
              style={inputStyle}
              value={q.label || ""}
              onChange={(e) => updateDraftQuestion(idx, { label: e.target.value })}
              placeholder="Q1"
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...labelStyle, marginBottom: 4 }}>Answer</div>
            <input
              style={inputStyle}
              value={q.answer || ""}
              onChange={(e) => updateDraftQuestion(idx, { answer: e.target.value })}
              placeholder="Correct answer"
            />
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ ...labelStyle, marginBottom: 4 }}>Question text</div>
          <textarea
            style={{ ...inputStyle, resize: "vertical" }}
            rows={3}
            value={q.text || ""}
            onChange={(e) => updateDraftQuestion(idx, { text: e.target.value })}
            placeholder="Full question text..."
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ ...labelStyle, marginBottom: 6 }}>Type</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["open", "multiple-choice", "image", "pick-from-list"].map((t) => (
              <button
                key={t}
                style={toggleBtn(q.type === t)}
                onClick={() => updateDraftQuestion(idx, { type: t })}
              >
                {t === "open" ? "Open" : t === "multiple-choice" ? "Multiple Choice" : t === "image" ? "Image" : "Pick from List"}
              </button>
            ))}
          </div>
        </div>

        {needsOptions && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ ...labelStyle, marginBottom: 6 }}>Options</div>
            {(q.options || []).map((opt, oi) => (
              <div key={oi} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  value={opt}
                  onChange={(e) => {
                    const opts = [...(q.options || [])];
                    opts[oi] = e.target.value;
                    updateDraftQuestion(idx, { options: opts });
                  }}
                  placeholder={`Option ${oi + 1}`}
                />
                <button
                  style={{ ...btnGhost, padding: "5px 10px", fontSize: 11, color: C.wrong }}
                  onClick={() => {
                    const opts = (q.options || []).filter((_, i) => i !== oi);
                    updateDraftQuestion(idx, { options: opts });
                  }}
                >Remove</button>
              </div>
            ))}
            <button
              style={{ ...btnGhost, fontSize: 12, marginTop: 2 }}
              onClick={() => updateDraftQuestion(idx, { options: [...(q.options || []), ""] })}
            >+ Add Option</button>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button style={{ ...btnPrimary, fontSize: 12, padding: "6px 16px" }} onClick={() => setEditingQuestionIdx(null)}>
            Done
          </button>
          <button style={{ ...btnGhost, fontSize: 12, padding: "6px 16px" }} onClick={() => setEditingQuestionIdx(null)}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  /* ---- render: round editor ---- */
  const roundEditor = draftRound && (
    <div style={{
      width: "100%", maxWidth: 700, marginTop: 24,
      background: "rgba(255,255,255,0.04)", borderRadius: 16,
      padding: "24px 20px", border: `1px solid ${C.sage}33`,
    }}>
      <div style={sectionTitle}>
        {draftRound.id === "__new__" ? "New Round" : "Edit Round"}
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ ...labelStyle, marginBottom: 4 }}>Name</div>
        <input
          style={inputStyle}
          value={draftRound.name || ""}
          onChange={(e) => updateDraft({ name: e.target.value })}
          placeholder="Round name"
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ ...labelStyle, marginBottom: 4 }}>Subtitle</div>
        <input
          style={inputStyle}
          value={draftRound.subtitle || ""}
          onChange={(e) => updateDraft({ subtitle: e.target.value })}
          placeholder="Optional subtitle"
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ ...labelStyle, marginBottom: 6 }}>Type</div>
        <div style={{ display: "flex", gap: 8 }}>
          {["series", "varia", "photo"].map((t) => (
            <button key={t} style={toggleBtn(draftRound.type === t)} onClick={() => updateDraft({ type: t })}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ ...labelStyle, marginBottom: 4 }}>Max Points</div>
        <input
          style={{ ...inputStyle, width: 100 }}
          type="number"
          min={1}
          value={draftRound.maxPts || 1}
          onChange={(e) => updateDraft({ maxPts: Number(e.target.value) })}
        />
      </div>

      {/* Questions */}
      <div style={sectionTitle}>Questions ({(draftRound.questions || []).length})</div>
      {(draftRound.questions || []).map((q, idx) => (
        <div key={q.id || idx}>
          {editingQuestionIdx === idx ? (
            renderQuestionEditor(q, idx)
          ) : (
            <div style={{
              ...card, display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 10,
            }}>
              <div style={{ flex: 1, minWidth: 0 }} onClick={() => setEditingQuestionIdx(idx)}>
                <span style={{ fontWeight: 700, fontSize: 13, marginRight: 8 }}>{q.label || `Q${idx + 1}`}</span>
                <span style={{
                  fontSize: 13, opacity: 0.7,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  display: "inline-block", maxWidth: 340, verticalAlign: "middle",
                }}>
                  {q.text || "(no text)"}
                </span>
                <span style={{ ...typeBadge(q.type === "multiple-choice" ? "series" : q.type === "pick-from-list" ? "photo" : "varia"), marginLeft: 8, fontSize: 10 }}>
                  {q.type || "open"}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={{ ...btnAccent, padding: "4px 12px", fontSize: 11 }} onClick={() => setEditingQuestionIdx(idx)}>
                  Edit
                </button>
                <button style={{ ...btnGhost, padding: "4px 12px", fontSize: 11, color: C.wrong }} onClick={() => removeQuestion(idx)}>
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <button onClick={addQuestion} style={{ ...btnGhost, marginTop: 8, fontSize: 13, width: "100%" }}>
        + Add Question
      </button>

      {/* Save / Delete */}
      <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
        <button
          style={{ ...btnPrimary, flex: 1, opacity: saving ? 0.5 : 1 }}
          onClick={saveRound}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Round"}
        </button>

        {draftRound.id !== "__new__" && !deleteConfirm && (
          <button
            style={{ ...btnGhost, color: C.wrong, flex: "0 0 auto" }}
            onClick={() => setDeleteConfirm(true)}
          >Delete Round</button>
        )}
        {draftRound.id !== "__new__" && deleteConfirm && (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: C.wrong }}>Are you sure?</span>
            <button
              style={{ ...btnAccent, padding: "5px 14px", fontSize: 12 }}
              onClick={deleteRound}
              disabled={saving}
            >Yes, delete</button>
            <button
              style={{ ...btnGhost, padding: "5px 14px", fontSize: 12 }}
              onClick={() => setDeleteConfirm(false)}
            >Cancel</button>
          </div>
        )}
      </div>
    </div>
  );

  /* ---- main render ---- */
  if (!unlocked) {
    return (
      <div>
        <div style={overlay} />
        <div style={darkOverlay} />
        <div style={{ ...scrollWrap, justifyContent: "center", minHeight: "100vh" }}>
          <div style={{ maxWidth: 380, width: "100%", textAlign: "center" }}>
            <LogoMark size="lg" />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.cream, marginTop: 24, marginBottom: 8, letterSpacing: 3, textTransform: "uppercase" }}>Quiz Management</h2>
            <p style={{ fontSize: 13, color: C.sage, marginBottom: 24 }}>Enter the admin key to access quiz management.</p>
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
    <div>
      <div style={overlay} />
      <div style={darkOverlay} />
      <div style={scrollWrap}>
        {header}
        {roundList}
        {roundEditor}
      </div>
    </div>
  );
}
