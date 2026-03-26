import { useAuth } from "../../AuthContext";
import Button from "../ui/Button";

/**
 * Sticky header with greeting, page title, and action buttons.
 */

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
  const { user } = useAuth();
  const userName = user?.displayName || user?.email?.split("@")[0] || "Pastor";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const title = PAGE_TITLES[pathname] || "Church Overview";

  return (
    <header style={s.header}>
      <div>
        <div style={s.greeting}>{greeting}, {userName}</div>
        <h1 style={s.title}>{title}</h1>
      </div>
      <div style={s.actions}>
        <Button>{EYE_ICON} Preview as Member</Button>
        <button style={s.bellBtn}>
          {BELL_ICON}
          <span style={s.bellDot} />
        </button>
      </div>
    </header>
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
};
