import { useState, useEffect, useRef } from "react";
import { useChurchColors } from "../useChurchColors";
import { COLORS } from "../../colors";
import { useAuth } from "../AuthContext";
import { get, post, put, del, postFile } from "../api";
import ConfirmDialog from "../components/ConfirmDialog";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_COLORS = {
  published: { bg: "greenBg", color: "green" },
  scheduled: { bg: "amberBg", color: "amber" },
  draft: { bg: "blueBg", color: "blue" },
  archived: { bg: "card", color: "muted" },
};

export default function SermonsPage() {
  const C = useChurchColors();
  const { church } = useAuth();
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    title: "", scripture_refs: "", theme: "", summary: "", pastor_notes: "",
    week_start_date: "",
  });

  // File transcription state
  const [transcribing, setTranscribing] = useState(false);
  const [transcribed, setTranscribed] = useState(false);
  const [transcriptionMeta, setTranscriptionMeta] = useState(null);
  const fileInputRef = useRef(null);

  // Reflection preview state
  const [genReflections, setGenReflections] = useState(false);
  const [previewReflections, setPreviewReflections] = useState([]);
  const [editingPreviewIdx, setEditingPreviewIdx] = useState(null);

  // Scheduling state
  const [publishMode, setPublishMode] = useState("now"); // "now" or "schedule"
  const [scheduledDate, setScheduledDate] = useState("");

  // Editing reflection state (for published sermons)
  const [editingRef, setEditingRef] = useState(null);
  const [refForm, setRefForm] = useState({ title: "", prompt: "", scripture_focus: "", discussion_prompt: "" });

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

  function resetCreateForm() {
    setForm({ title: "", scripture_refs: "", theme: "", summary: "", pastor_notes: "", week_start_date: "" });
    setTranscribed(false); setTranscriptionMeta(null);
    setPreviewReflections([]); setEditingPreviewIdx(null);
    setPublishMode("now"); setScheduledDate("");
  }

  // ─── Transcription (file upload) ────────────────────────────

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setTranscribing(true);
    try {
      const data = await postFile(`/api/churches/${church.id}/sermons/transcribe-upload`, file);
      setTranscribed(true);
      setTranscriptionMeta(data);
      setForm(f => ({
        ...f,
        title: f.title || data.title || "",
        scripture_refs: f.scripture_refs || data.scripture_refs || "",
        theme: f.theme || data.theme || "",
        summary: f.summary || data.summary || "",
      }));
    } catch (e) {
      alert("Transcription failed: " + (e.message || "Unknown error"));
    } finally {
      setTranscribing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ─── Generate reflections (preview only, no sermon created) ─

  async function handleGenerateReflections() {
    if (!form.title) return;
    setGenReflections(true);
    try {
      const data = await post(`/api/churches/${church.id}/sermons/preview-reflections`, {
        title: form.title,
        scripture_refs: form.scripture_refs,
        theme: form.theme,
        summary: form.summary,
        pastor_notes: form.pastor_notes,
      });
      setPreviewReflections(data.reflections || []);
    } catch (e) {
      alert("Failed to generate reflections: " + (e.message || "Unknown error"));
    }
    setGenReflections(false);
  }

  function updatePreviewReflection(idx, field, value) {
    setPreviewReflections(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  }

  // ─── Create sermon (publish or schedule) ──────────────────

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title || !form.week_start_date) return;
    if (publishMode === "schedule" && !scheduledDate) {
      alert("Please select a scheduled date.");
      return;
    }
    setGenerating(true);
    try {
      const payload = { ...form };
      if (previewReflections.length > 0) {
        payload.reflections = previewReflections;
      }
      if (publishMode === "schedule" && scheduledDate) {
        payload.scheduled_date = scheduledDate;
      }
      const data = await post(`/api/churches/${church.id}/sermons`, payload);
      setCreating(false);
      resetCreateForm();
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

  if (loading) return <div style={{ padding: 60, display: "flex", justifyContent: "center" }}><div style={{ width: 28, height: 28, border: `2px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>;

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg,
    fontSize: 13, fontFamily: "var(--body)", color: C.text, outline: "none",
  };

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: C.text, fontFamily: "var(--heading)" }}>Sermons</div>
        <button onClick={() => { setCreating(true); setSelected(null); }} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--body)", boxShadow: `0 4px 12px ${C.accent}25` }}>+ New Sermon</button>
      </div>

      {/* New Sermon Creator */}
      {creating && (
        <div style={{ background: C.card, border: `2px solid ${C.accent}30`, borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.03)", marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: "var(--heading)", marginBottom: 16 }}>Create This Week's Sermon Study</div>

          {/* Transcribe from File */}
          <div style={{ padding: 20, borderRadius: 14, background: `linear-gradient(135deg, ${C.blueBg} 0%, ${C.card} 100%)`, border: `1px solid ${C.blue}20`, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>🎙️</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Transcribe Sermon Recording</div>
                <div style={{ fontSize: 12, color: C.sec }}>Upload your sermon audio or video to auto-extract title, scripture, and summary</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input ref={fileInputRef} type="file" accept=".mp3,.mp4,.m4a,.wav,.webm,.ogg" onChange={handleFileUpload} disabled={transcribing} style={{ display: "none" }} />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={transcribing} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--body)", boxShadow: `0 4px 12px ${C.accent}25`, opacity: transcribing ? 0.5 : 1 }}>
                {transcribing ? "Transcribing..." : "Upload & Transcribe"}
              </button>
              <span style={{ fontSize: 11, color: C.muted }}>MP3, MP4, M4A, WAV (max 25MB)</span>
            </div>
            {transcribed && transcriptionMeta && (
              <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 10, background: C.greenBg, border: `1px solid ${C.green}20` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.green }}>
                  Transcription complete. {transcriptionMeta.word_count?.toLocaleString() || "?"} words extracted.
                </div>
                {transcriptionMeta.theme && (
                  <div style={{ fontSize: 11, color: C.sec, marginTop: 4 }}>Theme: {transcriptionMeta.theme}</div>
                )}
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 16 }}>or enter manually</div>

          <form onSubmit={handleCreate}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.body, display: "block", marginBottom: 6 }}>Sermon Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Finding Peace in the Storm" required style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.body, display: "block", marginBottom: 6 }}>Scripture References</label>
                <input value={form.scripture_refs} onChange={e => setForm({ ...form, scripture_refs: e.target.value })} placeholder="e.g., Mark 4:35-41, Psalm 46:10" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.body, display: "block", marginBottom: 6 }}>Week Start Date (Monday) *</label>
                <input type="date" value={form.week_start_date} onChange={e => setForm({ ...form, week_start_date: e.target.value })} required style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.body, display: "block", marginBottom: 6 }}>Publication</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { key: "now", label: "Publish Now" },
                    { key: "schedule", label: "Schedule" },
                  ].map(opt => (
                    <button key={opt.key} type="button" onClick={() => setPublishMode(opt.key)} style={{
                      flex: 1, padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${publishMode === opt.key ? C.accent : C.border}`,
                      background: publishMode === opt.key ? C.accentLight : "transparent",
                      color: publishMode === opt.key ? C.accent : C.body,
                      fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--body)",
                    }}>{opt.label}</button>
                  ))}
                </div>
                {publishMode === "schedule" && (
                  <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} min={new Date().toISOString().split("T")[0]} style={{ ...inputStyle, marginTop: 8 }} placeholder="Select date" />
                )}
              </div>
            </div>

            {/* Generate Reflections */}
            <div style={{ padding: "16px 20px", borderRadius: 14, background: `linear-gradient(135deg, ${C.accentLight} 0%, ${C.goldBg} 100%)`, border: `1px solid ${C.accent}20`, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>✨</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>Generate 7-Day Reflections</div>
                    <div style={{ fontSize: 12, color: C.sec }}>Creates daily prompts, scripture connections, and closing prayers{transcribed ? " based on your sermon transcript" : ""}</div>
                  </div>
                </div>
                <button type="button" onClick={handleGenerateReflections} disabled={genReflections || !form.title} style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--body)", boxShadow: `0 4px 12px ${C.accent}25`, opacity: !form.title ? 0.5 : 1 }}>
                  {genReflections ? "Generating..." : previewReflections.length > 0 ? "Regenerate" : "Generate"}
                </button>
              </div>
            </div>

            {/* Preview Reflections */}
            {previewReflections.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>GENERATED REFLECTIONS (edit before publishing)</div>
                {previewReflections.map((ref, i) => (
                  <div key={i} style={{ padding: "12px 14px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 6 }}>
                    {editingPreviewIdx === i ? (
                      <div>
                        <input value={ref.title} onChange={e => updatePreviewReflection(i, "title", e.target.value)} placeholder="Reflection title" style={{ ...inputStyle, marginBottom: 6 }} />
                        <textarea value={ref.prompt} onChange={e => updatePreviewReflection(i, "prompt", e.target.value)} placeholder="Reflection prompt" style={{ ...inputStyle, resize: "vertical", minHeight: 60, marginBottom: 6 }} />
                        <input value={ref.scripture_focus || ""} onChange={e => updatePreviewReflection(i, "scripture_focus", e.target.value)} placeholder="Scripture focus" style={{ ...inputStyle, marginBottom: 6 }} />
                        <textarea value={ref.discussion_prompt || ""} onChange={e => updatePreviewReflection(i, "discussion_prompt", e.target.value)} placeholder="e.g. What does this passage say about how we treat others?" style={{ ...inputStyle, resize: "vertical", minHeight: 50, marginBottom: 6 }} />
                        <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Discussion Question (optional)</div>
                        <button type="button" onClick={() => setEditingPreviewIdx(null)} style={{ padding: "4px 12px", borderRadius: 6, border: "none", background: C.accentLight, color: C.accent, fontFamily: "var(--body)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Done</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{ref.day_number}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{ref.title}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>{DAY_SHORT[i]}{ref.scripture_focus ? ` · ${ref.scripture_focus}` : ""}</div>
                        </div>
                        <span onClick={() => setEditingPreviewIdx(i)} style={{ fontSize: 11, color: C.accent, fontWeight: 600, cursor: "pointer" }}>Edit</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" onClick={() => { setCreating(false); resetCreateForm(); }} style={{ padding: "10px 20px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.card, color: C.body, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--body)" }}>Cancel</button>
              <button type="submit" disabled={generating} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--body)", boxShadow: `0 4px 12px ${C.accent}25` }}>
                {generating ? "Creating..." : publishMode === "schedule" ? "Schedule Sermon Study" : "Publish Sermon Study"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sermon List + Detail Split */}
      {(() => {
        const activeSermons = sermons.filter(s => s.status !== "archived");
        const archivedSermons = sermons.filter(s => s.status === "archived");
        const showDetail = selected && !creating;

        const sermonCard = (sermon) => {
          const sc = STATUS_COLORS[sermon.status] || STATUS_COLORS.draft;
          return (
            <div
              key={sermon.id}
              onClick={() => { loadSermonDetail(sermon.id); setCreating(false); }}
              style={{
                padding: 16, borderRadius: 14, marginBottom: 10, cursor: "pointer",
                background: selected?.sermon?.id === sermon.id ? C.accentLight : C.card,
                border: `1px solid ${selected?.sermon?.id === sermon.id ? C.accent + "30" : C.border}`,
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{sermon.title}</div>
              <div style={{ fontSize: 12, color: C.sec, marginTop: 4 }}>Week of {sermon.week_start_date}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
                <span style={{ padding: "2px 8px", borderRadius: 6, background: C[sc.bg], fontSize: 10, fontWeight: 700, color: C[sc.color] }}>{sermon.status}</span>
                {sermon.status === "scheduled" && sermon.scheduled_date && (
                  <span style={{ fontSize: 10, color: C.muted }}>Publishes {sermon.scheduled_date}</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                {sermon.status === "published" && (
                  <button style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontFamily: "var(--body)", fontSize: 11, fontWeight: 600, cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); handleArchive(sermon); }}>Archive</button>
                )}
                <button style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${C.red}30`, background: "transparent", color: C.red, fontFamily: "var(--body)", fontSize: 11, fontWeight: 600, cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setDeleting(sermon); }}>Delete</button>
              </div>
            </div>
          );
        };

        return (
          <div style={{ display: "grid", gridTemplateColumns: showDetail ? "340px 1fr" : "1fr", gap: 24 }}>
            <div>
              {sermons.length === 0 && !creating && (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📖</div>
                  <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
                    No sermons yet. Create your first sermon to generate daily reflections for your congregation.
                  </div>
                </div>
              )}
              {activeSermons.map(sermonCard)}

              {/* Archived section */}
              {archivedSermons.length > 0 && (
                <>
                  <div
                    onClick={() => setShowArchived(!showArchived)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "12px 16px",
                      borderRadius: 10, cursor: "pointer", marginTop: 8, marginBottom: 6,
                      background: C.bg, border: `1px solid ${C.border}`,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span style={{ fontSize: 12, color: C.muted, transition: "transform 0.2s ease", transform: showArchived ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block" }}>▶</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 0.5 }}>Archived ({archivedSermons.length})</span>
                  </div>
                  {showArchived && archivedSermons.map(sermonCard)}
                </>
              )}
            </div>

            {/* Detail Panel */}
            {showDetail && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: "var(--heading)" }}>{selected.sermon.title}</div>
                      <div style={{ fontSize: 13, color: C.sec, marginTop: 4 }}>{selected.sermon.scripture_refs || ""}</div>
                      {selected.sermon.status === "scheduled" && selected.sermon.scheduled_date && (
                        <div style={{ fontSize: 12, color: C.amber, marginTop: 4 }}>Scheduled to publish: {selected.sermon.scheduled_date}</div>
                      )}
                    </div>
                    <button style={{ padding: "5px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.card, color: C.body, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--body)" }}>Edit</button>
                  </div>

                  {/* Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
                    {[
                      { label: "Started", value: selected.sermon.started_count || 0, color: C.amber, bg: C.amberBg },
                      { label: "Completed", value: selected.sermon.finished_count || 0, color: C.green, bg: C.greenBg },
                      { label: "Rate", value: (selected.sermon.completion_rate || 0) + "%", color: C.accent, bg: C.accentLight },
                    ].map((s, i) => (
                      <div key={i} style={{ padding: 16, borderRadius: 12, background: s.bg, textAlign: "center" }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: "var(--heading)" }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: C.sec, marginTop: 4 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Daily Engagement Bar Chart */}
                  {selected.sermon.day_breakdown && (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>DAILY ENGAGEMENT</div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                        {DAY_SHORT.map((d, i) => {
                          const val = selected.sermon.day_breakdown?.[i] || 0;
                          const max = Math.max(...(selected.sermon.day_breakdown || [1]));
                          return (
                            <div key={i} style={{ flex: 1, textAlign: "center" }}>
                              <div style={{ height: 80, display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: 6 }}>
                                <div style={{ width: "70%", borderRadius: "6px 6px 0 0", background: `linear-gradient(180deg, ${C.accent} 0%, ${C.accentMid} 100%)`, height: `${max > 0 ? (val / max) * 100 : 0}%`, transition: "height 0.6s ease", minHeight: val > 0 ? 4 : 0 }} />
                              </div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>{val}</div>
                              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{d}</div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Reflections */}
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>DAILY REFLECTIONS</div>
                  {(selected.reflections || []).map((ref) => (
                    <div key={ref.id} style={{ padding: "18px 20px", borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 10, background: C.bg }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: 0.5, textTransform: "uppercase" }}>Day {ref.day_number} · {DAYS[ref.day_number - 1]}</div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginTop: 4 }}>{ref.title}</div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          {selected.completion_stats && (
                            <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: C.greenBg, color: C.green }}>{selected.completion_stats[ref.day_number] || 0} completed</span>
                          )}
                        </div>
                      </div>
                      {editingRef?.id === ref.id ? (
                        <div style={{ marginTop: 12 }}>
                          <input style={{ display: "block", width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontFamily: "var(--body)", fontSize: 14, outline: "none", marginBottom: 8 }} value={refForm.title} onChange={(e) => setRefForm({ ...refForm, title: e.target.value })} placeholder="Reflection title" />
                          <textarea style={{ display: "block", width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontFamily: "var(--body)", fontSize: 14, outline: "none", resize: "vertical", minHeight: 80, marginBottom: 8 }} value={refForm.prompt} onChange={(e) => setRefForm({ ...refForm, prompt: e.target.value })} placeholder="Reflection prompt" />
                          <input style={{ display: "block", width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontFamily: "var(--body)", fontSize: 14, outline: "none", marginBottom: 8 }} value={refForm.scripture_focus} onChange={(e) => setRefForm({ ...refForm, scripture_focus: e.target.value })} placeholder="Scripture focus" />
                          <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Discussion Question (optional)</label>
                          <textarea style={{ display: "block", width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontFamily: "var(--body)", fontSize: 14, outline: "none", resize: "vertical", minHeight: 60, marginBottom: 8 }} value={refForm.discussion_prompt} onChange={(e) => setRefForm({ ...refForm, discussion_prompt: e.target.value })} placeholder="e.g. What does this passage say about how we treat others?" />
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={saveReflection} style={{ padding: "4px 12px", borderRadius: 6, border: "none", background: C.accentLight, color: C.accent, fontFamily: "var(--body)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Save</button>
                            <button onClick={() => setEditingRef(null)} style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontFamily: "var(--body)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p style={{ fontSize: 13, color: C.sec, lineHeight: 1.7, marginTop: 8 }}>{ref.prompt}</p>
                          {ref.scripture_focus && <div style={{ fontSize: 12, color: C.accent, marginTop: 6 }}>📖 {ref.scripture_focus}</div>}
                          {ref.discussion_prompt && <div style={{ fontSize: 12, color: C.sec, marginTop: 6 }}>💬 {ref.discussion_prompt}</div>}
                          <button onClick={() => { setEditingRef(ref); setRefForm({ title: ref.title, prompt: ref.prompt, scripture_focus: ref.scripture_focus || "", discussion_prompt: ref.discussion_prompt || "" }); }} style={{ marginTop: 8, padding: "4px 14px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.accent, fontFamily: "var(--body)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                        </>
                      )}
                    </div>
                  ))}
                  {(!selected.reflections || selected.reflections.length === 0) && (
                    <div style={{ color: C.muted, fontSize: 13, fontStyle: "italic" }}>No reflections generated yet.</div>
                  )}
                </div>
              </div>
            )}

            {/* Placeholder when no sermon selected and not creating */}
            {!showDetail && !creating && sermons.length > 0 && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.03)", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📖</div>
                  <div style={{ fontSize: 15, color: C.sec }}>Select a sermon to view reflections and progress</div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

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
