import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { COLORS } from "../colors";
import { useAuth } from "./AuthContext";
import { get } from "./api";

export default function PortalLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { church, user } = useAuth();
  const location = useLocation();
  const [badges, setBadges] = useState({});
  const isOverview = location.pathname === "/portal" || location.pathname === "/portal/";
  const userName = user?.email?.split("@")[0] || "Pastor";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Fetch sidebar badge counts
  useEffect(() => {
    if (!church?.id) return;
    async function fetchBadges() {
      try {
        const [prayers, members] = await Promise.all([
          get(`/api/churches/${church.id}/prayer-wall`).catch(() => null),
          get(`/api/churches/${church.id}/members`).catch(() => null),
        ]);
        const prayerCount = (prayers?.prayers || []).filter(p => !p.hidden).length;
        const memberCount = (members?.members || []).filter(m => {
          if (!m.joined_at) return false;
          const joined = new Date(m.joined_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return joined > weekAgo;
        }).length;
        setBadges({ prayerCount, memberCount });
      } catch {}
    }
    fetchBadges();
  }, [church?.id]);

  return (
    <div style={s.wrapper}>
      <style>{portalCSS}</style>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} badges={badges} />

      <div style={s.main} className="portal-main">
        {/* Mobile hamburger only */}
        <header style={s.topBar} className="portal-hamburger-bar">
          <button onClick={() => setMenuOpen(!menuOpen)} style={s.hamburger} className="portal-hamburger">
            <div style={s.hamLine} />
            <div style={s.hamLine} />
            <div style={s.hamLine} />
          </button>
        </header>

        {/* Page content */}
        <div style={s.content}>
          {!isOverview && (
            <div style={{ padding: "16px 40px 0", fontSize: 13, color: COLORS.sec }}>{greeting}, {userName}</div>
          )}
          <Outlet />
        </div>
      </div>
    </div>
  );
}

const portalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,600;6..72,700&family=DM+Sans:wght@400;500;600;700&display=swap');
  :root { --heading: 'Newsreader', serif; --body: 'DM Sans', sans-serif; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { -webkit-font-smoothing: antialiased; }
  @keyframes spin { to { transform: rotate(360deg); } }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #E8E2D9; border-radius: 3px; }
  body { background: #F7F4EF; }
  input::placeholder, textarea::placeholder { color: #A8A29E; }

  @media (min-width: 769px) {
    .portal-hamburger { display: none !important; }
    .portal-hamburger-bar { display: none !important; }
  }
  @media (max-width: 768px) {
    .portal-sidebar { transform: translateX(-100%); }
    .portal-sidebar.open { transform: translateX(0); }
    .portal-main { margin-left: 0 !important; }
  }
`;

const s = {
  wrapper: {
    minHeight: "100vh",
    background: COLORS.bg,
    color: COLORS.text,
    fontFamily: "var(--body)",
  },
  main: {
    marginLeft: 220,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  topBar: {
    height: 56,
    padding: "0 24px",
    display: "flex",
    alignItems: "center",
    background: COLORS.bg,
  },
  hamburger: {
    display: "none",
    flexDirection: "column",
    gap: 4,
    padding: 8,
    border: "none",
    background: "transparent",
    cursor: "pointer",
  },
  hamLine: {
    width: 20,
    height: 2,
    background: COLORS.muted,
    borderRadius: 1,
  },
  content: {
    flex: 1,
  },
};
