import { COLORS } from "../../colors";

export default function StatCard({ label, value, icon }) {
  return (
    <div style={s.card}>
      {icon && <div style={s.icon}>{icon}</div>}
      <div style={s.value}>{value ?? "—"}</div>
      <div style={s.label}>{label}</div>
    </div>
  );
}

const s = {
  card: {
    padding: "24px 20px",
    borderRadius: 16,
    background: COLORS.bgCard,
    border: `1px solid ${COLORS.border}`,
    textAlign: "center",
    transition: "border-color 0.2s",
  },
  icon: {
    marginBottom: 12,
    color: COLORS.gold,
  },
  value: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 36,
    fontWeight: 400,
    color: COLORS.text,
    lineHeight: 1,
    marginBottom: 6,
  },
  label: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    color: COLORS.textMuted,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
};
