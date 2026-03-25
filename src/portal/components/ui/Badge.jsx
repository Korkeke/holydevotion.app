/**
 * Status pill badge.
 * Usage: <Badge>Published</Badge>
 *        <Badge color="#8b6914" bg="#faf3e0">Scheduled</Badge>
 */

const VARIANTS = {
  published:  { color: "#3d6b44", bg: "#e8f0e9" },
  draft:      { color: "#9e9888", bg: "#f0ebe3" },
  scheduled:  { color: "#8b6914", bg: "#faf3e0" },
  broadcast:  { color: "#b05a3a", bg: "#f5e8e3" },
  answered:   { color: "#3d6b44", bg: "#e8f0e9" },
  active:     { color: "#3d6b44", bg: "#e8f0e9" },
  thriving:   { color: "#3d6b44", bg: "#e8f0e9" },
  declining:  { color: "#b05a3a", bg: "#f5e8e3" },
  new:        { color: "#5a5647", bg: "#f0ebe3" },
  owner:      { color: "#8b6914", bg: "#faf3e0" },
};

export default function Badge({ children, variant, color, bg, style }) {
  const v = variant ? VARIANTS[variant.toLowerCase()] : null;
  const c = color || v?.color || "#5a5647";
  const b = bg || v?.bg || "#f0ebe3";

  return (
    <span style={{
      display: "inline-flex",
      padding: "3px 9px",
      borderRadius: 5,
      background: b,
      color: c,
      fontSize: 11,
      fontWeight: 600,
      whiteSpace: "nowrap",
      ...style,
    }}>
      {children}
    </span>
  );
}
