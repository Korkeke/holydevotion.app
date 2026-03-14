import { useState, useEffect } from "react";
import { COLORS } from "../../colors";
import { useAuth } from "../AuthContext";
import { get, post, put, del } from "../api";
import DataTable from "../components/DataTable";
import FormModal from "../components/FormModal";
import ConfirmDialog from "../components/ConfirmDialog";

const EVENT_FIELDS = [
  { name: "title", label: "Title", required: true, placeholder: "Sunday Worship Service" },
  { name: "description", label: "Description", type: "textarea", placeholder: "Details about the event..." },
  { name: "event_date", label: "Date & Time", type: "datetime-local", required: true },
  { name: "location", label: "Location", placeholder: "Main Sanctuary" },
];

export default function EventsPage() {
  const { church } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function load() {
    if (!church?.id) return;
    try {
      const data = await get(`/api/churches/${church.id}/events`);
      setEvents(data?.events || []);
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [church?.id]);

  async function handleCreate(values) {
    await post(`/api/churches/${church.id}/events`, values);
    await load();
  }

  async function handleEdit(values) {
    await put(`/api/churches/${church.id}/events/${editing.id}`, values);
    setEditing(null);
    await load();
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await del(`/api/churches/${church.id}/events/${deleting.id}`);
      setDeleting(null);
      await load();
    } finally {
      setDeleteLoading(false);
    }
  }

  function formatDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  }

  function toInputDate(iso) {
    if (!iso) return "";
    return iso.slice(0, 16);
  }

  const columns = [
    { key: "title", label: "Title" },
    { key: "event_date", label: "Date", render: (row) => formatDate(row.event_date) },
    { key: "location", label: "Location", render: (row) => row.location || "—" },
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

  if (loading) {
    return <div style={s.loading}><div style={s.spinner} /></div>;
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Events</h1>
        <button style={s.createBtn} onClick={() => setShowForm(true)}>+ Create Event</button>
      </div>

      <DataTable columns={columns} data={events} emptyMessage="No events yet. Create your first one." />

      {showForm && (
        <FormModal
          title="Create Event"
          fields={EVENT_FIELDS}
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
          submitLabel="Create"
        />
      )}

      {editing && (
        <FormModal
          title="Edit Event"
          fields={EVENT_FIELDS}
          initialValues={{
            title: editing.title,
            description: editing.description || "",
            event_date: toInputDate(editing.event_date),
            location: editing.location || "",
          }}
          onSubmit={handleEdit}
          onClose={() => setEditing(null)}
          submitLabel="Save Changes"
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Event"
          message={`Are you sure you want to delete "${deleting.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}

const s = {
  page: { padding: "32px 40px", maxWidth: 960 },
  loading: { padding: 60, display: "flex", justifyContent: "center" },
  spinner: {
    width: 28, height: 28,
    border: `2px solid ${COLORS.gold}`, borderTopColor: "transparent",
    borderRadius: "50%", animation: "spin 0.8s linear infinite",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 24,
  },
  title: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 28, fontWeight: 400, color: COLORS.text,
  },
  createBtn: {
    padding: "10px 20px", borderRadius: 10, border: "none",
    background: `linear-gradient(135deg, ${COLORS.gold}, #b8973e)`,
    color: "#fff", fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 13, fontWeight: 700, cursor: "pointer",
  },
  editBtn: {
    padding: "6px 14px", borderRadius: 6,
    border: `1px solid ${COLORS.borderHover}`, background: "transparent",
    color: COLORS.gold, fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 12, fontWeight: 600, cursor: "pointer",
  },
  deleteBtn: {
    padding: "6px 14px", borderRadius: 6,
    border: `1px solid rgba(192,57,43,0.3)`, background: "transparent",
    color: "#e57373", fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 12, fontWeight: 600, cursor: "pointer",
  },
};
