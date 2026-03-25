import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useChurchColors } from "../useChurchColors";
import { useAuth } from "../AuthContext";
import { usePortalTheme } from "../context/ThemeContext";
import { icons } from "./NavIcons";
import { cloudinaryUrl } from "./ImageUpload";
import { motion } from "framer-motion";

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
  const { palette } = usePortalTheme();
  const sb = palette.sidebar;

  const [collapsed, setCollapsed] = useState(false);

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
  const sidebarWidth = collapsed ? 64 : 240;

  return (
    <>
      {open && <div onClick={onClose} style={s.overlay} />}

      <motion.aside
        className={`portal-sidebar ${open ? "open" : ""}`}
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        style={{
          ...s.sidebar,
          width: sidebarWidth,
          background: sb.bg,
          borderRight: `1px solid ${sb.border}`,
          color: sb.text,
        }}
      >
        {/* Devotion branding */}
        <div style={{ ...s.brand, borderBottom: `1px solid ${sb.border}`, padding: collapsed ? "16px 12px 8px" : "20px 20px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: collapsed ? 8 : 16 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #c8a855, #a68a3a)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 700, color: "#fff",
              fontFamily: "'DM Serif Display', serif", flexShrink: 0,
            }}>
              D
            </div>
            {!collapsed && (
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: sb.brand }}>Devotion</div>
                <div style={{ fontSize: 11, color: sb.muted }}>Pastor Portal</div>
              </div>
            )}
          </div>

          {/* Church switcher */}
          {!collapsed && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", background: sb.switchBg,
              borderRadius: 10, cursor: "pointer",
            }}>
              {church?.logo_url ? (
                <img src={cloudinaryUrl(church.logo_url, { width: 64, height: 64 })} alt=""
                  style={{ width: 30, height: 30, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: "linear-gradient(135deg, #6b8f71, #4a6b4f)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
                }}>
                  {churchInitial}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 500, color: sb.brand,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {church?.name || "Church Portal"}
                </div>
                <div style={{ fontSize: 11, color: sb.muted }}>
                  {({ church: "Church", church_plus: "Church Plus", church_pro: "Church Pro" })[church?.plan] || "Church"}
                </div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke={sb.chevron} strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ ...s.nav, padding: collapsed ? "12px 8px" : "12px 10px" }}>
          {NAV_ITEMS.map((item, i) => {
            if (item.type === "divider") {
              if (collapsed) {
                return <div key={`div-${i}`} style={{ height: 1, background: sb.border, margin: "12px 4px" }} />;
              }
              return (
                <div key={`div-${i}`} style={{
                  fontSize: 10, fontWeight: 600, color: sb.muted,
                  letterSpacing: "0.08em", padding: "16px 10px 6px",
                  textTransform: "uppercase", whiteSpace: "nowrap",
                }}>
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
                title={collapsed ? item.label : undefined}
                style={{
                  ...s.navItem,
                  justifyContent: collapsed ? "center" : "flex-start",
                  padding: collapsed ? "9px 0" : "9px 12px",
                  background: active ? sb.activeBg : "transparent",
                  color: active ? sb.active : sb.text,
                  fontWeight: active ? 500 : 400,
                  position: "relative",
                }}
              >
                <span style={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {iconFn ? iconFn(active ? sb.active : sb.muted) : null}
                </span>
                {!collapsed && <span style={{ flex: 1, whiteSpace: "nowrap" }}>{item.label}</span>}
                {!collapsed && badgeValue > 0 && (
                  <span style={{
                    marginLeft: "auto", padding: "1px 7px", borderRadius: 10,
                    background: "#c8a855", color: "#2c2a25",
                    fontSize: 10, fontWeight: 700, minWidth: 18, textAlign: "center",
                  }}>
                    {badgeValue}
                  </span>
                )}
                {collapsed && badgeValue > 0 && (
                  <span style={{
                    position: "absolute", top: 4, right: 4,
                    width: 8, height: 8, borderRadius: "50%", background: "#c8a855",
                  }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div
          onClick={() => setCollapsed(!collapsed)}
          style={{
            padding: "10px 16px",
            borderTop: `1px solid ${sb.border}`,
            display: "flex", alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-end",
            cursor: "pointer", color: sb.muted,
            transition: "all 0.15s",
          }}
        >
          <div style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.25s", display: "flex" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="11 17 6 12 11 7" />
              <line x1="18" y1="12" x2="6" y2="12" />
            </svg>
          </div>
        </div>

        {/* Pastor info */}
        <div style={{
          padding: collapsed ? "14px 12px" : "14px 16px",
          borderTop: `1px solid ${sb.border}`,
          display: "flex", alignItems: "center", gap: 10,
          justifyContent: collapsed ? "center" : "flex-start",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #6b8f71, #8aab8f)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 600, color: "#fff", flexShrink: 0,
          }}>
            {userInitials}
          </div>
          {!collapsed && (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: sb.brand }}>{userName}</div>
              <div style={{ fontSize: 11, color: sb.muted }}>Admin</div>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}

// Export collapsed state width for layout calculations
export const SIDEBAR_EXPANDED = 240;
export const SIDEBAR_COLLAPSED = 64;

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
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    zIndex: 100,
    transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
    overflowY: "auto",
    overflowX: "hidden",
  },
  brand: {
    flexShrink: 0,
  },
  nav: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    borderRadius: 8,
    border: "none",
    fontFamily: "var(--body)",
    fontSize: 13,
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    transition: "all 0.15s ease",
    marginBottom: 2,
    background: "transparent",
  },
};
