/**
 * Styled checkbox for bulk selection.
 * Usage: <Checkbox checked={selected} onChange={(val) => setSelected(val)} />
 */

export default function Checkbox({ checked, onChange }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      style={{
        width: 18, height: 18, borderRadius: 5,
        border: checked ? "none" : "1.5px solid #d0cbc2",
        background: checked ? "#3d6b44" : "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.15s",
        flexShrink: 0,
      }}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </div>
  );
}
