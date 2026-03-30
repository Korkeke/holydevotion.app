import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { get, post, del } from "../api";
import ConfirmDialog from "../components/ConfirmDialog";
import PastoralMessageModal from "../components/PastoralMessageModal";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import SectionLabel from "../components/ui/SectionLabel";
import Progress from "../components/ui/Progress";
import HealthBar from "../components/ui/HealthBar";
import EmptyState from "../components/ui/EmptyState";

const RANK_NAMES = ["Seeker", "Learner", "Steadfast", "Faithful", "Guardian", "Devoted"];

const STATUS_STYLES = {
  thriving:  { color: "#3d6b44", bg: "#e8f0e9" },
  active:    { color: "#3d6b44", bg: "#edf5ee" },
  declining: { color: "#b05a3a", bg: "#f5e8e3" },
  new:       { color: "#5a5647", bg: "#f0ebe3" },
};

export default function MembersPage() {
  const { church, role: myRole, user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [messageTo, setMessageTo] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

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
      setSelected(null);
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

  const getStatus = (m) => {
    if (m.status && STATUS_STYLES[m.status]) return m.status;
    if (m.last_active_at) {
      const last = new Date(m.last_active_at);
      const now = new Date();
      const daysSince = (now - last) / (1000 * 60 * 60 * 24);
      if (daysSince > 14) return "declining";
      if (daysSince <= 3) return "thriving";
      return "active";
    }
    if (!m.joined_at) return "new";
    const joined = new Date(m.joined_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    if (joined > weekAgo) return "new";
    return "active";
  };

  // Health counts
  const statusCounts = { thriving: 0, active: 0, declining: 0, new: 0 };
  members.forEach(m => {
    const s = getStatus(m);
    if (statusCounts[s] !== undefined) statusCounts[s]++;
  });

  // Filtered members
  const filtered = members.filter(m => {
    if (!search) return true;
    const name = (m.display_name || m.user_id || "").toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const selectedMember = selected !== null ? filtered[selected] : null;

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Unknown";
  const formatShortDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Unknown";

  if (loading) {
    return (
      <div style={{ padding: 60, display: "flex", justifyContent: "center" }}>
        <div style={{
          width: 28, height: 28,
          border: "2px solid #3d6b44",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 32px 48px" }}>

      {/* Search bar + member count */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, marginBottom: 16,
      }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            color: "#9e9888", fontSize: 14, pointerEvents: "none",
          }}>
            &#x1F50D;
          </span>
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={e => { setSearch(e.target.value); setSelected(null); }}
            style={{
              width: "100%", padding: "9px 14px 9px 36px",
              borderRadius: 10, border: "1px solid #e0dbd1",
              background: "#fff", fontSize: 13, color: "#2c2a25",
              fontFamily: "inherit", outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={e => e.target.style.borderColor = "#3d6b44"}
            onBlur={e => e.target.style.borderColor = "#e0dbd1"}
          />
        </div>
        <span style={{ fontSize: 13, color: "#9e9888", whiteSpace: "nowrap" }}>
          {members.length} member{members.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Health Bar */}
      <div style={{ marginBottom: 24 }}>
        <HealthBar counts={statusCounts} total={members.length} />
      </div>

      {/* Main grid: table + detail panel */}
      <div style={{
        display: "grid",
        gridTemplateColumns: selectedMember ? "1fr 400px" : "1fr",
        gap: 20,
        transition: "grid-template-columns 0.25s ease",
      }}>
        {/* Table */}
        <Card noPad>
          {filtered.length === 0 ? (
            <EmptyState
              emoji="👥"
              title="No members found"
              desc={search ? "Try a different search term." : "No members have joined yet."}
            />
          ) : (
            <table style={{
              width: "100%", borderCollapse: "collapse", fontSize: 13,
            }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #ece7dd" }}>
                  {["Member", "Status", "Rank", "Streak", "Last Active"].map(h => (
                    <th key={h} style={{
                      textAlign: "left", padding: "10px 16px",
                      fontSize: 11, fontWeight: 600, color: "#9e9888",
                      textTransform: "uppercase", letterSpacing: "0.04em",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => {
                  const status = getStatus(m);
                  const name = m.display_name || m.user_id?.slice(0, 12) || "Member";
                  const initials = name.slice(0, 2).toUpperCase();
                  const isSelected = selected === i;
                  const isDeclining = status === "declining";
                  const st = STATUS_STYLES[status] || STATUS_STYLES.active;

                  return (
                    <tr
                      key={m.id || i}
                      onClick={() => setSelected(isSelected ? null : i)}
                      style={{
                        cursor: "pointer",
                        background: isSelected ? "#faf8f4" : "transparent",
                        borderBottom: "1px solid #f5f0ea",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#fdfcfa"; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                    >
                      {/* Member: avatar + name + joined */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar
                            initials={initials}
                            size={34}
                            bg={st.bg}
                            color={st.color}
                          />
                          <div>
                            <div style={{
                              fontSize: 13, fontWeight: 600, color: "#2c2a25",
                              display: "flex", alignItems: "center", gap: 6,
                            }}>
                              {name}
                              {m.role === "owner" && (
                                <Badge variant="owner" style={{ fontSize: 10 }}>Owner</Badge>
                              )}
                              {m.role === "admin" && (
                                <Badge color="#4a7ab5" bg="#e8eef5" style={{ fontSize: 10 }}>Admin</Badge>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: "#9e9888", marginTop: 1 }}>
                              Joined {formatShortDate(m.joined_at)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "12px 16px" }}>
                        <Badge color={st.color} bg={st.bg}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      </td>

                      {/* Rank */}
                      <td style={{ padding: "12px 16px", color: "#5a5647", fontSize: 13 }}>
                        {RANK_NAMES[m.rank_index] || "Seeker"}
                      </td>

                      {/* Streak */}
                      <td style={{ padding: "12px 16px", color: "#5a5647", fontSize: 13 }}>
                        {m.current_streak ? `${m.current_streak}d` : "---"}
                      </td>

                      {/* Last Active */}
                      <td style={{
                        padding: "12px 16px",
                        fontSize: 13,
                        color: isDeclining ? "#c26a4a" : "#5a5647",
                        fontWeight: isDeclining ? 700 : 400,
                      }}>
                        {m.last_active_at ? formatShortDate(m.last_active_at) : "---"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>

        {/* Detail Panel */}
        {selectedMember && (() => {
          const m = selectedMember;
          const status = getStatus(m);
          const st = STATUS_STYLES[status] || STATUS_STYLES.active;
          const name = m.display_name || m.user_id?.slice(0, 12) || "Member";
          const initials = name.slice(0, 2).toUpperCase();
          const isMe = m.user_id === user?.uid;

          return (
            <Card style={{ alignSelf: "start", position: "sticky", top: 20 }}>
              {/* Close button */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
                <span
                  onClick={() => setSelected(null)}
                  style={{
                    cursor: "pointer", fontSize: 18, color: "#9e9888",
                    width: 28, height: 28, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    borderRadius: 6, transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f0ebe3"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  &times;
                </span>
              </div>

              {/* Avatar + name + joined */}
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                marginBottom: 20,
              }}>
                <Avatar initials={initials} size={48} bg={st.bg} color={st.color} />
                <div style={{
                  fontSize: 20, fontWeight: 700, color: "#2c2a25",
                  fontFamily: "'DM Serif Display', serif",
                  marginTop: 10,
                }}>
                  {name}
                </div>
                <div style={{ fontSize: 12, color: "#9e9888", marginTop: 2 }}>
                  Joined {formatDate(m.joined_at)}
                </div>
                <div style={{ marginTop: 8 }}>
                  <Badge color={st.color} bg={st.bg}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                </div>
              </div>

              {/* 3-stat grid */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                gap: 10, marginBottom: 20,
              }}>
                {[
                  { label: "Rank", value: RANK_NAMES[m.rank_index] || "Seeker" },
                  { label: "Streak", value: m.current_streak ? `${m.current_streak}d` : "---" },
                  { label: "Conversations", value: m.total_messages || 0 },
                ].map((s, j) => (
                  <div key={j} style={{
                    padding: "10px 8px", borderRadius: 10,
                    background: "#faf8f4", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#2c2a25" }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: 10, color: "#9e9888", marginTop: 2 }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Faith journey progress */}
              {(m.journey_progress != null || m.faith_journey) && (
                <div style={{ marginBottom: 20 }}>
                  <SectionLabel>Faith Journey</SectionLabel>
                  <div style={{ fontSize: 13, color: "#5a5647", marginBottom: 6 }}>
                    {m.faith_journey || "In progress"}
                  </div>
                  <Progress
                    pct={m.journey_progress ?? 0}
                    color="#3d6b44"
                    height={7}
                  />
                  <div style={{ fontSize: 11, color: "#9e9888", marginTop: 4, textAlign: "right" }}>
                    {m.journey_progress ?? 0}%
                  </div>
                </div>
              )}

              {/* Prayer focus */}
              {m.prayer_focus && (
                <div style={{
                  marginBottom: 20, padding: "10px 14px", borderRadius: 10,
                  borderLeft: "3px solid #3d6b44", background: "#f4f8f5",
                  fontStyle: "italic", fontSize: 13, color: "#5a5647", lineHeight: 1.5,
                }}>
                  {m.prayer_focus}
                </div>
              )}

              {/* Activity timeline */}
              {m.activity && m.activity.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <SectionLabel>Recent Activity</SectionLabel>
                  <div style={{ position: "relative", paddingLeft: 18 }}>
                    {/* Vertical line */}
                    <div style={{
                      position: "absolute", left: 5, top: 4, bottom: 4,
                      width: 2, background: "#ece7dd", borderRadius: 1,
                    }} />
                    {m.activity.slice(0, 5).map((act, ai) => (
                      <div key={ai} style={{
                        position: "relative", paddingBottom: ai < m.activity.length - 1 ? 14 : 0,
                      }}>
                        {/* Dot */}
                        <div style={{
                          position: "absolute", left: -14, top: 5,
                          width: 8, height: 8, borderRadius: "50%",
                          background: ai === 0 ? "#3d6b44" : "#c9c1b4",
                          border: "2px solid #fff",
                        }} />
                        <div style={{ fontSize: 12, color: "#2c2a25" }}>
                          {act.label || act.type || act.description || "Activity"}
                        </div>
                        {act.date && (
                          <div style={{ fontSize: 11, color: "#9e9888", marginTop: 1 }}>
                            {formatShortDate(act.date)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {!isMe && (
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <Button
                    primary
                    small
                    onClick={() => setMessageTo(name)}
                    style={{ flex: 1 }}
                  >
                    Message
                  </Button>
                </div>
              )}

              {/* Admin actions */}
              {!isMe && m.role !== "owner" && (
                <div style={{
                  display: "flex", gap: 8, marginTop: 10,
                  paddingTop: 10, borderTop: "1px solid #f0ebe3",
                }}>
                  {isOwner && m.role === "member" && (
                    <Button small onClick={() => promoteToAdmin(m)}>
                      Make Admin
                    </Button>
                  )}
                  {isOwner && m.role === "admin" && (
                    <Button small onClick={() => demoteToMember(m)}>
                      Demote
                    </Button>
                  )}
                  <Button danger small onClick={() => setRemoving(m)}>
                    Remove
                  </Button>
                </div>
              )}
            </Card>
          );
        })()}
      </div>

      {/* Modals */}
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
