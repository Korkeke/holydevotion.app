/**
 * Card container with white background and warm border.
 * Usage: <Card>content</Card>
 *        <Card noPad>table content</Card>
 */

export default function Card({ children, noPad, style }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      border: "1px solid #ece7dd",
      padding: noPad ? 0 : 20,
      overflow: "hidden",
      transition: "all 0.2s",
      ...style,
    }}>
      {children}
    </div>
  );
}
