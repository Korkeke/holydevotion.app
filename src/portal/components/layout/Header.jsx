import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../AuthContext";
import { get } from "../../api";
import Button from "../ui/Button";
import PhonePreviewModal from "../PhonePreviewModal";
import PastoralMessageModal from "../PastoralMessageModal";

const BELL_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const EYE_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const PAGE_TITLES = {
  "/portal": "Church Overview",
  "/portal/sermons": "Sermons",
  "/portal/events": "Events",
  "/portal/announcements": "Announcements",
  "/portal/devotionals": "Devotionals",
  "/portal/prayers": "Prayer Wall",
  "/portal/members": "Members",
  "/portal/settings": "Settings",
};

export default function Header({ pathname }) {
  const { user, church } = useAuth();
  const userName = user?.displayName || user?.email?.split("@")[0] || "Pastor";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const title = PAGE_TITLES[pathname] || "Church Overview";

  // Phone preview
  const [showPreview, setShowPreview] = useState(false);

  // Pastoral message
  const [messageTo, setMessageTo] = useState(null);

  // Notifications
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`notif_dismissed_${church?.id}`) || "[]"); }
    catch { return []; }
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetch notification data
  useEffect(() => {
    if (!church?.id) return;
    async function load() {
      const lastRead = localStorage.getItem(`notif_read_${church.id}`) || "1970-01-01";
      const items = [];

      try {
        const [members, prayers, attention, milestones, pending] = await Promise.all([
          get(`/api/churches/${church.id}/members`).catch(() => null),
          get(`/api/churches/${church.id}/prayer-wall`).catch(() => null),
          get(`/api/churches/${church.id}/analytics/attention`).catch(() => null),
          get(`/api/churches/${church.id}/milestones`).catch(() => null),
          get(`/api/churches/${church.id}/members/pending`).catch(() => null),
        ]);

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        // New members (joined in last 7 days)
        (members?.members || []).forEach((m) => {
          if (m.joined_at && new Date(m.joined_at) > weekAgo) {
            items.push({
              icon: "👋",
              text: `${m.display_name || "New member"} joined`,
              time: m.joined_at,
              type: "member",
            });
          }
        });

        // Recent prayers (last 3 days)
        (prayers?.prayers || []).filter(p => !p.hidden).forEach((p) => {
          if (p.created_at && new Date(p.created_at) > threeDaysAgo) {
            items.push({
              icon: p.type === "praise" ? "🙌" : "🙏",
              text: `${p.is_anonymous ? "Anonymous" : (p.display_name || "Member")} shared a ${p.type || "prayer"}`,
              time: p.created_at,
              type: "prayer",
            });
          }
        });

        // Answered prayers (last 7 days)
        (prayers?.prayers || []).filter(p => p.status === "answered" && p.answered_at).forEach((p) => {
          if (new Date(p.answered_at) > weekAgo) {
            items.push({
              icon: "✨",
              text: `${p.is_anonymous ? "Anonymous" : (p.display_name || "Member")} marked a prayer as answered`,
              time: p.answered_at,
              type: "answered",
            });
          }
        });

        // Declining members (with Send Note action)
        (attention?.declining || []).forEach((m) => {
          items.push({
            icon: "⚠️",
            text: `${m.display_name || "Member"} hasn't been active in ${m.days_inactive || "?"} days`,
            time: null,
            type: "attention",
            actionLabel: "Send Note",
            actionName: m.display_name || "Member",
          });
        });

        // Inactive members
        (attention?.inactive || []).slice(0, 2).forEach((m) => {
          items.push({
            icon: "💤",
            text: `${m.display_name || "Member"} is inactive (${m.days_inactive || "?"}d)`,
            time: null,
            type: "attention",
            actionLabel: "Send Note",
            actionName: m.display_name || "Member",
          });
        });

        // Milestones this month
        (milestones?.milestones || []).forEach((m) => {
          items.push({
            icon: "🏅",
            text: `${m.display_name || "Member"} hit ${m.milestone_type}`,
            time: m.joined_at,
            type: "milestone",
          });
        });

        // Streak milestones from attention
        (attention?.milestones || []).forEach((m) => {
          items.push({
            icon: "🔥",
            text: `${m.display_name || "Member"} reached a ${m.milestone}-day streak`,
            time: null,
            type: "milestone",
          });
        });

        // Pending member approvals
        const pendingList = pending?.members || pending || [];
        if (Array.isArray(pendingList) && pendingList.length > 0) {
          items.push({
            icon: "📋",
            text: `${pendingList.length} member${pendingList.length > 1 ? "s" : ""} waiting for approval`,
            time: null,
            type: "pending",
          });
        }

        // Sort: attention items first (no time = pinned to top), then by time newest first
        items.sort((a, b) => {
          if (a.type === "attention" && b.type !== "attention") return -1;
          if (b.type === "attention" && a.type !== "attention") return 1;
          if (a.type === "pending" && b.type !== "pending") return -1;
          if (b.type === "pending" && a.type !== "pending") return 1;
          const ta = a.time ? new Date(a.time).getTime() : 0;
          const tb = b.time ? new Date(b.time).getTime() : 0;
          return tb - ta;
        });

        setNotifications(items.slice(0, 15));
        setUnreadCount(items.filter((n) => n.time && n.time > lastRead).length
          + (attention?.declining?.length || 0)
          + (Array.isArray(pendingList) ? pendingList.length : 0));
      } catch {}
    }
    load();
  }, [church?.id]);

  function handleOpenNotifs() {
    setShowNotifs(!showNotifs);
    if (!showNotifs && church?.id) {
      localStorage.setItem(`notif_read_${church.id}`, new Date().toISOString());
      setUnreadCount(0);
    }
  }

  function timeAgo(iso) {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  // Build a unique key for each notification so we can track dismissals
  function notifKey(n) { return `${n.type}:${n.text}`; }

  function dismissOne(n) {
    const key = notifKey(n);
    const next = [...dismissed, key];
    setDismissed(next);
    if (church?.id) localStorage.setItem(`notif_dismissed_${church.id}`, JSON.stringify(next));
  }

  function clearAll() {
    const next = notifications.map(notifKey);
    setDismissed(next);
    if (church?.id) localStorage.setItem(`notif_dismissed_${church.id}`, JSON.stringify(next));
  }

  const visibleNotifs = notifications.filter(n => !dismissed.includes(notifKey(n)));

  return (
    <>
      <header style={s.header}>
        <div>
          <div style={s.greeting}>{greeting}, {userName}</div>
          <h1 style={s.title}>{title}</h1>
        </div>
        <div style={s.actions}>
          <Button onClick={() => setShowPreview(true)}>{EYE_ICON} Preview as Member</Button>

          {/* Notification bell */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button style={s.bellBtn} onClick={handleOpenNotifs}>
              {BELL_ICON}
              {unreadCount > 0 && visibleNotifs.length > 0 && <span style={s.bellDot} />}
            </button>

            {showNotifs && (
              <div style={s.notifDropdown}>
                <div style={s.notifHeader}>
                  <span>Notifications</span>
                  {visibleNotifs.length > 0 && (
                    <button onClick={clearAll} style={s.clearAllBtn}>Clear all</button>
                  )}
                </div>
                {visibleNotifs.length === 0 ? (
                  <div style={s.notifEmpty}>No recent activity</div>
                ) : (
                  visibleNotifs.map((n, i) => (
                    <div key={i} style={{
                      ...s.notifItem,
                      background: n.type === "attention" ? "#fdf8f6" : n.type === "pending" ? "#faf6ee" : "transparent",
                    }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{n.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: "#2c2a25", lineHeight: 1.4 }}>{n.text}</div>
                        {n.time && <div style={{ fontSize: 10, color: "#b0a998", marginTop: 2 }}>{timeAgo(n.time)}</div>}
                        {n.actionLabel && (
                          <button
                            onClick={() => { setMessageTo(n.actionName); setShowNotifs(false); }}
                            style={{
                              marginTop: 6, padding: "4px 10px", borderRadius: 6,
                              border: "1px solid #e0dbd1", background: "#fff",
                              color: "#3d6b44", fontSize: 11, fontWeight: 600,
                              cursor: "pointer", fontFamily: "inherit",
                            }}
                          >
                            {n.actionLabel}
                          </button>
                        )}
                      </div>
                      <button onClick={() => dismissOne(n)} style={s.dismissBtn} title="Dismiss">
                        &times;
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {showPreview && <PhonePreviewModal onClose={() => setShowPreview(false)} />}
      {messageTo && <PastoralMessageModal recipientName={messageTo} onClose={() => setMessageTo(null)} />}
    </>
  );
}

const s = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 32px",
    borderBottom: "1px solid #ece7dd",
    background: "rgba(250,248,244,0.85)",
    backdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
    zIndex: 10,
    flexShrink: 0,
  },
  greeting: {
    fontSize: 11,
    color: "#9e9888",
    fontWeight: 500,
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    margin: 0,
    fontFamily: "'DM Serif Display', serif",
    letterSpacing: "-0.01em",
    color: "#2c2a25",
  },
  actions: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  bellBtn: {
    display: "flex",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    border: "1px solid #e0dbd1",
    background: "#fff",
    cursor: "pointer",
    color: "#5a5647",
    position: "relative",
  },
  bellDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#c26a4a",
    border: "2px solid #fff",
  },
  notifDropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    width: 320,
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #ece7dd",
    boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
    zIndex: 50,
    maxHeight: 400,
    overflowY: "auto",
  },
  notifHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px 10px",
    fontSize: 14,
    fontWeight: 600,
    color: "#2c2a25",
    borderBottom: "1px solid #f0ebe3",
    fontFamily: "'DM Serif Display', serif",
  },
  clearAllBtn: {
    background: "none",
    border: "none",
    color: "#9e9888",
    fontSize: 11,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
    padding: 0,
  },
  dismissBtn: {
    background: "none",
    border: "none",
    color: "#b0a998",
    fontSize: 16,
    cursor: "pointer",
    padding: "0 0 0 4px",
    lineHeight: 1,
    flexShrink: 0,
    alignSelf: "flex-start",
  },
  notifEmpty: {
    padding: "24px 16px",
    textAlign: "center",
    fontSize: 13,
    color: "#9e9888",
  },
  notifItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "12px 16px",
    borderBottom: "1px solid #f0ebe3",
  },
};
