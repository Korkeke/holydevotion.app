import Card from "../ui/Card";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";

/**
 * Hero card showing members who need pastoral attention.
 * Combines declining, inactive members and unanswered prayers
 * into a prioritized list (top 5).
 */

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function WhoNeedsYou({ attention, prayers = [], onViewAll }) {
  // Build prioritized list: inactive first, then declining, then unanswered prayers
  const items = [];

  // Inactive members (most urgent)
  for (const m of (attention?.inactive || [])) {
    items.push({
      key: `inactive-${m.id}`,
      name: m.display_name || "Member",
      badge: `Inactive ${m.days_inactive ?? "10+"}d`,
      badgeColor: "#c26a4a",
      badgeBg: "#f5e8e3",
      borderColor: "#c26a4a",
      sub: m.last_active_at
        ? `Last active ${new Date(m.last_active_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
        : "Never active",
      avatarBg: "#f5e8e3",
      avatarColor: "#c26a4a",
    });
  }

  // Declining members
  for (const m of (attention?.declining || [])) {
    items.push({
      key: `declining-${m.id}`,
      name: m.display_name || "Member",
      badge: `Declining ${m.days_inactive ?? ""}d`,
      badgeColor: "#d4a03c",
      badgeBg: "#faf3e0",
      borderColor: "#d4a03c",
      sub: m.current_streak > 0
        ? `Streak: ${m.current_streak} days`
        : m.last_active_at
          ? `Last active ${new Date(m.last_active_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
          : "No recent activity",
      avatarBg: "#faf3e0",
      avatarColor: "#d4a03c",
    });
  }

  // Unanswered prayers
  for (const p of prayers) {
    items.push({
      key: `prayer-${p.id}`,
      name: p.is_anonymous ? "Anonymous" : (p.display_name || "Member"),
      badge: "Unanswered prayer",
      badgeColor: "#d4a03c",
      badgeBg: "#faf3e0",
      borderColor: "#8b6914",
      sub: (p.text || p.content || "").slice(0, 60) + ((p.text || p.content || "").length > 60 ? "..." : ""),
      avatarBg: "#faf3e0",
      avatarColor: "#8b6914",
    });
  }

  const visible = items.slice(0, 5);
  const remaining = items.length - visible.length;

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={s.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🤲</span>
          <span style={s.title}>Who Needs You This Week</span>
        </div>
        {items.length > 0 && (
          <span style={s.count}>{items.length} {items.length === 1 ? "person" : "people"}</span>
        )}
      </div>

      {visible.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🌿</div>
          <div style={s.emptyTitle}>Your flock is doing well this week</div>
          <div style={s.emptyDesc}>No members need immediate attention right now</div>
        </div>
      ) : (
        <div style={{ padding: "4px 0" }}>
          {visible.map((item, i) => (
            <div key={item.key} style={{
              ...s.row,
              borderBottom: i < visible.length - 1 ? "1px solid #f0ebe3" : "none",
            }}>
              <div style={{ ...s.accent, background: item.borderColor }} />
              <Avatar
                initials={getInitials(item.name)}
                size={36}
                bg={item.avatarBg}
                color={item.avatarColor}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={s.name}>{item.name}</span>
                  <Badge color={item.badgeColor} bg={item.badgeBg}>{item.badge}</Badge>
                </div>
                <div style={s.sub}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {remaining > 0 && (
        <div style={s.footer}>
          <button onClick={onViewAll} style={s.viewAll}>
            +{remaining} more &middot; View all members
          </button>
        </div>
      )}
    </Card>
  );
}

const s = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid #ece7dd",
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: "#2c2a25",
    fontFamily: "'DM Serif Display', serif",
  },
  count: {
    fontSize: 12,
    fontWeight: 600,
    color: "#c26a4a",
    padding: "3px 10px",
    borderRadius: 20,
    background: "#f5e8e3",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 20px",
    transition: "background 0.15s",
  },
  accent: {
    width: 4,
    height: 36,
    borderRadius: 2,
    flexShrink: 0,
  },
  name: {
    fontSize: 13,
    fontWeight: 600,
    color: "#2c2a25",
  },
  sub: {
    fontSize: 12,
    color: "#9e9888",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  empty: {
    textAlign: "center",
    padding: "32px 20px",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "'DM Serif Display', serif",
    color: "#2c2a25",
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    color: "#9e9888",
  },
  footer: {
    padding: "12px 20px",
    borderTop: "1px solid #ece7dd",
    textAlign: "center",
  },
  viewAll: {
    fontSize: 13,
    fontWeight: 600,
    color: "#3d6b44",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
