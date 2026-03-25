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

  async function load() {
    if (!church?.id) return;
    try {
      const data = await get(`/api/churches/${church.id}/devotionals`);
      setItems(data?.devotionals || []);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [church?.id]);

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

  if (loading) return (
    <div style={{ padding: 60, display: "flex", justifyContent: "center" }}>
      <div style={{ width: 28, height: 28, border: `2px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  const selectedItem = selected !== null ? filtered[selected] : null;

  return (
    <div style={{ padding: "24px 32px 48px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, fontWeight: 700, color: "#2c2a25", margin: 0 }}>
          Devotionals
        </h1>
        <Button primary onClick={() => setShowForm(true)}>+ Write Devotional</Button>
      </div>

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

      {/* Content area: table + detail panel */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            emoji="📖"
            title="No devotionals yet"
            desc="Write your first devotional to inspire and guide your congregation through scripture."
            action="+ Write Devotional"
            onAction={() => setShowForm(true)}
          />
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: selectedItem ? "1fr 380px" : "1fr", gap: 20 }}>
          {/* Table */}
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
                    onClick={() => setSelected(idx)}
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
              {/* Close button */}
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
              >
                &times;
              </button>

              {/* Status badge */}
              <div style={{ marginBottom: 12 }}>
                <Badge variant={selectedItem.status || "draft"}>
                  {(selectedItem.status || "draft").charAt(0).toUpperCase() + (selectedItem.status || "draft").slice(1)}
                </Badge>
              </div>

              {/* Title */}
              <h2 style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 20, fontWeight: 700, color: "#2c2a25",
                margin: "0 0 6px", lineHeight: 1.3, paddingRight: 24,
              }}>
                {selectedItem.title}
              </h2>

              {/* Scripture */}
              {selectedItem.scripture_ref && (
                <div style={{ fontSize: 13, fontStyle: "italic", color: "#8b6914", marginBottom: 16 }}>
                  {selectedItem.scripture_ref}
                </div>
              )}

              {/* Body preview */}
              {selectedItem.content && (
                <div style={{
                  padding: "14px 16px",
                  borderRadius: 10,
                  background: "#faf6ee",
                  fontSize: 13, color: "#5a5647",
                  lineHeight: 1.7,
                  marginBottom: 20,
                  maxHeight: 180,
                  overflow: "hidden",
                }}>
                  {selectedItem.content.length > 300
                    ? selectedItem.content.slice(0, 300) + "..."
                    : selectedItem.content
                  }
                </div>
              )}

              {/* Performance stats (published only) */}
              {selectedItem.status === "published" && (
                <>
                  <SectionLabel>Performance</SectionLabel>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                    <div style={{
                      padding: "14px 10px", borderRadius: 10, textAlign: "center",
                      background: "#edf7f1",
                    }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "#4a8b6f", fontFamily: "'DM Serif Display', serif" }}>
                        {selectedItem.engagement_pct != null ? `${selectedItem.engagement_pct}%` : "\u2014"}
                      </div>
                      <div style={{ fontSize: 10, color: "#9e9888", marginTop: 4 }}>Engagement</div>
                    </div>
                    <div style={{
                      padding: "14px 10px", borderRadius: 10, textAlign: "center",
                      background: "#eef4fb",
                    }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "#3b6fa0", fontFamily: "'DM Serif Display', serif" }}>
                        {selectedItem.read_count ?? "\u2014"}
                      </div>
                      <div style={{ fontSize: 10, color: "#9e9888", marginTop: 4 }}>Reads</div>
                    </div>
                    <div style={{
                      padding: "14px 10px", borderRadius: 10, textAlign: "center",
                      background: "#faf3e0",
                    }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "#8b6914", fontFamily: "'DM Serif Display', serif" }}>
                        {selectedItem.avg_time ?? "\u2014"}
                      </div>
                      <div style={{ fontSize: 10, color: "#9e9888", marginTop: 4 }}>Avg Time</div>
                    </div>
                  </div>
                </>
              )}

              {/* Quick publish for non-published */}
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
