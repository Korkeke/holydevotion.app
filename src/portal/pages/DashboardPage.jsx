import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS } from "../../colors";
import { useAuth } from "../AuthContext";
import { get } from "../api";
import StatCard from "../components/StatCard";

export default function DashboardPage() {
  const { church, churchLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (churchLoading) return;
    if (!church?.id) { setLoading(false); return; }
    get(`/api/churches/${church.id}/analytics`)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [church?.id, churchLoading]);

  if (churchLoading || loading) {
    return (
      <div style={s.loading}>
        <div style={s.spinner} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!church) {
    return (
      <div style={s.empty}>
        <p style={s.emptyText}>No church found. Please complete signup.</p>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>{church.name}</h1>
        <p style={s.subtitle}>
          {[church.denomination, church.city].filter(Boolean).join(" · ") || "Church Dashboard"}
        </p>
      </div>

      {/* Stats grid */}
      <div style={s.statsGrid}>
        <StatCard label="Members" value={stats?.member_count ?? 0} />
        <StatCard label="Events" value={stats?.event_count ?? 0} />
        <StatCard label="Announcements" value={stats?.announcement_count ?? 0} />
        <StatCard label="Prayer Requests" value={stats?.prayer_count ?? 0} />
      </div>

      {/* Quick actions */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Quick Actions</h2>
        <div style={s.actions}>
          <button style={s.actionBtn} onClick={() => navigate("/portal/events")}>
            + Create Event
          </button>
          <button style={s.actionBtn} onClick={() => navigate("/portal/announcements")}>
            + Post Announcement
          </button>
          <button style={s.actionBtn} onClick={() => navigate("/portal/devotionals")}>
            + Write Devotional
          </button>
        </div>
      </div>

      {/* Invite code */}
      {church.invite_code && (
        <div style={s.section}>
          <h2 style={s.sectionTitle}>Invite Code</h2>
          <div style={s.inviteCard}>
            <div style={s.inviteCode}>{church.invite_code}</div>
            <button
              style={s.copyBtn}
              onClick={() => {
                navigator.clipboard.writeText(church.invite_code);
              }}
            >
              Copy
            </button>
          </div>
          <p style={s.inviteHint}>
            Share this code with your congregation. They enter it in the Devotion app to join your church.
          </p>
        </div>
      )}
    </div>
  );
}

const s = {
  page: {
    padding: "32px 40px",
    maxWidth: 960,
  },
  loading: {
    padding: 60,
    display: "flex",
    justifyContent: "center",
  },
  spinner: {
    width: 28,
    height: 28,
    border: `2px solid ${COLORS.gold}`,
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  empty: {
    padding: 60,
    textAlign: "center",
  },
  emptyText: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 14,
    color: COLORS.textMuted,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 32,
    fontWeight: 400,
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 14,
    color: COLORS.textMuted,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 16,
    marginBottom: 40,
  },
  section: {
    marginBottom: 36,
  },
  sectionTitle: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.gold,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: 14,
  },
  actions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  actionBtn: {
    padding: "10px 20px",
    borderRadius: 10,
    border: `1px solid ${COLORS.borderHover}`,
    background: "transparent",
    color: COLORS.gold,
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  inviteCard: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "16px 20px",
    borderRadius: 12,
    background: COLORS.bgCard,
    border: `1px solid ${COLORS.borderHover}`,
  },
  inviteCode: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 22,
    fontWeight: 600,
    color: COLORS.text,
    letterSpacing: "0.1em",
    flex: 1,
  },
  copyBtn: {
    padding: "8px 18px",
    borderRadius: 8,
    border: "none",
    background: COLORS.goldDim,
    color: COLORS.gold,
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  inviteHint: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 13,
    color: COLORS.textDim,
    marginTop: 10,
  },
};
