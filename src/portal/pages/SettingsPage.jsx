import { useState, useEffect } from "react";
import { useChurchColors } from "../useChurchColors";
import { COLORS } from "../../colors";
import { useAuth } from "../AuthContext";
import { get, put, del } from "../api";
import ConfirmDialog from "../components/ConfirmDialog";
import ImageUpload from "../components/ImageUpload";

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

export default function SettingsPage() {
  const COLORS = useChurchColors();
  const { church, role, signOutUser, reloadChurch } = useAuth();
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

  useEffect(() => {
    if (!church?.id) return;
    (async () => {
      try {
        const data = await get(`/api/churches/${church.id}`);
        const c = data?.church || data || {};
        const vals = {};
        FIELDS.forEach((f) => { vals[f.key] = c[f.key] || ""; });
        setForm(vals);
        const th = c.theme || "sage_green";
        setSelectedTheme(th);
        setAccentColor(c.accent_color || "#3D6B5E");
        setSecondaryColor(c.secondary_color || "#D4A853");
        setIsCustom(th === "custom" || !THEMES[th]);
      } catch {} finally { setLoading(false); }
    })();
  }, [church?.id]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await put(`/api/churches/${church.id}`, {
        ...form,
        theme: isCustom ? "custom" : selectedTheme,
        accent_color: accentColor,
        secondary_color: secondaryColor,
      });
      setSaved(true);
      reloadChurch(); // update portal colors immediately
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

  const isOwner = role === "owner";

  if (loading) return <div style={s.loading}><div style={s.spinner} /></div>;

  return (
    <div style={s.page}>
      <h1 style={s.title}>Settings</h1>

      {/* Invite Code */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Invite Code</h2>
        <p style={s.sectionDesc}>Share this code with members so they can join your church in the app.</p>
        <div style={s.codeRow}>
          <span style={{ ...s.code, color: COLORS.accent, background: COLORS.accentLight }}>{church?.invite_code || "—"}</span>
          <button style={{ ...s.copyBtn, color: COLORS.accent }} onClick={copyCode}>
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Church Profile */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Church Profile</h2>
        <form onSubmit={handleSave}>
          {FIELDS.map((f) => (
            <div key={f.key} style={s.field}>
              <label style={s.label}>
                {f.label}{f.required && <span style={{ color: "#e57373" }}> *</span>}
              </label>
              {f.textarea ? (
                <textarea
                  style={{ ...s.input, minHeight: 80, resize: "vertical" }}
                  value={form[f.key] || ""}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder || ""}
                />
              ) : (
                <input
                  style={s.input}
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

          <div style={s.saveRow}>
            <button type="submit" style={{ ...s.saveBtn, background: COLORS.accent, boxShadow: `0 4px 12px ${COLORS.accent}25` }} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            {saved && <span style={{ ...s.savedText, color: COLORS.accent }}>Saved!</span>}
          </div>
        </form>
      </div>

      {/* Theme */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Church Theme</h2>
        <p style={s.sectionDesc}>These colors apply to both this dashboard and your church's space in the Devotion app.</p>
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
                  ...s.themeCard,
                  borderColor: selected ? t.accent : COLORS.border,
                  boxShadow: selected ? `0 0 16px ${t.accent}33` : "none",
                }}
              >
                <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: t.accent, border: `2px solid ${COLORS.bgCard}`, boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: t.secondary, border: `2px solid ${COLORS.bgCard}`, boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                </div>
                <span style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 10,
                  color: selected ? t.accent : COLORS.textMuted,
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
          border: `1px solid ${isCustom ? accentColor : COLORS.border}`,
          background: isCustom ? `${accentColor}10` : "transparent",
          transition: "all 0.2s",
        }}>
          <button
            type="button"
            onClick={() => setIsCustom(true)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
              color: isCustom ? COLORS.text : COLORS.textMuted,
              padding: 0, marginBottom: isCustom ? 12 : 0,
              display: "block",
            }}
          >
            🎨 Custom Colors
          </button>
          {isCustom && (
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Primary</label>
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
                    style={{ ...s.fieldInput, fontFamily: "monospace", fontSize: 12, padding: "6px 8px", width: "100%" }}
                  />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Accent</label>
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
                    style={{ ...s.fieldInput, fontFamily: "monospace", fontSize: 12, padding: "6px 8px", width: "100%" }}
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
                style={{ ...s.saveBtn, background: COLORS.accent, boxShadow: `0 4px 12px ${COLORS.accent}25`, alignSelf: "flex-end", padding: "8px 16px", fontSize: 12 }}
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      {isOwner && (
        <div style={s.dangerSection}>
          <h2 style={{ ...s.sectionTitle, color: "#e57373" }}>Danger Zone</h2>
          <p style={s.sectionDesc}>
            Permanently delete this church and all its data. This cannot be undone.
          </p>
          {!deleting ? (
            <button style={s.deleteBtn} onClick={() => setDeleting(true)}>
              Delete Church
            </button>
          ) : (
            <div style={s.deleteConfirmRow}>
              <span style={{ color: "#e57373", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                Are you sure? Click again to confirm.
              </span>
              <button style={s.deleteConfirmBtn} onClick={() => setDeleteConfirm(true)}>
                Yes, Delete Forever
              </button>
              <button style={s.cancelBtn} onClick={() => setDeleting(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

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

const s = {
  page: { padding: "32px 40px", maxWidth: 800 },
  loading: { padding: 60, display: "flex", justifyContent: "center" },
  spinner: { width: 28, height: 28, border: `2px solid ${COLORS.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  title: { fontFamily: "var(--heading)", fontSize: 26, fontWeight: 700, color: COLORS.text, marginBottom: 24 },
  section: {
    padding: "24px 28px", borderRadius: 16,
    background: COLORS.card, border: `1px solid ${COLORS.border}`,
    marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
  },
  sectionTitle: { fontFamily: "var(--heading)", fontSize: 20, fontWeight: 700, color: COLORS.text, marginBottom: 4 },
  sectionDesc: { fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: COLORS.textMuted, marginBottom: 16 },
  codeRow: { display: "flex", alignItems: "center", gap: 12 },
  code: {
    fontFamily: "'Courier New', monospace", fontSize: 20, fontWeight: 700,
    color: COLORS.accent, letterSpacing: "0.08em",
    padding: "10px 20px", borderRadius: 10,
    background: COLORS.accentLight, border: `1px solid ${COLORS.border}`,
  },
  copyBtn: {
    padding: "8px 18px", borderRadius: 8, border: `1px solid ${COLORS.border}`,
    background: "transparent", color: COLORS.accent,
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  field: { marginBottom: 16 },
  label: { display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" },
  input: {
    width: "100%", padding: "10px 14px", borderRadius: 8, boxSizing: "border-box",
    border: `1px solid ${COLORS.border}`, background: COLORS.bg,
    color: COLORS.text, fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    outline: "none",
  },
  saveRow: { display: "flex", alignItems: "center", gap: 14, marginTop: 8 },
  saveBtn: {
    padding: "10px 28px", borderRadius: 10, border: "none",
    background: COLORS.accent,
    color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer",
  },
  savedText: { fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: COLORS.accent },
  themeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10,
  },
  themeCard: {
    padding: "10px 6px 8px",
    borderRadius: 12,
    border: `2px solid ${COLORS.border}`,
    background: COLORS.bg,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    transition: "all 0.2s",
  },
  dangerSection: {
    padding: "24px 28px", borderRadius: 14,
    background: "rgba(192,57,43,0.06)", border: "1px solid rgba(192,57,43,0.2)",
    marginBottom: 20,
  },
  deleteBtn: {
    padding: "10px 20px", borderRadius: 8,
    border: "1px solid rgba(192,57,43,0.4)", background: "transparent",
    color: "#e57373", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  deleteConfirmRow: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  deleteConfirmBtn: {
    padding: "10px 20px", borderRadius: 8, border: "none",
    background: "rgba(192,57,43,0.8)", color: "#fff",
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer",
  },
  cancelBtn: {
    padding: "10px 20px", borderRadius: 8,
    border: `1px solid ${COLORS.border}`, background: "transparent",
    color: COLORS.textMuted, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
};
