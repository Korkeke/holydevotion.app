import { useLocation, useNavigate } from "react-router-dom";
import { COLORS } from "../../colors";
import { useChurchColors } from "../useChurchColors";
import { useAuth } from "../AuthContext";
import { icons } from "./NavIcons";
import { cloudinaryUrl } from "./ImageUpload";

const NAV_ITEMS = [
  { id: "overview", iconKey: "overview", label: "Overview", path: "/portal" },
  { type: "divider", label: "CONTENT" },
  { id: "sermons", iconKey: "sermon", label: "Sermons", path: "/portal/sermons" },
  { id: "events", iconKey: "events", label: "Events", path: "/portal/events" },
  { id: "announcements", iconKey: "announcements", label: "Announcements", path: "/portal/announcements" },
  { id: "devotionals", iconKey: "devotionals", label: "Devotionals", path: "/portal/devotionals" },
  { type: "divider", label: "COMMUNITY" },
  { id: "prayer", iconKey: "prayer", label: "Prayer Wall", path: "/portal/prayers", badgeKey: "prayerCount" },
  { id: "members", iconKey: "members", label: "Members", path: "/portal/members", badgeKey: "memberCount" },
  { type: "divider", label: "ADMIN" },
  { id: "settings", iconKey: "settings", label: "Settings", path: "/portal/settings" },
];

export default function Sidebar({ open, onClose, badges = {} }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { church, user, signOut } = useAuth();
  const C = useChurchColors();

  function handleNav(path) {
    navigate(path);
    if (onClose) onClose();
  }

  async function handleSignOut() {
    await signOut();
    navigate("/portal/login");
  }

  const churchInitial = (church?.name || "C")[0].toUpperCase();
  const userName = user?.email?.split("@")[0] || "Pastor";
  const userInitials = userName.slice(0, 2).toUpperCase();

  return (
    <>
      {open && <div onClick={onClose} style={s.overlay} />}

      <aside className={`portal-sidebar ${open ? "open" : ""}`} style={{ ...s.sidebar, borderRight: `1px solid ${C.border}` }}>
        {/* Devotion branding */}
        <div style={{ ...s.brand, borderBottom: `1px solid ${C.borderLight}` }}>
          <span style={{ fontSize: 18, color: C.accent }}>✝</span>
          <span style={{ fontSize: 17, fontWeight: 700, color: C.accent, fontFamily: "var(--heading)" }}>Devotion</span>
        </div>

        {/* Church branding */}
        <div style={{ ...s.churchSection, borderBottom: `1px solid ${C.borderLight}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {church?.logo_url ? (
              <img src={cloudinaryUrl(church.logo_url, { width: 64, height: 64 })} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>{churchInitial}</div>
            )}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{church?.name || "Church Portal"}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{({ church: "Church", church_plus: "Church Plus", church_pro: "Church Pro" })[church?.plan] || "Church"}</div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={s.nav}>
          {NAV_ITEMS.map((item, i) => {
            if (item.type === "divider") {
              return (
                <div key={`div-${i}`} style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1.5, padding: "16px 8px 6px" }}>
                  {item.label}
                </div>
              );
            }

            const active = location.pathname === item.path;
            const badgeValue = item.badgeKey ? badges[item.badgeKey] : null;
            const iconFn = icons[item.iconKey];

            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                style={{
                  ...s.navItem,
                  background: active ? C.accentLight : "transparent",
                  color: active ? C.accent : C.body,
                  fontWeight: active ? 700 : 500,
                }}
              >
                <span style={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {iconFn ? iconFn(active ? C.accent : C.sec) : null}
                </span>
                {item.label}
                {badgeValue > 0 && (
                  <span style={{
                    marginLeft: "auto", padding: "1px 7px", borderRadius: 10,
                    background: C.red, color: "#fff", fontSize: 10, fontWeight: 700,
                    minWidth: 18, textAlign: "center",
                  }}>{badgeValue}</span>
                )}
                {item.isNew && (
                  <span style={{
                    marginLeft: "auto", padding: "1px 6px", borderRadius: 6,
                    background: C.accent, color: "#fff", fontSize: 9, fontWeight: 700,
                  }}>NEW</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Pastor info + Sign out */}
        <div style={{ borderTop: `1px solid ${C.borderLight}`, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.bgDeep, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: C.sec }}>{userInitials}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{userName}</div>
              <div style={{ fontSize: 10, color: C.muted }}>Admin</div>
            </div>
          </div>
          <button onClick={handleSignOut} style={s.signOut}>Sign Out</button>
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
    width: 220,
    height: "100vh",
    background: COLORS.card,
    display: "flex",
    flexDirection: "column",
    zIndex: 100,
    transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
    padding: "20px 0",
    overflowY: "auto",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0 20px 20px",
    marginBottom: 8,
  },
  churchSection: {
    padding: "12px 20px 16px",
    marginBottom: 8,
  },
  nav: {
    flex: 1,
    padding: "0 12px",
    display: "flex",
    flexDirection: "column",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    borderRadius: 10,
    border: "none",
    fontFamily: "var(--body)",
    fontSize: 13,
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    transition: "all 0.15s ease",
    marginBottom: 2,
  },
  signOut: {
    marginTop: 10,
    fontSize: 11,
    color: COLORS.muted,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "var(--body)",
  },
};
