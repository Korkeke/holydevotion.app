import { COLORS } from "../../colors";

export default function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = "Delete", loading }) {
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
    background: "rgba(0,0,0,0.6)",
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
    borderRadius: 16,
    background: COLORS.bgDeep,
    border: `1px solid ${COLORS.border}`,
  },
  title: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 20,
    fontWeight: 500,
    color: COLORS.text,
    marginBottom: 8,
  },
  message: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 14,
    color: COLORS.textMuted,
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
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    background: "transparent",
    color: COLORS.textMuted,
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  confirmBtn: {
    padding: "10px 20px",
    borderRadius: 8,
    border: "none",
    background: "#c0392b",
    color: "#fff",
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
};
