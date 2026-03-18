import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS } from "../../colors";
import { useAuth } from "../AuthContext";
import { get, post } from "../api";

export default function DashboardPage() {
  const { church, churchLoading, user } = useAuth();
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

    async function fetchData(retryCount = 0) {
      const base = `/api/churches/${church.id}`;
      try {
        const [s, p, e, a] = await Promise.all([
          get(`${base}/analytics`).catch(() => null),
          get(`${base}/analytics/pulse`).catch(() => null),
          get(`${base}/analytics/engagement`).catch(() => null),
          get(`${base}/analytics/attention`).catch(() => null),
        ]);
        setStats(s);
        setPulse(p);
        setEngagement(e);
        setAttention(a);

        // If all returned null (membership not propagated yet), retry once
        if (!s && !p && !e && !a && retryCount < 2) {
          await new Promise((r) => setTimeout(r, 2000));
          return fetchData(retryCount + 1);
        }
      } catch {
        // Silent fail — dashboard will show empty state
      } finally {
        setLoading(false);
      }
    }
    fetchData();
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
  const userName = user?.email?.split("@")[0] || "Pastor";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Sermon data from engagement
  const sermonTitle = engagement?.current_sermon?.title || "Weekly Sermon";
  const sermonWeek = engagement?.current_sermon?.week || "";
  const weeklySermonData = engagement?.sermon_daily || [
    { day: "Mon", reflections: 0, opens: 0 },
    { day: "Tue", reflections: 0, opens: 0 },
    { day: "Wed", reflections: 0, opens: 0 },
    { day: "Thu", reflections: 0, opens: 0 },
    { day: "Fri", reflections: 0, opens: 0 },
    { day: "Sat", reflections: 0, opens: 0 },
    { day: "Sun", reflections: 0, opens: 0 },
  ];
  const maxSermon = Math.max(...weeklySermonData.map(d => Math.max(d.reflections || 0, d.opens || 0)), 1);

  // Theme data
  const themes = pulse?.themes || [];
  const themeColors = [COLORS.amber, COLORS.accent, COLORS.red, COLORS.accentMid, COLORS.green];

  // Attention items
  const attentionItems = [];
  if (attention?.inactive?.length > 0) {
    const m = attention.inactive[0];
    attentionItems.push({
      icon: "💛",
      name: m.display_name || "Member",
      detail: `Inactive ${m.days_inactive || "?"} days · Was active regularly`,
      action: "Reach Out",
      color: COLORS.amber,
    });
  }
  if (attention?.declining?.length > 0) {
    const m = attention.declining[0];
    attentionItems.push({
      icon: "💛",
      name: m.display_name || "Member",
      detail: "Engagement declining",
      action: "Reach Out",
      color: COLORS.amber,
    });
  }
  const totalInactive = (attention?.inactive?.length || 0) + (attention?.declining?.length || 0);
  if (totalInactive > 2) {
    attentionItems.push({
      icon: "⚠️",
      name: `${totalInactive - 2} members`,
      detail: "Haven't opened the app this week",
      action: "View List",
      color: COLORS.red,
    });
  }

  // Members for table
  const members = attention?.all_members || [];

  const churchInitial = (church?.name || "C")[0].toUpperCase();

  // ─── Getting Started Checklist ─────────────────────────
  const [checklistDismissed, setChecklistDismissed] = useState(
    () => localStorage.getItem("onboarding_checklist_dismissed") === "true"
  );
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    if (!church?.id) return;
    get(`/api/churches/${church.id}/members/count`).then((d) => {
      setMemberCount(d?.count || 0);
    }).catch(() => {});
  }, [church?.id]);

  const hasSermons = (engagement?.current_sermon?.title && engagement.current_sermon.title !== "Weekly Sermon") || (stats?.total_sermons > 0);
  const hasAnnouncements = stats?.total_announcements > 0;
  const hasBranding = church?.accent_color && church.accent_color !== "#c9a84c";
  const hasMembers = memberCount >= 2;

  const checklistItems = [
    { label: "Create your church", done: true },
    { label: "Set up branding", done: !!hasBranding, action: () => navigate("/portal/settings") },
    { label: "Create your first sermon study", done: !!hasSermons, action: () => navigate("/portal/sermons") },
    { label: "Share invite code with congregation", done: hasMembers, action: () => navigate("/portal/settings") },
    { label: "Post your first announcement", done: !!hasAnnouncements, action: () => navigate("/portal/announcements") },
  ];
  const completedCount = checklistItems.filter((i) => i.done).length;
  const allDone = completedCount === checklistItems.length;

  function dismissChecklist() {
    localStorage.setItem("onboarding_checklist_dismissed", "true");
    setChecklistDismissed(true);
  }

  return (
    <div style={s.page}>
      {/* Church branding */}
      <div style={s.churchBrand}>
        <div style={s.churchBrandIcon}>{churchInitial}</div>
        <div>
          <div style={s.churchBrandName}>{church?.name || "Church Portal"}</div>
          <div style={s.churchBrandPlan}>Shepherd Plan</div>
        </div>
      </div>

      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.greeting}>{greeting}, {userName}</div>
          <div style={s.title}>Church Overview</div>
        </div>
        <div style={s.headerActions}>
          <button style={s.outlineBtn}>This Week ▾</button>
          <button style={s.accentBtn} onClick={() => navigate("/portal/sermons")}>
            + Update Sermon
          </button>
        </div>
      </div>

      {/* Getting Started Checklist */}
      {!checklistDismissed && !allDone && (
        <div style={s.checklistCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: COLORS.text }}>
                Getting Started
              </span>
              <span style={{ fontSize: 13, color: COLORS.textMuted, marginLeft: 12 }}>
                {completedCount} of {checklistItems.length} complete
              </span>
            </div>
            <button onClick={dismissChecklist} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 18, padding: 4 }}>
              ✕
            </button>
          </div>
          <div style={{ height: 3, borderRadius: 2, background: "rgba(201,168,76,0.15)", marginBottom: 16 }}>
            <div style={{ height: "100%", borderRadius: 2, background: COLORS.gold, width: `${(completedCount / checklistItems.length) * 100}%`, transition: "width 0.4s ease" }} />
          </div>
          {checklistItems.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 0",
                borderBottom: i < checklistItems.length - 1 ? `1px solid rgba(201,168,76,0.08)` : "none",
                cursor: item.action && !item.done ? "pointer" : "default",
                opacity: item.done ? 0.6 : 1,
              }}
              onClick={() => { if (item.action && !item.done) item.action(); }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: item.done ? COLORS.gold : "transparent",
                border: item.done ? "none" : `2px solid rgba(201,168,76,0.3)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {item.done && <span style={{ color: "#0a0e1a", fontSize: 12, fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: COLORS.text,
                textDecoration: item.done ? "line-through" : "none",
              }}>
                {item.label}
              </span>
              {!item.done && item.action && (
                <span style={{ marginLeft: "auto", fontSize: 12, color: COLORS.gold, fontWeight: 600 }}>
                  Do it →
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {!checklistDismissed && allDone && (
        <div style={s.checklistCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: COLORS.text }}>
              🎉 You're all set! Your church is live on Devotion.
            </span>
            <button onClick={dismissChecklist} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 18, padding: 4 }}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div style={s.statsGrid}>
        {[
          { label: "Total Members", value: stats?.member_count ?? 0, change: `${stats?.new_members_this_month ?? 0} this month`, dir: "up" },
          { label: "Active This Week", value: stats?.active_this_week ?? engagement?.active_this_week ?? 0, change: `${stats?.active_pct ?? "—"}% of members`, dir: "up" },
          { label: "Sermon Engagement", value: engagement?.sermon_completion_rate != null ? `${engagement.sermon_completion_rate}%` : "—", change: engagement?.sermon_change || "", dir: "up" },
          { label: "Avg. Session Length", value: engagement?.avg_session_length || "—", change: engagement?.session_change || "", dir: "up" },
        ].map((stat, i) => (
          <div key={i} style={s.statCard}>
            <div style={s.statLabel}>{stat.label}</div>
            <div style={s.statValue}>{stat.value}</div>
            {stat.change && (
              <div style={{ fontSize: 12, fontWeight: 600, color: stat.dir === "up" ? COLORS.green : COLORS.red }}>
                {stat.dir === "up" ? "↑ " : "↓ "}{stat.change}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Two Column: Sermon Chart + Spiritual Pulse */}
      <div style={s.twoColWide}>
        {/* Sermon Engagement Chart */}
        <div style={s.card}>
          <div style={s.cardHeaderRow}>
            <div>
              <div style={s.cardTitle}>Sermon Engagement</div>
              <div style={s.cardSubtitle}>{sermonTitle}{sermonWeek ? ` · ${sermonWeek}` : ""}</div>
            </div>
            <div style={s.legendRow}>
              <div style={s.legendItem}>
                <div style={{ ...s.legendDot, background: COLORS.accent }} />
                Reflections
              </div>
              <div style={s.legendItem}>
                <div style={{ ...s.legendDot, background: COLORS.accentMid }} />
                App Opens
              </div>
            </div>
          </div>

          {/* Bar chart */}
          <div style={s.barChart}>
            {weeklySermonData.map((d, i) => (
              <div key={i} style={s.barGroup}>
                <div style={s.barPair}>
                  <div style={{
                    flex: 1,
                    height: (d.opens || 0) > 0 ? `${((d.opens || 0) / maxSermon) * 100}%` : 4,
                    borderRadius: 5,
                    background: (d.opens || 0) > 0 ? COLORS.accentMid : COLORS.border,
                    minHeight: 4,
                    transition: "height 0.4s ease",
                  }} />
                  <div style={{
                    flex: 1,
                    height: (d.reflections || 0) > 0 ? `${((d.reflections || 0) / maxSermon) * 100}%` : 4,
                    borderRadius: 5,
                    background: (d.reflections || 0) > 0 ? COLORS.accent : COLORS.border,
                    minHeight: 4,
                    transition: "height 0.4s ease",
                  }} />
                </div>
                <div style={s.barLabel}>{d.day}</div>
              </div>
            ))}
          </div>

          {/* Scripture engagement */}
          {engagement?.scripture_engagement && engagement.scripture_engagement.length > 0 && (
            <div style={s.scriptureSection}>
              <div style={s.scriptureSectionTitle}>Scripture Engagement</div>
              <div style={s.scriptureRow}>
                {engagement.scripture_engagement.slice(0, 3).map((sc, i) => (
                  <div key={i} style={s.scripturePill}>
                    <div style={s.scriptureCount}>{sc.reads}</div>
                    <div style={s.scriptureRef}>{sc.ref}</div>
                    <div style={s.scripturePct}>{sc.pct} of members</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Spiritual Pulse */}
        <div style={s.card}>
          <div style={s.cardTitle}>Spiritual Pulse</div>
          <div style={{ ...s.cardSubtitle, marginBottom: 20 }}>Themes from congregation conversations</div>

          {themes.length === 0 ? (
            <p style={s.noData}>Not enough conversation data yet. Themes will appear as your members chat with Devotion.</p>
          ) : (
            themes.slice(0, 5).map((t, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={s.themeHeaderRow}>
                  <span style={s.themeName}>{t.theme}</span>
                  <div style={s.themeStats}>
                    <span style={s.themePct}>{t.percentage}%</span>
                    {t.change != null && (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: t.trend === "up" && t.theme === "Anxiety" ? COLORS.red
                          : t.trend === "up" ? COLORS.green
                          : COLORS.textMuted,
                      }}>
                        {t.trend === "up" ? "+" : t.trend === "down" ? "" : ""}{t.change ?? ""}
                      </span>
                    )}
                  </div>
                </div>
                <div style={s.themeBarBg}>
                  <div style={{
                    width: `${Math.min(t.percentage, 100)}%`,
                    height: "100%",
                    borderRadius: 3,
                    background: themeColors[i % themeColors.length],
                    transition: "width 0.5s ease",
                  }} />
                </div>
              </div>
            ))
          )}

          {/* AI Insight */}
          {pulse?.insight ? (
            <div style={s.insightCard}>
              <div style={s.insightRow}>
                <span style={{ fontSize: 16 }}>💡</span>
                <div>
                  <div style={s.insightTitle}>AI Insight</div>
                  <div style={s.insightText}>{pulse.insight.text}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={s.insightCard}>
              <div style={s.insightRow}>
                <span style={{ fontSize: 16 }}>💡</span>
                <div style={{ flex: 1 }}>
                  <div style={s.insightTitle}>AI Insight</div>
                  <div style={s.insightText}>
                    {generatingInsight ? "Generating insight..." : "Click to generate an AI-powered insight based on your congregation's conversations."}
                  </div>
                </div>
                {!generatingInsight && !pulse?.insight && (
                  <button style={s.insightBtn} onClick={handleGenerateInsight}>Generate</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two Column: Needs Attention + Active Journeys */}
      <div style={s.twoCol}>
        {/* Needs Attention */}
        <div style={s.card}>
          <div style={s.cardTitle}>Needs Attention</div>
          <div style={{ height: 16 }} />
          {attentionItems.length === 0 ? (
            <p style={s.noData}>All members are active! No one needs outreach right now.</p>
          ) : (
            attentionItems.map((a, i) => (
              <div key={i} style={{
                ...s.attentionRow,
                borderBottom: i < attentionItems.length - 1 ? `1px solid ${COLORS.border}` : "none",
              }}>
                <div style={{ ...s.attentionIcon, background: `${a.color}12` }}>{a.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={s.attentionName}>{a.name}</div>
                  <div style={s.attentionDetail}>{a.detail}</div>
                </div>
                <button style={s.attentionBtn}>{a.action}</button>
              </div>
            ))
          )}
        </div>

        {/* Active Journeys / Quick Actions */}
        <div style={s.card}>
          <div style={s.cardHeaderRow}>
            <div style={s.cardTitle}>Quick Actions</div>
          </div>
          <div style={{ height: 8 }} />
          {[
            { label: "+ Create Sermon Study", path: "/portal/sermons" },
            { label: "+ Create Event", path: "/portal/events" },
            { label: "+ Post Announcement", path: "/portal/announcements" },
            { label: "+ Write Devotional", path: "/portal/devotionals" },
          ].map((action, i) => (
            <div key={i} style={{
              padding: "14px 0",
              borderBottom: i < 3 ? `1px solid ${COLORS.border}` : "none",
            }}>
              <button
                onClick={() => navigate(action.path)}
                style={s.quickActionBtn}
              >
                {action.label}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Code */}
      {church.invite_code && (
        <div style={{ ...s.card, marginBottom: 24 }}>
          <div style={s.cardHeaderRow}>
            <div>
              <div style={s.cardTitle}>Invite Code</div>
              <div style={s.cardSubtitle}>Share this code with your congregation to join in the Devotion app</div>
            </div>
          </div>
          <div style={s.inviteRow}>
            <div style={s.inviteCode}>{church.invite_code}</div>
            <button
              style={s.copyBtn}
              onClick={() => navigator.clipboard.writeText(church.invite_code)}
            >
              Copy Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Styles ───────────────────────────────────────────────

const s = {
  page: {
    padding: "28px 36px",
    maxWidth: 1200,
  },
  checklistCard: {
    background: COLORS.bgCard,
    border: `1px solid rgba(201, 168, 76, 0.15)`,
    borderRadius: 16,
    padding: "20px 24px",
    marginBottom: 24,
  },
  loading: {
    padding: 60,
    display: "flex",
    justifyContent: "center",
  },
  spinner: {
    width: 28,
    height: 28,
    border: `2px solid ${COLORS.accent}`,
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  empty: {
    padding: 60,
    textAlign: "center",
  },
  emptyText: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: COLORS.textMuted,
  },

  // Church branding
  churchBrand: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 24,
  },
  churchBrandIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: COLORS.accent,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
  },
  churchBrandName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 18,
    fontWeight: 700,
    color: COLORS.text,
  },
  churchBrandPlan: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  // Header
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  greeting: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 28,
    fontWeight: 700,
    color: COLORS.text,
  },
  headerActions: {
    display: "flex",
    gap: 10,
  },
  outlineBtn: {
    padding: "10px 20px",
    borderRadius: 10,
    border: `1.5px solid ${COLORS.border}`,
    background: COLORS.card,
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.textBody,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
  accentBtn: {
    padding: "10px 20px",
    borderRadius: 10,
    border: "none",
    background: COLORS.accent,
    fontSize: 13,
    fontWeight: 700,
    color: "#fff",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },

  // Stats
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 14,
    marginBottom: 24,
  },
  statCard: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 14,
    padding: "18px 20px",
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: 500,
    marginBottom: 8,
  },
  statValue: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 30,
    fontWeight: 700,
    marginBottom: 4,
    color: COLORS.text,
  },

  // Two column layouts
  twoColWide: {
    display: "grid",
    gridTemplateColumns: "1.6fr 1fr",
    gap: 20,
    marginBottom: 24,
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
    marginBottom: 24,
  },

  // Cards
  card: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 16,
    padding: "22px 24px",
  },
  cardHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: COLORS.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  noData: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: "italic",
    lineHeight: 1.6,
  },

  // Legend
  legendRow: {
    display: "flex",
    gap: 12,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
  },

  // Bar chart
  barChart: {
    display: "flex",
    gap: 12,
    alignItems: "flex-end",
    height: 160,
    marginBottom: 8,
    marginTop: 20,
  },
  barGroup: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100%",
  },
  barPair: {
    flex: 1,
    display: "flex",
    alignItems: "flex-end",
    gap: 3,
    width: "100%",
  },
  barLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.textMuted,
    marginTop: 8,
  },

  // Scripture engagement
  scriptureSection: {
    borderTop: `1px solid ${COLORS.border}`,
    paddingTop: 16,
    marginTop: 8,
  },
  scriptureSectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: COLORS.textSec,
    marginBottom: 10,
  },
  scriptureRow: {
    display: "flex",
    gap: 10,
  },
  scripturePill: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 10,
    background: COLORS.accentLight,
    textAlign: "center",
  },
  scriptureCount: {
    fontSize: 18,
    fontWeight: 700,
    color: COLORS.accent,
  },
  scriptureRef: {
    fontSize: 10,
    color: COLORS.textSec,
    marginTop: 2,
  },
  scripturePct: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  // Spiritual Pulse themes
  themeHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  themeName: {
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.textBody,
  },
  themeStats: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  themePct: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.text,
  },
  themeBarBg: {
    height: 6,
    borderRadius: 3,
    background: COLORS.sand,
  },

  // AI Insight
  insightCard: {
    marginTop: 16,
    padding: "14px 16px",
    borderRadius: 12,
    background: `${COLORS.amber}10`,
    border: `1px solid ${COLORS.amber}25`,
  },
  insightRow: {
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.text,
    marginBottom: 3,
  },
  insightText: {
    fontSize: 12,
    color: COLORS.textSec,
    lineHeight: 1.5,
  },
  insightBtn: {
    padding: "6px 14px",
    borderRadius: 8,
    border: `1.5px solid ${COLORS.border}`,
    background: COLORS.card,
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.textBody,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },

  // Attention
  attentionRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 0",
  },
  attentionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    flexShrink: 0,
  },
  attentionName: {
    fontSize: 13,
    fontWeight: 700,
    color: COLORS.text,
  },
  attentionDetail: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  attentionBtn: {
    padding: "6px 14px",
    borderRadius: 8,
    border: `1.5px solid ${COLORS.border}`,
    background: COLORS.card,
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.textBody,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    whiteSpace: "nowrap",
  },

  // Quick actions
  quickActionBtn: {
    background: "none",
    border: "none",
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.accent,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    padding: 0,
  },

  // Invite
  inviteRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginTop: 16,
    padding: "14px 18px",
    borderRadius: 12,
    background: COLORS.accentLight,
    border: `1px solid ${COLORS.accentMid}`,
  },
  inviteCode: {
    fontFamily: "'Playfair Display', serif",
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
    background: COLORS.accent,
    color: "#fff",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
};
