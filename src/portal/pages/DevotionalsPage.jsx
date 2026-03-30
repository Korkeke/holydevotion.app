import { useState, useEffect } from "react";
import { useChurchColors } from "../useChurchColors";
import { useAuth } from "../AuthContext";
import { get, post, put, del } from "../api";
import FormModal from "../components/FormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import FilterButton from "../components/ui/FilterButton";
import EmptyState from "../components/ui/EmptyState";
import SectionLabel from "../components/ui/SectionLabel";
import Progress from "../components/ui/Progress";

const FIELDS = [
  { name: "title", label: "Title", required: true, placeholder: "Walking in Faith" },
  { name: "scripture_ref", label: "Scripture Reference", placeholder: "John 3:16" },
  { name: "content", label: "Content", type: "textarea", required: true, rows: 8, placeholder: "Write your devotional..." },
  { name: "scheduled_date", label: "Scheduled Date", type: "date" },
  {
    name: "status", label: "Status", type: "select",
    options: [
      { value: "draft", label: "Draft" },
      { value: "scheduled", label: "Scheduled" },
      { value: "published", label: "Published" },
    ],
  },
];

const FILTERS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
];

const AI_MODES = [
  { key: "topic", label: "From Topic", icon: "💡" },
  { key: "congregation", label: "Congregation", icon: "👥" },
  { key: "sermon", label: "From Sermon", icon: "🎤" },
  { key: "polish", label: "Polish Draft", icon: "✨" },
  { key: "series", label: "Series", icon: "📅" },
];

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1px solid #e0dbd1", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
  color: "#2c2a25", background: "#fff", boxSizing: "border-box",
  outline: "none",
};

const textareaStyle = {
  ...inputStyle, resize: "vertical", minHeight: 100, lineHeight: 1.6,
};

