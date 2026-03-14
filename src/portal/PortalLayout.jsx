import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { COLORS } from "../colors";
import { useAuth } from "./AuthContext";

export default function PortalLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div style={s.wrapper}>
      <style>{portalCSS}</style>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div style={s.main}>
        {/* Top bar */}
        <header style={s.topBar}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={s.hamburger}>
            <div style={s.hamLine} />
            <div style={s.hamLine} />
            <div style={s.hamLine} />
          </button>
          <div style={s.topRight}>
            <span style={s.email}>{user?.email}</span>
          </div>
        </header>

        {/* Page content */}
        <div style={s.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

const portalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Nunito+Sans:ital,opsz,wght@0,6..12,300;0,6..12,400;0,6..12,500;0,6..12,600;1,6..12,300&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { -webkit-font-smoothing: antialiased; }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (min-width: 769px) {
    .portal-hamburger { display: none !important; }
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
  },
  main: {
    marginLeft: 240,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  topBar: {
    height: 56,
    padding: "0 24px",
    borderBottom: `1px solid ${COLORS.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "rgba(6,9,17,0.8)",
    backdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
    zIndex: 50,
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
    background: COLORS.textMuted,
    borderRadius: 1,
  },
  topRight: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginLeft: "auto",
  },
  email: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 13,
    color: COLORS.textMuted,
  },
  content: {
    flex: 1,
  },
};
