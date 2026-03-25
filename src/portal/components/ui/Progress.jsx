/**
 * Horizontal progress bar.
 * Usage: <Progress pct={73} />
 *        <Progress pct={40} color="#d4a03c" height={8} />
 */

export default function Progress({ pct, color = "#3d6b44", height = 6 }) {
  return (
    <div style={{
      height,
      borderRadius: height / 2,
      background: "#f0ebe3",
      overflow: "hidden",
    }}>
      <div style={{
        height: "100%",
        width: `${Math.min(100, Math.max(0, pct))}%`,
        borderRadius: height / 2,
        background: color,
        transition: "width 0.4s ease",
      }} />
    </div>
  );
}
