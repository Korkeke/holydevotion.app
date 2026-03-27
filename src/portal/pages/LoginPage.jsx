import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { get } from "../api";

const SAGE = "#3D6B5E";
const LINEN = "#FAF8F5";

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cred = await signIn(email, password);
      // Firebase signIn returns void from our wrapper, so grab user from auth
      const { auth } = await import("../../firebase");
      const signedInUser = auth.currentUser;
      if (signedInUser && !signedInUser.emailVerified) {
        navigate("/portal/verify-email");
        return;
      }
      // Check if user has a church — if not, send to onboarding
      try {
        const data = await get("/api/churches/me");
        const churches = data?.churches || [];
        if (churches.length === 0) {
          navigate("/portal/signup");
          return;
        }
      } catch {
        // Network error checking churches — proceed to portal anyway,
        // it will handle the no-church state
      }
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
      <style>{`
        input:focus { outline: none; border-color: ${SAGE} !important; }
      `}</style>

      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 36, color: SAGE, lineHeight: 1 }}>✝</div>
        <div style={{
          fontFamily: "var(--heading)", fontSize: 18, fontWeight: 600,
          color: SAGE, marginTop: 6, letterSpacing: "0.02em",
        }}>Devotion</div>
      </div>

      <div style={s.card}>
        <h1 style={s.title}>Welcome back</h1>
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
            autoFocus
          />

          <label style={{ ...s.label, marginTop: 16 }}>Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={s.input}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={s.eyeBtn}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {error && <p style={s.error}>{error}</p>}

          <button type="submit" disabled={loading} style={s.button}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={s.footer}>
          Don't have an account?{" "}
          <a href="/churches" style={s.link}>Get started</a>
        </p>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: `radial-gradient(ellipse at center, #FDFCFA 0%, ${LINEN} 70%)`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    padding: "40px 36px",
    borderRadius: 20,
    background: "#FFFFFF",
    border: "1px solid #EDE9E3",
    boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
  },
  title: {
    fontFamily: "var(--heading)",
    fontSize: 24,
    fontWeight: 700,
    color: "#2C2C2C",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#7A7672",
    marginBottom: 28,
    textAlign: "center",
  },
  form: {
    textAlign: "left",
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#7A7672",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    display: "block",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #EDE9E3",
    background: "#FDFCFA",
    color: "#2C2C2C",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#7A7672",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
  error: {
    fontSize: 13,
    color: "#c0392b",
    marginTop: 12,
  },
  button: {
    width: "100%",
    marginTop: 24,
    padding: "14px 0",
    borderRadius: 12,
    border: "none",
    background: SAGE,
    color: "#fff",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 0.2s",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  },
  footer: {
    fontSize: 13,
    color: "#7A7672",
    marginTop: 24,
    textAlign: "center",
  },
  link: {
    color: SAGE,
    textDecoration: "none",
    fontWeight: 600,
  },
};
