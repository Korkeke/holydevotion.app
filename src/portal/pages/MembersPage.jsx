import { useState, useEffect } from "react";
import { useChurchColors } from "../useChurchColors";
import { useAuth } from "../AuthContext";
import { get, post, del } from "../api";
import DataTable from "../components/DataTable";
import ConfirmDialog from "../components/ConfirmDialog";
import StatusBadge from "../components/StatusBadge";

const ROLE_COLORS = {
  owner: { bg: COLORS.accentLight, text: COLORS.accent },
  admin: { bg: "rgba(52,152,219,0.12)", text: "#5dade2" },
  member: { bg: COLORS.sand, text: COLORS.textMuted },
};

function RoleBadge({ role }) {
  const c = ROLE_COLORS[role] || ROLE_COLORS.member;
  return (
    <span style={{
      display: "inline-block", padding: "4px 10px", borderRadius: 6,
      background: c.bg, color: c.text,
      fontFamily: "'DM Sans', sans-serif", fontSize: 11,
      fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
    }}>{role}</span>
  );
}

export default function MembersPage() {
  const COLORS = useChurchColors();
  const { church, role: myRole, user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  async function load() {
    if (!church?.id) return;
    try {
      const data = await get(`/api/churches/${church.id}/members`);
      setMembers(data?.members || []);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [church?.id]);

  async function handleRemove() {
    setRemoveLoading(true);
    try {
      await del(`/api/churches/${church.id}/members/${removing.id}`);
      setRemoving(null);
      await load();
    } finally { setRemoveLoading(false); }
  }

  async function promoteToAdmin(member) {
    await post(`/api/churches/${church.id}/admins`, { user_id: member.user_id });
    await load();
  }

  async function demoteToMember(member) {
    await del(`/api/churches/${church.id}/admins/${member.user_id}`);
    await load();
  }

  function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  const isOwner = myRole === "owner";

  const columns = [
    {
      key: "user_id", label: "Member",
      render: (r) => (
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: COLORS.textMuted }}>
          {r.user_id?.slice(0, 12)}...
        </span>
      ),
    },
    { key: "role", label: "Role", render: (r) => <RoleBadge role={r.role} /> },
    { key: "joined_at", label: "Joined", render: (r) => formatDate(r.joined_at) },
    {
      key: "actions", label: "", width: 240,
      render: (row) => {
        // Can't act on yourself or the owner
        const isMe = row.user_id === user?.uid;
        if (isMe || row.role === "owner") return null;

        return (
          <div style={{ display: "flex", gap: 8 }}>
            {isOwner && row.role === "member" && (
              <button style={s.promoteBtn} onClick={() => promoteToAdmin(row)}>Make Admin</button>
            )}
            {isOwner && row.role === "admin" && (
              <button style={s.demoteBtn} onClick={() => demoteToMember(row)}>Demote</button>
            )}
            <button style={s.removeBtn} onClick={() => setRemoving(row)}>Remove</button>
          </div>
        );
      },
    },
  ];

  if (loading) return <div style={s.loading}><div style={s.spinner} /></div>;

  return (
    <div style={s.page}>
      <h1 style={s.title}>Members</h1>
      <p style={s.subtitle}>{members.length} member{members.length !== 1 ? "s" : ""} in your church</p>

      <DataTable columns={columns} data={members} emptyMessage="No members yet." />

      {removing && (
        <ConfirmDialog
          title="Remove Member"
          message={`Remove this member from the church? They can rejoin with the invite code.`}
          onConfirm={handleRemove}
          onCancel={() => setRemoving(null)}
          loading={removeLoading}
        />
      )}
    </div>
  );
}

const s = {
  page: { padding: "32px 40px", maxWidth: 960 },
  loading: { padding: 60, display: "flex", justifyContent: "center" },
  spinner: { width: 28, height: 28, border: `2px solid ${COLORS.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  title: { fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: COLORS.text, marginBottom: 4 },
  subtitle: { fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: COLORS.textMuted, marginBottom: 24 },
  promoteBtn: { padding: "6px 14px", borderRadius: 6, border: "none", background: COLORS.accentLight, color: COLORS.accent, fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  demoteBtn: { padding: "6px 14px", borderRadius: 6, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.accent, fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  removeBtn: { padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(192,57,43,0.3)", background: "transparent", color: "#e57373", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer" },
};
