import { useState, useEffect, useMemo } from "react";
import { useChurchColors } from "../useChurchColors";
import { useAuth } from "../AuthContext";
import { get, put } from "../api";
import ConfirmDialog from "../components/ConfirmDialog";
import PastoralMessageModal from "../components/PastoralMessageModal";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import FilterButton from "../components/ui/FilterButton";
import Avatar from "../components/ui/Avatar";
import EmptyState from "../components/ui/EmptyState";
import InlinePrayerResponse from "../components/ui/InlinePrayerResponse";

const TYPE_FILTERS = [
  { key: "all", label: "All" },
  { key: "prayer", label: "Prayers" },
  { key: "praise", label: "Praise" },
];

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "answered", label: "Answered" },
];

export default function PrayerWallPage() {
  const C = useChurchColors();
  const { church } = useAuth();
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hiding, setHiding] = useState(null);
  const [hideLoading, setHideLoading] = useState(false);
  const [messageTo, setMessageTo] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [replyTo, setReplyTo] = useState(null);

  async function load() {
    if (!church?.id) return;
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const qs = params.toString();
      const url = `/api/churches/${church.id}/prayer-wall${qs ? `?${qs}` : ""}`;
      const data = await get(url);
      setPrayers(data?.prayers || []);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [church?.id, typeFilter, statusFilter]);

  async function handleHide() {
    setHideLoading(true);
    try {
      await put(`/api/churches/${church.id}/prayer-wall/${hiding.id}/hide`);
      setHiding(null);
      await load();
    } finally { setHideLoading(false); }
  }

  const visible = useMemo(() => prayers.filter(p => !p.hidden), [prayers]);

  const activeCount = useMemo(
    () => prayers.filter(p => !p.hidden && (p.status || "active") === "active").length,
    [prayers],
  );

  const totalPrayers = prayers.reduce((sum, p) => sum + (p.prayer_count || 0), 0);

  if (loading) {
    return (
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
  }

  return (
    <div style={{ padding: "24px 32px 48px" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontSize: 22, fontWeight: 700, color: "#2c2a25",
          fontFamily: "'DM Serif Display', serif", marginBottom: 4,
        }}>
          Prayer Wall
        </div>
        <div style={{ fontSize: 13, color: "#9e9888" }}>
          Pin important requests or hide inappropriate content.
        </div>
      </div>

      {/* Filter row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 24, marginBottom: 24, flexWrap: "wrap",
      }}>
        {/* Type filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            fontSize: 11, color: "#9e9888", fontWeight: 600,
            textTransform: "uppercase", letterSpacing: 1, marginRight: 2,
          }}>Type</span>
          {TYPE_FILTERS.map(f => (
            <FilterButton
              key={f.key}
              active={typeFilter === f.key}
              onClick={() => setTypeFilter(f.key)}
            >
              {f.label}
            </FilterButton>
          ))}
        </div>

        {/* Status filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            fontSize: 11, color: "#9e9888", fontWeight: 600,
            textTransform: "uppercase", letterSpacing: 1, marginRight: 2,
          }}>Status</span>
          {STATUS_FILTERS.map(f => (
            <FilterButton
              key={f.key}
              active={statusFilter === f.key}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
            </FilterButton>
          ))}
        </div>

        {/* Active count badge */}
        <div style={{ marginLeft: "auto" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "6px 14px", borderRadius: 8, background: "#faf3e0",
            fontSize: 12, fontWeight: 700, color: "#8b6914",
          }}>
            🙏 {activeCount} active
          </span>
        </div>
      </div>

      {/* Grid or Empty state */}
      {visible.length === 0 ? (
        <EmptyState
          emoji="🙏"
          title="No prayer requests yet"
          desc="When members share prayers or praise, they'll appear here for you to support and respond."
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {visible.map((p, idx) => {
            const name = p.is_anonymous ? "Anonymous" : (p.display_name || "Member");
            const initials = name === "Anonymous"
              ? "A"
              : name.split(" ").map(n => n[0]).join("").slice(0, 2);
            const pType = p.type || "prayer";
            const pStatus = p.status || "active";

            return (
              <div
                key={p.id}
                style={{ transition: "transform 0.2s, box-shadow 0.2s" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
              <Card>
                {/* Top row: avatar, name, time */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <Avatar
                    initials={initials}
                    size={36}
                    bg={C.accent + "18"}
                    color={C.accent}
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#2c2a25" }}>
                      {name}
                    </span>
                    <span style={{ fontSize: 11, color: "#9e9888", marginLeft: 8 }}>
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : ""}
                    </span>
                  </div>
                </div>

                {/* Type + Status badges */}
                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  <Badge
                    color={pType === "praise" ? "#8b6914" : "#5a5647"}
                    bg={pType === "praise" ? "#faf3e0" : "#f0ebe3"}
                  >
                    {pType === "praise" ? "✨ Praise" : "🙏 Prayer"}
                  </Badge>
                  <Badge variant={pStatus}>
                    {pStatus.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </Badge>
                </div>

                {/* Body text */}
                <div style={{
                  fontSize: 13.5, color: "#5a5647", lineHeight: 1.65, marginBottom: 14,
                }}>
                  {p.text || p.content}
                </div>

                {/* Follow-up text for answered prayers */}
                {p.follow_up_text && pStatus === "answered" && (
                  <div style={{
                    borderLeft: "3px solid #C9A84C",
                    paddingLeft: 12,
                    marginBottom: 14,
                    fontStyle: "italic",
                    fontSize: 12.5,
                    color: "#7a7568",
                    lineHeight: 1.6,
                  }}>
                    {p.follow_up_text}
                  </div>
                )}

                {/* Footer: praying count, responses, actions */}
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 12, color: "#8b6914", fontWeight: 600 }}>
                      🙏 {p.prayer_count || 0} praying
                    </span>
                    {(p.response_count > 0) && (
                      <span style={{ fontSize: 12, color: "#9e9888", fontWeight: 500 }}>
                        💬 {p.response_count} response{p.response_count !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Button
                      small
                      ghost
                      onClick={() => setReplyTo(replyTo === idx ? null : idx)}
                    >
                      {replyTo === idx ? "Close" : "Respond"}
                    </Button>
                    {!p.is_anonymous && name !== "Anonymous" && (
                      <Button small ghost onClick={() => setMessageTo(name)}>
                        ✉️ Note
                      </Button>
                    )}
                    <Button
                      small
                      ghost
                      onClick={() => {
                        // Pin / Unpin toggle — placeholder until backend wired
                      }}
                      style={{ color: p.pinned ? "#8b6914" : "#9e9888" }}
                    >
                      {p.pinned ? "📌 Unpin" : "📌 Pin"}
                    </Button>
                    <Button small danger onClick={() => setHiding(p)}>Hide</Button>
                  </div>
                </div>

                {/* Inline reply expansion */}
                {replyTo === idx && (
                  <InlinePrayerResponse onClose={() => setReplyTo(null)} />
                )}
              </Card>
              </div>
            );
          })}
        </div>
      )}

      {hiding && (
        <ConfirmDialog
          title="Hide Prayer"
          message="This will hide the prayer from all members. The prayer is not deleted and can be reviewed later."
          confirmLabel="Hide"
          onConfirm={handleHide}
          onCancel={() => setHiding(null)}
          loading={hideLoading}
        />
      )}

      {messageTo && (
        <PastoralMessageModal recipientName={messageTo} onClose={() => setMessageTo(null)} />
      )}
    </div>
  );
}
