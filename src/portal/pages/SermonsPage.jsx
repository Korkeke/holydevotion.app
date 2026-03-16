import { useState, useEffect } from "react";
import { COLORS } from "../../colors";
import { useAuth } from "../AuthContext";
import { get, post, put, del } from "../api";
import ConfirmDialog from "../components/ConfirmDialog";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function SermonsPage() {
  const { church } = useAuth();
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState(null); // sermon with reflections
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    title: "", scripture_refs: "", theme: "", summary: "", pastor_notes: "",
    week_start_date: "",
  });

  // Editing reflection state
  const [editingRef, setEditingRef] = useState(null);
  const [refForm, setRefForm] = useState({ title: "", prompt: "", scripture_focus: "" });

  async function loadSermons() {
    if (!church?.id) return;
    try {
      const data = await get(`/api/churches/${church.id}/sermons`);
      setSermons(data?.sermons || []);
    } catch {} finally { setLoading(false); }
  }

  async function loadSermonDetail(sermonId) {
    try {
      const data = await get(`/api/churches/${church.id}/sermons/${sermonId}`);
      setSelected(data);
    } catch (e) { console.error(e); }
  }

  useEffect(() => { loadSermons(); }, [church?.id]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title || !form.week_start_date) return;
    setGenerating(true);
    try {
      const data = await post(`/api/churches/${church.id}/sermons`, form);
      setCreating(false);
      setForm({ title: "", scripture_refs: "", theme: "", summary: "", pastor_notes: "", week_start_date: "" });
      await loadSermons();
      if (data?.sermon?.id) {
        await loadSermonDetail(data.sermon.id);
      }
    } catch (e) {
      alert("Failed to create sermon: " + e.message);
    } finally { setGenerating(false); }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await del(`/api/churches/${church.id}/sermons/${deleting.id}`);
      setDeleting(null);
      if (selected?.sermon?.id === deleting.id) setSelected(null);
      await loadSermons();
    } finally { setDeleteLoading(false); }
  }

  async function handleArchive(sermon) {
    await put(`/api/churches/${church.id}/sermons/${sermon.id}`, { status: "archived" });
    await loadSermons();
    if (selected?.sermon?.id === sermon.id) setSelected(null);
  }

  async function saveReflection() {
    if (!editingRef) return;
    try {
      await put(
        `/api/churches/${church.id}/sermons/${selected.sermon.id}/reflections/${editingRef.id}`,
        refForm,
      );
      setEditingRef(null);
      await loadSermonDetail(selected.sermon.id);
    } catch (e) {
      alert("Failed to save: " + e.message);
    }
  }

  if (loading) return <div style={s.loading}><div style={s.spinner} /></div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Sermons</h1>
        <button style={s.createBtn} onClick={() => setCreating(true)}>+ New Sermon</button>
      </div>

      <div style={{ display: "flex", gap: 24 }}>
        {/* Left: sermon list */}
        <div style={{ flex: "0 0 320px" }}>
          {sermons.length === 0 && !creating && (
            <div style={s.empty}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📖</div>
              <div style={{ color: COLORS.textMuted, fontSize: 14, lineHeight: 1.6 }}>
                No sermons yet. Create your first sermon to generate daily reflections for your congregation.
              </div>
            </div>
          )}

          {sermons.map((sermon) => (
            <div
              key={sermon.id}
              onClick={() => loadSermonDetail(sermon.id)}
              style={{
                ...s.sermonCard,
                borderColor: selected?.sermon?.id === sermon.id ? COLORS.gold : COLORS.border,
                background: selected?.sermon?.id === sermon.id ? COLORS.goldGlow : "transparent",
              }}
            >
              <div style={s.sermonTitle}>{sermon.title}</div>
              <div style={s.sermonMeta}>
                Week of {sermon.week_start_date}
                <span style={{
                  marginLeft: 8,
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  background: sermon.status === "published" ? "rgba(76, 175, 80, 0.15)" : COLORS.goldDim,
                  color: sermon.status === "published" ? "#4caf50" : COLORS.gold,
                }}>
                  {sermon.status}
                </span>
              </div>
              {sermon.scripture_refs && (
                <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 4 }}>
                  {sermon.scripture_refs}
                </div>
              )}
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                {sermon.status === "published" && (
                  <button style={s.smallBtn} onClick={(e) => { e.stopPropagation(); handleArchive(sermon); }}>
                    Archive
                  </button>
                )}
                <button style={s.smallDeleteBtn} onClick={(e) => { e.stopPropagation(); setDeleting(sermon); }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right: detail or create form */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {creating && (
            <div style={s.formCard}>
              <h2 style={s.formTitle}>Create Sermon</h2>
              <p style={s.formDesc}>
                Enter your sermon details and we'll generate 7 daily reflections for your congregation.
              </p>
              <form onSubmit={handleCreate}>
                <label style={s.label}>Sermon Title *</label>
                <input style={s.input} value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Finding Peace in the Storm" required />

                <label style={s.label}>Key Scriptures</label>
                <input style={s.input} value={form.scripture_refs}
                  onChange={(e) => setForm({ ...form, scripture_refs: e.target.value })}
                  placeholder="Mark 4:35-41, Psalm 46:1-3" />

                <label style={s.label}>Theme</label>
                <input style={s.input} value={form.theme}
                  onChange={(e) => setForm({ ...form, theme: e.target.value })}
                  placeholder="Trusting God in uncertain times" />

                <label style={s.label}>Summary</label>
                <textarea style={{ ...s.input, minHeight: 80 }} value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="A brief summary of the sermon's main points..." />

                <label style={s.label}>Pastor's Notes (private)</label>
                <textarea style={{ ...s.input, minHeight: 60 }} value={form.pastor_notes}
                  onChange={(e) => setForm({ ...form, pastor_notes: e.target.value })}
                  placeholder="Additional context for AI reflection generation..." />

                <label style={s.label}>Week Start Date (Monday) *</label>
                <input style={s.input} type="date" value={form.week_start_date}
                  onChange={(e) => setForm({ ...form, week_start_date: e.target.value })} required />

                <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                  <button type="submit" style={s.generateBtn} disabled={generating}>
                    {generating ? "Generating reflections..." : "Create & Generate Reflections"}
                  </button>
                  <button type="button" style={s.cancelBtn} onClick={() => setCreating(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {selected && !creating && (
            <div style={s.formCard}>
              <h2 style={s.formTitle}>{selected.sermon.title}</h2>
              <div style={s.sermonMeta}>
                Week of {selected.sermon.week_start_date}
                {selected.sermon.scripture_refs && ` · ${selected.sermon.scripture_refs}`}
              </div>
              {selected.sermon.summary && (
                <p style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
                  {selected.sermon.summary}
                </p>
              )}

              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: COLORS.text, marginBottom: 16 }}>
                  Daily Reflections
                </h3>

                {(selected.reflections || []).map((ref) => (
                  <div key={ref.id} style={s.reflectionCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={s.dayLabel}>Day {ref.day_number} · {DAYS[ref.day_number - 1]}</div>
                        <div style={s.refTitle}>{ref.title}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        {ref.ai_generated && (
                          <span style={s.aiBadge}>AI</span>
                        )}
                        {selected.completion_stats && (
                          <span style={s.completionBadge}>
                            {selected.completion_stats[ref.day_number] || 0} completed
                          </span>
                        )}
                      </div>
                    </div>

                    {editingRef?.id === ref.id ? (
                      <div style={{ marginTop: 12 }}>
                        <input style={s.input} value={refForm.title}
                          onChange={(e) => setRefForm({ ...refForm, title: e.target.value })}
                          placeholder="Reflection title" />
                        <textarea style={{ ...s.input, minHeight: 80 }} value={refForm.prompt}
                          onChange={(e) => setRefForm({ ...refForm, prompt: e.target.value })}
                          placeholder="Reflection prompt" />
                        <input style={s.input} value={refForm.scripture_focus}
                          onChange={(e) => setRefForm({ ...refForm, scripture_focus: e.target.value })}
                          placeholder="Scripture focus" />
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <button style={s.smallSaveBtn} onClick={saveReflection}>Save</button>
                          <button style={s.smallBtn} onClick={() => setEditingRef(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p style={s.refPrompt}>{ref.prompt}</p>
                        {ref.scripture_focus && (
                          <div style={s.refScripture}>📖 {ref.scripture_focus}</div>
                        )}
                        <button
                          style={s.editRefBtn}
                          onClick={() => {
                            setEditingRef(ref);
                            setRefForm({
                              title: ref.title,
                              prompt: ref.prompt,
                              scripture_focus: ref.scripture_focus || "",
                            });
                          }}
                        >
                          Edit
                        </button>
                      </>
                    )}
                  </div>
                ))}

                {(!selected.reflections || selected.reflections.length === 0) && (
                  <div style={{ color: COLORS.textMuted, fontSize: 13, fontStyle: "italic" }}>
                    No reflections generated yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {!selected && !creating && (
            <div style={{ ...s.empty, marginTop: 40 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>👈</div>
              <div style={{ color: COLORS.textMuted, fontSize: 14 }}>
                Select a sermon to view its reflections, or create a new one.
              </div>
            </div>
          )}
        </div>
      </div>

      {deleting && (
        <ConfirmDialog
          title="Delete Sermon"
          message={`Delete "${deleting.title}" and all its reflections? This cannot be undone.`}
          onConfirm={handleDelete} onCancel={() => setDeleting(null)} loading={deleteLoading}
        />
      )}
    </div>
  );
}

const s = {
  page: { padding: "32px 40px", maxWidth: 1100 },
  loading: { padding: 60, display: "flex", justifyContent: "center" },
  spinner: { width: 28, height: 28, border: `2px solid ${COLORS.gold}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  title: { fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 400, color: COLORS.text },
  createBtn: { padding: "10px 20px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${COLORS.gold}, #b8973e)`, color: "#fff", fontFamily: "'Nunito Sans', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  empty: { textAlign: "center", padding: "40px 20px" },

  sermonCard: {
    padding: "16px 18px", borderRadius: 12, border: `1px solid ${COLORS.border}`,
    marginBottom: 10, cursor: "pointer", transition: "all 0.15s ease",
  },
  sermonTitle: { fontSize: 15, fontWeight: 600, color: COLORS.text, fontFamily: "'Nunito Sans', sans-serif" },
  sermonMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 4, fontFamily: "'Nunito Sans', sans-serif" },

  smallBtn: { padding: "4px 12px", borderRadius: 6, border: `1px solid ${COLORS.borderHover}`, background: "transparent", color: COLORS.textMuted, fontFamily: "'Nunito Sans', sans-serif", fontSize: 11, fontWeight: 600, cursor: "pointer" },
  smallDeleteBtn: { padding: "4px 12px", borderRadius: 6, border: "1px solid rgba(192,57,43,0.3)", background: "transparent", color: "#e57373", fontFamily: "'Nunito Sans', sans-serif", fontSize: 11, fontWeight: 600, cursor: "pointer" },
  smallSaveBtn: { padding: "4px 12px", borderRadius: 6, border: "none", background: COLORS.goldDim, color: COLORS.gold, fontFamily: "'Nunito Sans', sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer" },

  formCard: {
    padding: "28px 32px", borderRadius: 16, border: `1px solid ${COLORS.border}`,
    background: COLORS.bgCard,
  },
  formTitle: { fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 400, color: COLORS.text, marginBottom: 4 },
  formDesc: { color: COLORS.textMuted, fontSize: 13, marginBottom: 20, lineHeight: 1.6 },

  label: { display: "block", fontSize: 11, fontWeight: 700, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, marginTop: 14, fontFamily: "'Nunito Sans', sans-serif" },
  input: {
    display: "block", width: "100%", padding: "10px 14px", borderRadius: 8,
    border: `1px solid rgba(255,255,255,0.18)`, background: "transparent",
    color: COLORS.text, fontFamily: "'Nunito Sans', sans-serif", fontSize: 14, outline: "none",
    resize: "vertical",
  },

  generateBtn: { padding: "12px 24px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${COLORS.gold}, #b8973e)`, color: "#fff", fontFamily: "'Nunito Sans', sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  cancelBtn: { padding: "12px 24px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.textMuted, fontFamily: "'Nunito Sans', sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer" },

  reflectionCard: {
    padding: "18px 20px", borderRadius: 12, border: `1px solid ${COLORS.border}`,
    marginBottom: 10, background: "rgba(255,255,255,0.02)",
  },
  dayLabel: { fontSize: 11, fontWeight: 700, color: COLORS.gold, letterSpacing: 0.5, textTransform: "uppercase", fontFamily: "'Nunito Sans', sans-serif" },
  refTitle: { fontSize: 15, fontWeight: 600, color: COLORS.text, marginTop: 4, fontFamily: "'Nunito Sans', sans-serif" },
  refPrompt: { fontSize: 13, color: COLORS.textMuted, lineHeight: 1.7, marginTop: 8, fontFamily: "'Nunito Sans', sans-serif" },
  refScripture: { fontSize: 12, color: COLORS.gold, marginTop: 6, fontFamily: "'Nunito Sans', sans-serif" },
  aiBadge: { padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: "rgba(41, 128, 185, 0.15)", color: "#5dade2", fontFamily: "'Nunito Sans', sans-serif" },
  completionBadge: { padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: "rgba(76,175,80,0.12)", color: "#66bb6a", fontFamily: "'Nunito Sans', sans-serif" },
  editRefBtn: { marginTop: 8, padding: "4px 14px", borderRadius: 6, border: `1px solid ${COLORS.borderHover}`, background: "transparent", color: COLORS.gold, fontFamily: "'Nunito Sans', sans-serif", fontSize: 11, fontWeight: 600, cursor: "pointer" },
};
