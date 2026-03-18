import { useState, useEffect } from "react";
import { useChurchColors } from "../useChurchColors";
import { COLORS } from "../../colors";

export default function FormModal({ title, fields, initialValues = {}, onSubmit, onClose, submitLabel = "Save" }) {
  const COLORS = useChurchColors();
  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setValues(initialValues);
  }, []);

  function handleChange(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSubmit(values);
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={s.title}>{title}</h2>

        <form onSubmit={handleSubmit}>
          {fields.map((field) => (
            <div key={field.name} style={s.fieldGroup}>
              <label style={s.label}>
                {field.label}
                {field.required && <span style={{ color: COLORS.red }}> *</span>}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  value={values[field.name] || ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  required={field.required}
                  placeholder={field.placeholder}
                  rows={field.rows || 4}
                  style={{ ...s.input, minHeight: 100, resize: "vertical" }}
                />
              ) : field.type === "select" ? (
                <select
                  value={values[field.name] || ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  style={s.input}
                >
                  {field.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : field.type === "checkbox" ? (
                <label style={s.checkLabel}>
                  <input
                    type="checkbox"
                    checked={!!values[field.name]}
                    onChange={(e) => handleChange(field.name, e.target.checked)}
                    style={s.checkbox}
                  />
                  <span>{field.checkLabel || field.label}</span>
                </label>
              ) : (
                <input
                  type={field.type || "text"}
                  value={values[field.name] || ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  required={field.required}
                  placeholder={field.placeholder}
                  style={s.input}
                />
              )}
            </div>
          ))}

          {error && <p style={s.error}>{error}</p>}

          <div style={s.actions}>
            <button type="button" onClick={onClose} style={s.cancelBtn}>Cancel</button>
            <button type="submit" disabled={loading} style={s.submitBtn}>
              {loading ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
    padding: 20,
    overflowY: "auto",
  },
  modal: {
    width: "100%",
    maxWidth: 520,
    padding: "32px 28px",
    borderRadius: 16,
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 24,
    fontWeight: 700,
    color: COLORS.text,
    marginBottom: 24,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    color: COLORS.textMuted,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    display: "block",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: `1.5px solid ${COLORS.border}`,
    background: COLORS.bg,
    color: COLORS.text,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  checkLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: COLORS.text,
    cursor: "pointer",
  },
  checkbox: {
    width: 16,
    height: 16,
    accentColor: COLORS.accent,
  },
  error: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: COLORS.red,
    marginBottom: 12,
  },
  actions: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 24,
  },
  cancelBtn: {
    padding: "10px 20px",
    borderRadius: 8,
    border: `1.5px solid ${COLORS.border}`,
    background: COLORS.card,
    color: COLORS.textSec,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  submitBtn: {
    padding: "10px 24px",
    borderRadius: 8,
    border: "none",
    background: COLORS.accent,
    color: "#fff",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
};
