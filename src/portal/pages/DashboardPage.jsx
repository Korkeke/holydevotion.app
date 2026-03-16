import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS } from "../../colors";
import { useAuth } from "../AuthContext";
import { get, post } from "../api";

export default function DashboardPage() {
  const { church, churchLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pulse, setPulse] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [attention, setAttention] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingInsight, setGeneratingInsight] = useState(false);

  useEffect(() => {
    if (churchLoading) return;
    if (!church?.id) { setLoading(false); return; }

    const base = `/api/churches/${church.id}`;
    Promise.all([
      get(`${base}/analytics`).catch(() => null),
      get(`${base}/analytics/pulse`).catch(() => null),
      get(`${base}/analytics/engagement`).catch(() => null),
      get(`${base}/analytics/attention`).catch(() => null),
    ]).then(([s, p, e, a]) => {
      setStats(s);
      setPulse(p);
      setEngagement(e);
      setAttention(a);
    }).finally(() => setLoading(false));
  }, [church?.id, churchLoading]);

  const handleGenerateInsight = async () => {
    if (!church?.id || generatingInsight) return;
    setGeneratingInsight(true);
    try {
      const result = await post(`/api/churches/${church.id}/analytics/generate-insight`);
      setPulse(prev => ({ ...prev, insight: { text: result.insight, generated_at: result.generated_at } }));
    } catch {}
    setGeneratingInsight(false);
  };

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

  const dailyData = engagement?.daily || [];
  const maxMessages = Math.max(...dailyData.map(d => d.messages), 1);

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.title}>{church.name}</h1>
        <p style={s.subtitle}>
          {[church.denomination, church.city].filter(Boolean).join(" · ") || "Church Dashboard"}
        </p>
      </div>

      {/* Top stat cards */}
      <div style={s.statsGrid}>
        <SparkCard
          label="Active Members"
          value={stats?.member_count ?? 0}
          sparkData={dailyData.map(d => d.active_users)}
        />
        <SparkCard
          label="Weekly Messages"
          value={pulse?.total_messages_this_week ?? 0}
          prevValue={pulse?.total_messages_prev_week}
          sparkData={dailyData.slice(-7).map(d => d.messages)}
        />
        <SparkCard
          label="Sermon Engagement"
          value={engagement?.sermon_completion_rate != null ? `${engagement.sermon_completion_rate}%` : "—"}
          sparkData={dailyData.slice(-7).map(d => d.sermon_completions)}
        />
        <SparkCard
          label="Prayer Requests"
          value={stats?.prayer_count ?? 0}
        />
      </div>

      {/* Main grid: Engagement chart + Spiritual Pulse side by side */}
      <div style={s.twoCol}>
        {/* Left: Engagement chart */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>Daily Activity</h3>
          <p style={s.cardSubtitle}>Messages over the last 30 days</p>
          <div style={s.chartArea}>
            {dailyData.length === 0 ? (
              <p style={s.noData}>No activity data yet. As your members use Devotion, this chart will populate.</p>
            ) : (
              <div style={s.barChart}>
                {dailyData.map((d, i) => {
                  const h = Math.max((d.messages / maxMessages) * 100, 2);
                  const isToday = i === dailyData.length - 1;
                  return (
                    <div key={d.date} style={s.barCol} title={`${d.date}: ${d.messages} messages`}>
                      <div style={{
                        ...s.bar,
                        height: `${h}%`,
                        background: isToday
                          ? `linear-gradient(to top, ${COLORS.gold}, ${COLORS.goldLight})`
                          : COLORS.goldDim,
                      }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Spiritual Pulse */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>Spiritual Pulse</h3>
          <p style={s.cardSubtitle}>What your congregation is wrestling with this week</p>
          {(!pulse?.themes || pulse.themes.length === 0) ? (
            <p style={s.noData}>Not enough conversation data yet. Themes will appear as your members chat with Devotion.</p>
          ) : (
            <div style={s.themeList}>
              {pulse.themes.slice(0, 6).map(t => (
                <div key={t.theme} style={s.themeRow}>
                  <div style={s.themeLabel}>
                    <span style={s.themeName}>{t.theme}</span>
                    <span style={s.themeTrend}>
                      {t.trend === "up" ? "↑" : t.trend === "down" ? "↓" : t.trend === "new" ? "✦" : "—"}
                    </span>
                  </div>
                  <div style={s.themeBarBg}>
                    <div style={{ ...s.themeBarFill, width: `${Math.min(t.percentage, 100)}%` }} />
                  </div>
                  <span style={s.themePct}>{t.percentage}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Insight card */}
      <div style={{ ...s.card, marginBottom: 24 }}>
        <div style={s.insightHeader}>
          <div>
            <h3 style={s.cardTitle}>AI Pastoral Insight</h3>
            <p style={s.cardSubtitle}>Weekly analysis of your congregation's spiritual needs</p>
          </div>
          {!pulse?.insight && (
            <button
              style={s.generateBtn}
              onClick={handleGenerateInsight}
              disabled={generatingInsight}
            >
              {generatingInsight ? "Generating..." : "Generate Insight"}
            </button>
          )}
        </div>
        {pulse?.insight ? (
          <div style={s.insightBody}>
            <div style={s.insightIcon}>✝</div>
            <p style={s.insightText}>{pulse.insight.text}</p>
            {pulse.insight.generated_at && (
              <p style={s.insightDate}>
                Generated {new Date(pulse.insight.generated_at).toLocaleDateString()}
              </p>
            )}
          </div>
        ) : !generatingInsight ? (
          <p style={s.noData}>
            Click "Generate Insight" to get an AI-powered analysis of what your congregation needs this week.
          </p>
        ) : null}
      </div>

      {/* Needs Attention */}
      {attention && (attention.declining?.length > 0 || attention.inactive?.length > 0 || attention.new_members?.length > 0 || attention.milestones?.length > 0) && (
        <div style={{ ...s.card, marginBottom: 24 }}>
          <h3 style={s.cardTitle}>Needs Attention</h3>
          <p style={s.cardSubtitle}>Members who may need pastoral outreach</p>
          <div style={s.attentionGrid}>
            {attention.declining?.length > 0 && (
              <AttentionGroup
                label="Declining"
                color="#e67e22"
                members={attention.declining}
              />
            )}
            {attention.inactive?.length > 0 && (
              <AttentionGroup
                label="Inactive"
                color="#e74c3c"
                members={attention.inactive}
              />
            )}
            {attention.new_members?.length > 0 && (
              <AttentionGroup
                label="New Members"
                color="#2ecc71"
                members={attention.new_members}
              />
            )}
            {attention.milestones?.length > 0 && (
              <AttentionGroup
                label="Streak Milestones"
                color={COLORS.gold}
                members={attention.milestones.map(m => ({ ...m, display_name: `${m.display_name} — ${m.milestone} day streak!` }))}
              />
            )}
          </div>
        </div>
      )}

      {/* Quick actions + Invite code */}
      <div style={s.twoCol}>
        <div style={s.card}>
          <h3 style={s.cardTitle}>Quick Actions</h3>
          <div style={s.actions}>
            <button style={s.actionBtn} onClick={() => navigate("/portal/sermons")}>
              + Create Sermon Study
            </button>
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

        {church.invite_code && (
          <div style={s.card}>
            <h3 style={s.cardTitle}>Invite Code</h3>
            <div style={s.inviteCard}>
              <div style={s.inviteCode}>{church.invite_code}</div>
              <button
                style={s.copyBtn}
                onClick={() => navigator.clipboard.writeText(church.invite_code)}
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
    </div>
  );
}


// ─── SparkCard Component ──────────────────────────────────

function SparkCard({ label, value, prevValue, sparkData = [] }) {
  const trend = prevValue != null && typeof value === "number"
    ? value > prevValue ? "up" : value < prevValue ? "down" : "flat"
    : null;

  // Mini sparkline
  const maxVal = Math.max(...sparkData, 1);
  const points = sparkData.map((v, i) => {
    const x = sparkData.length > 1 ? (i / (sparkData.length - 1)) * 80 : 40;
    const y = 24 - (v / maxVal) * 20;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div style={s.sparkCard}>
      <div style={s.sparkTop}>
        <div style={s.sparkValue}>{value}</div>
        {trend && (
          <span style={{ ...s.sparkTrend, color: trend === "up" ? "#2ecc71" : trend === "down" ? "#e74c3c" : COLORS.textMuted }}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "—"}
          </span>
        )}
      </div>
      {sparkData.length > 1 && (
        <svg width="80" height="28" style={{ marginBottom: 6, opacity: 0.6 }}>
          <polyline
            points={points}
            fill="none"
            stroke={COLORS.gold}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <div style={s.sparkLabel}>{label}</div>
    </div>
  );
}


// ─── AttentionGroup Component ─────────────────────────────

function AttentionGroup({ label, color, members }) {
  return (
    <div style={s.attentionGroup}>
      <div style={s.attentionLabel}>
        <span style={{ ...s.attentionDot, background: color }} />
        <span>{label}</span>
        <span style={s.attentionCount}>{members.length}</span>
      </div>
      {members.slice(0, 5).map((m, i) => (
        <div key={m.id || i} style={s.attentionMember}>
          <span style={s.attentionName}>{m.display_name || "Anonymous"}</span>
          {m.last_active_at && (
            <span style={s.attentionDate}>
              Last active {new Date(m.last_active_at).toLocaleDateString()}
            </span>
          )}
        </div>
      ))}
      {members.length > 5 && (
        <p style={s.attentionMore}>+ {members.length - 5} more</p>
      )}
    </div>
  );
}


// ─── Styles ───────────────────────────────────────────────

const s = {
  page: {
    padding: "32px 40px",
    maxWidth: 1100,
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

  // Stats grid
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    marginBottom: 28,
  },

  // Spark cards
  sparkCard: {
    padding: "22px 20px 18px",
    borderRadius: 16,
    background: COLORS.bgCard,
    border: `1px solid ${COLORS.border}`,
    display: "flex",
    flexDirection: "column",
  },
  sparkTop: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 4,
  },
  sparkValue: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 32,
    fontWeight: 400,
    color: COLORS.text,
    lineHeight: 1,
  },
  sparkTrend: {
    fontSize: 16,
    fontWeight: 700,
  },
  sparkLabel: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.textMuted,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },

  // Two column layout
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
    marginBottom: 24,
  },

  // Cards
  card: {
    padding: "24px",
    borderRadius: 16,
    background: COLORS.bgCard,
    border: `1px solid ${COLORS.border}`,
  },
  cardTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 20,
    fontWeight: 500,
    color: COLORS.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 20,
  },
  noData: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 13,
    color: COLORS.textDim,
    fontStyle: "italic",
    lineHeight: 1.6,
  },

  // Bar chart
  chartArea: {
    height: 180,
    display: "flex",
    alignItems: "flex-end",
  },
  barChart: {
    display: "flex",
    alignItems: "flex-end",
    gap: 3,
    width: "100%",
    height: "100%",
  },
  barCol: {
    flex: 1,
    height: "100%",
    display: "flex",
    alignItems: "flex-end",
    cursor: "default",
  },
  bar: {
    width: "100%",
    borderRadius: "3px 3px 0 0",
    minHeight: 2,
    transition: "height 0.3s ease",
  },

  // Theme list (Spiritual Pulse)
  themeList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  themeRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  themeLabel: {
    width: 120,
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  themeName: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    color: COLORS.text,
  },
  themeTrend: {
    fontSize: 12,
    color: COLORS.gold,
  },
  themeBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    background: `${COLORS.gold}15`,
    overflow: "hidden",
  },
  themeBarFill: {
    height: "100%",
    borderRadius: 4,
    background: `linear-gradient(to right, ${COLORS.gold}, ${COLORS.goldLight})`,
    transition: "width 0.4s ease",
  },
  themePct: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    color: COLORS.textMuted,
    width: 40,
    textAlign: "right",
    flexShrink: 0,
  },

  // AI Insight
  insightHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  generateBtn: {
    padding: "8px 18px",
    borderRadius: 8,
    border: `1px solid ${COLORS.borderHover}`,
    background: COLORS.goldDim,
    color: COLORS.gold,
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  insightBody: {
    padding: "18px 20px",
    borderRadius: 12,
    background: `${COLORS.gold}08`,
    border: `1px solid ${COLORS.gold}20`,
    position: "relative",
  },
  insightIcon: {
    position: "absolute",
    top: 14,
    right: 16,
    fontSize: 20,
    color: `${COLORS.gold}40`,
  },
  insightText: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 1.7,
    paddingRight: 30,
  },
  insightDate: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 11,
    color: COLORS.textDim,
    marginTop: 10,
  },

  // Attention
  attentionGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
  },
  attentionGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  attentionLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.text,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 4,
  },
  attentionDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
  },
  attentionCount: {
    fontWeight: 400,
    color: COLORS.textMuted,
  },
  attentionMember: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: 8,
    background: `${COLORS.gold}06`,
    border: `1px solid ${COLORS.border}`,
  },
  attentionName: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 13,
    color: COLORS.text,
  },
  attentionDate: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 11,
    color: COLORS.textDim,
  },
  attentionMore: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: "italic",
    paddingLeft: 12,
  },

  // Quick actions
  actions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  actionBtn: {
    padding: "10px 18px",
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
    padding: "14px 18px",
    borderRadius: 12,
    background: `${COLORS.gold}08`,
    border: `1px solid ${COLORS.borderHover}`,
    marginBottom: 8,
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
    fontSize: 12,
    color: COLORS.textDim,
    marginTop: 4,
  },
};
