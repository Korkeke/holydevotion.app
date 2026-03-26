import { useState, useEffect, useMemo } from "react";
import { useChurchColors } from "../useChurchColors";
import { useAuth } from "../AuthContext";
import { get, post, put, del } from "../api";
import FormModal from "../components/FormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import FilterButton from "../components/ui/FilterButton";
import Checkbox from "../components/ui/Checkbox";
import EmptyState from "../components/ui/EmptyState";

const FIELDS = [
  { name: "title", label: "Title", required: true, placeholder: "Weekly Update" },
  { name: "body", label: "Body", type: "textarea", required: true, rows: 6, placeholder: "Write your announcement..." },
  { name: "pinned", label: "Pinned", type: "checkbox", checkLabel: "Pin to top of announcements" },
];

const BROADCAST_FIELDS = [
  { name: "title", label: "Title", required: true, placeholder: "Important Update" },
  { name: "body", label: "Message", type: "textarea", required: true, rows: 6, placeholder: "Write your broadcast message..." },
];

export default function AnnouncementsPage() {
  const C = useChurchColors();
  const { church } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [filter, setFilter] = useState("all");
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [memberCount, setMemberCount] = useState(0);

  function showError(msg) {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  }

  async function load() {
    if (!church?.id) return;
    try {
      const data = await get(`/api/churches/${church.id}/announcements`);
      setItems(data?.announcements || []);
      setMemberCount(data?.member_count || 0);
    } catch (e) { showError(e.message || "Failed to load announcements"); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [church?.id]);

  async function handleCreate(values) {
    try {
      await post(`/api/churches/${church.id}/announcements`, values);
      await load();
    } catch (e) { showError(e.message || "Failed to post announcement"); throw e; }
  }

  async function handleBroadcast(values) {
    try {
      await post(`/api/churches/${church.id}/announcements`, { ...values, pinned: true });
      await load();
    } catch (e) { showError(e.message || "Failed to send broadcast"); throw e; }
  }

  async function handleEdit(values) {
    try {
      await put(`/api/churches/${church.id}/announcements/${editing.id}`, values);
      setEditing(null);
      await load();
    } catch (e) { showError(e.message || "Failed to update announcement"); throw e; }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await del(`/api/churches/${church.id}/announcements/${deleting.id}`);
      setDeleting(null);
      await load();
    } catch (e) { showError(e.message || "Failed to delete announcement"); } finally { setDeleteLoading(false); }
  }

  async function togglePin(ann) {
    try {
      await put(`/api/churches/${church.id}/announcements/${ann.id}`, { pinned: !ann.pinned });
      await load();
    } catch (e) { showError(e.message || "Failed to toggle pin"); }
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    setDeleteLoading(true);
    try {
      for (const id of selected) {
        await del(`/api/churches/${church.id}/announcements/${id}`);
      }
      setSelected(new Set());
      await load();
    } catch (e) { showError(e.message || "Failed to delete selected"); } finally { setDeleteLoading(false); }
  }

  function formatDate(iso) {
    if (!iso) return "\u2014";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  // Filter
  const filtered = useMemo(() => {
    if (filter === "announcement") return items.filter(i => !i.pinned);
    if (filter === "broadcast") return items.filter(i => i.pinned);
    return items;
  }, [items, filter]);

  // Sort
  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let va, vb;
      if (sortKey === "title") { va = (a.title || "").toLowerCase(); vb = (b.title || "").toLowerCase(); }
      else if (sortKey === "created_at") { va = a.created_at || ""; vb = b.created_at || ""; }
      else if (sortKey === "pinned") { va = a.pinned ? 1 : 0; vb = b.pinned ? 1 : 0; }
      else if (sortKey === "views") { va = a.views || 0; vb = b.views || 0; }
      else { va = a[sortKey] || ""; vb = b[sortKey] || ""; }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  // Counts
  const counts = useMemo(() => ({
    all: items.length,
    announcement: items.filter(i => !i.pinned).length,
    broadcast: items.filter(i => i.pinned).length,
  }), [items]);

  // Selection helpers
  const allSelected = sorted.length > 0 && sorted.every(i => selected.has(i.id));
  const someSelected = selected.size > 0 && !allSelected;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sorted.map(i => i.id)));
    }
  }

  function toggleOne(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const SortIcon = ({ col }) => (
    <span style={{ marginLeft: 4, fontSize: 10, opacity: sortKey === col ? 0.9 : 0.3 }}>
      {sortKey === col && sortDir === "asc" ? "\u25B2" : "\u25BC"}
    </span>
  );

  if (loading) return (
    <div style={{ padding: 60, display: "flex", justifyContent: "center" }}>
      <div style={{ width: 28, height: 28, border: `2px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ padding: "24px 32px 48px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "var(--heading)", fontSize: 26, fontWeight: 700, color: C.text, margin: 0 }}>Announcements</h1>
          <div style={{ fontSize: 13, color: C.sec, marginTop: 4 }}>{items.length} total</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button onClick={() => setShowBroadcast(true)}>Send Broadcast</Button>
          <Button primary onClick={() => setShowForm(true)}>+ Post Announcement</Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ padding: "10px 16px", borderRadius: 10, background: "#FEE2E2", border: "1px solid #FCA5A5", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "var(--body)", fontSize: 13, color: "#991B1B" }}>{error}</span>
          <button onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#991B1B", fontSize: 16 }}>&times;</button>
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")} count={counts.all}>All</FilterButton>
        <FilterButton active={filter === "announcement"} onClick={() => setFilter("announcement")} count={counts.announcement}>Announcements</FilterButton>
        <FilterButton active={filter === "broadcast"} onClick={() => setFilter("broadcast")} count={counts.broadcast}>Broadcasts</FilterButton>
      </div>

      {/* Floating action bar for bulk selection */}
      {selected.size > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "10px 18px", borderRadius: 10,
          background: "#2d6a4f", color: "#fff",
          marginBottom: 16, fontSize: 13, fontWeight: 600,
        }}>
          <span>{selected.size} selected</span>
          <Button danger small onClick={handleBulkDelete} style={{ marginLeft: 8 }}>Delete Selected</Button>
          <button onClick={() => setSelected(new Set())} style={{ marginLeft: "auto", background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "inherit" }}>Clear</button>
        </div>
      )}

      {/* Table */}
      {sorted.length === 0 ? (
        <Card>
          <EmptyState
            emoji="📢"
            title="No announcements yet"
            desc="Post an announcement or send a broadcast to your church community."
            action="+ Post Announcement"
            onAction={() => setShowForm(true)}
          />
        </Card>
      ) : (
        <Card noPad>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th style={{ ...thStyle, width: 44, paddingLeft: 16 }}>
                  <Checkbox checked={allSelected} onChange={toggleAll} />
                </th>
                <th style={{ ...thStyle, width: 44 }}>
                  <span onClick={() => handleSort("pinned")} style={sortHeader}>📌<SortIcon col="pinned" /></span>
                </th>
                <th style={thStyle}>
                  <span onClick={() => handleSort("title")} style={sortHeader}>Title<SortIcon col="title" /></span>
                </th>
                <th style={thStyle}>
                  <span style={{ ...sortHeader, cursor: "default" }}>Preview</span>
                </th>
                <th style={{ ...thStyle, width: 100 }}>
                  <span onClick={() => handleSort("views")} style={sortHeader}>Viewed<SortIcon col="views" /></span>
                </th>
                <th style={{ ...thStyle, width: 110 }}>
                  <span onClick={() => handleSort("created_at")} style={sortHeader}>Created<SortIcon col="created_at" /></span>
                </th>
                <th style={{ ...thStyle, width: 140 }}></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => {
                const isSelected = selected.has(row.id);
                return (
                  <tr key={row.id} style={{ borderBottom: `1px solid ${C.borderLight}`, background: isSelected ? `${C.accent}08` : "transparent", transition: "background 0.15s" }}>
                    <td style={{ ...tdStyle, paddingLeft: 16, width: 44 }}>
                      <Checkbox checked={isSelected} onChange={() => toggleOne(row.id)} />
                    </td>
                    <td style={{ ...tdStyle, width: 44, textAlign: "center" }}>
                      <button onClick={() => togglePin(row)} style={{
                        background: "none", border: "none", cursor: "pointer", fontSize: 14,
                        opacity: row.pinned ? 1 : 0.25,
                      }}>📌</button>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {row.pinned && <Badge variant="broadcast">BROADCAST</Badge>}
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{row.title}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: C.muted, fontSize: 13 }}>
                        {row.body?.slice(0, 80)}{row.body?.length > 80 ? "..." : ""}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, width: 100 }}>
                      {memberCount > 0 ? (
                        <span style={{
                          fontSize: 12, fontWeight: 500,
                          color: (row.views || 0) / memberCount >= 0.7 ? "#3d6b44"
                               : (row.views || 0) / memberCount < 0.3 ? "#9e9888"
                               : "#5a5647",
                        }}>
                          {row.views || 0} of {memberCount}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: "#9e9888" }}>{row.views || 0}</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, width: 110 }}>
                      <span style={{ fontSize: 12, color: C.sec }}>{formatDate(row.created_at)}</span>
                    </td>
                    <td style={{ ...tdStyle, width: 140 }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <Button small onClick={() => setEditing(row)}>Edit</Button>
                        <Button small danger onClick={() => setDeleting(row)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Modals */}
      {showForm && (
        <FormModal title="Post Announcement" fields={FIELDS}
          onSubmit={handleCreate} onClose={() => setShowForm(false)} submitLabel="Post" />
      )}
      {showBroadcast && (
        <FormModal title="Send Broadcast" fields={BROADCAST_FIELDS}
          onSubmit={handleBroadcast} onClose={() => setShowBroadcast(false)} submitLabel="Send Broadcast" />
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

const thStyle = {
  padding: "12px 14px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 600,
  color: "#9e9888",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "14px 14px",
  verticalAlign: "middle",
};

const sortHeader = {
  cursor: "pointer",
  userSelect: "none",
  display: "inline-flex",
  alignItems: "center",
};
