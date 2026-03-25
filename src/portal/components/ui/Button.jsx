/**
 * Button component with primary/outline/danger/ghost variants.
 * Usage: <Button primary>Save</Button>
 *        <Button danger small>Delete</Button>
 */

export default function Button({
  children, primary, danger, ghost, small, onClick, style, disabled, type = "button",
}) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 500,
    fontSize: small ? 12 : 13,
    border: "none",
    transition: "all 0.2s",
    fontFamily: "inherit",
    padding: small ? "7px 12px" : "9px 16px",
    opacity: disabled ? 0.5 : 1,
  };

  let variant;
  if (primary) {
    variant = {
      background: "#3d6b44",
      color: "#fff",
      boxShadow: "0 1px 3px rgba(61,107,68,0.2)",
    };
  } else if (danger) {
    variant = {
      background: "#fff",
      color: "#c26a4a",
      border: "1px solid #e8c8bc",
    };
  } else if (ghost) {
    variant = {
      background: "transparent",
      color: "#8b6914",
      border: "none",
      padding: small ? "4px 8px" : "6px 10px",
    };
  } else {
    variant = {
      background: "#fff",
      color: "#5a5647",
      border: "1px solid #e0dbd1",
    };
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variant, ...style }}
    >
      {children}
    </button>
  );
}
