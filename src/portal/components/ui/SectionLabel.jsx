/**
 * Uppercase section label with optional right-side action.
 * Usage: <SectionLabel right="View All" onRightClick={...}>Recent Activity</SectionLabel>
 */

export default function SectionLabel({ children, right, onRightClick }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: "#9e9888",
        textTransform: "uppercase", letterSpacing: "0.04em",
      }}>
        {children}
      </div>
      {right && (
        <span
          onClick={onRightClick}
          style={{
            fontSize: 12, color: "#8b6914",
            cursor: "pointer", fontWeight: 500,
            transition: "color 0.15s",
          }}
        >
          {right}
        </span>
      )}
    </div>
  );
}
