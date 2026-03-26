import { useState, useEffect, useRef } from "react";
import { updateProfile } from "firebase/auth";
import { useChurchColors } from "../useChurchColors";
import { useAuth } from "../AuthContext";
import { get, post, put, del } from "../api";
import ConfirmDialog from "../components/ConfirmDialog";
import ImageUpload from "../components/ImageUpload";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import SectionLabel from "../components/ui/SectionLabel";
import { usePortalTheme, palettes } from "../context/ThemeContext";

const THEMES = {
  devotion:       { label: "Devotion",              accent: "#0A0E1A", secondary: "#C9A84C" },
  classic_navy:   { label: "Classic Navy",          accent: "#1B3A5C", secondary: "#C8A96E" },
  sage_green:     { label: "Sage Green",            accent: "#3D6B5E", secondary: "#D4A853" },
  burgundy:       { label: "Burgundy",              accent: "#7B2D3B", secondary: "#D4B896" },
  warm_slate:     { label: "Warm Slate",            accent: "#4A5568", secondary: "#C08552" },
  deep_teal:      { label: "Deep Teal",             accent: "#1A5E63", secondary: "#E8C16D" },
  forest_green:   { label: "Forest Green",          accent: "#2E5E3F", secondary: "#D9C8A9" },
  ivory_gold:     { label: "Ivory and Gold",        accent: "#B8A88A", secondary: "#7A6B4F" },
  purple_gold:    { label: "Purple and Warm Gold",  accent: "#4A3060", secondary: "#C9B57A" },
};

const FIELDS = [
  { key: "name", label: "Church Name", required: true },
  { key: "denomination", label: "Denomination" },
  { key: "city", label: "City" },
  { key: "website", label: "Website" },
  { key: "welcome_message", label: "Welcome Message", textarea: true },
];

const NAV_ITEMS = [
  { key: "appearance", label: "Appearance" },
  { key: "invites", label: "Invite Codes" },
  { key: "profile", label: "Church Profile" },
  { key: "verse", label: "Verse of the Week" },
  { key: "danger", label: "Danger Zone" },
];

