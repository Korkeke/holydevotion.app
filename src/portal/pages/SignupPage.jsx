import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../AuthContext";

// Devotion brand colors (matches main website)
const BRAND = {
  bg: "#0a0e1a",
  navy: "#0f1632",
  gold: "#c9a84c",
  text: "#e8e4dc",
  textMuted: "rgba(232, 228, 220, 0.5)",
  border: "rgba(201, 168, 76, 0.1)",
};

const THEMES = {
  gold_navy:    { label: "Gold & Navy",      accent: "#c9a84c", bg: "#0D1F35" },
  royal_purple: { label: "Royal Purple",   accent: "#9b59b6", bg: "#1a0e2e" },
  forest_green: { label: "Forest Green",   accent: "#27ae60", bg: "#0e1a14" },
  crimson:      { label: "Crimson",         accent: "#c0392b", bg: "#1a0e0e" },
  ocean_blue:   { label: "Ocean Blue",      accent: "#2980b9", bg: "#0e141a" },
  rose:         { label: "Rose",            accent: "#e84393", bg: "#1a0e16" },
  copper:       { label: "Copper",          accent: "#d4a373", bg: "#1a140e" },
  silver:       { label: "Silver",          accent: "#bdc3c7", bg: "#12141a" },
};

const API_BASE = "https://devotion-backend-production.up.railway.app";

export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(null); // null = loading, 1 = account, 2 = church
  const [regCode, setRegCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [churchName, setChurchName] = useState("");
  const [denomination, setDenomination] = useState("");
  const [city, setCity] = useState("");
  const [theme, setTheme] = useState("gold_navy");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      // Coming back from Stripe payment
      fetch(`${API_BASE}/api/stripe/success?session_id=${sessionId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.code) {
            setRegCode(data.code);
            setStep(1); // Go to account creation
          } else {
            // No code returned, send to churches page
            window.location.href = "/churches";
          }
        })
        .catch(() => {
          window.location.href = "/churches";
        });
    } else if (searchParams.get("cancelled")) {
      setError("Payment was cancelled. You can try again on the Churches page.");
      setStep(1); // Show the form but they won't have a code
    } else {
      // No session_id, no payment. Send them to pick a plan first.
      window.location.href = "/churches";
    }
  }, []);

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
        theme,
        registration_code: regCode.trim(),
      });
      navigate("/portal/verify-email");
    } catch (err) {
      const msg = err?.code || err?.message || "";
      if (msg.includes("email-already-in-use")) {
        setError("An account with this email already exists.");
        setStep(1);
      } else if (msg.includes("Invalid registration code") || msg.includes("already used")) {
        setError(msg);
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Loading state while checking session_id
  if (step === null) {
    return (
      <div style={s.page}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
        <div style={s.spinner} />
      </div>
    );
  }

  const stepTitles = ["", "Create Your Account", "Set Up Your Church"];
  const stepSubtitles = ["", "Set up your admin credentials", "Tell us about your church"];

  return (
    <div style={s.page}>
      <style>{``}</style>

      <div style={s.card}>
        <div style={s.cross}>✝</div>
        <h1 style={s.title}>{stepTitles[step]}</h1>
        <p style={s.subtitle}>{stepSubtitles[step]}</p>

        {/* Step indicator */}
        <div style={s.steps}>
          {[1, 2].map((n, i) => (
            <div key={n} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && <div style={s.stepLine} />}
              <div style={{
                ...s.stepDot,
                background: step >= n ? BRAND.gold : BRAND.border,
              }} />
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          {step === 1 && (
            <>
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={s.input}
                placeholder="At least 6 characters"
              />
            </>
          )}

          {step === 2 && (
            <>
              <label style={s.label}>Church Name *</label>
              <input
                type="text"
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
                required
                style={s.input}
                placeholder="Grace Community Church"
                autoFocus
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

              <label style={{ ...s.label, marginTop: 20 }}>Theme</label>
              <div style={s.themeGrid}>
                {Object.entries(THEMES).map(([key, t]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTheme(key)}
                    style={{
                      ...s.themeCard,
                      borderColor: theme === key ? t.accent : BRAND.border,
                      boxShadow: theme === key ? `0 0 12px ${t.accent}33` : "none",
                    }}
                  >
                    <div style={{
                      width: "100%", height: 28, borderRadius: 6,
                      background: t.bg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <div style={{
                        width: 14, height: 14, borderRadius: "50%",
                        background: t.accent,
                      }} />
                    </div>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 10,
                      color: theme === key ? t.accent : BRAND.textMuted,
                      fontWeight: theme === key ? 700 : 400,
                      marginTop: 4,
                    }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {error && <p style={s.error}>{error}</p>}

          <button type="submit" disabled={loading} style={s.button}>
            {loading
              ? "..."
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
              Back
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
    background: BRAND.bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    fontFamily: "'DM Sans', sans-serif",
  },
  spinner: {
    width: 28,
    height: 28,
    border: `2px solid ${BRAND.gold}`,
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    padding: "48px 36px",
    borderRadius: 20,
    background: BRAND.navy,
    border: `1px solid ${BRAND.border}`,
    textAlign: "center",
  },
  cross: {
    fontSize: 32,
    color: BRAND.gold,
    marginBottom: 16,
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 28,
    fontWeight: 700,
    color: BRAND.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: BRAND.textMuted,
    marginBottom: 24,
  },
  steps: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    transition: "background 0.3s",
  },
  stepLine: {
    width: 30,
    height: 2,
    background: BRAND.border,
  },
  form: {
    textAlign: "left",
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: BRAND.textMuted,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    display: "block",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: `1px solid ${BRAND.border}`,
    background: BRAND.bg,
    color: BRAND.text,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  themeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 8,
  },
  themeCard: {
    padding: "8px 4px 6px",
    borderRadius: 10,
    border: `2px solid ${BRAND.border}`,
    background: BRAND.bg,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    transition: "all 0.2s",
  },
  error: {
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
    background: `linear-gradient(135deg, ${BRAND.gold}, #b8973e)`,
    color: "#fff",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 0.2s",
    boxShadow: "0 4px 20px rgba(201, 168, 76, 0.3)",
  },
  backBtn: {
    width: "100%",
    marginTop: 10,
    padding: "12px 0",
    borderRadius: 12,
    border: `1px solid ${BRAND.border}`,
    background: "transparent",
    color: BRAND.textMuted,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    cursor: "pointer",
  },
  footer: {
    fontSize: 13,
    color: BRAND.textMuted,
    marginTop: 24,
  },
  link: {
    color: BRAND.gold,
    textDecoration: "none",
    fontWeight: 600,
  },
};
