/**
 * Segmented member health bar.
 * Usage: <HealthBar counts={{ thriving: 7, active: 6, declining: 3, new: 4 }} total={20} />
 */

const SEGMENTS = [
  { key: "thriving", label: "Thriving", color: "#3d6b44", textColor: "#fff" },
  { key: "active",   label: "Active",   color: "#6b9e72", textColor: "#fff" },
  { key: "declining",label: "Declining", color: "#d4a03c", textColor: "#fff" },
  { key: "new",      label: "New",      color: "#c9c1b4", textColor: "#5a5647" },
];

export default function HealthBar({ counts, total }) {
  if (!total) return null;

  return (
    <div style={{
      display: "flex",
      borderRadius: 10,
      overflow: "hidden",
      height: 36,
    }}>
      {SEGMENTS.map((seg) => {
        const count = counts[seg.key] || 0;
        if (count === 0) return null;
        return (
          <div
            key={seg.key}
            style={{
              width: `${(count / total) * 100}%`,
              background: seg.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: seg.textColor,
              fontSize: 12,
              fontWeight: 600,
              gap: 4,
              minWidth: 60,
              transition: "width 0.4s ease",
            }}
          >
            <span>{count}</span>
            <span style={{ fontWeight: 400, fontSize: 11, opacity: 0.8 }}>{seg.label}</span>
          </div>
        );
      })}
    </div>
  );
}
