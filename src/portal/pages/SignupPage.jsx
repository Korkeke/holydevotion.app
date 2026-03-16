import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { COLORS } from "../../colors";

const PLANS = [
  {
    id: "church",
    name: "Church",
    price: "$49",
    period: "/month",
    members: "Up to 250 members",
    features: [
      "Events & announcements",
      "Devotionals & prayer wall",
      "Member management",
      "Church theme customization",
      "Invite code for congregation",
    ],
  },
  {
    id: "church_plus",
    name: "Church Plus",
    price: "$99",
    period: "/month",
    members: "Up to 1,000 members",
    popular: true,
    features: [
      "Everything in Church",
      "Sermon studies with AI reflections",
      "AI pastoral insights",
      "Engagement analytics",
      "Member activity tracking",
    ],
  },
  {
    id: "church_pro",
    name: "Church Pro",
    price: "$199",
    period: "/month",
    members: "Unlimited members",
    features: [
      "Everything in Church Plus",
      "Advanced analytics & reporting",
      "Spiritual pulse dashboard",
      "Needs-attention alerts",
      "Priority support",
    ],
  },
];

const THEMES = {
  gold_cream:   { label: "Gold & Cream",    accent: "#c9a84c", bg: "#FAF8F5" },
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
  const [step, setStep] = useState(0); // 0 = plan select, 1 = reg code, 2 = account, 3 = church
  const [selectedPlan, setSelectedPlan] = useState("church_plus");
  const [regCode, setRegCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [churchName, setChurchName] = useState("");
  const [denomination, setDenomination] = useState("");
  const [city, setCity] = useState("");
  const [theme, setTheme] = useState("gold_cream");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // If redirected from Stripe with session_id, fetch the registration code
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      fetch(`${API_BASE}/api/stripe/success?session_id=${sessionId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.code) {
            setRegCode(data.code);
            setStep(2); // Skip to account creation — code is auto-filled
          }
        })
        .catch(() => { setStep(0); });
    }
    if (searchParams.get("cancelled")) {
      setError("Payment was cancelled. You can try again.");
      setStep(0);
    }
  }, []);

  async function handleStripeCheckout() {
    setCheckoutLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/stripe/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Could not start checkout. Please try again.");
      }
    } catch {
      setError("Could not connect to payment service.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (step === 1) {
      if (!regCode.trim()) {
        setError("Please enter your registration code.");
        setLoading(false);
        return;
      }
      setStep(2);
      setLoading(false);
      return;
    }

    if (step === 2) {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setLoading(false);
        return;
      }
      setStep(3);
      setLoading(false);
      return;
    }

    // Step 3: Create account + church
    try {
      await signUp(email, password, {
        name: churchName,
        denomination: denomination || undefined,
        city: city || undefined,
        theme,
        registration_code: regCode.trim(),
      });
      navigate("/portal");
    } catch (err) {
      const msg = err?.code || err?.message || "";
      if (msg.includes("email-already-in-use")) {
        setError("An account with this email already exists.");
        setStep(2);
      } else if (msg.includes("Invalid registration code") || msg.includes("already used")) {
        setError(msg);
        setStep(1);
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── Step 0: Plan Selection ─────────────────────────
  if (step === 0) {
    return (
      <div style={s.page}>
        <div style={s.planPage}>
          <div style={s.cross}>✝</div>
          <h1 style={s.title}>Choose Your Plan</h1>
          <p style={s.subtitle}>Start managing your congregation's spiritual journey</p>

          <div style={s.planGrid}>
            {PLANS.map((plan) => {
              const selected = selectedPlan === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  style={{
                    ...s.planCard,
                    borderColor: selected ? COLORS.accent : COLORS.border,
                    boxShadow: selected ? `0 0 20px ${COLORS.accent}20` : "none",
                  }}
                >
                  {plan.popular && (
                    <div style={s.popularBadge}>Most Popular</div>
                  )}
                  <div style={s.planName}>{plan.name}</div>
                  <div style={s.planPriceRow}>
                    <span style={s.planPrice}>{plan.price}</span>
                    <span style={s.planPeriod}>{plan.period}</span>
                  </div>
                  <div style={s.planMembers}>{plan.members}</div>
                  <div style={s.planDivider} />
                  <ul style={s.featureList}>
                    {plan.features.map((f, i) => (
                      <li key={i} style={s.featureItem}>
                        <span style={s.checkmark}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <div style={{
                    ...s.planRadio,
                    borderColor: selected ? COLORS.accent : COLORS.border,
                  }}>
                    {selected && <div style={s.planRadioInner} />}
                  </div>
                </div>
              );
            })}
          </div>

          {error && <p style={s.error}>{error}</p>}

          <button
            onClick={handleStripeCheckout}
            disabled={checkoutLoading}
            style={s.button}
          >
            {checkoutLoading
              ? "Redirecting to payment..."
              : `Subscribe — ${PLANS.find(p => p.id === selectedPlan)?.price}/month`}
          </button>

          <p style={s.footer}>
            Already have an account?{" "}
            <Link to="/portal/login" style={s.link}>Sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  // ─── Steps 1-3: Registration Code → Account → Church ─
  const stepTitles = [
    "",
    "Registration Code",
    "Create Your Account",
    "Set Up Your Church",
  ];
  const stepSubtitles = [
    "",
    "Enter the code you received after subscribing",
    "Set up your admin credentials",
    "Tell us about your church",
  ];

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.cross}>✝</div>
        <h1 style={s.title}>{stepTitles[step]}</h1>
        <p style={s.subtitle}>{stepSubtitles[step]}</p>

        {/* Step indicator */}
        <div style={s.steps}>
          {[1, 2, 3].map((n, i) => (
            <div key={n} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && <div style={s.stepLine} />}
              <div style={{
                ...s.stepDot,
                background: step >= n ? COLORS.accent : COLORS.border,
              }} />
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          {step === 1 && (
            <>
              <label style={s.label}>Registration Code</label>
              <input
                type="text"
                value={regCode}
                onChange={(e) => setRegCode(e.target.value.toUpperCase())}
                style={{ ...s.input, fontFamily: "'Courier New', monospace", fontSize: 16, letterSpacing: "0.08em", textAlign: "center" }}
                placeholder="HOLY-XXXX-XXXX"
                autoFocus
              />
            </>
          )}

          {step === 2 && (
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

          {step === 3 && (
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
                      borderColor: theme === key ? t.accent : COLORS.border,
                      boxShadow: theme === key ? `0 0 12px ${t.accent}33` : "none",
                    }}
                  >
                    <div style={{
                      width: "100%", height: 28, borderRadius: 6,
                      background: `linear-gradient(135deg, ${t.bg}, ${t.bg})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <div style={{
                        width: 14, height: 14, borderRadius: "50%",
                        background: t.accent,
                      }} />
                    </div>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 10,
                      color: theme === key ? t.accent : COLORS.textMuted,
                      fontWeight: theme === key ? 700 : 400,
                      marginTop: 4,
                    }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {error && <p style={s.error}>{error}</p>}

          <button type="submit" disabled={loading} style={{
            ...s.button,
            ...(step === 1 && !regCode.trim() ? { opacity: 0.5 } : {}),
          }}>
            {loading
              ? "..."
              : step === 1
                ? "Next"
                : step === 2
                  ? "Next"
                  : "Create Church"}
          </button>

          <button
            type="button"
            onClick={() => { setStep(step - 1); setError(""); }}
            style={s.backBtn}
          >
            ← Back
          </button>
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
  planPage: {
    width: "100%",
    maxWidth: 900,
    textAlign: "center",
    padding: "48px 0",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    padding: "48px 36px",
    borderRadius: 20,
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    textAlign: "center",
  },
  cross: {
    fontSize: 32,
    color: COLORS.accentMid,
    marginBottom: 16,
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 28,
    fontWeight: 700,
    color: COLORS.text,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 32,
  },

  // Plan grid
  planGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
    marginBottom: 32,
  },
  planCard: {
    position: "relative",
    padding: "28px 20px 20px",
    borderRadius: 16,
    border: `2px solid ${COLORS.border}`,
    background: COLORS.card,
    cursor: "pointer",
    transition: "all 0.2s",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    left: "50%",
    transform: "translateX(-50%)",
    padding: "4px 14px",
    borderRadius: 20,
    background: COLORS.accent,
    color: "#fff",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  planName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 18,
    fontWeight: 700,
    color: COLORS.text,
    marginBottom: 12,
  },
  planPriceRow: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 2,
    marginBottom: 4,
  },
  planPrice: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 36,
    fontWeight: 700,
    color: COLORS.text,
  },
  planPeriod: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: COLORS.textMuted,
  },
  planMembers: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: 600,
    marginBottom: 16,
  },
  planDivider: {
    width: "100%",
    height: 1,
    background: COLORS.border,
    marginBottom: 16,
  },
  featureList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    textAlign: "left",
    width: "100%",
    flex: 1,
  },
  featureItem: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: COLORS.textBody,
    padding: "4px 0",
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
  },
  checkmark: {
    color: COLORS.accent,
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0,
  },
  planRadio: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    border: `2px solid ${COLORS.border}`,
    marginTop: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "border-color 0.2s",
  },
  planRadioInner: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: COLORS.accent,
  },

  // Steps
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
    background: COLORS.border,
  },

  // Form
  form: {
    textAlign: "left",
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
    padding: "12px 14px",
    borderRadius: 10,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.bg,
    color: COLORS.text,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "16px 0",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: COLORS.border,
  },
  dividerText: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  codeBtn: {
    width: "100%",
    padding: "14px 0",
    borderRadius: 12,
    border: `1px solid ${COLORS.border}`,
    background: "transparent",
    color: COLORS.textSec,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  themeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 8,
  },
  themeCard: {
    padding: "8px 4px 6px",
    borderRadius: 10,
    border: `2px solid ${COLORS.border}`,
    background: COLORS.bg,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    transition: "all 0.2s",
  },
  error: {
    fontFamily: "'DM Sans', sans-serif",
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
    background: COLORS.accent,
    color: "#fff",
    fontFamily: "'DM Sans', sans-serif",
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
    border: `1px solid ${COLORS.border}`,
    background: "transparent",
    color: COLORS.textMuted,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    cursor: "pointer",
  },
  footer: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 24,
  },
  link: {
    color: COLORS.accent,
    textDecoration: "none",
    fontWeight: 600,
  },
};
