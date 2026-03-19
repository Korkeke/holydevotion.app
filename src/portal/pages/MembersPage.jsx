import { useState, useEffect } from "react";
import { useChurchColors } from "../useChurchColors";
import { COLORS } from "../../colors";
import { useAuth } from "../AuthContext";
import { get, post, del } from "../api";
import ConfirmDialog from "../components/ConfirmDialog";
import PastoralMessageModal from "../components/PastoralMessageModal";

export default function MembersPage() {
  const C = useChurchColors();
  const { church, role: myRole, user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [messageTo, setMessageTo] = useState(null);

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

  const isOwner = myRole === "owner";

  // Status categories (simple heuristic based on available data)
  const getStatus = (m) => {
    if (!m.joined_at) return "new";
    const joined = new Date(m.joined_at);
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    if (joined > weekAgo) return "new";
    return "active";
  };

  const statusColor = (s) => s === "thriving" ? C.green : s === "active" ? C.accent : s === "declining" ? C.amber : s === "new" ? C.purple : C.muted;
  const statusBg = (s) => s === "thriving" ? C.greenBg : s === "active" ? C.accentLight : s === "declining" ? C.amberBg : s === "new" ? C.purpleBg : C.bg;

  // Count by status
  const statusCounts = { thriving: 0, active: 0, declining: 0, new: 0 };
  members.forEach(m => { const s = getStatus(m); if (statusCounts[s] !== undefined) statusCounts[s]++; });

  if (loading) return <div style={{ padding: 60, display: "flex", justifyContent: "center" }}><div style={{ width: 28, height: 28, border: `2px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>;

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: C.text, fontFamily: "var(--heading)" }}>Members</div>
      </div>
      <div style={{ fontSize: 13, color: C.sec, marginBottom: 20 }}>{members.length} members</div>

      {/* Status summary */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Thriving", count: statusCounts.thriving, color: C.green, bg: C.greenBg },
          { label: "Active", count: statusCounts.active, color: C.accent, bg: C.accentLight },
          { label: "Declining", count: statusCounts.declining, color: C.amber, bg: C.amberBg },
          { label: "New", count: statusCounts.new, color: C.purple, bg: C.purpleBg },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: "12px 16px", borderRadius: 12, background: s.bg, border: `1px solid ${s.color}20`, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 11, color: C.sec, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Member cards */}
      {members.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: C.muted, fontSize: 14 }}>No members yet.</div>
      ) : (
        members.map((m, i) => {
          const status = getStatus(m);
          const isMe = m.user_id === user?.uid;
          const name = m.display_name || m.user_id?.slice(0, 12) || "Member";
          const initials = name.slice(0, 2).toUpperCase();
          const isExp = expanded === i;

          return (
            <div key={m.id || i} style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
              marginBottom: 8, overflow: "hidden",
              boxShadow: isExp ? "0 4px 16px rgba(0,0,0,0.06)" : "0 1px 4px rgba(0,0,0,0.02)",
            }}>
              <div onClick={() => setExpanded(isExp ? null : i)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", cursor: "pointer" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: statusBg(status), border: `2px solid ${statusColor(status)}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: statusColor(status) }}>{initials}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{name}</span>
                    <span style={{ padding: "1px 8px", borderRadius: 6, background: statusBg(status), fontSize: 10, fontWeight: 700, color: statusColor(status), textTransform: "capitalize" }}>{status}</span>
                    {m.role === "owner" && <span style={{ padding: "1px 8px", borderRadius: 6, background: C.goldDim, fontSize: 10, fontWeight: 700, color: C.amber }}>Owner</span>}
                    {m.role === "admin" && <span style={{ padding: "1px 8px", borderRadius: 6, background: C.blueBg, fontSize: 10, fontWeight: 700, color: C.blue }}>Admin</span>}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                    Joined: {m.joined_at ? new Date(m.joined_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Unknown"}
                  </div>
                </div>
                {!isMe && (
                  <button onClick={(e) => { e.stopPropagation(); setMessageTo(name); }} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.accent}25`, background: C.accentLight, fontSize: 11, fontWeight: 600, cursor: "pointer", color: C.accent, fontFamily: "var(--body)", marginRight: 8 }}>✉️</button>
                )}
                <div style={{ fontSize: 16, color: C.muted, transform: isExp ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>⏷</div>
              </div>

              {isExp && (
                <div style={{ padding: "0 20px 16px", borderTop: `1px solid ${C.borderLight}` }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 14 }}>
                    {[
                      { label: "Joined", value: m.joined_at ? new Date(m.joined_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Unknown" },
                      { label: "Role", value: m.role || "member" },
                      { label: "User ID", value: m.user_id?.slice(0, 8) || "..." },
                    ].map((s, j) => (
                      <div key={j} style={{ padding: 10, borderRadius: 10, background: C.bg, textAlign: "center" }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{s.value}</div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {!isMe && m.role !== "owner" && (
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      {isOwner && m.role === "member" && (
                        <button onClick={() => promoteToAdmin(m)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: C.accentLight, color: C.accent, fontFamily: "var(--body)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Make Admin</button>
                      )}
                      {isOwner && m.role === "admin" && (
                        <button onClick={() => demoteToMember(m)} style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.accent, fontFamily: "var(--body)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Demote</button>
                      )}
                      <button onClick={() => setRemoving(m)} style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${C.red}30`, background: "transparent", color: C.red, fontFamily: "var(--body)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Remove</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {removing && (
        <ConfirmDialog
          title="Remove Member"
          message="Remove this member from the church? They can rejoin with the invite code."
          onConfirm={handleRemove}
          onCancel={() => setRemoving(null)}
          loading={removeLoading}
        />
      )}

      {messageTo && (
        <PastoralMessageModal recipientName={messageTo} onClose={() => setMessageTo(null)} />
      )}
    </div>
  );
}
