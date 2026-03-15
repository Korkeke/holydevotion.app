import { useState, useEffect } from "react";
import { COLORS } from "../../colors";
import { useAuth } from "../AuthContext";
import { get, put, del } from "../api";
import ConfirmDialog from "../components/ConfirmDialog";

const THEMES = {
  gold_navy:    { label: "Gold & Navy",    accent: "#c9a84c", bg: "#0a0e1a" },
  royal_purple: { label: "Royal Purple",   accent: "#9b59b6", bg: "#1a0e2e" },
  forest_green: { label: "Forest Green",   accent: "#27ae60", bg: "#0e1a14" },
  crimson:      { label: "Crimson",         accent: "#c0392b", bg: "#1a0e0e" },
  ocean_blue:   { label: "Ocean Blue",      accent: "#2980b9", bg: "#0e141a" },
  rose:         { label: "Rose",            accent: "#e84393", bg: "#1a0e16" },
  copper:       { label: "Copper",          accent: "#d4a373", bg: "#1a140e" },
  silver:       { label: "Silver",          accent: "#bdc3c7", bg: "#12141a" },
};

const FIELDS = [
  { key: "name", label: "Church Name", required: true },
  { key: "denomination", label: "Denomination" },
  { key: "city", label: "City" },
  { key: "website", label: "Website" },
  { key: "welcome_message", label: "Welcome Message", textarea: true },
  { key: "logo_url", label: "Logo URL" },
  { key: "banner_url", label: "Banner URL" },
];

export default function SettingsPage() {
  const { church, role, signOutUser } = useAuth();
  const [form, setForm] = useState({});
  const [selectedTheme, setSelectedTheme] = useState("gold_navy");
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
        setSelectedTheme(c.theme || "gold_navy");
      } catch {} finally { setLoading(false); }
    })();
  }, [church?.id]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const t = THEMES[selectedTheme];
      await put(`/api/churches/${church.id}`, {
        ...form,
        theme: selectedTheme,
        accent_color: t ? t.accent : form.accent_color,
      });
      setSaved(true);
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
          <span style={s.code}>{church?.invite_code || "—"}</span>
          <button style={s.copyBtn} onClick={copyCode}>
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
          <div style={s.saveRow}>
            <button type="submit" style={s.saveBtn} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            {saved && <span style={s.savedText}>Saved!</span>}
          </div>
        </form>
      </div>

      {/* Theme */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>App Theme</h2>
        <p style={s.sectionDesc}>Choose how your church looks in the Devotion app for your members.</p>
        <div style={s.themeGrid}>
          {Object.entries(THEMES).map(([key, t]) => (
            <button
              key={key}
              type="button"
              onClick={async () => {
                setSelectedTheme(key);
                await put(`/api/churches/${church.id}`, { theme: key, accent_color: t.accent });
              }}
              style={{
                ...s.themeCard,
                borderColor: selectedTheme === key ? t.accent : COLORS.border,
                boxShadow: selectedTheme === key ? `0 0 16px ${t.accent}33` : "none",
              }}
            >
              <div style={{
                width: "100%", height: 36, borderRadius: 8,
                background: t.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%",
                  background: t.accent,
                }} />
              </div>
              <span style={{
                fontFamily: "'Nunito Sans', sans-serif", fontSize: 11,
                color: selectedTheme === key ? t.accent : COLORS.textMuted,
                fontWeight: selectedTheme === key ? 700 : 400,
                marginTop: 6,
              }}>{t.label}</span>
            </button>
          ))}
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
              <span style={{ color: "#e57373", fontSize: 13, fontFamily: "'Nunito Sans', sans-serif" }}>
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
  page: { padding: "32px 40px", maxWidth: 720 },
  loading: { padding: 60, display: "flex", justifyContent: "center" },
  spinner: { width: 28, height: 28, border: `2px solid ${COLORS.gold}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  title: { fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 400, color: COLORS.text, marginBottom: 24 },
  section: {
    padding: "24px 28px", borderRadius: 14,
    background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
    marginBottom: 20,
  },
  sectionTitle: { fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: COLORS.text, marginBottom: 4 },
  sectionDesc: { fontFamily: "'Nunito Sans', sans-serif", fontSize: 13, color: COLORS.textMuted, marginBottom: 16 },
  codeRow: { display: "flex", alignItems: "center", gap: 12 },
  code: {
    fontFamily: "'Courier New', monospace", fontSize: 20, fontWeight: 700,
    color: COLORS.gold, letterSpacing: "0.08em",
    padding: "10px 20px", borderRadius: 10,
    background: COLORS.goldDim, border: `1px solid ${COLORS.borderHover}`,
  },
  copyBtn: {
    padding: "8px 18px", borderRadius: 8, border: `1px solid ${COLORS.borderHover}`,
    background: "transparent", color: COLORS.gold,
    fontFamily: "'Nunito Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  field: { marginBottom: 16 },
  label: { display: "block", fontFamily: "'Nunito Sans', sans-serif", fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" },
  input: {
    width: "100%", padding: "10px 14px", borderRadius: 8, boxSizing: "border-box",
    border: `1px solid ${COLORS.border}`, background: "rgba(255,255,255,0.04)",
    color: COLORS.text, fontFamily: "'Nunito Sans', sans-serif", fontSize: 14,
    outline: "none",
  },
  saveRow: { display: "flex", alignItems: "center", gap: 14, marginTop: 8 },
  saveBtn: {
    padding: "10px 28px", borderRadius: 10, border: "none",
    background: `linear-gradient(135deg, ${COLORS.gold}, #b8973e)`,
    color: "#fff", fontFamily: "'Nunito Sans', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer",
  },
  savedText: { fontFamily: "'Nunito Sans', sans-serif", fontSize: 13, color: COLORS.gold },
  themeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10,
  },
  themeCard: {
    padding: "10px 6px 8px",
    borderRadius: 12,
    border: `2px solid ${COLORS.border}`,
    background: "rgba(255,255,255,0.03)",
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
    color: "#e57373", fontFamily: "'Nunito Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  deleteConfirmRow: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  deleteConfirmBtn: {
    padding: "10px 20px", borderRadius: 8, border: "none",
    background: "rgba(192,57,43,0.8)", color: "#fff",
    fontFamily: "'Nunito Sans', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer",
  },
  cancelBtn: {
    padding: "10px 20px", borderRadius: 8,
    border: `1px solid ${COLORS.border}`, background: "transparent",
    color: COLORS.textMuted, fontFamily: "'Nunito Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
};
