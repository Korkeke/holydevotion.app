import { useState, useEffect, useRef } from "react";
import { useChurchColors } from "../useChurchColors";
import { useAuth } from "../AuthContext";
import { get, post, put, del, postFile } from "../api";
import ConfirmDialog from "../components/ConfirmDialog";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import SectionLabel from "../components/ui/SectionLabel";
import Progress from "../components/ui/Progress";
import Avatar from "../components/ui/Avatar";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

  if (loading) return (
    <div style={{ padding: 60, display: "flex", justifyContent: "center" }}>
      <div style={{
        width: 28, height: 28, border: `2px solid ${C.accent}`,
        borderTopColor: "transparent", borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
    </div>
  );

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    border: "1px solid #e0dbd1", background: "#fff",
    fontSize: 13, fontFamily: "inherit", color: "#2C2C2C", outline: "none",
  };

  const activeSermons = sermons.filter(s => s.status !== "archived");
  const archivedSermons = sermons.filter(s => s.status === "archived");
  const showDetail = selected && !creating;
  const showRightPanel = showDetail || creating;

  return (
    <div style={{ padding: "24px 32px 48px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C2C2C", fontFamily: "'DM Serif Display', serif", margin: 0 }}>
          Sermons
        </h1>
        <Button primary onClick={() => { setCreating(true); setSelected(null); }}>
          + New Sermon
        </Button>
      </div>

      {/* Split Layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: showRightPanel ? "1fr 1fr" : "1fr",
        gap: 24,
      }}>
        {/* ─── Left: Sermon List ─────────────────────────── */}
        <div>
          {sermons.length === 0 && !creating && (
            <Card style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📖</div>
              <div style={{ color: "#9e9888", fontSize: 14, lineHeight: 1.6 }}>
                No sermons yet. Create your first sermon to generate daily reflections for your congregation.
              </div>
            </Card>
          )}

          {activeSermons.map((sermon) => {
            const isSelected = selected?.sermon?.id === sermon.id;
            const completionPct = sermon.completion_rate || 0;
            return (
              <Card
                key={sermon.id}
                style={{
                  marginBottom: 10, cursor: "pointer",
                  border: isSelected ? `1.5px solid ${C.accent}` : "1px solid #ece7dd",
                  background: isSelected ? (C.accent + "08") : "#fff",
                }}
              >
                <div onClick={() => { loadSermonDetail(sermon.id); setCreating(false); }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#2C2C2C", marginBottom: 3 }}>
                        {sermon.title}
                      </div>
                      <div style={{ fontSize: 12, color: "#7A7672" }}>
                        Week of {sermon.week_start_date}
                      </div>
                    </div>
                    <Badge variant={sermon.status} style={{ marginLeft: 10, textTransform: "capitalize" }}>
                      {sermon.status}
                    </Badge>
                  </div>

                  {/* Completion + Reflections row */}
                  <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    <div style={{
                      flex: 1, padding: "6px 10px", borderRadius: 6,
                      background: "#e8f0e9", fontSize: 11, color: "#3d6b44", fontWeight: 600,
                    }}>
                      {completionPct}% completed
                    </div>
                    <div style={{
                      flex: 1, padding: "6px 10px", borderRadius: 6,
                      background: "#faf3e0", fontSize: 11, color: "#8b6914", fontWeight: 600,
                    }}>
                      {sermon.reflection_count || 7} reflections
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  {sermon.status === "published" && (
                    <Button small onClick={(e) => { e.stopPropagation(); handleArchive(sermon); }}>
                      Archive
                    </Button>
                  )}
                  <Button small danger onClick={(e) => { e.stopPropagation(); setDeleting(sermon); }}>
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}

          {/* Archived section */}
          {archivedSermons.length > 0 && (
            <>
              <div
                onClick={() => setShowArchived(!showArchived)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "12px 16px",
                  borderRadius: 8, cursor: "pointer", marginTop: 10, marginBottom: 6,
                  background: "#f7f4ef", border: "1px solid #e0dbd1",
                  transition: "all 0.2s ease",
                }}
              >
                <span style={{
                  fontSize: 10, color: "#9e9888",
                  transition: "transform 0.2s ease",
                  transform: showArchived ? "rotate(90deg)" : "rotate(0deg)",
                  display: "inline-block",
                }}>
                  ▶
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#9e9888", letterSpacing: "0.04em" }}>
                  Archived ({archivedSermons.length})
                </span>
              </div>
              {showArchived && archivedSermons.map((sermon) => {
                const isSelected = selected?.sermon?.id === sermon.id;
                return (
                  <Card
                    key={sermon.id}
                    style={{
                      marginBottom: 10, cursor: "pointer", opacity: 0.7,
                      border: isSelected ? `1.5px solid ${C.accent}` : "1px solid #ece7dd",
                    }}
                  >
                    <div onClick={() => { loadSermonDetail(sermon.id); setCreating(false); }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, color: "#2C2C2C" }}>{sermon.title}</div>
                          <div style={{ fontSize: 12, color: "#7A7672", marginTop: 3 }}>Week of {sermon.week_start_date}</div>
                        </div>
                        <Badge variant="draft" style={{ marginLeft: 10 }}>Archived</Badge>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                      <Button small danger onClick={(e) => { e.stopPropagation(); setDeleting(sermon); }}>Delete</Button>
                    </div>
                  </Card>
                );
              })}
            </>
          )}
        </div>

        {/* ─── Right: Detail Panel or Create Form ────────── */}

        {/* Create Form Panel */}
        {creating && (
          <Card style={{ padding: 24, alignSelf: "start" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#2C2C2C", fontFamily: "'DM Serif Display', serif", marginBottom: 20 }}>
              Create This Week's Sermon Study
            </div>

            {/* Transcribe from File */}
            <div style={{
              padding: 18, borderRadius: 10, marginBottom: 20,
              background: "linear-gradient(135deg, #EEF4FB 0%, #fff 100%)",
              border: "1px solid #d4e3f3",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>🎙️</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#2C2C2C" }}>Transcribe Sermon Recording</div>
                  <div style={{ fontSize: 12, color: "#7A7672" }}>Upload your sermon audio or video to auto-extract title, scripture, and summary</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input ref={fileInputRef} type="file" accept=".mp3,.mp4,.m4a,.wav,.webm,.ogg" onChange={handleFileUpload} disabled={transcribing} style={{ display: "none" }} />
                <Button primary small onClick={() => fileInputRef.current?.click()} disabled={transcribing}>
                  {transcribing ? "Transcribing..." : "Upload & Transcribe"}
                </Button>
                <span style={{ fontSize: 11, color: "#A8A29E" }}>MP3, MP4, M4A, WAV (max 25MB)</span>
              </div>
              {transcribed && transcriptionMeta && (
                <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "#e8f0e9", border: "1px solid #c8e0cd" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#3d6b44" }}>
                    Transcription complete. {transcriptionMeta.word_count?.toLocaleString() || "?"} words extracted.
                  </div>
                  {transcriptionMeta.theme && (
                    <div style={{ fontSize: 11, color: "#7A7672", marginTop: 4 }}>Theme: {transcriptionMeta.theme}</div>
                  )}
                </div>
              )}
            </div>

            <div style={{ textAlign: "center", fontSize: 11, color: "#A8A29E", fontWeight: 600, marginBottom: 16 }}>or enter manually</div>

            <form onSubmit={handleCreate}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#4A4A4A", display: "block", marginBottom: 6 }}>Sermon Title *</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Finding Peace in the Storm" required style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#4A4A4A", display: "block", marginBottom: 6 }}>Scripture References</label>
                  <input value={form.scripture_refs} onChange={e => setForm({ ...form, scripture_refs: e.target.value })} placeholder="e.g., Mark 4:35-41, Psalm 46:10" style={inputStyle} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#4A4A4A", display: "block", marginBottom: 6 }}>Week Start Date (Monday) *</label>
                  <input type="date" value={form.week_start_date} onChange={e => setForm({ ...form, week_start_date: e.target.value })} required style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#4A4A4A", display: "block", marginBottom: 6 }}>Publication</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[
                      { key: "now", label: "Publish Now" },
                      { key: "schedule", label: "Schedule" },
                    ].map(opt => (
                      <button key={opt.key} type="button" onClick={() => setPublishMode(opt.key)} style={{
                        flex: 1, padding: "9px 12px", borderRadius: 8,
                        border: `1.5px solid ${publishMode === opt.key ? C.accent : "#e0dbd1"}`,
                        background: publishMode === opt.key ? (C.accent + "10") : "#fff",
                        color: publishMode === opt.key ? C.accent : "#4A4A4A",
                        fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                      }}>{opt.label}</button>
                    ))}
                  </div>
                  {publishMode === "schedule" && (
                    <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} min={new Date().toISOString().split("T")[0]} style={{ ...inputStyle, marginTop: 8 }} placeholder="Select date" />
                  )}
                </div>
              </div>

              {/* Generate Reflections */}
              <div style={{
                padding: "14px 18px", borderRadius: 10, marginBottom: 16,
                background: "linear-gradient(135deg, #faf3e0 0%, #F9F5ED 100%)",
                border: "1px solid #e8dcc4",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>✨</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#8b6914" }}>Generate 7-Day Reflections</div>
                      <div style={{ fontSize: 12, color: "#7A7672" }}>Creates daily prompts, scripture connections, and closing prayers{transcribed ? " based on your sermon transcript" : ""}</div>
                    </div>
                  </div>
                  <Button primary small onClick={handleGenerateReflections} disabled={genReflections || !form.title} style={{ background: "#8b6914", boxShadow: "0 1px 3px rgba(139,105,20,0.2)" }}>
                    {genReflections ? "Generating..." : previewReflections.length > 0 ? "Regenerate" : "Generate"}
                  </Button>
                </div>
              </div>

              {/* Preview Reflections */}
              {previewReflections.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <SectionLabel>Generated Reflections (edit before publishing)</SectionLabel>
                  {previewReflections.map((ref, i) => (
                    <Card key={i} style={{ padding: "12px 14px", marginBottom: 6 }}>
                      {editingPreviewIdx === i ? (
                        <div>
                          <input value={ref.title} onChange={e => updatePreviewReflection(i, "title", e.target.value)} placeholder="Reflection title" style={{ ...inputStyle, marginBottom: 6 }} />
                          <textarea value={ref.prompt} onChange={e => updatePreviewReflection(i, "prompt", e.target.value)} placeholder="Reflection prompt" style={{ ...inputStyle, resize: "vertical", minHeight: 60, marginBottom: 6 }} />
                          <input value={ref.scripture_focus || ""} onChange={e => updatePreviewReflection(i, "scripture_focus", e.target.value)} placeholder="Scripture focus" style={{ ...inputStyle, marginBottom: 6 }} />
                          <textarea value={ref.discussion_prompt || ""} onChange={e => updatePreviewReflection(i, "discussion_prompt", e.target.value)} placeholder="e.g. What does this passage say about how we treat others?" style={{ ...inputStyle, resize: "vertical", minHeight: 50, marginBottom: 6 }} />
                          <div style={{ fontSize: 11, color: "#A8A29E", marginBottom: 6 }}>Discussion Question (optional)</div>
                          <Button small onClick={() => setEditingPreviewIdx(null)} style={{ background: C.accent + "15", color: C.accent, border: "none" }}>
                            Done
                          </Button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <Avatar initials={String(ref.day_number)} size={28} bg={C.accent} color="#fff" />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2C" }}>{ref.title}</div>
                            <div style={{ fontSize: 11, color: "#A8A29E" }}>{DAY_SHORT[i]}{ref.scripture_focus ? ` · ${ref.scripture_focus}` : ""}</div>
                          </div>
                          <Button ghost small onClick={() => setEditingPreviewIdx(i)}>Edit</Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <Button onClick={() => { setCreating(false); resetCreateForm(); }}>Cancel</Button>
                <Button primary type="submit" disabled={generating}>
                  {generating ? "Creating..." : publishMode === "schedule" ? "Schedule Sermon Study" : "Publish Sermon Study"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Detail Panel */}
        {showDetail && (
          <Card style={{ padding: 24, alignSelf: "start" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#2C2C2C", fontFamily: "'DM Serif Display', serif" }}>
                  {selected.sermon.title}
                </div>
                <div style={{ fontSize: 13, color: "#7A7672", marginTop: 4 }}>
                  Week of {selected.sermon.week_start_date}
                  {selected.sermon.scripture_refs ? ` · ${selected.sermon.scripture_refs}` : ""}
                </div>
                {selected.sermon.status === "scheduled" && selected.sermon.scheduled_date && (
                  <div style={{ fontSize: 12, color: "#8b6914", marginTop: 6 }}>
                    Scheduled to publish: {selected.sermon.scheduled_date}
                  </div>
                )}
              </div>
              <Button small>Edit</Button>
            </div>

            {/* Engagement Stats Boxes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
              <div style={{ padding: 16, borderRadius: 10, background: "#faf3e0", textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: "#8b6914", fontFamily: "'DM Serif Display', serif" }}>
                  {selected.sermon.started_count || 0}
                </div>
                <div style={{ fontSize: 11, color: "#7A7672", marginTop: 4 }}>Started</div>
              </div>
              <div style={{ padding: 16, borderRadius: 10, background: "#e8f0e9", textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: "#3d6b44", fontFamily: "'DM Serif Display', serif" }}>
                  {selected.sermon.finished_count || 0}
                </div>
                <div style={{ fontSize: 11, color: "#7A7672", marginTop: 4 }}>Completed</div>
              </div>
              <div style={{ padding: 16, borderRadius: 10, background: C.accent + "12", textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: C.accent, fontFamily: "'DM Serif Display', serif" }}>
                  {(selected.sermon.completion_rate || 0)}%
                </div>
                <div style={{ fontSize: 11, color: "#7A7672", marginTop: 4 }}>Rate</div>
              </div>
            </div>

            {/* Daily Engagement Bar Chart */}
            {selected.sermon.day_breakdown && (
              <>
                <SectionLabel>Daily Engagement</SectionLabel>
                <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                  {DAY_SHORT.map((d, i) => {
                    const val = selected.sermon.day_breakdown?.[i] || 0;
                    const max = Math.max(...(selected.sermon.day_breakdown || [1]));
                    return (
                      <div key={i} style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ height: 80, display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: 6 }}>
                          <div style={{
                            width: "70%", borderRadius: "6px 6px 0 0",
                            background: `linear-gradient(180deg, ${C.accent} 0%, ${C.accent}80 100%)`,
                            height: `${max > 0 ? (val / max) * 100 : 0}%`,
                            transition: "height 0.6s ease",
                            minHeight: val > 0 ? 4 : 0,
                          }} />
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>{val}</div>
                        <div style={{ fontSize: 10, color: "#A8A29E", marginTop: 2 }}>{d}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Per-member progress bars */}
            {selected.member_progress && selected.member_progress.length > 0 && (
              <>
                <SectionLabel>Member Progress</SectionLabel>
                <div style={{ marginBottom: 24 }}>
                  {selected.member_progress.map((m, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <Avatar initials={m.initials || "?"} size={28} bg="#e8e2d8" color="#5a5647" />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: "#2C2C2C" }}>{m.name || "Member"}</span>
                          <span style={{ fontSize: 11, color: "#7A7672" }}>{m.days_completed || 0}/7</span>
                        </div>
                        <Progress pct={((m.days_completed || 0) / 7) * 100} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Reflections */}
            <SectionLabel>Daily Reflections</SectionLabel>
            {(selected.reflections || []).map((ref) => (
              <Card key={ref.id} style={{ padding: "16px 18px", marginBottom: 10, background: "#f7f4ef" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.accent, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      Day {ref.day_number} · {DAYS[ref.day_number - 1]}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#2C2C2C", marginTop: 4 }}>{ref.title}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {selected.completion_stats && (
                      <Badge variant="published">
                        {selected.completion_stats[ref.day_number] || 0} completed
                      </Badge>
                    )}
                  </div>
                </div>
                {editingRef?.id === ref.id ? (
                  <div style={{ marginTop: 12 }}>
                    <input style={{ ...inputStyle, background: "#fff", marginBottom: 8 }} value={refForm.title} onChange={(e) => setRefForm({ ...refForm, title: e.target.value })} placeholder="Reflection title" />
                    <textarea style={{ ...inputStyle, background: "#fff", resize: "vertical", minHeight: 80, marginBottom: 8 }} value={refForm.prompt} onChange={(e) => setRefForm({ ...refForm, prompt: e.target.value })} placeholder="Reflection prompt" />
                    <input style={{ ...inputStyle, background: "#fff", marginBottom: 8 }} value={refForm.scripture_focus} onChange={(e) => setRefForm({ ...refForm, scripture_focus: e.target.value })} placeholder="Scripture focus" />
                    <label style={{ fontSize: 11, fontWeight: 500, color: "#A8A29E", display: "block", marginBottom: 4 }}>Discussion Question (optional)</label>
                    <textarea style={{ ...inputStyle, background: "#fff", resize: "vertical", minHeight: 60, marginBottom: 8 }} value={refForm.discussion_prompt} onChange={(e) => setRefForm({ ...refForm, discussion_prompt: e.target.value })} placeholder="e.g. What does this passage say about how we treat others?" />
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button primary small onClick={saveReflection}>Save</Button>
                      <Button small onClick={() => setEditingRef(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: 13, color: "#7A7672", lineHeight: 1.7, marginTop: 8, marginBottom: 0 }}>{ref.prompt}</p>
                    {ref.scripture_focus && <div style={{ fontSize: 12, color: C.accent, marginTop: 6 }}>📖 {ref.scripture_focus}</div>}
                    {ref.discussion_prompt && <div style={{ fontSize: 12, color: "#7A7672", marginTop: 6 }}>💬 {ref.discussion_prompt}</div>}
                    <Button ghost small onClick={() => { setEditingRef(ref); setRefForm({ title: ref.title, prompt: ref.prompt, scripture_focus: ref.scripture_focus || "", discussion_prompt: ref.discussion_prompt || "" }); }} style={{ marginTop: 8 }}>
                      Edit
                    </Button>
                  </>
                )}
              </Card>
            ))}
            {(!selected.reflections || selected.reflections.length === 0) && (
              <div style={{ color: "#A8A29E", fontSize: 13, fontStyle: "italic" }}>No reflections generated yet.</div>
            )}
          </Card>
        )}

        {/* Placeholder when no sermon selected and not creating */}
        {!showDetail && !creating && sermons.length > 0 && (
          <Card style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center" }}>
            <div>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📖</div>
              <div style={{ fontSize: 14, color: "#7A7672" }}>Select a sermon to view reflections and progress</div>
            </div>
          </Card>
        )}
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
