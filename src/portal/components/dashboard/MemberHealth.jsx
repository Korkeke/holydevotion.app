import Card from "../ui/Card";
import SectionLabel from "../ui/SectionLabel";
import Avatar from "../ui/Avatar";
import HealthBar from "../ui/HealthBar";

/**
 * Member Health card with segmented bar and recent activity.
 */

const STATUS_COLORS = {
  thriving: { color: "#3d6b44", bg: "#e8f0e9" },
  active:   { color: "#3d6b44", bg: "#edf5ee" },
  declining:{ color: "#b05a3a", bg: "#f5e8e3" },
  new:      { color: "#5a5647", bg: "#f0ebe3" },
};

export default function MemberHealth({ counts, total, attention, onViewAll }) {
  // Build recent activity from attention data
  const recentActivity = [];
  if (attention?.declining) {
    attention.declining.slice(0, 2).forEach((m) => {
      recentActivity.push({
        name: m.display_name || "Member",
        initials: (m.display_name || "M").split(" ").map(n => n[0]).join("").slice(0, 2),
        action: "Engagement declining",
        time: m.days_inactive ? `${m.days_inactive}d inactive` : "",
        status: "declining",
      });
    });
  }
  if (attention?.milestones) {
    attention.milestones.slice(0, 2).forEach((m) => {
      recentActivity.push({
        name: m.display_name || "Member",
        initials: (m.display_name || "M").split(" ").map(n => n[0]).join("").slice(0, 2),
        action: `${m.milestone}-day streak`,
        time: "",
        status: "thriving",
      });
    });
  }

  return (
    <Card>
      <SectionLabel right="All Members" onRightClick={onViewAll}>Member Health</SectionLabel>
      <HealthBar counts={counts} total={total} />

      {/* Status counts grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
        {Object.entries(STATUS_COLORS).map(([key, sc]) => (
          <div key={key} style={{
            padding: "10px 12px", borderRadius: 8, background: sc.bg,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 12, color: sc.color, fontWeight: 500, textTransform: "capitalize" }}>{key}</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: sc.color, fontFamily: "'DM Serif Display', serif" }}>
              {counts[key] || 0}
            </span>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <SectionLabel>Recent Activity</SectionLabel>
          {recentActivity.slice(0, 3).map((ac, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 0",
              borderBottom: i < recentActivity.length - 1 ? "1px solid #f0ebe3" : "none",
            }}>
              <Avatar
                initials={ac.initials}
                size={28}
                bg={STATUS_COLORS[ac.status]?.bg || "#f0ebe3"}
                color={STATUS_COLORS[ac.status]?.color || "#5a5647"}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12 }}><strong>{ac.name}</strong> {ac.action}</div>
                {ac.time && <div style={{ fontSize: 11, color: "#b0a998" }}>{ac.time}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
