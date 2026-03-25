/**
 * Toggle pill for filter groups.
 * Usage: <FilterButton active={tab === "All"} onClick={...} count={5}>All</FilterButton>
 */

export default function FilterButton({ active, children, onClick, count }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 14px",
      borderRadius: 8,
      fontSize: 12,
      fontWeight: 500,
      cursor: "pointer",
      fontFamily: "inherit",
      border: active ? "none" : "1px solid #e0dbd1",
      background: active ? "#2c2a25" : "#fff",
      color: active ? "#fff" : "#5a5647",
      display: "flex",
      alignItems: "center",
      gap: 4,
      transition: "all 0.15s",
    }}>
      {children}
      {count !== undefined && (
        <span style={{
          fontSize: 10, fontWeight: 700,
          background: active ? "rgba(255,255,255,0.2)" : "#f0ebe3",
          padding: "1px 5px", borderRadius: 4,
        }}>
          {count}
        </span>
      )}
    </button>
  );
}
