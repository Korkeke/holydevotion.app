import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { COLORS } from "../../colors";

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      navigate("/portal");
    } catch (err) {
      const code = err?.code || "";
      if (code.includes("user-not-found") || code.includes("wrong-password") || code.includes("invalid-credential")) {
        setError("Invalid email or password.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.cross}>✝</div>
        <h1 style={s.title}>Church Portal</h1>
        <p style={s.subtitle}>Sign in to manage your church</p>

        <form onSubmit={handleSubmit} style={s.form}>
          <label style={s.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={s.input}
            placeholder="pastor@church.org"
          />

          <label style={{ ...s.label, marginTop: 16 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={s.input}
            placeholder="••••••••"
          />

          {error && <p style={s.error}>{error}</p>}

          <button type="submit" disabled={loading} style={s.button}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={s.footer}>
          Don't have an account?{" "}
          <Link to="/portal/signup" style={s.link}>Create one</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: COLORS.bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: "48px 36px",
    borderRadius: 20,
    background: COLORS.bgCard,
    border: `1px solid ${COLORS.border}`,
    textAlign: "center",
  },
  cross: {
    fontSize: 32,
    color: COLORS.goldLight,
    marginBottom: 16,
  },
  title: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 28,
    fontWeight: 400,
    color: COLORS.text,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 32,
  },
  form: {
    textAlign: "left",
  },
  label: {
    fontFamily: "'Nunito Sans', sans-serif",
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
    padding: "12px 14px",
    borderRadius: 10,
    border: `1px solid rgba(201, 168, 76, 0.15)`,
    background: "rgba(255,255,255,0.04)",
    color: COLORS.text,
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  error: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 13,
    color: "#e57373",
    marginTop: 12,
  },
  button: {
    width: "100%",
    marginTop: 24,
    padding: "14px 0",
    borderRadius: 12,
    border: "none",
    background: `linear-gradient(135deg, ${COLORS.gold}, #b8973e)`,
    color: "#fff",
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  footer: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 24,
  },
  link: {
    color: COLORS.gold,
    textDecoration: "none",
    fontWeight: 600,
  },
};