export default function DevotionalsPage() {
  const C = useChurchColors();
  const { church } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  // AI Assist state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMode, setAiMode] = useState("topic");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // AI input state
  const [aiTopic, setAiTopic] = useState("");
  const [aiScripture, setAiScripture] = useState("");
  const [aiDraft, setAiDraft] = useState("");
  const [aiSeriesTheme, setAiSeriesTheme] = useState("");
  const [aiSeriesCount, setAiSeriesCount] = useState(5);
  const [aiSermonId, setAiSermonId] = useState("");

  // AI result state
  const [aiResult, setAiResult] = useState(null);        // single { title, scripture_ref, content }
  const [aiSeriesResult, setAiSeriesResult] = useState(null); // array
  const [editingTitle, setEditingTitle] = useState("");
  const [editingScripture, setEditingScripture] = useState("");
  const [editingContent, setEditingContent] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);

  // Congregation suggestions + sermons
  const [suggestions, setSuggestions] = useState([]);
  const [sermons, setSermons] = useState([]);

  async function load() {
    if (!church?.id) return;
    try {
      const data = await get(`/api/churches/${church.id}/devotionals`);
      setItems(data?.devotionals || []);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [church?.id]);

  // Load suggestions + sermons when AI panel opens
  useEffect(() => {
    if (!aiOpen || !church?.id) return;
    get(`/api/churches/${church.id}/devotionals/suggestions`).then(d => setSuggestions(d?.suggestions || [])).catch(() => {});
    get(`/api/churches/${church.id}/sermons`).then(d => {
      const list = d?.sermons || [];
      setSermons(list);
      if (list.length > 0 && !aiSermonId) setAiSermonId(list[0].id);
    }).catch(() => {});
  }, [aiOpen, church?.id]);

  const filtered = filter === "all" ? items : items.filter((d) => d.status === filter);

  function countByStatus(status) {
    return status === "all" ? items.length : items.filter((d) => d.status === status).length;
  }

  async function handleCreate(values) {
    await post(`/api/churches/${church.id}/devotionals`, values);
    await load();
  }

  async function handleEdit(values) {
    await put(`/api/churches/${church.id}/devotionals/${editing.id}`, values);
    setEditing(null);
    await load();
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await del(`/api/churches/${church.id}/devotionals/${deleting.id}`);
      setDeleting(null);
      if (selected !== null && filtered[selected]?.id === deleting?.id) setSelected(null);
      await load();
    } finally { setDeleteLoading(false); }
  }

  async function quickPublish(dev) {
    await put(`/api/churches/${church.id}/devotionals/${dev.id}`, { status: "published" });
    await load();
  }

  function openAiPanel() {
    setAiOpen(true);
    setSelected(null);
    setAiResult(null);
    setAiSeriesResult(null);
    setAiError(null);
  }

  function closeAiPanel() {
    setAiOpen(false);
    setAiResult(null);
    setAiSeriesResult(null);
    setAiError(null);
  }

  function loadResultIntoEditor(r) {
    setEditingTitle(r.title || "");
    setEditingScripture(r.scripture_ref || "");
    setEditingContent(r.content || "");
  }

  async function handleGenerate(overrideBody) {
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    setAiSeriesResult(null);

    const body = overrideBody || (() => {
      switch (aiMode) {
        case "topic": return { mode: "prompt", topic: aiTopic, scripture: aiScripture };
        case "congregation": return { mode: "congregation" };
        case "sermon": return { mode: "sermon", sermon_id: aiSermonId || undefined };
        case "polish": return { mode: "polish", draft_content: aiDraft };
        case "series": return { mode: "series", series_theme: aiSeriesTheme, series_count: aiSeriesCount };
        default: return { mode: "prompt" };
      }
    })();

    try {
      const data = await post(`/api/churches/${church.id}/devotionals/generate`, body);
      if (body.mode === "series") {
        setAiSeriesResult(data.devotionals || []);
      } else {
        const r = data.devotional;
        setAiResult(r);
        loadResultIntoEditor(r);
      }
    } catch (e) {
      setAiError("Generation failed. Please try again.");
    } finally { setAiLoading(false); }
  }

  async function saveSingleDraft() {
    setSavingDraft(true);
    try {
      await post(`/api/churches/${church.id}/devotionals`, {
        title: editingTitle,
        scripture_ref: editingScripture,
        content: editingContent,
        status: "draft",
      });
      setAiResult(null);
      setEditingTitle(""); setEditingScripture(""); setEditingContent("");
      await load();
    } catch {} finally { setSavingDraft(false); }
  }

  async function saveAllSeriesDrafts() {
    if (!aiSeriesResult?.length) return;
    setSavingDraft(true);
    try {
      for (const item of aiSeriesResult) {
        await post(`/api/churches/${church.id}/devotionals`, {
          title: item.title,
          scripture_ref: item.scripture_ref,
          content: item.content,
          status: "draft",
        });
      }
      setAiSeriesResult(null);
      await load();
    } catch {} finally { setSavingDraft(false); }
  }

  if (loading) return (
    <div style={{ padding: 60, display: "flex", justifyContent: "center" }}>
      <div style={{ width: 28, height: 28, border: `2px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  const selectedItem = !aiOpen && selected !== null ? filtered[selected] : null;
  const showRightPanel = selectedItem != null;
  const hasAiResult = aiResult || aiSeriesResult || aiLoading || aiError;

  return (
    <div style={{ padding: "24px 32px 48px" }}>
      {/* Action bar */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 20 }}>
        {!aiOpen && (
          <Button onClick={openAiPanel}>
            AI Assist
          </Button>
        )}
        <Button primary onClick={() => setShowForm(true)}>+ Write Devotional</Button>
      </div>

      {/* AI Assist — full-width workspace */}
      {aiOpen ? (
        <Card style={{ padding: 28 }}>
          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={closeAiPanel} style={{
                width: 32, height: 32, borderRadius: 8,
                border: "1px solid #e0dbd1", background: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: 16, color: "#5a5647",
                transition: "all 0.15s",
              }}>&larr;</button>
              <SectionLabel style={{ margin: 0, fontSize: 13 }}>AI Assist</SectionLabel>
            </div>
            <button onClick={closeAiPanel} style={{
              width: 28, height: 28, borderRadius: "50%",
              border: "1px solid #e0dbd1", background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 14, color: "#9e9888",
            }}>&times;</button>
          </div>

          {/* Mode tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
            {AI_MODES.map(m => (
              <button
                key={m.key}
                onClick={() => { setAiMode(m.key); setAiResult(null); setAiSeriesResult(null); setAiError(null); }}
                style={{
                  padding: "8px 16px", borderRadius: 8, border: "1px solid",
                  borderColor: aiMode === m.key ? C.accent : "#e0dbd1",
                  background: aiMode === m.key ? C.accent + "12" : "#fff",
                  color: aiMode === m.key ? C.accent : "#5a5647",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.15s",
                }}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {/* Two-column body: inputs left, results right */}
          <div style={{ display: "grid", gridTemplateColumns: hasAiResult ? "1fr 1fr" : "1fr", gap: 24 }}>
            {/* Left: mode-specific inputs */}
            <div>
              {aiMode === "topic" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input
                    value={aiTopic} onChange={e => setAiTopic(e.target.value)}
                    placeholder="e.g. Finding peace in hard seasons"
                    style={inputStyle}
                  />
                  <input
                    value={aiScripture} onChange={e => setAiScripture(e.target.value)}
                    placeholder="Scripture (optional) e.g. Philippians 4:6-7"
                    style={inputStyle}
                  />
                  <Button primary onClick={() => handleGenerate()} disabled={aiLoading}>
                    {aiLoading ? "Generating..." : "Generate Devotional"}
                  </Button>
                </div>
              )}

              {aiMode === "congregation" && (
                <div>
                  {suggestions.length === 0 ? (
                    <div style={{ fontSize: 13, color: "#9e9888", padding: "12px 0", textAlign: "center" }}>
                      Not enough conversation data yet. As members use the app, themes will appear here.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {suggestions.map((s, i) => (
                        <div key={i} style={{
                          padding: "12px 14px", borderRadius: 10,
                          border: "1px solid #e0dbd1", background: "#faf6ee",
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#2c2a25" }}>{s.theme}</span>
                            <span style={{ fontSize: 11, color: "#9e9888" }}>{s.percentage}% this week</span>
                          </div>
                          <div style={{ fontSize: 12, color: "#5a5647", marginBottom: 2 }}>{s.topic}</div>
                          <div style={{ fontSize: 11, fontStyle: "italic", color: "#8b6914", marginBottom: 8 }}>{s.scripture}</div>
                          <Button small primary onClick={() => handleGenerate({ mode: "congregation" })} disabled={aiLoading}>
                            {aiLoading ? "Generating..." : "Generate"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: 10 }}>
                    <Button primary onClick={() => handleGenerate({ mode: "congregation" })} disabled={aiLoading} style={{ width: "100%" }}>
                      {aiLoading ? "Generating..." : "Generate from All Themes"}
                    </Button>
                  </div>
                </div>
              )}

              {aiMode === "sermon" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {sermons.length === 0 ? (
                    <div style={{ fontSize: 13, color: "#9e9888", textAlign: "center", padding: "12px 0" }}>
                      No sermons found. Create a sermon study first.
                    </div>
                  ) : (
                    <>
                      <select
                        value={aiSermonId}
                        onChange={e => setAiSermonId(e.target.value)}
                        style={{ ...inputStyle, cursor: "pointer" }}
                      >
                        {sermons.map(s => (
                          <option key={s.id} value={s.id}>{s.title} ({s.week_start_date || "no date"})</option>
                        ))}
                      </select>
                      <Button primary onClick={() => handleGenerate()} disabled={aiLoading || !aiSermonId}>
                        {aiLoading ? "Generating..." : "Generate from Sermon"}
                      </Button>
                    </>
                  )}
                </div>
              )}

              {aiMode === "polish" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <textarea
                    value={aiDraft} onChange={e => setAiDraft(e.target.value)}
                    placeholder="Paste your rough draft here. The AI will polish and expand it while keeping your voice..."
                    style={{ ...textareaStyle, minHeight: 200 }}
                  />
                  <Button primary onClick={() => handleGenerate()} disabled={aiLoading || !aiDraft.trim()}>
                    {aiLoading ? "Polishing..." : "Polish Draft"}
                  </Button>
                </div>
              )}

              {aiMode === "series" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input
                    value={aiSeriesTheme} onChange={e => setAiSeriesTheme(e.target.value)}
                    placeholder="e.g. The Beatitudes, Walking by Faith"
                    style={inputStyle}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ fontSize: 12, color: "#5a5647", whiteSpace: "nowrap" }}>Days:</label>
                    <select
                      value={aiSeriesCount}
                      onChange={e => setAiSeriesCount(Number(e.target.value))}
                      style={{ ...inputStyle, width: 70 }}
                    >
                      {[2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <Button primary onClick={() => handleGenerate()} disabled={aiLoading || !aiSeriesTheme.trim()}>
                    {aiLoading ? "Generating Series..." : `Generate ${aiSeriesCount}-Day Series`}
                  </Button>
                </div>
              )}
            </div>

            {/* Right: results area */}
            {hasAiResult && (
              <div>
                {/* Error */}
                {aiError && (
                  <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fef2f2", color: "#b91c1c", fontSize: 13, marginBottom: 14 }}>
                    {aiError}
                  </div>
                )}

                {/* Loading spinner */}
                {aiLoading && (
                  <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                    <div style={{ width: 28, height: 28, border: `2px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  </div>
                )}

                {/* Single result - editable preview */}
                {aiResult && !aiLoading && (
                  <div>
                    <SectionLabel style={{ marginBottom: 10 }}>Preview & Edit</SectionLabel>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8, marginBottom: 8 }}>
                      <input
                        value={editingTitle} onChange={e => setEditingTitle(e.target.value)}
                        placeholder="Title" style={{ ...inputStyle, fontWeight: 600 }}
                      />
                      <input
                        value={editingScripture} onChange={e => setEditingScripture(e.target.value)}
                        placeholder="Scripture Reference" style={inputStyle}
                      />
                    </div>
                    <textarea
                      value={editingContent} onChange={e => setEditingContent(e.target.value)}
                      style={{ ...textareaStyle, minHeight: 280, marginBottom: 14 }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button primary onClick={saveSingleDraft} disabled={savingDraft || !editingTitle.trim() || !editingContent.trim()} style={{ flex: 1 }}>
                        {savingDraft ? "Saving..." : "Save as Draft"}
                      </Button>
                      <Button onClick={() => handleGenerate()} disabled={aiLoading} style={{ flex: 1 }}>
                        Regenerate
                      </Button>
                    </div>
                  </div>
                )}

                {/* Series result */}
                {aiSeriesResult && !aiLoading && (
                  <div>
                    <SectionLabel style={{ marginBottom: 10 }}>
                      {aiSeriesResult.length}-Day Series Preview
                    </SectionLabel>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                      {aiSeriesResult.map((item, i) => (
                        <SeriesItemCard key={i} item={item} dayNum={i + 1} C={C}
                          onUpdate={(field, value) => {
                            setAiSeriesResult(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
                          }}
                        />
                      ))}
                    </div>
                    <Button primary onClick={saveAllSeriesDrafts} disabled={savingDraft} style={{ width: "100%" }}>
                      {savingDraft ? "Saving All..." : `Save All ${aiSeriesResult.length} as Drafts`}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            emoji="📖"
            title="No devotionals yet"
            desc="Write your first devotional or use AI Assist to generate one."
            action="AI Assist"
            onAction={openAiPanel}
          />
        </Card>
      ) : (
        <>
          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {FILTERS.map((f) => (
              <FilterButton
                key={f.key}
                active={filter === f.key}
                onClick={() => { setFilter(f.key); setSelected(null); }}
                count={countByStatus(f.key)}
              >
                {f.label}
              </FilterButton>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: showRightPanel ? "1fr 420px" : "1fr", gap: 20 }}>
            <Card noPad>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #ece7dd" }}>
                    {["Title", "Scripture", "Status", "Scheduled", "Engagement", ""].map((h, i) => (
                      <th key={i} style={{
                        padding: "12px 16px",
                        fontSize: 11, fontWeight: 600, color: "#9e9888",
                        textTransform: "uppercase", letterSpacing: "0.04em",
                        textAlign: "left",
                        ...(i === 5 ? { width: 120 } : {}),
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, idx) => (
                    <tr
                      key={row.id || idx}
                      onClick={() => { setSelected(idx); }}
                      style={{
                        cursor: "pointer",
                        borderBottom: idx < filtered.length - 1 ? "1px solid #f0ebe3" : "none",
                        background: selected === idx ? "#faf6ee" : "transparent",
                        transition: "background 0.15s",
                      }}
                    >
                      <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: "#2c2a25" }}>
                        {row.title}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#5a5647" }}>
                        {row.scripture_ref || "\u2014"}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <Badge variant={row.status || "draft"}>
                          {(row.status || "draft").charAt(0).toUpperCase() + (row.status || "draft").slice(1)}
                        </Badge>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#5a5647" }}>
                        {row.scheduled_date || "\u2014"}
                      </td>
                      <td style={{ padding: "14px 16px", minWidth: 100 }}>
                        <Progress pct={row.engagement_pct || 0} color={C.accent} height={6} />
                        <div style={{ fontSize: 10, color: "#9e9888", marginTop: 4 }}>
                          {row.engagement_pct != null ? `${row.engagement_pct}%` : "\u2014"}
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                          <Button small onClick={() => setEditing(row)}>Edit</Button>
                          <Button small danger onClick={() => setDeleting(row)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Detail panel */}
            {selectedItem && (
              <Card style={{ position: "relative", alignSelf: "start" }}>
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    position: "absolute", top: 14, right: 14,
                    width: 28, height: 28, borderRadius: "50%",
                    border: "1px solid #e0dbd1", background: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", fontSize: 14, color: "#9e9888",
                    transition: "all 0.15s",
                  }}
                >&times;</button>

                <div style={{ marginBottom: 12 }}>
                  <Badge variant={selectedItem.status || "draft"}>
                    {(selectedItem.status || "draft").charAt(0).toUpperCase() + (selectedItem.status || "draft").slice(1)}
                  </Badge>
                </div>

                <h2 style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 20, fontWeight: 700, color: "#2c2a25",
                  margin: "0 0 6px", lineHeight: 1.3, paddingRight: 24,
                }}>
                  {selectedItem.title}
                </h2>

                {selectedItem.scripture_ref && (
                  <div style={{ fontSize: 13, fontStyle: "italic", color: "#8b6914", marginBottom: 16 }}>
                    {selectedItem.scripture_ref}
                  </div>
                )}

                {selectedItem.content && (
                  <div style={{
                    padding: "14px 16px", borderRadius: 10, background: "#faf6ee",
                    fontSize: 13, color: "#5a5647", lineHeight: 1.7,
                    marginBottom: 20, maxHeight: 180, overflow: "hidden",
                  }}>
                    {selectedItem.content.length > 300 ? selectedItem.content.slice(0, 300) + "..." : selectedItem.content}
                  </div>
                )}

                {selectedItem.status === "published" && (
                  <>
                    <SectionLabel>Performance</SectionLabel>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                      <div style={{ padding: "14px 10px", borderRadius: 10, textAlign: "center", background: "#edf7f1" }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: "#4a8b6f", fontFamily: "'DM Serif Display', serif" }}>
                          {selectedItem.engagement_pct != null ? `${selectedItem.engagement_pct}%` : "\u2014"}
                        </div>
                        <div style={{ fontSize: 10, color: "#9e9888", marginTop: 4 }}>Engagement</div>
                      </div>
                      <div style={{ padding: "14px 10px", borderRadius: 10, textAlign: "center", background: "#eef4fb" }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: "#3b6fa0", fontFamily: "'DM Serif Display', serif" }}>
                          {selectedItem.read_count ?? "\u2014"}
                        </div>
                        <div style={{ fontSize: 10, color: "#9e9888", marginTop: 4 }}>Reads</div>
                      </div>
                      <div style={{ padding: "14px 10px", borderRadius: 10, textAlign: "center", background: "#faf3e0" }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: "#8b6914", fontFamily: "'DM Serif Display', serif" }}>
                          {selectedItem.avg_time ?? "\u2014"}
                        </div>
                        <div style={{ fontSize: 10, color: "#9e9888", marginTop: 4 }}>Avg Time</div>
                      </div>
                    </div>
                  </>
                )}

                {selectedItem.status !== "published" && (
                  <div style={{ marginTop: 4 }}>
                    <Button primary onClick={() => quickPublish(selectedItem)} style={{ width: "100%" }}>
                      Publish Now
                    </Button>
                  </div>
                )}
              </Card>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      {showForm && (
        <FormModal title="Write Devotional" fields={FIELDS}
          initialValues={{ status: "draft" }}
          onSubmit={handleCreate} onClose={() => setShowForm(false)} submitLabel="Create" />
      )}
      {editing && (
        <FormModal title="Edit Devotional" fields={FIELDS}
          initialValues={{
            title: editing.title, scripture_ref: editing.scripture_ref || "",
            content: editing.content, scheduled_date: editing.scheduled_date || "",
            status: editing.status || "draft",
          }}
          onSubmit={handleEdit} onClose={() => setEditing(null)} submitLabel="Save" />
      )}
      {deleting && (
        <ConfirmDialog title="Delete Devotional"
          message={`Delete "${deleting.title}"? This cannot be undone.`}
          onConfirm={handleDelete} onCancel={() => setDeleting(null)} loading={deleteLoading} />
      )}
    </div>
  );
}


