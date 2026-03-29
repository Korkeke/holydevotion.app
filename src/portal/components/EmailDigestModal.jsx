import { useState, useEffect } from "react";
import { COLORS } from "../../colors";
import { useChurchColors } from "../useChurchColors";
import { useAuth } from "../AuthContext";
import { post } from "../api";

export default function EmailDigestModal({ onClose }) {
  const C = useChurchColors();
  const { church, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [email, setEmail] = useState(user?.email || "");

  useEffect(() => {
    if (!church?.id) return;
    (async () => {
      try {
        const data = await post(`/api/churches/${church.id}/digest/preview`);
        setStats(data.stats);
        setPreviewHtml(data.html);
      } catch (e) {
        setError("Failed to load digest preview");
      } finally {
        setLoading(false);
      }
    })();
  }, [church?.id]);

  const handleSend = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const result = await post(`/api/churches/${church.id}/digest/send`, { email: email.trim() });
      setSent(result.sent_to);
    } catch (e) {
      setError(e.message || "Failed to send digest");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={s.modal}>
        {/* Header */}
        <div style={{ padding: "16px 24px", background: C.accent, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.06em" }}>Weekly Digest</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>This Week at {church?.name || "Church"}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", opacity: 0.7, padding: "4px 8px" }}>&times;</button>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <div style={{ width: 24, height: 24, border: "2px solid #3d6b44", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
              <div style={{ fontSize: 13, color: C.sec }}>Loading digest...</div>
            </div>
          ) : error && !stats ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#b05a3a", fontSize: 13 }}>{error}</div>
          ) : stats ? (
            <>
              {/* Stats summary */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
                {[
                  { label: "Active", value: stats.active_count, color: "#3d6b44" },
                  { label: "Messages", value: stats.total_messages, color: "#8b6914" },
                  { label: "New Members", value: stats.new_member_count, color: "#5a7d9a" },
                  { label: "Prayers", value: stats.prayer_count, color: "#b05a3a" },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: "center", padding: 10, borderRadius: 10, background: s.color + "10" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: C.sec }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Top themes */}
              {stats.top_themes?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.sec, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Top Themes</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {stats.top_themes.map(([theme, count], i) => (
                      <span key={i} style={{
                        fontSize: 11, padding: "4px 10px", borderRadius: 20,
                        background: "#faf6ee", border: "1px solid #ece7dd",
                        color: "#5a5647",
                      }}>
                        {theme} ({count})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Declining members */}
              {stats.declining?.length > 0 && (
                <div style={{ marginBottom: 16, padding: "10px 12px", borderRadius: 8, background: "#fdf8f6", border: "1px solid #e8c8bc" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#b05a3a", marginBottom: 4 }}>Needs Attention</div>
                  {stats.declining.map((m, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#5a5647", marginBottom: 2 }}>
                      {m.name} {m.days_inactive ? `(${m.days_inactive}d inactive)` : ""}
                    </div>
                  ))}
                </div>
              )}

              {/* Insight preview */}
              {stats.insight && (
                <div style={{ padding: "10px 12px", borderRadius: 8, background: "#f4f8f5", borderLeft: "3px solid #3d6b44", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#3d6b44", marginBottom: 4 }}>Pastoral Insight</div>
                  <div style={{ fontSize: 12, color: "#5a5647", lineHeight: 1.5 }}>
                    {stats.insight.length > 200 ? stats.insight.slice(0, 200) + "..." : stats.insight}
                  </div>
                </div>
              )}
            </>
          ) : null}

          {/* Actions */}
          <div style={{ marginTop: 20 }}>
            {sent ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, marginBottom: 8 }}>&#10003;</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#3d6b44", marginBottom: 4 }}>Digest Sent!</div>
                <div style={{ fontSize: 12, color: C.sec }}>Check your inbox at {sent}</div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{
                    display: "block", fontSize: 11, fontWeight: 600, color: C.sec,
                    textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6,
                  }}>Send to</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="pastor@example.com"
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 8, boxSizing: "border-box",
                      border: "1px solid #ece7dd", background: "#f7f4ef",
                      color: "#2c2a25", fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                      outline: "none",
                    }}
                    onFocus={e => e.target.style.borderColor = "#3d6b44"}
                    onBlur={e => e.target.style.borderColor = "#ece7dd"}
                  />
                </div>
                <div style={{ textAlign: "center" }}>
                  <button
                    onClick={handleSend}
                    disabled={sending || loading || (!stats && !error)}
                    style={{
                      padding: "10px 24px", borderRadius: 10, border: "none",
                      background: sending ? "#9e9888" : C.accent, color: "#fff",
                      fontSize: 13, fontWeight: 700, cursor: sending ? "default" : "pointer",
                      fontFamily: "var(--body)",
                      boxShadow: `0 4px 12px ${C.accent}25`,
                      opacity: (sending || loading) ? 0.6 : 1,
                    }}
                  >
                    {sending ? "Sending..." : "Send Digest"}
                  </button>
                  {error && (
                    <div style={{ fontSize: 12, color: "#b05a3a", marginTop: 8 }}>{error}</div>
                  )}
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
                    Sends a formatted digest email with this week's overview
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 100,
    background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  modal: {
    width: 560, background: COLORS.card, borderRadius: 20, padding: 0,
    boxShadow: "0 24px 60px rgba(0,0,0,0.15)", overflow: "hidden",
    maxHeight: "85vh", overflowY: "auto",
  },
};
