import { COLORS } from "../../colors";
import { useChurchColors } from "../useChurchColors";

export default function DataTable({ columns, data, emptyMessage = "Nothing here yet." }) {
  const COLORS = useChurchColors();
  if (!data || data.length === 0) {
    return (
      <div style={s.empty}>
        <p style={s.emptyText}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div style={s.wrapper}>
      <table style={s.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ ...s.th, ...(col.width ? { width: col.width } : {}) }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id || i} style={s.tr}>
              {columns.map((col) => (
                <td key={col.key} style={s.td}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const s = {
  wrapper: {
    overflowX: "auto",
    borderRadius: 14,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.card,
    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontFamily: "var(--body)",
    fontSize: 14,
  },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    background: COLORS.bgDeep,
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    borderBottom: `1px solid ${COLORS.border}`,
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: `1px solid ${COLORS.borderLight}`,
  },
  td: {
    padding: "12px 16px",
    color: COLORS.text,
    verticalAlign: "middle",
  },
  empty: {
    padding: "48px 20px",
    textAlign: "center",
    borderRadius: 14,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.card,
  },
  emptyText: {
    fontFamily: "var(--body)",
    fontSize: 14,
    color: COLORS.muted,
  },
};
