import { COLORS } from "../../colors";

const STATUS_COLORS = {
  draft: { bg: COLORS.bgDeep, text: COLORS.sec },
  scheduled: { bg: COLORS.blueBg, text: COLORS.blue },
  published: { bg: COLORS.greenBg, text: COLORS.green },
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
      fontFamily: "var(--body)",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
    }}>
      {status}
    </span>
  );
}
