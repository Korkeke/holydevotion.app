import { useState, useEffect } from "react";
import { COLORS } from "../../colors";
import { useAuth } from "../AuthContext";
import { get, post, put, del } from "../api";
import DataTable from "../components/DataTable";
import FormModal from "../components/FormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import StatusBadge from "../components/StatusBadge";

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

export default function DevotionalsPage() {
  const { church } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function load() {
    if (!church?.id) return;
    try {
      const data = await get(`/api/churches/${church.id}/devotionals`);
      setItems(data?.devotionals || []);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [church?.id]);

  const filtered = filter === "all" ? items : items.filter((d) => d.status === filter);

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
      await load();
    } finally { setDeleteLoading(false); }
  }

  async function quickPublish(dev) {
    await put(`/api/churches/${church.id}/devotionals/${dev.id}`, { status: "published" });
    await load();
  }

  const columns = [
    { key: "title", label: "Title" },
    { key: "scripture_ref", label: "Scripture", render: (r) => r.scripture_ref || "—" },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status || "draft"} /> },
    { key: "scheduled_date", label: "Scheduled", render: (r) => r.scheduled_date || "—" },
    {
      key: "actions", label: "", width: 200,
      render: (row) => (
        <div style={{ display: "flex", gap: 8 }}>
          {row.status !== "published" && (
            <button style={s.publishBtn} onClick={() => quickPublish(row)}>Publish</button>
          )}
          <button style={s.editBtn} onClick={() => setEditing(row)}>Edit</button>
          <button style={s.deleteBtn} onClick={() => setDeleting(row)}>Delete</button>
        </div>
      ),
    },
  ];

  if (loading) return <div style={s.loading}><div style={s.spinner} /></div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Devotionals</h1>
        <button style={s.createBtn} onClick={() => setShowForm(true)}>+ Write Devotional</button>
      </div>

      {/* Filter tabs */}
      <div style={s.tabs}>
        {["all", "draft", "scheduled", "published"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{ ...s.tab, ...(filter === t ? s.tabActive : {}) }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={filtered} emptyMessage="No devotionals yet." />

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

const s = {
  page: { padding: "32px 40px", maxWidth: 960 },
  loading: { padding: 60, display: "flex", justifyContent: "center" },
  spinner: { width: 28, height: 28, border: `2px solid ${COLORS.gold}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  title: { fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 400, color: COLORS.text },
  createBtn: { padding: "10px 20px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${COLORS.gold}, #b8973e)`, color: "#fff", fontFamily: "'Nunito Sans', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  tabs: { display: "flex", gap: 4, marginBottom: 20 },
  tab: {
    padding: "7px 16px", borderRadius: 8, border: `1px solid ${COLORS.border}`,
    background: "transparent", color: COLORS.textMuted,
    fontFamily: "'Nunito Sans', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer",
  },
  tabActive: { background: COLORS.goldDim, color: COLORS.gold, borderColor: COLORS.borderHover },
  publishBtn: { padding: "6px 14px", borderRadius: 6, border: "none", background: COLORS.goldDim, color: COLORS.gold, fontFamily: "'Nunito Sans', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  editBtn: { padding: "6px 14px", borderRadius: 6, border: `1px solid ${COLORS.borderHover}`, background: "transparent", color: COLORS.gold, fontFamily: "'Nunito Sans', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  deleteBtn: { padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(192,57,43,0.3)", background: "transparent", color: "#e57373", fontFamily: "'Nunito Sans', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer" },
};
