import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { get, post } from "../api";
import StatCard from "../components/dashboard/StatCard";
import PastoralInsight from "../components/dashboard/PastoralInsight";
import SpiritualPulse from "../components/dashboard/SpiritualPulse";
import MemberHealth from "../components/dashboard/MemberHealth";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import SectionLabel from "../components/ui/SectionLabel";
import Avatar from "../components/ui/Avatar";

export default function DashboardPage() {
  const { church, churchLoading, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pulse, setPulse] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [attention, setAttention] = useState(null);
  const [events, setEvents] = useState([]);
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [milestones, setMilestones] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (!church?.id) return;
    get(`/api/churches/${church.id}/members/count`).then(d => setMemberCount(d?.count || 0)).catch(() => {});
    get(`/api/churches/${church.id}/milestones`).then(d => setMilestones(d?.milestones || [])).catch(() => {});
    get(`/api/churches/${church.id}/members`).then(d => setMembers(d?.members || [])).catch(() => {});
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
        <div style={{ width: 28, height: 28, border: "2px solid #3d6b44", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!church) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "#9e9888" }}>No church found. Please complete signup.</p>
      </div>
    );
  }

  // Computed values
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const activeCount = members.filter(m => m.last_active_at && new Date(m.last_active_at) > weekAgo).length;
  const completionRate = engagement?.sermon_completion_rate != null ? `${engagement.sermon_completion_rate}%` : "0%";
  const totalMembers = stats?.member_count ?? memberCount;
  const membersWithStreak = members.filter(m => (m.current_streak || 0) > 0);
  const avgStreak = membersWithStreak.length > 0
    ? (membersWithStreak.reduce((sum, m) => sum + (m.current_streak || 0), 0) / membersWithStreak.length).toFixed(1)
    : "0";
  const hasCurrentSermon = engagement?.current_sermon?.title && engagement.current_sermon.title !== "Weekly Sermon";
  const themes = pulse?.themes || [];

  // Attention items for "Needs Attention"
  const attentionDots = [];
  if (attention?.declining?.length > 0) {
    attentionDots.push({ color: "#d4a03c", text: `${attention.declining.length} members inactive 7+ days` });
  }
  if (prayers.filter(p => p.prayer_count === 0).length > 0) {
    attentionDots.push({ color: "#c26a4a", text: `${prayers.filter(p => p.prayer_count === 0).length} unanswered prayer${prayers.filter(p => p.prayer_count === 0).length > 1 ? "s" : ""}` });
  }

  // Member health counts from actual member data
  const healthCounts = members.reduce((acc, m) => {
    const status = m.activity_status || "new";
    if (status === "thriving") acc.thriving++;
    else if (status === "active") acc.active++;
    else if (status === "declining" || status === "inactive") acc.declining++;
    else acc.new++;
    return acc;
  }, { thriving: 0, active: 0, declining: 0, new: 0 });

  // Week date range
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekRange = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div style={{ padding: "24px 32px 48px" }}>
      {/* Quick Actions */}
      <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
        <Button primary onClick={() => navigate("/portal/sermons")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add Sermon
        </Button>
        <Button onClick={() => navigate("/portal/announcements")}>Post Announcement</Button>
        <Button onClick={() => navigate("/portal/devotionals")}>Write Devotional</Button>
        <Button onClick={() => navigate("/portal/announcements")} style={{ color: "#b05a3a", borderColor: "#e0c4b8" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
          Send Broadcast
        </Button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="Active This Week" value={activeCount} change={stats?.active_change} up={true} sub={`${stats?.active_pct ?? 0}% of members`} color="#3d6b44" />
        <StatCard label="Sermon Completion" value={completionRate} change={engagement?.completion_change} up={true} sub="vs. last week" color="#8b6914" />
        <StatCard label="Total Members" value={totalMembers} change={stats?.member_change} up={true} sub={`${stats?.new_members_this_month ?? 0} new this month`} color="#5a7d9a" />
        <StatCard label="Avg. Streak" value={avgStreak} sub="days" color="#b05a3a" />
      </div>

      {/* Main two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Pastoral Insight */}
          <PastoralInsight
            insightText={pulse?.insight?.text}
            generating={generatingInsight}
            onGenerate={handleGenerateInsight}
          />

          {/* This Week Panel */}
          <Card noPad>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #ece7dd", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#2c2a25", fontFamily: "'DM Serif Display', serif", margin: 0 }}>
                This Week at {church?.name || "Church"}
              </h3>
              <span style={{ fontSize: 13, color: "#9e9888" }}>{weekRange}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #ece7dd" }}>
              {/* Sermon */}
              <div style={{ padding: 20, borderRight: "1px solid #ece7dd" }}>
                <SectionLabel>This Week's Sermon</SectionLabel>
                {hasCurrentSermon ? (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{engagement.current_sermon.title}</div>
                    {engagement.current_sermon.scripture_refs && (
                      <div style={{ fontSize: 12, color: "#9e9888", marginBottom: 10 }}>{engagement.current_sermon.scripture_refs}</div>
                    )}
                    <Badge variant="published">Published</Badge>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: "#9e9888" }}>No sermon this week</div>
                )}
              </div>

              {/* Needs Attention */}
              <div style={{ padding: 20, borderRight: "1px solid #ece7dd" }}>
                <SectionLabel>Needs Attention</SectionLabel>
                {attentionDots.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#9e9888" }}>Everyone is active</div>
                ) : (
                  attentionDots.map((n, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: n.color, boxShadow: `0 0 0 3px ${n.color}22` }} />
                      <span style={{ fontSize: 13, color: "#5a5647" }}>{n.text}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Upcoming */}
              <div style={{ padding: 20 }}>
                <SectionLabel right="View All" onRightClick={() => navigate("/portal/events")}>Upcoming</SectionLabel>
                {events.length === 0 ? (
                  <div style={{ padding: 14, borderRadius: 10, background: "linear-gradient(135deg, #faf6ee, #f5efe3)", border: "1px dashed #e0dbd1", textAlign: "center" }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>📅</div>
                    <div style={{ fontSize: 12, color: "#b0a998", marginBottom: 8 }}>No upcoming events</div>
                    <button onClick={() => navigate("/portal/events")} style={{ fontSize: 12, color: "#8b6914", background: "none", border: "none", cursor: "pointer", fontWeight: 600, textDecoration: "underline", fontFamily: "inherit" }}>+ Create Event</button>
                  </div>
                ) : (
                  events.slice(0, 2).map((e, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 4, borderRadius: 2, background: "#3d6b44" }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{e.title}</div>
                        <div style={{ fontSize: 11, color: "#9e9888" }}>
                          {e.event_date ? new Date(e.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                          {e.time ? ` at ${e.time}` : ""}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Milestones */}
            <div style={{ padding: 20 }}>
              <SectionLabel>Milestones This Month</SectionLabel>
              {milestones.length === 0 ? (
                <div style={{ fontSize: 13, color: "#9e9888" }}>No member milestones this month</div>
              ) : (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {milestones.slice(0, 4).map((m, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px", borderRadius: 10,
                      background: "#faf6ee", border: "1px solid #ece7dd",
                      flex: "1 1 180px",
                    }}>
                      <span style={{ fontSize: 20 }}>🏅</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{m.display_name || "Member"}</div>
                        <div style={{ fontSize: 11, color: "#9e9888" }}>{m.milestone_type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Spiritual Pulse + Recent Prayers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <SpiritualPulse themes={themes} totalMessages={pulse?.total_messages_this_week || 0} />

            <Card>
              <SectionLabel right="View All" onRightClick={() => navigate("/portal/prayers")}>Recent Prayers</SectionLabel>
              {prayers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#9e9888", fontSize: 13 }}>No prayer requests yet</div>
              ) : (
                prayers.slice(0, 3).map((p, i) => (
                  <div key={i} style={{ padding: "10px 0", borderBottom: i < 2 ? "1px solid #f0ebe3" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{p.is_anonymous ? "Anonymous" : (p.display_name || "Member")}</span>
                      <Badge
                        color={p.type === "praise" ? "#8b6914" : "#5a5647"}
                        bg={p.type === "praise" ? "#faf3e0" : "#f0ebe3"}
                      >
                        {p.type === "praise" ? "Praise" : "Prayer"}
                      </Badge>
                    </div>
                    <div style={{ fontSize: 12, color: "#5a5647", lineHeight: 1.4, marginBottom: 4 }}>
                      {(p.text || p.content || "").slice(0, 100)}{(p.text || p.content || "").length > 100 ? "..." : ""}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, color: "#b0a998" }}>
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : ""}
                      </span>
                      <span style={{ fontSize: 11, color: "#8b6914" }}>🙏 {p.prayer_count || 0}</span>
                    </div>
                  </div>
                ))
              )}
            </Card>
          </div>
        </div>

        {/* Right column (360px) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Member Health */}
          <MemberHealth
            counts={healthCounts}
            total={totalMembers}
            attention={attention}
            onViewAll={() => navigate("/portal/members")}
          />

          {/* Content This Week */}
          <Card>
            <SectionLabel>Content This Week</SectionLabel>
            {[
              hasCurrentSermon && { type: "Sermon", title: engagement.current_sermon.title, status: "Published", color: "#3d6b44", bg: "#e8f0e9" },
            ].filter(Boolean).map((ct, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f0ebe3" }}>
                <div style={{ width: 4, height: 36, borderRadius: 2, background: ct.color }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#9e9888", textTransform: "uppercase", letterSpacing: "0.04em" }}>{ct.type}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ct.title}</div>
                </div>
                <Badge color={ct.color} bg={ct.bg}>{ct.status}</Badge>
              </div>
            ))}
            {!hasCurrentSermon && (
              <div style={{ fontSize: 13, color: "#9e9888", padding: "12px 0" }}>No content published this week</div>
            )}
          </Card>

          {/* Church Invite Code */}
          <div style={{ background: "linear-gradient(135deg, #faf6ee, #f5efe3)", borderRadius: 14, border: "1px solid #e0dbd1", padding: 20 }}>
            <SectionLabel>Church Invite Code</SectionLabel>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", borderRadius: 8,
              background: "#2c2a25", color: "#e2c87a",
              fontFamily: "'DM Sans', monospace", fontSize: 15,
              fontWeight: 600, letterSpacing: "0.06em",
            }}>
              {church?.invite_code || "---"}
              <button
                onClick={() => { if (church?.invite_code) navigator.clipboard.writeText(church.invite_code); }}
                style={{
                  padding: "4px 10px", borderRadius: 5,
                  background: "rgba(200,168,85,0.15)",
                  border: "1px solid rgba(200,168,85,0.3)",
                  color: "#e2c87a", fontSize: 11, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Copy
              </button>
            </div>
            <div style={{ fontSize: 12, color: "#9e9888", marginTop: 8 }}>Share with members to join in the app</div>
          </div>
        </div>
      </div>
    </div>
  );
}
