import { COLORS } from "../../colors";
import { useChurchColors } from "../useChurchColors";
import { useAuth } from "../AuthContext";

export default function EmailDigestModal({ onClose, stats = {} }) {
  const C = useChurchColors();
  const { church } = useAuth();

  const digestStats = [
    { label: "Active", value: stats.active || "0", color: C.green },
    { label: "Completed Study", value: stats.completed || "0", color: C.accent },
    { label: "New Members", value: stats.newMembers || "0", color: C.purple },
    { label: "Prayers Shared", value: stats.prayers || "0", color: C.amber },
  ];

  return (
    <div style={s.overlay} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={s.modal}>
        <div style={{ padding: "16px 24px", background: C.accent, color: "#fff" }}>
          <div style={{ fontSize: 11, opacity: 0.7 }}>WEEKLY DIGEST PREVIEW</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>This Week at {church?.name || "Church"}</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Sent every Monday at 7:00 AM to you</div>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ fontSize: 14, color: C.body, lineHeight: 1.7, marginBottom: 16 }}>
            Good morning Pastor,<br/><br/>
            Here's what happened at <strong>{church?.name || "your church"}</strong> this week:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
            {digestStats.map((s, i) => (
              <div key={i} style={{ textAlign: "center", padding: 10, borderRadius: 10, background: s.color + "10" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: C.sec }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--body)", boxShadow: `0 4px 12px ${C.accent}25` }}>Looks Good</button>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Manage digest settings in Settings</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 100,
    background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  modal: {
    width: 520, background: COLORS.card, borderRadius: 20, padding: 0,
    boxShadow: "0 24px 60px rgba(0,0,0,0.15)", overflow: "hidden",
  },
};
