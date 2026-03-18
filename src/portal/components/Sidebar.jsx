import { useLocation, useNavigate } from "react-router-dom";
import { useChurchColors } from "../useChurchColors";
import { useAuth } from "../AuthContext";

const NAV_ITEMS = [
  { label: "Overview", path: "/portal" },
  { label: "Sermon", path: "/portal/sermons" },
  { label: "Events", path: "/portal/events" },
  { label: "Announcements", path: "/portal/announcements" },
  { label: "Devotionals", path: "/portal/devotionals" },
  { label: "Prayer Wall", path: "/portal/prayers" },
  { label: "Members", path: "/portal/members" },
  { label: "Settings", path: "/portal/settings" },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { church, user, signOut } = useAuth();
  const COLORS = useChurchColors();

  function handleNav(path) {
    navigate(path);
    if (onClose) onClose();
  }

  async function handleSignOut() {
    await signOut();
    navigate("/portal/login");
  }

  const churchInitial = (church?.name || "C")[0].toUpperCase();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div onClick={onClose} style={s.overlay} />
      )}

      <aside
        className={`portal-sidebar ${open ? "open" : ""}`}
        style={s.sidebar}
      >
        {/* Devotion branding */}
        <div style={s.brand}>
          <span style={s.brandCross}>✝</span>
          <span style={s.brandName}>Devotion</span>
        </div>

        {/* Church branding */}
        <div style={s.header}>
          <div style={s.churchIcon}>{churchInitial}</div>
          <div>
            <div style={s.churchName}>
              {church?.name || "Church Portal"}
            </div>
            <div style={s.planLabel}>Shepherd Plan</div>
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
                  background: active ? COLORS.accentLight : "transparent",
                  color: active ? COLORS.accentDark : COLORS.textSec,
                  fontWeight: active ? 700 : 500,
                }}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Pastor info + Sign out */}
        <div style={s.bottom}>
          <div style={s.pastorInfo}>
            <div style={s.pastorAvatar}>👤</div>
            <div>
              <div style={s.pastorName}>{user?.email?.split("@")[0] || "Pastor"}</div>
              <div style={s.pastorRole}>Admin</div>
            </div>
          </div>
          <button onClick={handleSignOut} style={s.signOut}>
            Sign Out
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
    background: "rgba(0,0,0,0.3)",
    zIndex: 90,
  },
  sidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    width: 240,
    height: "100vh",
    background: COLORS.bgSidebar,
    borderRight: `1px solid ${COLORS.border}`,
    display: "flex",
    flexDirection: "column",
    zIndex: 100,
    transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
    padding: "24px 16px",
    overflowY: "auto",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0 8px",
    marginBottom: 24,
  },
  brandCross: {
    fontSize: 20,
    color: COLORS.accent,
  },
  brandName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 18,
    fontWeight: 700,
    color: COLORS.text,
    letterSpacing: "-0.01em",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 32,
    padding: "0 8px",
  },
  churchIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: COLORS.accent,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
  },
  churchName: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.text,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  planLabel: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    color: COLORS.textMuted,
  },
  nav: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 10,
    border: "none",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    transition: "all 0.15s ease",
  },
  bottom: {
    borderTop: `1px solid ${COLORS.border}`,
    paddingTop: 16,
  },
  pastorInfo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 8px",
    marginBottom: 12,
  },
  pastorAvatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: COLORS.sand,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
  },
  pastorName: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    color: COLORS.text,
  },
  pastorRole: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    color: COLORS.textMuted,
  },
  signOut: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: COLORS.textMuted,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
  },
};