export default function SettingsPage() {
  const COLORS = useChurchColors();
  const { church, role, signOutUser, reloadChurch, user } = useAuth();
  const { paletteKey, setPaletteKey } = usePortalTheme();
  const [activeSection, setActiveSection] = useState("appearance");
  const [form, setForm] = useState({});
  const [selectedTheme, setSelectedTheme] = useState("sage_green");
  const [accentColor, setAccentColor] = useState("#3D6B5E");
  const [secondaryColor, setSecondaryColor] = useState("#D4A853");
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pastorCode, setPastorCode] = useState(null);
  const [pastorCodeUsed, setPastorCodeUsed] = useState(false);
  const [generatingPastorCode, setGeneratingPastorCode] = useState(false);
  const [pastorCopied, setPastorCopied] = useState(false);
  const [pastorName, setPastorName] = useState(user?.displayName || "");

  // Refs for scroll-into-view
  const sectionRefs = {
    appearance: useRef(null),
    invites: useRef(null),
    profile: useRef(null),
    verse: useRef(null),
    danger: useRef(null),
  };

  useEffect(() => {
    if (!church?.id) return;
    (async () => {
      try {
        const data = await get(`/api/churches/${church.id}`);
        const c = data?.church || data || {};
        const vals = {};
        FIELDS.forEach((f) => { vals[f.key] = c[f.key] || ""; });
        vals.logo_url = c.logo_url || "";
        vals.banner_url = c.banner_url || "";
        vals.verse_of_week = c.verse_of_week || "";
        vals.verse_of_week_ref = c.verse_of_week_ref || "";
        vals.giving_url = c.giving_url || "";
        setForm(vals);
        const th = c.theme || "sage_green";
        setSelectedTheme(th);
        setAccentColor(c.accent_color || "#3D6B5E");
        setSecondaryColor(c.secondary_color || "#D4A853");
        setIsCustom(th === "custom" || !THEMES[th]);
        setPastorCode(c.pastor_code || null);
        setPastorCodeUsed(!!c.pastor_code_used);
      } catch {} finally { setLoading(false); }
    })();
  }, [church?.id]);

  async function handleSave(e) {
    if (e) e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      // Update pastor display name in Firebase
      if (user && pastorName.trim() && pastorName !== user.displayName) {
        await updateProfile(user, { displayName: pastorName.trim() });
      }
      await put(`/api/churches/${church.id}`, {
        ...form,
        theme: isCustom ? "custom" : selectedTheme,
        accent_color: accentColor,
        secondary_color: secondaryColor,
      });
      setSaved(true);
      reloadChurch();
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await del(`/api/churches/${church.id}`);
      signOutUser();
    } finally { setDeleteLoading(false); }
  }

  function copyCode() {
    navigator.clipboard.writeText(church?.invite_code || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function generatePastorCode() {
    setGeneratingPastorCode(true);
    try {
      const data = await post(`/api/churches/${church.id}/pastor-code`);
      setPastorCode(data?.pastor_code || data?.code || null);
      setPastorCodeUsed(false);
    } catch (err) {
      console.error("Failed to generate pastor code:", err);
      alert("Failed to generate pastor code: " + (err.message || "Unknown error"));
    } finally { setGeneratingPastorCode(false); }
  }

  function copyPastorCode() {
    navigator.clipboard.writeText(pastorCode || "");
    setPastorCopied(true);
    setTimeout(() => setPastorCopied(false), 2000);
  }

  const isOwner = role === "owner";

  function handleNavClick(key) {
    setActiveSection(key);
    sectionRefs[key]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (loading) return (
    <div style={{ padding: 60, display: "flex", justifyContent: "center" }}>
      <div style={{ width: 28, height: 28, border: "2px solid #3d6b44", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ padding: "24px 32px 48px" }}>
      <h1 style={{
        fontFamily: "var(--heading)", fontSize: 26, fontWeight: 700,
        color: "#2c2a25", marginBottom: 24,
      }}>Settings</h1>

      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 32 }}>
        {/* Left sidebar nav */}
        <nav style={{ position: "sticky", top: 24, alignSelf: "start" }}>
          {NAV_ITEMS.filter(n => n.key !== "danger" || isOwner).map((item) => {
            const active = activeSection === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 14px",
                  marginBottom: 2,
                  borderRadius: 8,
                  border: "none",
                  borderLeft: active ? "3px solid #3d6b44" : "3px solid transparent",
                  background: active ? "#f0ebe3" : "transparent",
                  color: active ? "#2c2a25" : "#9e9888",
                  fontWeight: active ? 600 : 400,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right content */}
        <form onSubmit={handleSave} style={{ maxWidth: 600 }}>

          {/* ── Appearance ── */}
          <div ref={sectionRefs.appearance} style={{ marginBottom: 32 }}>
            <SectionLabel>Color Palette</SectionLabel>
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#9e9888",
              marginTop: -6, marginBottom: 16,
            }}>
              Choose a color theme for your portal. This affects the sidebar and accent areas.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
              {Object.entries(palettes).map(([key, pal]) => {
                const active = paletteKey === key;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setPaletteKey(key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "14px 16px",
                      borderRadius: 12,
                      border: active ? "2px solid #3d6b44" : "2px solid #ece7dd",
                      background: active ? "#faf6ee" : "#fff",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      transform: active ? "scale(1.02)" : "scale(1)",
                      position: "relative",
                    }}
                  >
                    <div style={{ display: "flex", gap: 4 }}>
                      {pal.preview.map((c, i) => (
                        <div key={i} style={{
                          width: 22, height: 22, borderRadius: "50%",
                          background: c,
                          border: "2px solid rgba(0,0,0,0.08)",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }} />
                      ))}
                    </div>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                      fontWeight: active ? 600 : 400,
                      color: active ? "#2c2a25" : "#9e9888",
                    }}>
                      {pal.name}
                    </span>
                    {active && (
                      <span style={{
                        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                        width: 20, height: 20, borderRadius: "50%",
                        background: "#3d6b44", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, lineHeight: 1,
                      }}>&#10003;</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Church Branding theme picker */}
            <SectionLabel>Church Branding</SectionLabel>
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#9e9888",
              marginTop: -6, marginBottom: 16,
            }}>
              These colors apply to both this dashboard and your church's space in the Devotion app.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
              {Object.entries(THEMES).map(([key, t]) => {
                const selected = !isCustom && selectedTheme === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={async () => {
                      setSelectedTheme(key);
                      setAccentColor(t.accent);
                      setSecondaryColor(t.secondary);
                      setIsCustom(false);
                      await put(`/api/churches/${church.id}`, {
                        theme: key,
                        accent_color: t.accent,
                        secondary_color: t.secondary,
                      });
                      reloadChurch();
                    }}
                    style={{
                      padding: "10px 6px 8px",
                      borderRadius: 12,
                      border: `2px solid ${selected ? t.accent : "#ece7dd"}`,
                      background: selected ? "#faf6ee" : "#fff",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      transition: "all 0.2s",
                      boxShadow: selected ? `0 0 16px ${t.accent}33` : "none",
                    }}
                  >
                    <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: t.accent, border: "2px solid #fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: t.secondary, border: "2px solid #fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                    </div>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 10,
                      color: selected ? t.accent : "#9e9888",
                      fontWeight: selected ? 700 : 400,
                      marginTop: 6,
                      textAlign: "center",
                      lineHeight: 1.2,
                    }}>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom color option */}
            <div style={{
              padding: "14px 16px",
              borderRadius: 12,
              border: `1px solid ${isCustom ? accentColor : "#ece7dd"}`,
              background: isCustom ? `${accentColor}10` : "transparent",
              transition: "all 0.2s",
            }}>
              <button
                type="button"
                onClick={() => setIsCustom(true)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
                  color: isCustom ? "#2c2a25" : "#9e9888",
                  padding: 0, marginBottom: isCustom ? 12 : 0,
                  display: "block",
                }}
              >
                Custom Colors
              </button>
              {isCustom && (
                <div style={{ display: "flex", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, fontWeight: 600, color: "#9e9888", letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Primary</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        style={{ width: 36, height: 32, border: "none", borderRadius: 6, cursor: "pointer", padding: 0 }}
                      />
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setAccentColor(v); }}
                        style={{ fontFamily: "monospace", fontSize: 12, padding: "6px 8px", width: "100%", borderRadius: 8, border: "1px solid #ece7dd", background: "#f7f4ef", color: "#2c2a25", outline: "none" }}
                      />
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, fontWeight: 600, color: "#9e9888", letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Accent</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        style={{ width: 36, height: 32, border: "none", borderRadius: 6, cursor: "pointer", padding: 0 }}
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setSecondaryColor(v); }}
                        style={{ fontFamily: "monospace", fontSize: 12, padding: "6px 8px", width: "100%", borderRadius: 8, border: "1px solid #ece7dd", background: "#f7f4ef", color: "#2c2a25", outline: "none" }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await put(`/api/churches/${church.id}`, {
                        theme: "custom",
                        accent_color: accentColor,
                        secondary_color: secondaryColor,
                      });
                      reloadChurch();
                    }}
                    style={{
                      padding: "8px 16px", borderRadius: 8, border: "none",
                      background: "#3d6b44", color: "#fff",
                      fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
                      cursor: "pointer", alignSelf: "flex-end",
                      boxShadow: "0 1px 3px rgba(61,107,68,0.2)",
                    }}
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Invite Codes ── */}
          <div ref={sectionRefs.invites} style={{ marginBottom: 32 }}>
            <SectionLabel>Invite Codes</SectionLabel>

            {/* Member code */}
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: "#9e9888", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
                Member Code
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#9e9888", marginBottom: 14 }}>
                Share this code with members so they can join your church in the app.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{
                  fontFamily: "'Courier New', monospace", fontSize: 20, fontWeight: 700,
                  color: "#e2c87a", letterSpacing: "0.08em",
                  padding: "10px 20px", borderRadius: 10,
                  background: "#2c2a25",
                }}>
                  {church?.invite_code || "\u2014"}
                </span>
                <Button onClick={copyCode}>
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </Card>

            {/* Pastor Invite Code — owner only */}
            {isOwner && (
              <Card>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: "#9e9888", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
                  Pastor Code
                </div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#9e9888", marginBottom: 14 }}>
                  Single-use code that grants admin access. Share privately with your pastor.
                </p>

                {pastorCode && !pastorCodeUsed ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{
                        fontFamily: "'Courier New', monospace", fontSize: 20, fontWeight: 700,
                        color: "#e2c87a", letterSpacing: "0.08em",
                        padding: "10px 20px", borderRadius: 10,
                        background: "#2c2a25",
                      }}>
                        {pastorCode}
                      </span>
                      <Button onClick={copyPastorCode}>
                        {pastorCopied ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                    <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "#FFF3CD", border: "1px solid #FFCC02", display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ fontSize: 15, lineHeight: 1 }}>&#9888;</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#664D03", lineHeight: 1.4 }}>
                        Share this privately. Anyone with this code gets admin access to your church.
                      </span>
                    </div>
                  </>
                ) : pastorCode && pastorCodeUsed ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{
                      fontFamily: "'Courier New', monospace", fontSize: 20, fontWeight: 700,
                      color: "#9e9888", letterSpacing: "0.08em",
                      padding: "10px 20px", borderRadius: 10,
                      background: "#f7f4ef", opacity: 0.6,
                    }}>
                      {pastorCode}
                    </span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: "#9e9888", padding: "4px 10px", borderRadius: 6, background: "#f7f4ef", border: "1px solid #ece7dd" }}>Used</span>
                    <Button onClick={generatePastorCode} disabled={generatingPastorCode}>
                      {generatingPastorCode ? "Generating..." : "Generate New"}
                    </Button>
                  </div>
                ) : (
                  <Button primary onClick={generatePastorCode} disabled={generatingPastorCode}>
                    {generatingPastorCode ? "Generating..." : "Generate Pastor Code"}
                  </Button>
                )}
              </Card>
            )}
          </div>

          {/* ── Church Profile ── */}
          <div ref={sectionRefs.profile} style={{ marginBottom: 32 }}>
            <SectionLabel>Church Profile</SectionLabel>

            <Card>
              {/* Pastor name */}
              <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #f0ebe3" }}>
                <label style={{
                  display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                  fontWeight: 600, color: "#9e9888", marginBottom: 6,
                  textTransform: "uppercase", letterSpacing: "0.04em",
                }}>
                  Your Name
                </label>
                <input
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 8, boxSizing: "border-box",
                    border: "1px solid #ece7dd", background: "#f7f4ef",
                    color: "#2c2a25", fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                    outline: "none",
                  }}
                  value={pastorName}
                  onChange={(e) => setPastorName(e.target.value)}
                  placeholder="Pastor John"
                />
                <div style={{ fontSize: 11, color: "#b0a998", marginTop: 4 }}>
                  Shown in the sidebar and greeting. Updates on save.
                </div>
              </div>
            </Card>

            <Card style={{ marginTop: 16 }}>
              {FIELDS.map((f) => (
                <div key={f.key} style={{ marginBottom: 16 }}>
                  <label style={{
                    display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                    fontWeight: 600, color: "#9e9888", marginBottom: 6,
                    textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>
                    {f.label}{f.required && <span style={{ color: "#c26a4a" }}> *</span>}
                  </label>
                  {f.textarea ? (
                    <textarea
                      style={{
                        width: "100%", padding: "10px 14px", borderRadius: 8, boxSizing: "border-box",
                        border: "1px solid #ece7dd", background: "#f7f4ef",
                        color: "#2c2a25", fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                        outline: "none", minHeight: 80, resize: "vertical",
                      }}
                      value={form[f.key] || ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.placeholder || ""}
                    />
                  ) : (
                    <input
                      style={{
                        width: "100%", padding: "10px 14px", borderRadius: 8, boxSizing: "border-box",
                        border: "1px solid #ece7dd", background: "#f7f4ef",
                        color: "#2c2a25", fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                        outline: "none",
                      }}
                      value={form[f.key] || ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.placeholder || ""}
                      required={f.required}
                    />
                  )}
                </div>
              ))}

              {/* Image uploads */}
              <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
                <ImageUpload
                  value={form.logo_url || ""}
                  onChange={(url) => setForm({ ...form, logo_url: url })}
                  aspect="square"
                  label="Church Logo"
                  accentColor={COLORS.accent}
                />
                <div style={{ flex: 1 }}>
                  <ImageUpload
                    value={form.banner_url || ""}
                    onChange={(url) => setForm({ ...form, banner_url: url })}
                    aspect="banner"
                    label="Header Image"
                    accentColor={COLORS.accent}
                  />
                </div>
              </div>

              {/* Giving / Donation */}
              <div style={{ marginBottom: 0, padding: "16px 18px", borderRadius: 12, border: "1px solid #ece7dd", background: "#f7f4ef" }}>
                <h3 style={{ fontFamily: "var(--heading)", fontSize: 15, fontWeight: 700, color: "#2c2a25", marginBottom: 4 }}>Giving / Donation</h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#9e9888", marginBottom: 14 }}>
                  Members will see a "Give" button that opens this link.
                </p>
                <div style={{ marginBottom: 0 }}>
                  <label style={{
                    display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                    fontWeight: 600, color: "#9e9888", marginBottom: 6,
                    textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>Giving URL</label>
                  <input
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 8, boxSizing: "border-box",
                      border: "1px solid #ece7dd", background: "#fff",
                      color: "#2c2a25", fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                      outline: "none",
                    }}
                    value={form.giving_url || ""}
                    onChange={(e) => setForm({ ...form, giving_url: e.target.value })}
                    placeholder="https://your-church.com/give"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* ── Verse of the Week ── */}
          <div ref={sectionRefs.verse} style={{ marginBottom: 32 }}>
            <SectionLabel>Verse of the Week</SectionLabel>
            <Card>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#9e9888", marginBottom: 16 }}>
                This verse will be displayed on every member's church home screen.
              </p>
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                  fontWeight: 600, color: "#9e9888", marginBottom: 6,
                  textTransform: "uppercase", letterSpacing: "0.04em",
                }}>Verse Text</label>
                <textarea
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 8, boxSizing: "border-box",
                    border: "1px solid #ece7dd", background: "#f7f4ef",
                    color: "#2c2a25", fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                    outline: "none", minHeight: 80, resize: "vertical",
                  }}
                  value={form.verse_of_week || ""}
                  onChange={(e) => setForm({ ...form, verse_of_week: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: 0 }}>
                <label style={{
                  display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                  fontWeight: 600, color: "#9e9888", marginBottom: 6,
                  textTransform: "uppercase", letterSpacing: "0.04em",
                }}>Scripture Reference</label>
                <input
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 8, boxSizing: "border-box",
                    border: "1px solid #ece7dd", background: "#f7f4ef",
                    color: "#2c2a25", fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                    outline: "none",
                  }}
                  value={form.verse_of_week_ref || ""}
                  onChange={(e) => setForm({ ...form, verse_of_week_ref: e.target.value })}
                  placeholder="e.g. Philippians 4:13"
                />
              </div>
            </Card>
          </div>

          {/* ── Danger Zone ── */}
          {isOwner && (
            <div ref={sectionRefs.danger} style={{ marginBottom: 32 }}>
              <SectionLabel>Danger Zone</SectionLabel>
              <Card style={{
                border: "1px solid #e8c8bc",
                background: "#fdf8f6",
              }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#9e9888", marginBottom: 16 }}>
                  Permanently delete this church and all its data. This cannot be undone.
                </p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <Button danger onClick={() => setDeleting(true)} style={{ display: deleting ? "none" : undefined }}>
                    Transfer Ownership
                  </Button>
                  {!deleting ? (
                    <Button danger onClick={() => setDeleting(true)}>
                      Delete Church
                    </Button>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ color: "#c26a4a", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                        Are you sure? Click again to confirm.
                      </span>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(true)}
                        style={{
                          padding: "9px 16px", borderRadius: 8, border: "none",
                          background: "rgba(192,57,43,0.8)", color: "#fff",
                          fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer",
                        }}
                      >
                        Yes, Delete Forever
                      </button>
                      <Button onClick={() => setDeleting(false)}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* ── Sticky Save Button ── */}
          <div style={{
            position: "sticky", bottom: 24,
            display: "flex", alignItems: "center", gap: 14,
            justifyContent: "flex-end",
            paddingTop: 16,
          }}>
            {saved && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#3d6b44", fontWeight: 600 }}>Saved!</span>}
            <Button primary type="submit" disabled={saving} style={{ padding: "10px 28px", fontSize: 13, fontWeight: 700 }}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Church"
          message="This will permanently delete your church, all members, events, announcements, devotionals, and prayers. This action CANNOT be undone."
          confirmLabel="Delete Everything"
          onConfirm={handleDelete}
          onCancel={() => { setDeleteConfirm(false); setDeleting(false); }}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
