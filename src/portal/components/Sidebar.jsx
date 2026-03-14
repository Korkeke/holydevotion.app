import { useLocation, useNavigate } from "react-router-dom";
import { COLORS } from "../../colors";
import { useAuth } from "../AuthContext";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/portal", icon: "grid" },
  { label: "Events", path: "/portal/events", icon: "calendar" },
  { label: "Announcements", path: "/portal/announcements", icon: "megaphone" },
  { label: "Devotionals", path: "/portal/devotionals", icon: "book" },
  { label: "Prayer Wall", path: "/portal/prayers", icon: "hands" },
  { label: "Members", path: "/portal/members", icon: "users" },
  { label: "Settings", path: "/portal/settings", icon: "gear" },
];

const ICONS = {
  grid: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  megaphone: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  book: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  hands: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21C12 21 3 14 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 12 5C12.09 3.81 13.76 3 15.5 3C18.58 3 21 5.42 21 8.5C21 14 12 21 12 21Z" />
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  gear: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  logout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { church, signOut } = useAuth();

  function handleNav(path) {
    navigate(path);
    if (onClose) onClose();
  }

  async function handleSignOut() {
    await signOut();
    navigate("/portal/login");
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div onClick={onClose} style={s.overlay} />
      )}

      <aside style={{
        ...s.sidebar,
        ...(open ? s.sidebarOpen : {}),
      }}>
        {/* Church name */}
        <div style={s.header}>
          <div style={s.churchIcon}>✝</div>
          <div style={s.churchName}>
            {church?.name || "Church Portal"}
          </div>
        </div>

        {/* Nav items */}
        <nav style={s.nav}>
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                style={{
                  ...s.navItem,
                  ...(active ? s.navItemActive : {}),
                }}
              >
                <span style={{ color: active ? COLORS.gold : COLORS.textMuted }}>
                  {ICONS[item.icon]}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sign out */}
        <div style={s.bottom}>
          <button onClick={handleSignOut} style={s.signOut}>
            <span style={{ color: COLORS.textMuted }}>{ICONS.logout}</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 90,
  },
  sidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    width: 240,
    height: "100vh",
    background: COLORS.bgDeep,
    borderRight: `1px solid ${COLORS.border}`,
    display: "flex",
    flexDirection: "column",
    zIndex: 100,
    transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
  },
  sidebarOpen: {},
  header: {
    padding: "28px 20px 20px",
    borderBottom: `1px solid ${COLORS.border}`,
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  churchIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: COLORS.goldDim,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    color: COLORS.gold,
    flexShrink: 0,
  },
  churchName: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 16,
    fontWeight: 600,
    color: COLORS.text,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  nav: {
    flex: 1,
    padding: "12px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
    overflowY: "auto",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: COLORS.textMuted,
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 14,
    fontWeight: 400,
    cursor: "pointer",
    transition: "all 0.15s",
    textAlign: "left",
    width: "100%",
  },
  navItemActive: {
    background: COLORS.goldDim,
    color: COLORS.gold,
    fontWeight: 600,
  },
  bottom: {
    padding: "12px 8px 20px",
    borderTop: `1px solid ${COLORS.border}`,
  },
  signOut: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: COLORS.textMuted,
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 14,
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
  },
};
