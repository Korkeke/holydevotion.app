import { useState, useEffect } from "react";
import { useChurchColors } from "../useChurchColors";
import { COLORS } from "../../colors";
import { useAuth } from "../AuthContext";
import { get, put } from "../api";
import ConfirmDialog from "../components/ConfirmDialog";
import PastoralMessageModal from "../components/PastoralMessageModal";

export default function PrayerWallPage() {
  const C = useChurchColors();
  const { church } = useAuth();
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hiding, setHiding] = useState(null);
  const [hideLoading, setHideLoading] = useState(false);
  const [messageTo, setMessageTo] = useState(null);

  async function load() {
    if (!church?.id) return;
    try {
      const data = await get(`/api/churches/${church.id}/prayer-wall`);
      setPrayers(data?.prayers || []);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [church?.id]);

  async function handleHide() {
    setHideLoading(true);
    try {
      await put(`/api/churches/${church.id}/prayer-wall/${hiding.id}/hide`);
      setHiding(null);
      await load();
    } finally { setHideLoading(false); }
  }

  const totalPrayers = prayers.reduce((sum, p) => sum + (p.prayer_count || 0), 0);

  if (loading) return <div style={{ padding: 60, display: "flex", justifyContent: "center" }}><div style={{ width: 28, height: 28, border: `2px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>;

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1280 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: C.text, fontFamily: "var(--heading)" }}>Prayer Wall</div>
        <span style={{ padding: "6px 14px", borderRadius: 8, background: C.accentLight, fontSize: 12, fontWeight: 700, color: C.accent }}>🙏 {totalPrayers} prayers this week</span>
      </div>
      <div style={{ fontSize: 13, color: C.sec, marginBottom: 24 }}>Pin important requests or hide inappropriate content.</div>

      {prayers.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: C.muted, fontSize: 14 }}>No prayer requests yet.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {prayers.filter(p => !p.hidden).map((p) => {
            const name = p.is_anonymous ? "Anonymous" : (p.display_name || "Member");
            const initials = name === "Anonymous" ? "A" : name.split(" ").map(n => n[0]).join("").slice(0, 2);
            return (
              <div key={p.id} style={{ background: `linear-gradient(135deg, ${C.card} 0%, ${C.cardWarm} 100%)`, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}22 0%, ${C.accent}0A 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: C.accent }}>{initials}</div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{name}</span>
                    <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>{p.created_at ? new Date(p.created_at).toLocaleDateString() : ""}</span>
                  </div>
                </div>
                <div style={{ fontSize: 13.5, color: C.body, lineHeight: 1.65, marginBottom: 14 }}>{p.text || p.content}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: C.accent, fontWeight: 600 }}>🙏 {p.prayer_count || 0} praying</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {!p.is_anonymous && name !== "Anonymous" && (
                      <button onClick={() => setMessageTo(name)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.accent}25`, background: C.accentLight, fontSize: 11, fontWeight: 600, cursor: "pointer", color: C.accent, fontFamily: "var(--body)" }}>✉️ Note</button>
                    )}
                    <button onClick={() => setHiding(p)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.red}30`, background: C.redBg, fontSize: 11, fontWeight: 600, cursor: "pointer", color: C.red, fontFamily: "var(--body)" }}>Hide</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hiding && (
        <ConfirmDialog
          title="Hide Prayer"
          message="This will hide the prayer from all members. The prayer is not deleted and can be reviewed later."
          confirmLabel="Hide"
          onConfirm={handleHide}
          onCancel={() => setHiding(null)}
          loading={hideLoading}
        />
      )}

      {messageTo && (
        <PastoralMessageModal recipientName={messageTo} onClose={() => setMessageTo(null)} />
      )}
    </div>
  );
}
