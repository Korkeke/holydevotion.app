import { useState } from "react";
import { COLORS } from "../../colors";

// TODO: Backend endpoint needed to deliver messages to the Flutter app
export default function PastoralMessageModal({ recipientName, onClose }) {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  function handleSend() {
    if (!text.trim()) return;
    // TODO: POST to backend messaging endpoint when available
    setSent(true);
  }

  return (
    <div style={s.overlay} onClick={() => { onClose(); setSent(false); setText(""); }}>
      <div onClick={e => e.stopPropagation()} style={s.modal}>
        {sent ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💌</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, fontFamily: "var(--heading)" }}>Message Sent</div>
            <div style={{ fontSize: 13, color: COLORS.sec, marginTop: 8 }}>{recipientName} will see your note in their Devotion app.</div>
            <button onClick={() => { onClose(); setSent(false); setText(""); }} style={{ ...s.btn, ...s.primaryBtn, marginTop: 20 }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, fontFamily: "var(--heading)", marginBottom: 4 }}>Send a Note to {recipientName}</div>
            <div style={{ fontSize: 13, color: COLORS.sec, marginBottom: 16 }}>This message will appear as a personal notification in their Devotion app.</div>
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Hey, just thinking about you. How are you doing?" style={s.textarea} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button onClick={() => { onClose(); setText(""); }} style={s.btn}>Cancel</button>
              <button onClick={handleSend} style={{ ...s.btn, ...s.primaryBtn }}>Send Note</button>
            </div>
          </>
        )}
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
    width: 440, background: COLORS.card, borderRadius: 20, padding: 28,
    boxShadow: "0 24px 60px rgba(0,0,0,0.15)",
  },
  textarea: {
    width: "100%", padding: 14, borderRadius: 12,
    border: `1px solid ${COLORS.border}`, background: COLORS.bg,
    fontSize: 14, fontFamily: "var(--body)", color: COLORS.text,
    resize: "none", height: 120, outline: "none",
  },
  btn: {
    padding: "10px 20px", borderRadius: 10,
    border: `1.5px solid ${COLORS.border}`, background: COLORS.card,
    color: COLORS.body, fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "var(--body)",
  },
  primaryBtn: {
    border: "none", background: COLORS.accent, color: "#fff",
    boxShadow: `0 4px 12px ${COLORS.accent}25`,
  },
};
