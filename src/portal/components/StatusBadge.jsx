import { COLORS } from "../../colors";

const STATUS_COLORS = {
  draft: { bg: "rgba(255,255,255,0.06)", text: COLORS.textMuted },
  scheduled: { bg: "rgba(52,152,219,0.12)", text: "#5dade2" },
  published: { bg: COLORS.goldDim, text: COLORS.gold },
};

export default function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.draft;
  return (
    <span style={{
      display: "inline-block",
      padding: "4px 10px",
      borderRadius: 6,
      background: c.bg,
      color: c.text,
      fontFamily: "'Nunito Sans', sans-serif",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
    }}>
      {status}
    </span>
  );
}
