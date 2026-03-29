import { useState, useEffect } from "react";
import { useChurchColors } from "../useChurchColors";
import { useAuth } from "../AuthContext";
import { get, post, put, del } from "../api";
import FormModal from "../components/FormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import SectionLabel from "../components/ui/SectionLabel";

const GROUP_FIELDS = [
  { name: "name", label: "Group Name", required: true, placeholder: "Men's Bible Study" },
  { name: "type", label: "Type", type: "select", options: [
    { value: "Study", label: "Study" },
    { value: "Fellowship", label: "Fellowship" },
    { value: "Prayer", label: "Prayer" },
    { value: "Serve", label: "Serve" },
  ]},
  { name: "meeting_time", label: "Meeting Time", placeholder: "Tuesdays at 7:00 PM" },
  { name: "leader_name", label: "Leader", placeholder: "Pastor Dave" },
  { name: "description", label: "Description", type: "textarea", placeholder: "A brief description of this group..." },
  { name: "emoji", label: "Emoji", placeholder: "📖" },
];

const JOURNEY_FIELDS = [
  { name: "name", label: "Journey Name", required: true, placeholder: "Easter: 7 Days of Hope" },
  { name: "emoji", label: "Emoji", placeholder: "✨" },
  { name: "description", label: "Description", type: "textarea", placeholder: "A church-wide journey together..." },
  { name: "total_days", label: "Total Days", type: "number", required: true, placeholder: "7" },
  { name: "status", label: "Status", type: "select", options: [
    { value: "upcoming", label: "Upcoming" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
  ]},
  { name: "starts_at", label: "Start Date", type: "date" },
];

const TYPE_COLORS = {
  Study: { bg: "#e8f0e9", text: "#3d6b44" },
  Fellowship: { bg: "#f0e8d6", text: "#8b6914" },
  Prayer: { bg: "#e8e0f0", text: "#6b4a8b" },
  Serve: { bg: "#ddeef5", text: "#3a6a8a" },
};

const STATUS_COLORS = {
  active: { bg: "#e8f0e9", text: "#3d6b44" },
  upcoming: { bg: "#f0e8d6", text: "#8b6914" },
  completed: { bg: "#eee", text: "#777" },
};

export default function GroupsPage() {
  const C = useChurchColors();
  const { church } = useAuth();
  const [groups, setGroups] = useState([]);
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(true);

  // Group CRUD state
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [deletingGroup, setDeletingGroup] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null);

  // Journey CRUD state
  const [showJourneyForm, setShowJourneyForm] = useState(false);
  const [editingJourney, setEditingJourney] = useState(null);
  const [deletingJourney, setDeletingJourney] = useState(null);
  const [deleteJourneyLoading, setDeleteJourneyLoading] = useState(false);

  async function load() {
    if (!church?.id) return;
    try {
      const [groupData, journeyData] = await Promise.all([
        get(`/api/churches/${church.id}/groups`),
        get(`/api/churches/${church.id}/journeys`),
      ]);
      setGroups(groupData?.groups || []);
      setJourneys(journeyData?.journeys || []);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [church?.id]);

  // Group handlers
  async function handleCreateGroup(values) {
    await post(`/api/churches/${church.id}/groups`, values);
    await load();
  }

  async function handleEditGroup(values) {
    await put(`/api/churches/${church.id}/groups/${editingGroup.id}`, values);
    setEditingGroup(null);
    await load();
  }

  async function handleDeleteGroup() {
    setDeleteLoading(true);
    try {
      await del(`/api/churches/${church.id}/groups/${deletingGroup.id}`);
      setDeletingGroup(null);
      await load();
    } finally { setDeleteLoading(false); }
  }

  // Journey handlers
  async function handleCreateJourney(values) {
    const payload = { ...values };
    if (payload.total_days) payload.total_days = parseInt(payload.total_days, 10);
    await post(`/api/churches/${church.id}/journeys`, payload);
    await load();
  }

  async function handleEditJourney(values) {
    const payload = { ...values };
    if (payload.total_days) payload.total_days = parseInt(payload.total_days, 10);
    if (payload.current_day) payload.current_day = parseInt(payload.current_day, 10);
    if (payload.member_count) payload.member_count = parseInt(payload.member_count, 10);
    await put(`/api/churches/${church.id}/journeys/${editingJourney.id}`, payload);
    setEditingJourney(null);
    await load();
  }

  async function handleDeleteJourney() {
    setDeleteJourneyLoading(true);
    try {
      await del(`/api/churches/${church.id}/journeys/${deletingJourney.id}`);
      setDeletingJourney(null);
      await load();
    } finally { setDeleteJourneyLoading(false); }
  }

  function timeAgo(iso) {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  function initials(name) {
    if (!name) return "?";
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  }

  if (loading) return (
    <div style={{ padding: 60, display: "flex", justifyContent: "center" }}>
      <div style={{
        width: 28, height: 28,
        border: `2px solid ${C.accent}`,
        borderTopColor: "transparent",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
    </div>
  );

  return (
    <div style={{ padding: "24px 32px 48px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#2c2a25", fontFamily: "'DM Serif Display', serif" }}>
          Groups
        </div>
      </div>

      {/* Groups Section */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <SectionLabel>Groups</SectionLabel>
          <Button primary small onClick={() => setShowGroupForm(true)}>+ New Group</Button>
        </div>

        {groups.length === 0 ? (
          <Card>
            <div style={{ textAlign: "center", padding: "32px 0", color: "#9e9888", fontFamily: "var(--body)", fontSize: 14 }}>
              No groups yet. Create your first group to get started.
            </div>
          </Card>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 16 }}>
            {groups.map(g => {
              const tc = TYPE_COLORS[g.type] || TYPE_COLORS.Study;
              const expanded = expandedGroup === g.id;
              return (
                <Card key={g.id} noPad>
                  {/* Card Header */}
                  <div
                    style={{ padding: "16px 18px", cursor: "pointer" }}
                    onClick={() => setExpandedGroup(expanded ? null : g.id)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: "#2c2a25", fontFamily: "var(--body)" }}>
                            {g.emoji ? `${g.emoji} ` : ""}{g.name}
                          </span>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                            background: tc.bg, color: tc.text, textTransform: "uppercase", letterSpacing: "0.03em",
                          }}>
                            {g.type}
                          </span>
                        </div>
                        {g.meeting_time && (
                          <div style={{ fontSize: 12, color: "#7a7672", fontFamily: "var(--body)", marginBottom: 2 }}>
                            {g.meeting_time}
                          </div>
                        )}
                        {g.leader_name && (
                          <div style={{ fontSize: 12, color: "#7a7672", fontFamily: "var(--body)" }}>
                            Led by {g.leader_name}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, color: "#a8a29e", fontFamily: "var(--body)" }}>
                          {g.member_count || 0} members
                        </span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="2"
                          style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </div>

                    {/* Activity count */}
                    {g.active_count > 0 && (
                      <div style={{ fontSize: 11, color: C.accent, fontWeight: 600, fontFamily: "var(--body)" }}>
                        {g.active_count} active this week
                      </div>
                    )}
                  </div>

                  {/* Expanded Detail */}
                  {expanded && (
                    <div style={{ borderTop: "1px solid #ece7dd" }}>
                      {/* Recent Activity */}
                      {g.activity && g.activity.length > 0 && (
                        <div style={{ padding: "14px 18px", background: "#faf8f5" }}>
                          <div style={{
                            fontSize: 10, fontWeight: 700, color: "#a8a29e", textTransform: "uppercase",
                            letterSpacing: "0.06em", marginBottom: 10, fontFamily: "var(--body)",
                          }}>
                            This Week
                          </div>
                          {g.activity.map((a, i) => (
                            <div key={a.id || i} style={{
                              display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
                            }}>
                              <div style={{
                                width: 26, height: 26, borderRadius: "50%",
                                background: `${C.accent}20`, color: C.accent,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 10, fontWeight: 700, fontFamily: "var(--body)", flexShrink: 0,
                              }}>
                                {initials(a.display_name)}
                              </div>
                              <span style={{ flex: 1, fontSize: 12, color: "#4a4a4a", fontFamily: "var(--body)" }}>
                                <strong>{a.display_name || "Someone"}</strong> {a.text}
                              </span>
                              <span style={{ fontSize: 10, color: "#a8a29e", fontFamily: "var(--body)", flexShrink: 0 }}>
                                {timeAgo(a.created_at)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Members preview */}
                      {g.members && g.members.length > 0 && (
                        <div style={{ padding: "12px 18px", borderTop: "1px solid #ece7dd" }}>
                          <div style={{
                            fontSize: 10, fontWeight: 700, color: "#a8a29e", textTransform: "uppercase",
                            letterSpacing: "0.06em", marginBottom: 8, fontFamily: "var(--body)",
                          }}>
                            Members
                          </div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {g.members.map((m, i) => (
                              <div key={m.id || i} style={{
                                fontSize: 11, padding: "3px 10px", borderRadius: 12,
                                background: m.role === "leader" ? `${C.accent}15` : "#f5f0ea",
                                color: m.role === "leader" ? C.accent : "#5a5647",
                                fontWeight: m.role === "leader" ? 700 : 500,
                                fontFamily: "var(--body)",
                              }}>
                                {m.display_name || m.user_id.slice(0, 8)}
                                {m.role === "leader" && " (Leader)"}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{
                        padding: "12px 18px", borderTop: "1px solid #ece7dd",
                        display: "flex", gap: 8, justifyContent: "flex-end",
                      }}>
                        <Button small onClick={() => { setEditingGroup(g); }}>Edit</Button>
                        <Button small danger onClick={() => setDeletingGroup(g)}>Delete</Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Church-Wide Journeys Section */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <SectionLabel>Church-Wide Journeys</SectionLabel>
          <Button primary small onClick={() => setShowJourneyForm(true)}>+ New Journey</Button>
        </div>

        {journeys.length === 0 ? (
          <Card>
            <div style={{ textAlign: "center", padding: "32px 0", color: "#9e9888", fontFamily: "var(--body)", fontSize: 14 }}>
              No journeys yet. Create a church-wide journey for your congregation.
            </div>
          </Card>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {journeys.map(j => {
              const sc = STATUS_COLORS[j.status] || STATUS_COLORS.upcoming;
              return (
                <Card key={j.id} noPad>
                  <div style={{ padding: "16px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          {j.emoji && (
                            <span style={{
                              width: 32, height: 32, borderRadius: 8, background: `${C.accent}10`,
                              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                            }}>
                              {j.emoji}
                            </span>
                          )}
                          <span style={{ fontSize: 16, fontWeight: 700, color: "#2c2a25", fontFamily: "var(--body)" }}>
                            {j.name}
                          </span>
                        </div>
                        {j.description && (
                          <div style={{ fontSize: 12, color: "#7a7672", fontFamily: "var(--body)", marginBottom: 4 }}>
                            {j.description}
                          </div>
                        )}
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                        background: sc.bg, color: sc.text, textTransform: "uppercase", letterSpacing: "0.03em",
                      }}>
                        {j.status}
                      </span>
                    </div>

                    {/* Progress for active journeys */}
                    {j.status === "active" && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                          {Array.from({ length: j.total_days }, (_, i) => (
                            <div key={i} style={{
                              flex: 1, height: 4, borderRadius: 2,
                              background: i < j.current_day ? C.accent : "#ece7dd",
                            }} />
                          ))}
                        </div>
                        <div style={{ fontSize: 11, color: "#7a7672", fontFamily: "var(--body)" }}>
                          Day {j.current_day} of {j.total_days} - {j.member_count || 0} members
                        </div>
                      </div>
                    )}

                    {j.status !== "active" && (
                      <div style={{ fontSize: 11, color: "#a8a29e", fontFamily: "var(--body)" }}>
                        {j.total_days} days - {j.member_count || 0} members
                        {j.starts_at && ` - Starts ${j.starts_at}`}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
                      <Button small onClick={() => setEditingJourney(j)}>Edit</Button>
                      <Button small danger onClick={() => setDeletingJourney(j)}>Delete</Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showGroupForm && (
        <FormModal
          title="New Group"
          fields={GROUP_FIELDS}
          initialValues={{ type: "Study" }}
          onSubmit={handleCreateGroup}
          onClose={() => setShowGroupForm(false)}
        />
      )}
      {editingGroup && (
        <FormModal
          title="Edit Group"
          fields={GROUP_FIELDS}
          initialValues={editingGroup}
          onSubmit={handleEditGroup}
          onClose={() => setEditingGroup(null)}
        />
      )}
      {deletingGroup && (
        <ConfirmDialog
          title="Delete Group"
          message={`Are you sure you want to delete "${deletingGroup.name}"? This cannot be undone.`}
          onConfirm={handleDeleteGroup}
          onCancel={() => setDeletingGroup(null)}
          loading={deleteLoading}
        />
      )}
      {showJourneyForm && (
        <FormModal
          title="New Journey"
          fields={JOURNEY_FIELDS}
          initialValues={{ status: "upcoming" }}
          onSubmit={handleCreateJourney}
          onClose={() => setShowJourneyForm(false)}
        />
      )}
      {editingJourney && (
        <FormModal
          title="Edit Journey"
          fields={JOURNEY_FIELDS}
          initialValues={editingJourney}
          onSubmit={handleEditJourney}
          onClose={() => setEditingJourney(null)}
        />
      )}
      {deletingJourney && (
        <ConfirmDialog
          title="Delete Journey"
          message={`Are you sure you want to delete "${deletingJourney.name}"? This cannot be undone.`}
          onConfirm={handleDeleteJourney}
          onCancel={() => setDeletingJourney(null)}
          loading={deleteJourneyLoading}
        />
      )}
    </div>
  );
}
