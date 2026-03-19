import { COLORS } from "../../colors";
import { useChurchColors } from "../useChurchColors";
import { useAuth } from "../AuthContext";

export default function PhonePreviewModal({ onClose, currentSermon, recentPrayer }) {
  const C = useChurchColors();
  const { church } = useAuth();
  const churchInitial = (church?.name || "C")[0].toUpperCase();

  return (
    <div style={s.overlay} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={s.phone}>
        <div style={{ borderRadius: 24, overflow: "hidden", background: C.bg }}>
          {/* Header */}
          <div style={{ padding: "14px 16px", background: `${C.bg}ee`, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {church?.logo_url ? (
                  <img src={church.logo_url} alt="" style={{ width: 24, height: 24, borderRadius: 6, objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>{churchInitial}</div>
                )}
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "var(--heading)" }}>{church?.name || "Church"}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: 16, minHeight: 420 }}>
            <div style={{ padding: 16, borderRadius: 12, marginBottom: 12, background: `linear-gradient(135deg, ${C.accent}12 0%, ${C.goldBg} 100%)` }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: "var(--heading)" }}>Good morning</div>
              <div style={{ fontSize: 11, color: C.sec, marginTop: 2 }}>Welcome to {church?.name || "Church"}</div>
            </div>

            {currentSermon && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>THIS WEEK'S SERMON</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{currentSermon}</div>
                <div style={{ marginTop: 8, padding: 6, borderRadius: 6, background: C.accent, textAlign: "center", color: "#fff", fontSize: 10, fontWeight: 700 }}>Open Today's Reflection</div>
              </div>
            )}

            {recentPrayer && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>PRAYER WALL</div>
                <div style={{ fontSize: 10, color: C.sec, lineHeight: 1.4 }}>{recentPrayer}</div>
              </div>
            )}
          </div>

          {/* Bottom nav */}
          <div style={{ display: "flex", justifyContent: "space-around", padding: "8px 0 12px", borderTop: `1px solid ${C.border}` }}>
            {["🏠","📖","🙏","🗺️","⚙️"].map((icon, i) => (
              <div key={i} style={{ textAlign: "center", opacity: i === 0 ? 1 : 0.4 }}>
                <div style={{ fontSize: 14 }}>{icon}</div>
                <div style={{ fontSize: 7, fontWeight: 700, color: i === 0 ? C.accent : C.muted, marginTop: 2 }}>{["Home","Sermon","Prayer","Journeys","Settings"][i]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 100,
    background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  phone: {
    width: 320, background: "#1A1A2E", borderRadius: 36, padding: 12,
    boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
  },
};
