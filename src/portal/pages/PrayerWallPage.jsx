import { useState, useEffect } from "react";
import { COLORS } from "../../colors";
import { useAuth } from "../AuthContext";
import { get, put } from "../api";
import ConfirmDialog from "../components/ConfirmDialog";

export default function PrayerWallPage() {
  const { church } = useAuth();
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hiding, setHiding] = useState(null);
  const [hideLoading, setHideLoading] = useState(false);

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

  function formatDate(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  if (loading) return <div style={s.loading}><div style={s.spinner} /></div>;

  return (
    <div style={s.page}>
      <h1 style={s.title}>Prayer Wall</h1>
      <p style={s.subtitle}>
        Prayer requests from your congregation. You can hide inappropriate content.
      </p>

      {prayers.length === 0 ? (
        <div style={s.empty}>No prayer requests yet.</div>
      ) : (
        <div style={s.list}>
          {prayers.map((p) => (
            <div key={p.id} style={s.card}>
              <p style={s.prayerText}>{p.text}</p>
              <div style={s.cardFooter}>
                <span style={s.meta}>
                  {p.anonymous ? "Anonymous" : (p.user_id?.slice(0, 8) || "Member")}
                  {" · "}{formatDate(p.created_at)}
                  {" · "}{p.prayer_count || 0} praying
                </span>
                <button style={s.hideBtn} onClick={() => setHiding(p)}>Hide</button>
              </div>
            </div>
          ))}
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
    </div>
  );
}

const s = {
  page: { padding: "32px 40px", maxWidth: 960 },
  loading: { padding: 60, display: "flex", justifyContent: "center" },
  spinner: { width: 28, height: 28, border: `2px solid ${COLORS.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  title: { fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: COLORS.text, marginBottom: 4 },
  subtitle: { fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: COLORS.textMuted, marginBottom: 24 },
  empty: { fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: COLORS.textMuted, textAlign: "center", padding: 48 },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  card: {
    padding: "16px 20px", borderRadius: 12,
    background: COLORS.card, border: `1px solid ${COLORS.border}`,
  },
  prayerText: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    color: COLORS.text, lineHeight: 1.6, marginBottom: 12,
  },
  cardFooter: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  meta: { fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: COLORS.textMuted },
  hideBtn: {
    padding: "5px 14px", borderRadius: 6,
    border: "1px solid rgba(192,57,43,0.3)", background: "transparent",
    color: "#e57373", fontFamily: "'DM Sans', sans-serif",
    fontSize: 12, fontWeight: 600, cursor: "pointer",
  },
};