// ─── Series Item Card (expandable) ──────────────────────────

function SeriesItemCard({ item, dayNum, C, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

  return (
    <div style={{
      border: "1px solid #e0dbd1", borderRadius: 10,
      background: expanded ? "#faf6ee" : "#fff",
      overflow: "hidden", transition: "background 0.15s",
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: "10px 14px", cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <div>
          <span style={{ fontSize: 11, color: "#9e9888", fontWeight: 600, marginRight: 8 }}>Day {dayNum}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#2c2a25" }}>{item.title}</span>
        </div>
        <span style={{ fontSize: 12, color: "#9e9888", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          &#9662;
        </span>
      </div>
      {expanded && (
        <div style={{ padding: "0 14px 12px", borderTop: "1px solid #ece7dd" }}>
          {editing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
              <input
                value={item.title} onChange={e => onUpdate("title", e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #e0dbd1", fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#2c2a25", boxSizing: "border-box" }}
              />
              <input
                value={item.scripture_ref || ""} onChange={e => onUpdate("scripture_ref", e.target.value)}
                placeholder="Scripture reference"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #e0dbd1", fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#2c2a25", boxSizing: "border-box" }}
              />
              <textarea
                value={item.content} onChange={e => onUpdate("content", e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #e0dbd1", fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#2c2a25", resize: "vertical", minHeight: 100, lineHeight: 1.6, boxSizing: "border-box" }}
              />
              <button
                onClick={() => setEditing(false)}
                style={{ alignSelf: "flex-start", padding: "4px 10px", borderRadius: 6, border: "none", background: C.accent + "15", color: C.accent, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
              >Done Editing</button>
            </div>
          ) : (
            <div style={{ marginTop: 10 }}>
              {item.scripture_ref && (
                <div style={{ fontSize: 12, fontStyle: "italic", color: "#8b6914", marginBottom: 6 }}>{item.scripture_ref}</div>
              )}
              <div style={{ fontSize: 13, color: "#5a5647", lineHeight: 1.6, maxHeight: 120, overflow: "hidden" }}>
                {item.content?.length > 200 ? item.content.slice(0, 200) + "..." : item.content}
              </div>
              <button
                onClick={() => setEditing(true)}
                style={{ marginTop: 8, padding: "4px 10px", borderRadius: 6, border: "1px solid #e0dbd1", background: "#fff", fontSize: 12, cursor: "pointer", color: "#5a5647", fontFamily: "'DM Sans', sans-serif" }}
              >Edit</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
