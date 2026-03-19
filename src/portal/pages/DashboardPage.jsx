import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useChurchColors } from "../useChurchColors";
import { useAuth } from "../AuthContext";
import { get, post } from "../api";

export default function DashboardPage() {
  const { church, churchLoading, user } = useAuth();
  const navigate = useNavigate();
  const C = useChurchColors();
  const [stats, setStats] = useState(null);
  const [pulse, setPulse] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [attention, setAttention] = useState(null);
  const [events, setEvents] = useState([]);
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [checklistDismissed, setChecklistDismissed] = useState(
    () => localStorage.getItem("onboarding_checklist_dismissed") === "true"
  );
  const [memberCount, setMemberCount] = useState(0);
  const [showPhonePreview, setShowPhonePreview] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(null);

  useEffect(() => {
    if (!church?.id) return;
    get(`/api/churches/${church.id}/members/count`).then(d => setMemberCount(d?.count || 0)).catch(() => {});
  }, [church?.id]);

  useEffect(() => {
    if (churchLoading) return;
    if (!church?.id) { setLoading(false); return; }

    async function fetchData(retryCount = 0) {
      const base = `/api/churches/${church.id}`;
      try {
        const [s, p, e, a, ev, pr] = await Promise.all([
          get(`${base}/analytics`).catch(() => null),
          get(`${base}/analytics/pulse`).catch(() => null),
          get(`${base}/analytics/engagement`).catch(() => null),
          get(`${base}/analytics/attention`).catch(() => null),
          get(`${base}/events`).catch(() => null),
          get(`${base}/prayer-wall`).catch(() => null),
        ]);
        setStats(s);
        setPulse(p);
        setEngagement(e);
        setAttention(a);
        setEvents(ev?.events || []);
        setPrayers((pr?.prayers || []).filter(x => !x.hidden));
        if (!s && !p && !e && !a && retryCount < 2) {
          await new Promise((r) => setTimeout(r, 2000));
          return fetchData(retryCount + 1);
        }
      } catch {} finally { setLoading(false); }
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

  if (churchLoading) {
    return (
      <div style={{ padding: 60, display: "flex", justifyContent: "center" }}>
        <div style={{ width: 28, height: 28, border: `2px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!church) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <p style={{ fontSize: 14, color: C.muted }}>No church found. Please complete signup.</p>
      </div>
    );
  }

  const userName = user?.email?.split("@")[0] || "Pastor";
  const churchInitial = (church?.name || "C")[0].toUpperCase();
  const hasCurrentSermon = engagement?.current_sermon?.title && engagement.current_sermon.title !== "Weekly Sermon";

  // Checklist logic
  const hasSermons = hasCurrentSermon || (stats?.total_sermons > 0);
  const hasAnnouncements = stats?.total_announcements > 0;
  const hasBranding = church?.accent_color && church.accent_color !== "#c9a84c" && church.accent_color !== "#3D6B5E";
  const hasMembers = memberCount >= 2;
  const checklistItems = [
    { label: "Create your church", sub: "Done!", done: true },
    { label: "Set up branding", sub: hasBranding ? `${church.theme || "Custom"} theme active` : "Choose your church colors", done: !!hasBranding },
    { label: "Create your first sermon study", sub: "Paste a video link or enter manually", done: !!hasSermons, action: "Create Sermon", nav: "/portal/sermons" },
    { label: "Share your invite code", sub: church?.invite_code || "Generate in settings", done: hasMembers, action: "Copy Code" },
    { label: "Welcome your first 5 members", sub: `${memberCount} of 5 members joined`, done: memberCount >= 5, action: "Share Invite" },
  ];
  const completedCount = checklistItems.filter(i => i.done).length;
  const allDone = completedCount === checklistItems.length;
  function dismissChecklist() {
    localStorage.setItem("onboarding_checklist_dismissed", "true");
    setChecklistDismissed(true);
  }

  // Attention items
  const attentionItems = [];
  if (attention?.declining?.length > 0) {
    attention.declining.slice(0, 2).forEach(m => {
      attentionItems.push({ name: m.display_name || "Member", issue: "Engagement declining", status: "declining" });
    });
  }
  if (attention?.inactive?.length > 0) {
    attention.inactive.slice(0, 2).forEach(m => {
      attentionItems.push({ name: m.display_name || "Member", issue: `Inactive ${m.days_inactive || "?"} days`, status: "new" });
    });
  }

  // Themes
  const themes = pulse?.themes || [];

  // Stat values
  const activeCount = stats?.active_this_week ?? engagement?.active_this_week ?? 0;
  const completionRate = engagement?.sermon_completion_rate != null ? `${engagement.sermon_completion_rate}%` : "0%";
  const totalMembers = stats?.member_count ?? memberCount;
  const avgStreak = engagement?.avg_session_length || "0";

  // Sermon days
  const sermonDays = engagement?.sermon_daily || [];

  const statusColor = (s) => s === "thriving" ? C.green : s === "active" ? C.accent : s === "declining" ? C.amber : s === "new" ? C.purple : C.muted;
  const statusBg = (s) => s === "thriving" ? C.greenBg : s === "active" ? C.accentLight : s === "declining" ? C.amberBg : s === "new" ? C.purpleBg : C.bg;

  return (
    <div style={{ padding: "32px 40px" }}>
      {/* ─── Church Hero Banner ─── */}
      <div style={{
        margin: "-32px -40px 28px", borderRadius: "0 0 20px 20px", overflow: "hidden",
        position: "relative", height: 180,
        background: church?.banner_url
          ? `url(${church.banner_url}) center/cover`
          : `linear-gradient(135deg, ${C.accent}18 0%, rgba(201,168,76,0.12) 40%, ${C.bgDeep} 100%)`,
      }}>
        <div style={{ position: "absolute", top: -40, right: 60, width: 300, height: 300, background: `radial-gradient(circle, rgba(201,168,76,0.22) 0%, transparent 60%)`, borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: -60, left: 100, width: 250, height: 250, background: `radial-gradient(circle, ${C.accent}18 0%, transparent 60%)`, borderRadius: "50%" }} />
        <div style={{ position: "absolute", top: 20, right: 30, fontSize: 200, opacity: 0.035, color: C.gold, fontFamily: "serif" }}>✝</div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 40px", background: "linear-gradient(transparent 0%, rgba(247,244,239,0.8) 60%, rgba(247,244,239,0.95) 100%)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {church?.logo_url ? (
                <img src={church.logo_url} alt="" style={{ width: 56, height: 56, borderRadius: 16, objectFit: "cover", boxShadow: `0 4px 16px ${C.accent}30`, border: "3px solid #fff" }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 16, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#fff", boxShadow: `0 4px 16px ${C.accent}30`, border: "3px solid #fff" }}>{churchInitial}</div>
              )}
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, color: C.text, fontFamily: "var(--heading)" }}>{church?.name || "Dashboard"}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                  <span style={{ padding: "2px 10px", borderRadius: 6, background: C.accent, color: "#fff", fontSize: 10, fontWeight: 700 }}>Shepherd Plan</span>
                  <span style={{ fontSize: 12, color: C.sec }}>{totalMembers} members{church?.city ? ` · ${church.city}` : ""}</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowEmailPreview(true)} style={{
                padding: "8px 14px", borderRadius: 10, border: `1.5px solid ${C.accent}30`,
                background: `${C.card}ee`, color: C.accent, fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "var(--body)", display: "flex", alignItems: "center", gap: 6,
              }}>📧 Email Digest</button>
              <button onClick={() => setShowPhonePreview(true)} style={{
                padding: "8px 14px", borderRadius: 10, border: `1.5px solid ${C.accent}30`,
                background: `${C.card}ee`, color: C.accent, fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "var(--body)", display: "flex", alignItems: "center", gap: 6,
              }}>📱 Preview as Member</button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Welcome Message ─── */}
      {!checklistDismissed && (
        <div style={{ padding: "16px 20px", borderRadius: 14, marginBottom: 16, background: `linear-gradient(135deg, ${C.accentLight} 0%, ${C.goldBg} 100%)`, border: `1px solid ${C.accent}15`, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 28 }}>👋</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Welcome to Devotion, Pastor</div>
            <div style={{ fontSize: 13, color: C.sec, lineHeight: 1.5, marginTop: 2 }}>We're honored to help you care for your congregation. Complete the steps below to get started.</div>
          </div>
        </div>
      )}

      {/* ─── Getting Started Checklist ─── */}
      {!checklistDismissed && !allDone && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.03)", marginBottom: 28, position: "relative" }}>
          <button onClick={dismissChecklist} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 18, color: C.muted, cursor: "pointer" }}>✕</button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.text, fontFamily: "var(--heading)" }}>Getting Started</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 120, height: 8, borderRadius: 4, background: C.bgDeep }}><div style={{ width: `${(completedCount / checklistItems.length) * 100}%`, height: "100%", borderRadius: 4, background: C.accent }} /></div>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>{completedCount}/{checklistItems.length}</span>
            </div>
          </div>
          {checklistItems.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderTop: i > 0 ? `1px solid ${C.borderLight}` : "none", opacity: step.done ? 0.55 : 1 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: step.done ? C.accent : C.card, border: step.done ? "none" : `2px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: step.done ? "#fff" : C.muted, fontSize: 12, fontWeight: 700 }}>{step.done ? "✓" : i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text, textDecoration: step.done ? "line-through" : "none" }}>{step.label}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{step.sub}</div>
              </div>
              {step.action && !step.done && (
                <button onClick={() => { if (step.nav) navigate(step.nav); else if (step.action === "Copy Code" && church?.invite_code) navigator.clipboard.writeText(church.invite_code); }} style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--body)", boxShadow: `0 4px 12px ${C.accent}25` }}>{step.action}</button>
              )}
            </div>
          ))}
        </div>
      )}
      {!checklistDismissed && allDone && (
        <div style={{ background: C.card, border: `1px solid ${C.accent}20`, borderRadius: 16, padding: "16px 24px", marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 15, color: C.text }}>🎉 You're all set! Your church is live on Devotion.</span>
          <button onClick={dismissChecklist} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 18, padding: 4 }}>✕</button>
        </div>
      )}

      {/* ─── Quick Actions ─── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
        <button onClick={() => navigate("/portal/sermons")} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--body)", boxShadow: `0 4px 12px ${C.accent}25` }}>📖 + This Week's Sermon</button>
        <button onClick={() => navigate("/portal/announcements")} style={{ padding: "10px 20px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.card, color: C.body, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--body)" }}>📢 Post Announcement</button>
        <button style={{ padding: "10px 20px", borderRadius: 10, border: `1.5px solid ${C.amber}40`, background: C.amberBg, color: C.amber, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--body)" }}>📣 Send Broadcast</button>
      </div>

      {/* ─── Stats Grid ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Active This Week", value: activeCount, sub: `${stats?.active_pct ?? "—"}% of members`, trend: stats?.active_change || "", color: C.green },
          { label: "Sermon Completion", value: completionRate, sub: engagement?.sermon_change || "", trend: engagement?.completion_change || "", color: C.accent },
          { label: "Total Members", value: totalMembers, sub: `${stats?.new_members_this_month ?? 0} new this month`, trend: stats?.member_change || "", color: C.purple },
          { label: "Avg. Streak", value: avgStreak, sub: "days", trend: "", color: C.gold },
        ].map((stat, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>{stat.label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: C.text, fontFamily: "var(--heading)" }}>{stat.value}</span>
              {stat.trend && <span style={{ fontSize: 12, fontWeight: 700, color: stat.color, background: stat.color + "15", padding: "2px 8px", borderRadius: 6 }}>↑ {stat.trend}</span>}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* ─── Pastoral Insight ─── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.accent}08 0%, ${C.goldBg} 100%)`,
        border: `1px solid ${C.accent}20`, borderRadius: 16, padding: "20px 24px", marginBottom: 28,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 12, flex: 1 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>✨</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Pastoral Insight</div>
              <div style={{ fontSize: 12, color: C.sec, marginTop: 2 }}>A summary of your congregation's spiritual health this week</div>
              {pulse?.insight?.text && (
                <div style={{ marginTop: 12, fontSize: 13, color: C.body, lineHeight: 1.7, padding: "14px 16px", borderRadius: 12, background: `${C.card}cc` }}>
                  {pulse.insight.text}
                </div>
              )}
            </div>
          </div>
          <button onClick={handleGenerateInsight} style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--body)", boxShadow: `0 4px 12px ${C.accent}25`, flexShrink: 0, marginLeft: 12 }}>
            {generatingInsight ? "Generating..." : pulse?.insight?.text ? "Regenerate" : "Generate Insight"}
          </button>
        </div>
      </div>

      {/* ─── Weekly Summary ─── */}
      <div style={{ background: `linear-gradient(135deg, ${C.card} 0%, ${C.cardWarm} 100%)`, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.03)", marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>THIS WEEK AT {(church?.name || "CHURCH").toUpperCase()}</div>
        </div>
        <div style={{ fontSize: 14, color: C.body, lineHeight: 1.7 }}>
          <strong style={{ color: C.green }}>{activeCount} members</strong> were active this week.{" "}
          {hasCurrentSermon && <><strong style={{ color: C.accent }}>{engagement?.sermon_finished_count || 0} members</strong> completed the sermon study on <em>{engagement?.current_sermon?.title}</em>. </>}
          <strong style={{ color: C.purple }}>{stats?.new_members_this_month ?? 0} new members</strong> joined.{" "}
          <strong style={{ color: C.amber }}>{prayers.length} prayer requests</strong> were shared by the congregation.
          {attentionItems.length > 0 && <span style={{ color: C.sec }}> {attentionItems[0].name}'s engagement dropped this week. Consider reaching out.</span>}
        </div>
      </div>

      {/* ─── Three-Column: Sermon + Attention + Events ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 28 }}>
        {/* Sermon Progress */}
        <div style={{ background: `linear-gradient(135deg, ${C.card} 0%, ${C.cardWarm} 100%)`, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>THIS WEEK'S SERMON</div>
            <span onClick={() => navigate("/portal/sermons")} style={{ fontSize: 12, color: C.accent, fontWeight: 600, cursor: "pointer" }}>Manage →</span>
          </div>
          {hasCurrentSermon ? (
            <>
              <div style={{ borderLeft: `3px solid ${C.accent}`, paddingLeft: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: "var(--heading)" }}>{engagement.current_sermon.title}</div>
                {engagement.current_sermon.scripture_refs && <div style={{ fontSize: 11, color: C.sec, marginTop: 4 }}>{engagement.current_sermon.scripture_refs}</div>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1, padding: 8, borderRadius: 8, background: C.accentLight, textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>{completionRate}</div><div style={{ fontSize: 9, color: C.sec }}>Complete</div>
                </div>
                <div style={{ flex: 1, padding: 8, borderRadius: 8, background: C.greenBg, textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.green }}>{engagement?.sermon_finished_count || 0}</div><div style={{ fontSize: 9, color: C.sec }}>Finished</div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0", color: C.sec, fontSize: 13 }}>No sermon this week</div>
          )}
        </div>

        {/* Needs Attention */}
        <div style={{ background: `linear-gradient(135deg, ${C.card} 0%, ${C.cardWarm} 100%)`, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>NEEDS ATTENTION</div>
          {attentionItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: C.sec, fontSize: 13 }}>Everyone is active</div>
          ) : (
            attentionItems.slice(0, 3).map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: statusBg(m.status), borderRadius: 10, marginBottom: 8, border: `1px solid ${statusColor(m.status)}20` }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: statusColor(m.status) + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: statusColor(m.status) }}>{m.name.split(" ").map(n => n[0]).join("")}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: C.sec }}>{m.issue}</div>
                </div>
                <button onClick={() => setShowMessageModal(m.name)} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${statusColor(m.status)}30`, background: "transparent", color: statusColor(m.status), fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "var(--body)" }}>✉️ Note</button>
              </div>
            ))
          )}
        </div>

        {/* Upcoming Events */}
        <div style={{ background: `linear-gradient(135deg, ${C.card} 0%, ${C.cardWarm} 100%)`, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>UPCOMING</div>
            <span onClick={() => navigate("/portal/events")} style={{ fontSize: 12, color: C.accent, fontWeight: 600, cursor: "pointer" }}>View All →</span>
          </div>
          {events.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: C.sec, fontSize: 13 }}>No upcoming events</div>
          ) : (
            events.slice(0, 3).map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < Math.min(events.length, 3) - 1 ? `1px solid ${C.borderLight}` : "none" }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📅</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{e.title}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{e.event_date ? new Date(e.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}{e.location ? ` · ${e.location}` : ""}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Two-Column: Spiritual Pulse + Recent Prayers ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
        {/* Spiritual Pulse */}
        <div style={{ background: `linear-gradient(135deg, ${C.card} 0%, ${C.cardWarm} 100%)`, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>SPIRITUAL PULSE</div>
            <div style={{ fontSize: 12, color: C.sec, marginTop: 2 }}>Themes from congregation conversations</div>
          </div>
          {themes.length === 0 ? (
            <p style={{ fontSize: 13, color: C.muted, fontStyle: "italic", lineHeight: 1.6, marginTop: 16 }}>
              Not enough conversation data yet. Themes will appear as your members use Devotion.
            </p>
          ) : (
            <div style={{ marginTop: 16 }}>
              {themes.slice(0, 5).map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 100, fontSize: 12, color: C.body, fontWeight: 500 }}>{t.theme}</div>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, background: C.bgDeep }}><div style={{ width: `${Math.min(t.percentage, 100)}%`, height: "100%", borderRadius: 4, background: i === 0 ? C.accent : C.sec, transition: "width 1s ease" }} /></div>
                  <div style={{ width: 35, fontSize: 12, fontWeight: 700, color: C.sec, textAlign: "right" }}>{t.percentage}%</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Prayers */}
        <div style={{ background: `linear-gradient(135deg, ${C.card} 0%, ${C.cardWarm} 100%)`, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>RECENT PRAYERS</div>
            <span onClick={() => navigate("/portal/prayers")} style={{ fontSize: 12, color: C.accent, fontWeight: 600, cursor: "pointer" }}>View All →</span>
          </div>
          {prayers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: C.sec, fontSize: 13 }}>No prayer requests yet</div>
          ) : (
            prayers.slice(0, 3).map((p, i) => (
              <div key={i} style={{ padding: "10px 0", borderBottom: i < Math.min(prayers.length, 3) - 1 ? `1px solid ${C.borderLight}` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.is_anonymous ? "Anonymous" : (p.display_name || "Member")}</span>
                  <span style={{ fontSize: 11, color: C.muted }}>{p.created_at ? new Date(p.created_at).toLocaleDateString() : ""}</span>
                </div>
                <div style={{ fontSize: 12, color: C.sec, lineHeight: 1.5 }}>{(p.text || p.content || "").slice(0, 120)}{(p.text || p.content || "").length > 120 ? "..." : ""}</div>
                <div style={{ fontSize: 11, color: C.accent, marginTop: 4 }}>🙏 {p.prayer_count || 0} praying</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Activity Log ─── */}
      <div style={{ background: `linear-gradient(135deg, ${C.card} 0%, ${C.cardWarm} 100%)`, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.03)", marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>RECENT ACTIVITY</div>
        {(() => {
          const log = [];
          prayers.slice(0, 2).forEach(p => log.push({ action: "Prayer request submitted", detail: p.is_anonymous ? "Anonymous" : (p.display_name || "Member"), time: p.created_at, icon: "🙏", color: C.accent }));
          if (hasCurrentSermon) log.push({ action: "Sermon published", detail: engagement.current_sermon.title, time: "", icon: "📖", color: C.accent });
          if (log.length === 0) return <div style={{ textAlign: "center", padding: "20px 0", color: C.sec, fontSize: 13 }}>No recent activity</div>;
          return log.slice(0, 6).map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < log.length - 1 ? `1px solid ${C.borderLight}` : "none" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: a.color + "12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{a.icon}</div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{a.action}</span>
                <span style={{ fontSize: 12, color: C.sec, marginLeft: 6 }}>{a.detail}</span>
              </div>
              <span style={{ fontSize: 11, color: C.muted }}>{a.time ? new Date(a.time).toLocaleDateString() : ""}</span>
            </div>
          ));
        })()}
      </div>

      {/* ─── Invite Code Banner ─── */}
      {church.invite_code && (
        <div style={{ background: `linear-gradient(135deg, ${C.accent}08 0%, ${C.goldBg} 100%)`, border: `1px solid ${C.accent}15`, borderRadius: 16, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>INVITE CODE</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: "var(--heading)", letterSpacing: 3, marginTop: 4 }}>{church.invite_code}</div>
          </div>
          <button onClick={() => navigator.clipboard.writeText(church.invite_code)} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--body)", boxShadow: `0 4px 12px ${C.accent}25` }}>Copy Code</button>
        </div>
      )}
    </div>
  );
}
