import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/layout/Header";
import { useAuth } from "./AuthContext";
import { get } from "./api";
import { ThemeProvider } from "./context/ThemeContext";

export default function PortalLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { church } = useAuth();
  const location = useLocation();
  const [badges, setBadges] = useState({});

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
    <ThemeProvider>
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

          {/* Sticky header */}
          <Header pathname={location.pathname} />

          {/* Page content */}
          <div style={s.content}>
            <Outlet />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

const portalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
  :root { --heading: 'DM Serif Display', serif; --body: 'DM Sans', sans-serif; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { -webkit-font-smoothing: antialiased; }
  @keyframes spin { to { transform: rotate(360deg); } }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #e0dbd1; border-radius: 3px; }
  body { background: #faf8f4; }
  input::placeholder, textarea::placeholder { color: #b0a998; }
  input:focus, textarea:focus { border-color: #3d6b44 !important; }

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
    background: "#faf8f4",
    color: "#2c2a25",
    fontFamily: "var(--body)",
    fontSize: 14,
    overflow: "hidden",
  },
  main: {
    marginLeft: 240,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    overflow: "auto",
  },
  topBar: {
    height: 56,
    padding: "0 24px",
    display: "flex",
    alignItems: "center",
    background: "#faf8f4",
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
    background: "#b0a998",
    borderRadius: 1,
  },
  content: {
    flex: 1,
  },
};
