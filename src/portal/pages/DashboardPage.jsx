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
        <p style={{ fontSize: 14, color: C.textMuted }}>No church found. Please complete signup.</p>
      </div>
    );
  }

  const userName = user?.email?.split("@")[0] || "Pastor";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const hasCurrentSermon = engagement?.current_sermon?.title && engagement.current_sermon.title !== "Weekly Sermon";

  // Sermon completion dots
  const sermonDays = engagement?.sermon_daily || [
    { day: "Mon" }, { day: "Tue" }, { day: "Wed" }, { day: "Thu" }, { day: "Fri" }, { day: "Sat" }, { day: "Sun" },
  ];

  // Themes
  const themes = pulse?.themes || [];

  // Attention
  const attentionItems = [];
  if (attention?.inactive?.length > 0) {
    attention.inactive.slice(0, 2).forEach(m => {
      attentionItems.push({ name: m.display_name || "Member", detail: `Inactive ${m.days_inactive || "?"} days`, action: "Reach Out" });
    });
  }
  if (attention?.declining?.length > 0) {
    attention.declining.slice(0, 2).forEach(m => {
      attentionItems.push({ name: m.display_name || "Member", detail: "Engagement declining", action: "Reach Out" });
    });
  }

  // Checklist
  const [checklistDismissed, setChecklistDismissed] = useState(
    () => localStorage.getItem("onboarding_checklist_dismissed") === "true"
  );
  const [memberCount, setMemberCount] = useState(0);
  useEffect(() => {
    if (!church?.id) return;
    get(`/api/churches/${church.id}/members/count`).then(d => setMemberCount(d?.count || 0)).catch(() => {});
  }, [church?.id]);

  const hasSermons = hasCurrentSermon || (stats?.total_sermons > 0);
  const hasAnnouncements = stats?.total_announcements > 0;
  const hasBranding = church?.accent_color && church.accent_color !== "#c9a84c" && church.accent_color !== "#3D6B5E";
  const hasMembers = memberCount >= 2;
  const checklistItems = [
    { label: "Create your church", done: true },
    { label: "Set up branding", done: !!hasBranding, action: () => navigate("/portal/settings") },
    { label: "Create your first sermon study", done: !!hasSermons, action: () => navigate("/portal/sermons") },
    { label: "Share invite code", done: hasMembers, action: () => navigate("/portal/settings") },
    { label: "Post an announcement", done: !!hasAnnouncements, action: () => navigate("/portal/announcements") },
  ];
  const completedCount = checklistItems.filter(i => i.done).length;
  const allDone = completedCount === checklistItems.length;
  function dismissChecklist() {
    localStorage.setItem("onboarding_checklist_dismissed", "true");
    setChecklistDismissed(true);
  }

  return (
    <div style={{ padding: "28px 36px", maxWidth: 1200 }}>
      {/* Greeting + Quick Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 4 }}>{greeting}, {userName}</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: C.text }}>
            {church?.name || "Dashboard"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => navigate("/portal/sermons")}
            style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: C.accent, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
          >
            + This Week's Sermon
          </button>
          <button
            onClick={() => navigate("/portal/announcements")}
            style={{ padding: "10px 20px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.card, fontSize: 13, fontWeight: 600, color: C.textBody, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
          >
            Post Announcement
          </button>
        </div>
      </div>

      {/* Weekly Snapshot — 4 stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Active This Week", value: stats?.active_this_week ?? engagement?.active_this_week ?? "—", sub: `${stats?.active_pct ?? "—"}% of members` },
          { label: "Sermon Completion", value: engagement?.sermon_completion_rate != null ? `${engagement.sermon_completion_rate}%` : "—", sub: engagement?.sermon_change || "" },
          { label: "Total Members", value: stats?.member_count ?? memberCount, sub: `${stats?.new_members_this_month ?? 0} new this month` },
          { label: "Avg. Streak", value: engagement?.avg_session_length || "—", sub: "" },
        ].map((stat, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 500, marginBottom: 8 }}>{stat.label}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 4 }}>{stat.value}</div>
            {stat.sub && <div style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>↑ {stat.sub}</div>}
          </div>
        ))}
      </div>

      {/* This Week's Sermon (hero card) */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px 28px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
            This Week's Sermon
          </div>
          <button
            onClick={() => navigate("/portal/sermons")}
            style={{ fontSize: 12, color: C.accent, fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
          >
            {hasCurrentSermon ? "Edit →" : "Create →"}
          </button>
        </div>

        {hasCurrentSermon ? (
          <>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 6 }}>
              {engagement.current_sermon.title}
            </div>
            {engagement.current_sermon.scripture_refs && (
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {engagement.current_sermon.scripture_refs.split(",").slice(0, 3).map((ref, i) => (
                  <span key={i} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: `${C.secondary}18`, color: C.secondary, fontWeight: 600 }}>
                    {ref.trim()}
                  </span>
                ))}
              </div>
            )}
            {/* 7-day completion dots */}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {sermonDays.map((d, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: (d.reflections || 0) > 0 ? C.accent : C.sand,
                    border: `2px solid ${(d.reflections || 0) > 0 ? C.accent : C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, color: (d.reflections || 0) > 0 ? "#fff" : C.textMuted,
                  }}>
                    {(d.reflections || 0) > 0 ? "✓" : ""}
                  </div>
                  <div style={{ fontSize: 9, color: C.textMuted, marginTop: 4, fontWeight: 600 }}>{d.day}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ fontSize: 14, color: C.textMuted, marginBottom: 12 }}>No sermon set up for this week yet.</p>
            <button
              onClick={() => navigate("/portal/sermons")}
              style={{ padding: "12px 28px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
            >
              + Add This Week's Sermon
            </button>
          </div>
        )}
      </div>

      {/* Two Column: Spiritual Pulse + Needs Attention */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Spiritual Pulse */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "22px 24px" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>Spiritual Pulse</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 20 }}>Themes from congregation conversations</div>

          {themes.length === 0 ? (
            <p style={{ fontSize: 13, color: C.textMuted, fontStyle: "italic", lineHeight: 1.6 }}>
              Not enough conversation data yet. Themes will appear as your members use Devotion.
            </p>
          ) : (
            themes.slice(0, 5).map((t, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.textBody }}>{t.theme}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{t.percentage}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: C.sand }}>
                  <div style={{ width: `${Math.min(t.percentage, 100)}%`, height: "100%", borderRadius: 3, background: i === 0 ? C.accent : C.secondary, opacity: i === 0 ? 1 : 0.7, transition: "width 0.5s ease" }} />
                </div>
              </div>
            ))
          )}

          {/* AI Insight */}
          <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 12, background: `${C.secondary}10`, border: `1px solid ${C.secondary}25` }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16 }}>💡</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 3 }}>Pastoral Insight</div>
                <div style={{ fontSize: 12, color: C.textSec, lineHeight: 1.5 }}>
                  {pulse?.insight?.text || (generatingInsight ? "Generating insight..." : "Generate an insight based on your congregation's conversations.")}
                </div>
              </div>
              {!pulse?.insight && !generatingInsight && (
                <button onClick={handleGenerateInsight} style={{ padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.card, fontSize: 11, fontWeight: 700, color: C.textBody, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap", flexShrink: 0 }}>
                  Generate
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Needs Attention */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "22px 24px" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>Needs Attention</div>

          {attentionItems.length === 0 ? (
            <p style={{ fontSize: 13, color: C.textMuted, fontStyle: "italic", lineHeight: 1.6 }}>
              All members are active. No one needs outreach right now.
            </p>
          ) : (
            attentionItems.slice(0, 4).map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < attentionItems.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.secondary}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>💛</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>{a.detail}</div>
                </div>
                <button style={{ padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.card, fontSize: 11, fontWeight: 700, color: C.textBody, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  {a.action}
                </button>
              </div>
            ))
          )}

          {/* Quick Actions below attention */}
          <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 16, paddingTop: 16 }}>
            <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Quick Actions</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                { label: "Sermon", path: "/portal/sermons" },
                { label: "Event", path: "/portal/events" },
                { label: "Announcement", path: "/portal/announcements" },
                { label: "Members", path: "/portal/members" },
              ].map((a, i) => (
                <button key={i} onClick={() => navigate(a.path)} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, fontSize: 12, fontWeight: 600, color: C.accent, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  + {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Code */}
      {church.invite_code && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "22px 24px", marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>Invite Code</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>Share with your congregation to join in the Devotion app</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", borderRadius: 12, background: `${C.accent}10`, border: `1px solid ${C.accent}30` }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: C.text, letterSpacing: "0.1em", flex: 1 }}>
              {church.invite_code}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(church.invite_code)}
              style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Getting Started Checklist (at bottom for new churches) */}
      {!checklistDismissed && !allDone && (
        <div style={{ background: C.card, border: `1px solid ${C.accent}20`, borderRadius: 16, padding: "20px 24px", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: C.text }}>Getting Started</span>
              <span style={{ fontSize: 13, color: C.textMuted, marginLeft: 12 }}>{completedCount} of {checklistItems.length}</span>
            </div>
            <button onClick={dismissChecklist} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 18, padding: 4 }}>✕</button>
          </div>
          <div style={{ height: 3, borderRadius: 2, background: `${C.accent}15`, marginBottom: 16 }}>
            <div style={{ height: "100%", borderRadius: 2, background: C.accent, width: `${(completedCount / checklistItems.length) * 100}%`, transition: "width 0.4s ease" }} />
          </div>
          {checklistItems.map((item, i) => (
            <div
              key={i}
              onClick={() => { if (item.action && !item.done) item.action(); }}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < checklistItems.length - 1 ? `1px solid ${C.accent}08` : "none", cursor: item.action && !item.done ? "pointer" : "default", opacity: item.done ? 0.6 : 1 }}
            >
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: item.done ? C.accent : "transparent", border: item.done ? "none" : `2px solid ${C.accent}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {item.done && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ fontSize: 14, color: C.text, textDecoration: item.done ? "line-through" : "none" }}>{item.label}</span>
              {!item.done && item.action && <span style={{ marginLeft: "auto", fontSize: 12, color: C.accent, fontWeight: 600 }}>Do it →</span>}
            </div>
          ))}
        </div>
      )}
      {!checklistDismissed && allDone && (
        <div style={{ background: C.card, border: `1px solid ${C.accent}20`, borderRadius: 16, padding: "16px 24px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 15, color: C.text }}>🎉 You're all set! Your church is live on Devotion.</span>
          <button onClick={dismissChecklist} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 18, padding: 4 }}>✕</button>
        </div>
      )}
    </div>
  );
}
