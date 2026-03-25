/**
 * Dashboard stat card with colored top accent bar, big number, and trend badge.
 */

export default function StatCard({ label, value, change, up, sub, color = "#3d6b44" }) {
  return (
    <div
      style={s.card}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.06)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ ...s.accent, background: `linear-gradient(90deg, ${color}, ${color}44)` }} />
      <div style={s.label}>{label}</div>
      <div style={s.value}>{value}</div>
      <div style={s.footer}>
        {change && (
          <span style={{
            ...s.changeBadge,
            color: up ? "#3d6b44" : "#b05a3a",
            background: up ? "#e8f0e9" : "#f5e8e3",
          }}>
            {up ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>
            )}
            {change}
          </span>
        )}
        <span style={s.sub}>{sub}</span>
      </div>
    </div>
  );
}

const s = {
  card: {
    background: "#fff",
    borderRadius: 14,
    padding: "20px 20px 16px",
    border: "1px solid #ece7dd",
    position: "relative",
    overflow: "hidden",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  accent: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: 500,
    color: "#9e9888",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: 10,
  },
  value: {
    fontSize: 28,
    fontWeight: 700,
    color: "#2c2a25",
    lineHeight: 1,
    fontFamily: "'DM Serif Display', serif",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  changeBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    fontSize: 12,
    fontWeight: 600,
    padding: "3px 8px",
    borderRadius: 6,
  },
  sub: {
    fontSize: 12,
    color: "#b0a998",
  },
};
