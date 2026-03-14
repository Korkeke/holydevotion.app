import { COLORS } from "../../colors";

export default function DataTable({ columns, data, emptyMessage = "Nothing here yet." }) {
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
    borderRadius: 12,
    border: `1px solid ${COLORS.border}`,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 14,
  },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    background: "rgba(15, 22, 45, 0.5)",
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    borderBottom: `1px solid ${COLORS.border}`,
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: `1px solid ${COLORS.border}`,
  },
  td: {
    padding: "12px 16px",
    color: COLORS.text,
    verticalAlign: "middle",
  },
  empty: {
    padding: "48px 20px",
    textAlign: "center",
    borderRadius: 12,
    border: `1px solid ${COLORS.border}`,
  },
  emptyText: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 14,
    color: COLORS.textDim,
  },
};
