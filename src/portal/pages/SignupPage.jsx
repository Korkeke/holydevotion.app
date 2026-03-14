import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { COLORS } from "../../colors";

export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [churchName, setChurchName] = useState("");
  const [denomination, setDenomination] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (step === 1) {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setLoading(false);
        return;
      }
      setStep(2);
      setLoading(false);
      return;
    }

    // Step 2: Create account + church
    try {
      await signUp(email, password, {
        name: churchName,
        denomination: denomination || undefined,
        city: city || undefined,
      });
      navigate("/portal");
    } catch (err) {
      const code = err?.code || err?.message || "";
      if (code.includes("email-already-in-use")) {
        setError("An account with this email already exists.");
        setStep(1);
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.cross}>✝</div>
        <h1 style={s.title}>
          {step === 1 ? "Create Your Account" : "Set Up Your Church"}
        </h1>
        <p style={s.subtitle}>
          {step === 1
            ? "Start your 7-day free trial"
            : "Tell us about your church"}
        </p>

        {/* Step indicator */}
        <div style={s.steps}>
          <div style={{ ...s.stepDot, background: COLORS.gold }} />
          <div style={s.stepLine} />
          <div style={{
            ...s.stepDot,
            background: step === 2 ? COLORS.gold : "rgba(201,168,76,0.2)",
          }} />
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          {step === 1 ? (
            <>
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
                placeholder="At least 6 characters"
              />
            </>
          ) : (
            <>
              <label style={s.label}>Church Name *</label>
              <input
                type="text"
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
                required
                style={s.input}
                placeholder="Grace Community Church"
              />

              <label style={{ ...s.label, marginTop: 16 }}>
                Denomination <span style={{ opacity: 0.5 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={denomination}
                onChange={(e) => setDenomination(e.target.value)}
                style={s.input}
                placeholder="e.g. Baptist, Non-denominational"
              />

              <label style={{ ...s.label, marginTop: 16 }}>
                City <span style={{ opacity: 0.5 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={s.input}
                placeholder="e.g. Dallas, TX"
              />
            </>
          )}

          {error && <p style={s.error}>{error}</p>}

          <button type="submit" disabled={loading} style={s.button}>
            {loading
              ? step === 1
                ? "Next..."
                : "Creating..."
              : step === 1
                ? "Next"
                : "Create Church"}
          </button>

          {step === 2 && (
            <button
              type="button"
              onClick={() => { setStep(1); setError(""); }}
              style={s.backBtn}
            >
              ← Back
            </button>
          )}
        </form>

        <p style={s.footer}>
          Already have an account?{" "}
          <Link to="/portal/login" style={s.link}>Sign in</Link>
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
    marginBottom: 24,
  },
  steps: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
    marginBottom: 28,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    transition: "background 0.3s",
  },
  stepLine: {
    width: 40,
    height: 2,
    background: "rgba(201,168,76,0.2)",
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
  backBtn: {
    width: "100%",
    marginTop: 10,
    padding: "12px 0",
    borderRadius: 12,
    border: `1px solid rgba(201,168,76,0.2)`,
    background: "transparent",
    color: COLORS.textMuted,
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 14,
    cursor: "pointer",
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
