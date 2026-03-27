import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { get } from "../api";

/**
 * Realistic iPhone mockup showing how members see the church in the Devotion app.
 * Fetches real data (sermon, prayers, announcements) so the preview is always current.
 */

export default function PhonePreviewModal({ onClose }) {
  const { church } = useAuth();
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    if (!church?.id) return;
    async function load() {
      const base = `/api/churches/${church.id}`;
      const [sermon, prayers, announcements, events] = await Promise.all([
        get(`${base}/sermons/current`).catch(() => null),
        get(`${base}/prayer-wall`).catch(() => null),
        get(`${base}/announcements`).catch(() => null),
        get(`${base}/events`).catch(() => null),
      ]);
      setData({
        sermon: sermon?.sermon || null,
        reflections: sermon?.reflections || [],
        prayers: (prayers?.prayers || []).filter(p => !p.hidden).slice(0, 3),
        announcements: (announcements?.announcements || []).slice(0, 2),
        events: (events?.events || []).slice(0, 2),
      });
    }
    load();
  }, [church?.id]);

  const accent = church?.accent_color || "#C9A84C";
  const churchName = church?.name || "Church";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const timeStr = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <div style={s.overlay} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={s.phoneFrame}>
        {/* iPhone frame */}
        <div style={s.phoneInner}>
          {/* Status bar */}
          <div style={s.statusBar}>
            <span style={{ fontSize: 11, fontWeight: 600 }}>{timeStr}</span>
            <div style={s.dynamicIsland} />
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {/* Signal */}
              <svg width="14" height="10" viewBox="0 0 14 10"><rect x="0" y="6" width="2" height="4" rx="0.5" fill="#fff" /><rect x="3" y="4" width="2" height="6" rx="0.5" fill="#fff" /><rect x="6" y="2" width="2" height="8" rx="0.5" fill="#fff" /><rect x="9" y="0" width="2" height="10" rx="0.5" fill="#fff" /></svg>
              {/* Battery */}
              <svg width="22" height="10" viewBox="0 0 22 10"><rect x="0" y="1" width="18" height="8" rx="1.5" stroke="#fff" strokeWidth="1" fill="none" /><rect x="1.5" y="2.5" width="14" height="5" rx="0.5" fill="#4ADE80" /><rect x="19" y="3" width="2" height="4" rx="0.5" fill="#fff" /></svg>
            </div>
          </div>

          {/* App header */}
          <div style={s.appHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {church?.logo_url ? (
                <img src={church.logo_url} alt="" style={{ width: 28, height: 28, borderRadius: 8, objectFit: "cover" }} />
              ) : (
                <div style={{ width: 28, height: 28, borderRadius: 8, background: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                  {churchName[0]}
                </div>
              )}
              <span style={{ fontSize: 15, fontWeight: 700, color: "#E8D5A3", fontFamily: "serif" }}>{churchName}</span>
            </div>
          </div>

          {/* Scrollable content */}
          <div style={s.content}>
            {activeTab === "home" && (
              <>
                {/* Greeting */}
                <div style={{ padding: "16px 0 8px" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#E8D5A3", fontFamily: "serif" }}>{greeting}</div>
                  <div style={{ fontSize: 11, color: "#8899AA", marginTop: 2 }}>Welcome to {churchName}</div>
                </div>

                {/* Verse of the week */}
                {church?.verse_of_week && (
                  <div style={{ ...s.card, borderLeft: `3px solid ${accent}`, background: "rgba(201,168,76,0.08)" }}>
                    <div style={{ fontSize: 10, color: "#8899AA", fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>VERSE OF THE WEEK</div>
                    <div style={{ fontSize: 11, color: "#C8D0DA", lineHeight: 1.5, fontStyle: "italic" }}>
                      "{church.verse_of_week}"
                    </div>
                    {church.verse_of_week_ref && (
                      <div style={{ fontSize: 10, color: accent, marginTop: 4 }}>{church.verse_of_week_ref}</div>
                    )}
                  </div>
                )}

                {/* Current sermon */}
                {data?.sermon && (
                  <div style={s.card}>
                    <div style={{ fontSize: 10, color: "#8899AA", fontWeight: 600, letterSpacing: 1, marginBottom: 6 }}>THIS WEEK'S SERMON</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#E0DDD5", fontFamily: "serif" }}>{data.sermon.title}</div>
                    {data.sermon.scripture_refs && (
                      <div style={{ fontSize: 10, color: accent, marginTop: 3 }}>{data.sermon.scripture_refs}</div>
                    )}
                    <div style={{ marginTop: 10, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)" }}>
                      <div style={{ height: "100%", borderRadius: 2, background: accent, width: "30%" }} />
                    </div>
                    <div style={{ fontSize: 9, color: "#8899AA", marginTop: 4 }}>Day 2 of 7</div>
                    <div style={{ marginTop: 8, padding: "8px 0", borderRadius: 8, background: accent, textAlign: "center", color: "#0D1F35", fontSize: 11, fontWeight: 700 }}>
                      Open Today's Reflection
                    </div>
                  </div>
                )}

                {/* Announcements */}
                {data?.announcements?.length > 0 && (
                  <div style={s.card}>
                    <div style={{ fontSize: 10, color: "#8899AA", fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>ANNOUNCEMENTS</div>
                    {data.announcements.map((a, i) => (
                      <div key={i} style={{ marginBottom: i < data.announcements.length - 1 ? 10 : 0, paddingBottom: i < data.announcements.length - 1 ? 10 : 0, borderBottom: i < data.announcements.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#E0DDD5" }}>{a.title}</div>
                        <div style={{ fontSize: 10, color: "#8899AA", lineHeight: 1.4, marginTop: 2 }}>
                          {(a.body || "").slice(0, 60)}{(a.body || "").length > 60 ? "..." : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upcoming events */}
                {data?.events?.length > 0 && (
                  <div style={s.card}>
                    <div style={{ fontSize: 10, color: "#8899AA", fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>UPCOMING</div>
                    {data.events.map((e, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 3, borderRadius: 2, background: accent, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#E0DDD5" }}>{e.title}</div>
                          <div style={{ fontSize: 9, color: "#8899AA" }}>
                            {e.event_date ? new Date(e.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                            {e.location ? ` \u00b7 ${e.location}` : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "prayer" && (
              <>
                <div style={{ padding: "16px 0 8px" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#E8D5A3", fontFamily: "serif" }}>Prayer Wall</div>
                </div>
                {data?.prayers?.length > 0 ? data.prayers.map((p, i) => (
                  <div key={i} style={s.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#E0DDD5" }}>
                        {p.is_anonymous ? "Anonymous" : (p.display_name || "Member")}
                      </span>
                      <span style={{ fontSize: 9, color: "#8899AA" }}>{p.type === "praise" ? "Praise" : "Prayer"}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#A0AABB", lineHeight: 1.5 }}>
                      {(p.text || p.content || "").slice(0, 80)}{(p.text || "").length > 80 ? "..." : ""}
                    </div>
                    <div style={{ fontSize: 9, color: accent, marginTop: 6 }}>
                      {"\uD83D\uDE4F"} {p.prayer_count || 0} praying
                    </div>
                  </div>
                )) : (
                  <div style={{ ...s.card, textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#8899AA" }}>No prayer requests yet</div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bottom navigation */}
          <div style={s.bottomNav}>
            {[
              { id: "home", icon: "\uD83C\uDFE0", label: "Home" },
              { id: "sermon", icon: "\uD83D\uDCD6", label: "Sermon" },
              { id: "prayer", icon: "\uD83D\uDE4F", label: "Prayer" },
              { id: "journeys", icon: "\uD83D\uDDFA\uFE0F", label: "Journeys" },
              { id: "settings", icon: "\u2699\uFE0F", label: "Settings" },
            ].map((tab) => (
              <div
                key={tab.id}
                onClick={() => { if (tab.id === "home" || tab.id === "prayer") setActiveTab(tab.id); }}
                style={{
                  textAlign: "center",
                  cursor: tab.id === "home" || tab.id === "prayer" ? "pointer" : "default",
                  opacity: activeTab === tab.id ? 1 : 0.4,
                }}
              >
                <div style={{ fontSize: 16 }}>{tab.icon}</div>
                <div style={{
                  fontSize: 8, fontWeight: 600, marginTop: 1,
                  color: activeTab === tab.id ? accent : "#8899AA",
                }}>{tab.label}</div>
              </div>
            ))}
          </div>

          {/* Home indicator */}
          <div style={{ display: "flex", justifyContent: "center", paddingBottom: 6, paddingTop: 2 }}>
            <div style={{ width: 100, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 200,
    background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  phoneFrame: {
    width: 310, background: "#1C1C1E", borderRadius: 44, padding: 10,
    boxShadow: "0 32px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
  },
  phoneInner: {
    borderRadius: 36, overflow: "hidden", background: "#0D1F35",
    display: "flex", flexDirection: "column", height: 620,
  },
  statusBar: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 20px 0", color: "#fff", fontSize: 12,
  },
  dynamicIsland: {
    width: 80, height: 22, borderRadius: 11, background: "#000",
  },
  appHeader: {
    padding: "12px 16px 10px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  content: {
    flex: 1, overflowY: "auto", padding: "0 14px 14px",
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12, padding: 12, marginBottom: 10,
  },
  bottomNav: {
    display: "flex", justifyContent: "space-around",
    padding: "8px 0 4px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(13,31,53,0.95)",
    flexShrink: 0,
  },
};
