import { useState, useEffect } from "react";
import { useChurchColors } from "../useChurchColors";
import { COLORS } from "../../colors";
import { useAuth } from "../AuthContext";
import { get, post, put, del } from "../api";
import DataTable from "../components/DataTable";
import FormModal from "../components/FormModal";
import ConfirmDialog from "../components/ConfirmDialog";

const FIELDS = [
  { name: "title", label: "Title", required: true, placeholder: "Weekly Update" },
  { name: "body", label: "Body", type: "textarea", required: true, rows: 6, placeholder: "Write your announcement..." },
  { name: "pinned", label: "Pinned", type: "checkbox", checkLabel: "Pin to top of announcements" },
];

export default function AnnouncementsPage() {
  const COLORS = useChurchColors();
  const { church } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function load() {
    if (!church?.id) return;
    try {
      const data = await get(`/api/churches/${church.id}/announcements`);
      setItems(data?.announcements || []);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [church?.id]);

  async function handleCreate(values) {
    await post(`/api/churches/${church.id}/announcements`, values);
    await load();
  }

  async function handleEdit(values) {
    await put(`/api/churches/${church.id}/announcements/${editing.id}`, values);
    setEditing(null);
    await load();
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await del(`/api/churches/${church.id}/announcements/${deleting.id}`);
      setDeleting(null);
      await load();
    } finally { setDeleteLoading(false); }
  }

  async function togglePin(ann) {
    await put(`/api/churches/${church.id}/announcements/${ann.id}`, { pinned: !ann.pinned });
    await load();
  }

  function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const columns = [
    {
      key: "pinned", label: "📌", width: 50,
      render: (row) => (
        <button onClick={() => togglePin(row)} style={{
          background: "none", border: "none", cursor: "pointer", fontSize: 14,
          opacity: row.pinned ? 1 : 0.25,
        }}>📌</button>
      ),
    },
    { key: "title", label: "Title" },
    {
      key: "body", label: "Preview",
      render: (row) => (
        <span style={{ color: COLORS.textMuted, fontSize: 13 }}>
          {row.body?.slice(0, 80)}{row.body?.length > 80 ? "..." : ""}
        </span>
      ),
    },
    { key: "created_at", label: "Created", render: (row) => formatDate(row.created_at) },
    {
      key: "actions", label: "", width: 140,
      render: (row) => (
        <div style={{ display: "flex", gap: 8 }}>
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
        <h1 style={s.title}>Announcements</h1>
        <button style={s.createBtn} onClick={() => setShowForm(true)}>+ Post Announcement</button>
      </div>

      <DataTable columns={columns} data={items} emptyMessage="No announcements yet." />

      {showForm && (
        <FormModal title="Post Announcement" fields={FIELDS}
          onSubmit={handleCreate} onClose={() => setShowForm(false)} submitLabel="Post" />
      )}
      {editing && (
        <FormModal title="Edit Announcement" fields={FIELDS}
          initialValues={{ title: editing.title, body: editing.body, pinned: editing.pinned }}
          onSubmit={handleEdit} onClose={() => setEditing(null)} submitLabel="Save" />
      )}
      {deleting && (
        <ConfirmDialog title="Delete Announcement"
          message={`Delete "${deleting.title}"? This cannot be undone.`}
          onConfirm={handleDelete} onCancel={() => setDeleting(null)} loading={deleteLoading} />
      )}
    </div>
  );
}

const s = {
  page: { padding: "32px 40px" },
  loading: { padding: 60, display: "flex", justifyContent: "center" },
  spinner: { width: 28, height: 28, border: `2px solid ${COLORS.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  title: { fontFamily: "var(--heading)", fontSize: 26, fontWeight: 700, color: COLORS.text },
  createBtn: { padding: "10px 20px", borderRadius: 10, border: "none", background: COLORS.accent, color: "#fff", fontFamily: "var(--body)", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 12px ${COLORS.accent}25` },
  editBtn: { padding: "5px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, background: COLORS.card, color: COLORS.body, fontFamily: "var(--body)", fontSize: 11, fontWeight: 700, cursor: "pointer" },
  deleteBtn: { padding: "5px 12px", borderRadius: 8, border: `1px solid ${COLORS.red}30`, background: COLORS.redBg, color: COLORS.red, fontFamily: "var(--body)", fontSize: 11, fontWeight: 700, cursor: "pointer" },
};
