import Button from "./Button";

/**
 * Empty state with emoji, title, description, and optional CTA.
 */

export default function EmptyState({ emoji, title, desc, action, onAction }) {
  return (
    <div style={{
      padding: "48px 32px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: "linear-gradient(135deg, #faf6ee, #f0ebe3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 32, marginBottom: 16,
        boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
      }}>
        {emoji}
      </div>
      <div style={{
        fontSize: 16, fontWeight: 600, color: "#2c2a25",
        marginBottom: 6, fontFamily: "'DM Serif Display', serif",
      }}>
        {title}
      </div>
      <div style={{
        fontSize: 13, color: "#9e9888",
        maxWidth: 320, lineHeight: 1.5,
        marginBottom: action ? 20 : 0,
      }}>
        {desc}
      </div>
      {action && <Button primary onClick={onAction}>{action}</Button>}
    </div>
  );
}
