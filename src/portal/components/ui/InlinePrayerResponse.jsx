import { useState } from "react";
import Button from "./Button";

/**
 * Inline expandable textarea for pastoral prayer responses.
 * UI-only for now -- submit is a placeholder until a backend endpoint exists.
 */

export default function InlinePrayerResponse({ onClose }) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    // TODO: Wire to POST /churches/{id}/prayer-wall/{prayerId}/respond when endpoint exists
    if (text.trim()) {
      onClose?.();
    }
  };

  return (
    <div style={{
      marginTop: 12, padding: 12, borderRadius: 8, background: "#faf6ee",
    }}>
      <textarea
        placeholder="Write a pastoral response..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          width: "100%", padding: 10, borderRadius: 8,
          border: "1px solid #e0dbd1", fontSize: 13,
          fontFamily: "inherit", background: "#fff",
          resize: "vertical", minHeight: 60,
          outline: "none", boxSizing: "border-box",
        }}
      />
      <div style={{
        display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8,
      }}>
        <Button small ghost onClick={onClose}>Cancel</Button>
        <Button small primary onClick={handleSubmit} disabled={!text.trim()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          Send
        </Button>
      </div>
    </div>
  );
}
