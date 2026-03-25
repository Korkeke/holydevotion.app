import { useState, useEffect, useMemo } from "react";
import { useChurchColors } from "../useChurchColors";
import { COLORS } from "../../colors";
import { useAuth } from "../AuthContext";
import { get, put } from "../api";
import ConfirmDialog from "../components/ConfirmDialog";
import PastoralMessageModal from "../components/PastoralMessageModal";

const TYPE_FILTERS = [
  { key: "all", label: "All" },
  { key: "prayer", label: "Prayers" },
  { key: "praise", label: "Praise" },
];

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "answered", label: "Answered" },
];

const STATUS_DOT = {
  active: "#22c55e",
  still_praying: "#f59e0b",
  answered: "#C9A84C",
};

export default function PrayerWallPage() {
  const C = useChurchColors();
  const { church } = useAuth();
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hiding, setHiding] = useState(null);
  const [hideLoading, setHideLoading] = useState(false);
  const [messageTo, setMessageTo] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  async function load() {
    if (!church?.id) return;
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const qs = params.toString();
      const url = `/api/churches/${church.id}/prayer-wall${qs ? `?${qs}` : ""}`;
      const data = await get(url);
      setPrayers(data?.prayers || []);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [church?.id, typeFilter, statusFilter]);

  async function handleHide() {
    setHideLoading(true);
    try {
      await put(`/api/churches/${church.id}/prayer-wall/${hiding.id}/hide`);
      setHiding(null);
      await load();
    } finally { setHideLoading(false); }
  }

  const visible = useMemo(() => prayers.filter(p => !p.hidden), [prayers]);

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    let prayerCount = 0;
    let praiseCount = 0;
    for (const p of prayers) {
      const created = p.created_at ? new Date(p.created_at) : null;
      if (created && created >= weekAgo) {
        if ((p.type || "prayer") === "praise") praiseCount++;
        else prayerCount++;
      }
    }
    return { prayerCount, praiseCount };
  }, [prayers]);

  const totalPrayers = prayers.reduce((sum, p) => sum + (p.prayer_count || 0), 0);

  const filterBtnStyle = (active) => ({
    padding: "5px 14px",
    borderRadius: 8,
    border: `1px solid ${active ? C.accent : C.border}`,
    background: active ? C.accentLight : "transparent",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    color: active ? C.accent : C.sec,
    fontFamily: "var(--body)",
    transition: "all 0.15s ease",
  });

  if (loading) return <div style={{ padding: 60, display: "flex", justifyContent: "center" }}><div style={{ width: 28, height: 28, border: `2px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>;

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: C.text, fontFamily: "var(--heading)" }}>Prayer Wall</div>
        <span style={{ padding: "6px 14px", borderRadius: 8, background: C.accentLight, fontSize: 12, fontWeight: 700, color: C.accent }}>🙏 {totalPrayers} praying</span>
      </div>
      <div style={{ fontSize: 13, color: C.sec, marginBottom: 16 }}>Pin important requests or hide inappropriate content.</div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <span style={{ padding: "6px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 600, color: C.body }}>
          🙏 {stats.prayerCount} prayer{stats.prayerCount !== 1 ? "s" : ""}, {stats.praiseCount} praise{stats.praiseCount !== 1 ? "s" : ""} this week
        </span>
      </div>

      {/* Filter row */}
      <div style={{ display: "flex", gap: 24, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginRight: 4 }}>Type</span>
          {TYPE_FILTERS.map(f => (
            <button key={f.key} onClick={() => setTypeFilter(f.key)} style={filterBtnStyle(typeFilter === f.key)}>{f.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginRight: 4 }}>Status</span>
          {STATUS_FILTERS.map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)} style={filterBtnStyle(statusFilter === f.key)}>{f.label}</button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: C.muted, fontSize: 14 }}>No prayer requests yet.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {visible.map((p) => {
            const name = p.is_anonymous ? "Anonymous" : (p.display_name || "Member");
            const initials = name === "Anonymous" ? "A" : name.split(" ").map(n => n[0]).join("").slice(0, 2);
            const pType = p.type || "prayer";
            const pStatus = p.status || "active";
            const dotColor = STATUS_DOT[pStatus] || STATUS_DOT.active;
            return (
              <div key={p.id} style={{ background: `linear-gradient(135deg, ${C.card} 0%, ${C.cardWarm} 100%)`, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}22 0%, ${C.accent}0A 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: C.accent }}>{initials}</div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{name}</span>
                    <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>{p.created_at ? new Date(p.created_at).toLocaleDateString() : ""}</span>
                  </div>
                  {/* Status dot */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: "capitalize" }}>{pStatus.replace("_", " ")}</span>
                  </div>
                </div>

                {/* Type badge */}
                <div style={{ marginBottom: 10 }}>
                  <span style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    background: pType === "praise" ? `${C.accent}18` : `${C.accent}10`,
                    color: pType === "praise" ? C.accent : C.sec,
                    border: `1px solid ${pType === "praise" ? C.accent + "30" : C.border}`,
                  }}>
                    {pType === "praise" ? "✨ Praise" : "🙏 Prayer"}
                  </span>
                </div>

                <div style={{ fontSize: 13.5, color: C.body, lineHeight: 1.65, marginBottom: 14 }}>{p.text || p.content}</div>

                {/* Follow-up text for answered prayers */}
                {p.follow_up_text && pStatus === "answered" && (
                  <div style={{
                    borderLeft: "3px solid #C9A84C",
                    paddingLeft: 12,
                    marginBottom: 14,
                    fontStyle: "italic",
                    fontSize: 12.5,
                    color: C.sec,
                    lineHeight: 1.6,
                  }}>
                    {p.follow_up_text}
                  </div>
                )}

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
