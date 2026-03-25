import Card from "../ui/Card";
import SectionLabel from "../ui/SectionLabel";

/**
 * Spiritual Pulse donut chart with theme breakdown.
 * Data comes from GET /analytics/pulse → themes[].percentage
 */

const THEME_COLORS = {
  Gratitude: "#3d6b44",
  Hope: "#5a9e64",
  Anxiety: "#d4a03c",
  Grief: "#c26a4a",
  Doubt: "#8b6914",
  Faith: "#3d6b44",
  Family: "#5a7d9a",
  Purpose: "#6b5b8a",
  Healing: "#4a8b6f",
  Peace: "#3d8b7a",
};

function Donut({ segments, size = 90, thickness = 12 }) {
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f0ebe3" strokeWidth={thickness} />
      {segments.map((seg, i) => {
        const dash = (seg.pct / 100) * circumference;
        const el = (
          <circle
            key={i}
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={seg.color} strokeWidth={thickness}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

export default function SpiritualPulse({ themes = [], totalMessages = 0 }) {
  const segments = themes.slice(0, 5).map((t) => ({
    name: t.theme,
    pct: t.percentage,
    color: THEME_COLORS[t.theme] || "#9e9888",
  }));

  return (
    <Card>
      <SectionLabel>Spiritual Pulse</SectionLabel>
      {segments.length === 0 ? (
        <p style={{ fontSize: 13, color: "#9e9888", fontStyle: "italic", lineHeight: 1.6 }}>
          Not enough conversation data yet. Themes will appear as your members use Devotion.
        </p>
      ) : (
        <>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <Donut segments={segments} />
            <div style={{ flex: 1 }}>
              {segments.map((seg, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: seg.color }} />
                  <span style={{ fontSize: 12, color: "#5a5647", flex: 1 }}>{seg.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{seg.pct}%</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#9e9888", marginTop: 14 }}>
            Themes from {totalMessages} conversations this week
          </div>
        </>
      )}
    </Card>
  );
}
