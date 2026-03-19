import { COLORS } from "../../colors";
import { useChurchColors } from "../useChurchColors";

export default function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = "Delete", loading }) {
  const COLORS = useChurchColors();
  return (
    <div style={s.overlay} onClick={onCancel}>
      <div style={s.dialog} onClick={(e) => e.stopPropagation()}>
        <h3 style={s.title}>{title}</h3>
        <p style={s.message}>{message}</p>
        <div style={s.actions}>
          <button onClick={onCancel} style={s.cancelBtn}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={s.confirmBtn}>
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
    padding: 20,
  },
  dialog: {
    width: "100%",
    maxWidth: 400,
    padding: "28px 24px",
    borderRadius: 20,
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    boxShadow: "0 24px 60px rgba(0,0,0,0.15)",
  },
  title: {
    fontFamily: "var(--heading)",
    fontSize: 20,
    fontWeight: 700,
    color: COLORS.text,
    marginBottom: 8,
  },
  message: {
    fontFamily: "var(--body)",
    fontSize: 14,
    color: COLORS.sec,
    lineHeight: 1.6,
    marginBottom: 24,
  },
  actions: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
  },
  cancelBtn: {
    padding: "10px 20px",
    borderRadius: 10,
    border: `1.5px solid ${COLORS.border}`,
    background: COLORS.card,
    color: COLORS.sec,
    fontFamily: "var(--body)",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  confirmBtn: {
    padding: "10px 20px",
    borderRadius: 10,
    border: "none",
    background: COLORS.red,
    color: "#fff",
    fontFamily: "var(--body)",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
};
