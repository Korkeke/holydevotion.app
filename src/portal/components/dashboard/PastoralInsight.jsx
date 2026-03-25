import { useState } from "react";
import { usePortalTheme } from "../../context/ThemeContext";

/**
 * Pastoral Insight card with theme-aware gradient background.
 */

export default function PastoralInsight({ insightText, generating, onGenerate }) {
  const [expanded, setExpanded] = useState(false);
  const { palette } = usePortalTheme();
  const ins = palette.insight;

  // Split text into preview and full if long
  const sentences = (insightText || "").split(/(?<=[.!?])\s+/);
  const preview = sentences.slice(0, 3).join(" ");
  const hasMore = sentences.length > 3;
  const displayText = expanded ? insightText : preview;

  return (
    <div style={{ background: ins.bg, borderRadius: 16, padding: 24, position: "relative", overflow: "hidden" }}>
      {/* Decorative glows */}
      <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(circle, ${ins.glow1}, transparent)` }} />
      <div style={{ position: "absolute", bottom: -30, left: "30%", width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${ins.glow2}, transparent)` }} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, position: "relative" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "linear-gradient(135deg, #c8a855, #a68a3a)",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: ins.title }}>Pastoral Insight</div>
          <div style={{ fontSize: 12, color: ins.sub }}>Weekly spiritual health summary</div>
        </div>
      </div>

      {insightText ? (
        <>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: ins.text, margin: 0, position: "relative" }}>
            {displayText}
          </p>
          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                marginTop: 14, display: "flex", alignItems: "center", gap: 6,
                padding: "9px 18px", borderRadius: 8,
                border: `1px solid ${ins.accentBorder}`,
                background: ins.accentBg, color: ins.accent,
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                fontFamily: "inherit", transition: "all 0.2s",
              }}
            >
              {expanded ? "Collapse" : "Read Full Insight"}
            </button>
          )}
        </>
      ) : (
        <div style={{ position: "relative" }}>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: ins.text, margin: "0 0 14px", opacity: 0.7 }}>
            Generate a summary of your congregation's spiritual health this week.
          </p>
          <button
            onClick={onGenerate}
            disabled={generating}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 18px", borderRadius: 8,
              border: `1px solid ${ins.accentBorder}`,
              background: ins.accentBg, color: ins.accent,
              fontSize: 13, fontWeight: 500, cursor: generating ? "wait" : "pointer",
              fontFamily: "inherit", opacity: generating ? 0.6 : 1,
            }}
          >
            {generating ? "Generating..." : "Generate Insight"}
          </button>
        </div>
      )}
    </div>
  );
}
