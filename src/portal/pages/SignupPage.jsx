import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { COLORS } from "../../colors";

// Devotion brand colors (matches main website)
const BRAND = {
  bg: "#0a0e1a",
  bgCard: "rgba(15, 22, 45, 0.7)",
  navy: "#0f1632",
  navyLight: "#1a2347",
  gold: "#c9a84c",
  goldLight: "#e8cc6e",
  goldDim: "rgba(201, 168, 76, 0.15)",
  text: "#e8e4dc",
  textMuted: "rgba(232, 228, 220, 0.5)",
  textDim: "rgba(232, 228, 220, 0.3)",
  border: "rgba(201, 168, 76, 0.1)",
  borderHover: "rgba(201, 168, 76, 0.25)",
};

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
  const [step, setStep] = useState(0); // 0 = plan select, 1 = reg code, 2 = account, 3 = church
  const [selectedPlan, setSelectedPlan] = useState("church_plus");
  const [regCode, setRegCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [churchName, setChurchName] = useState("");
  const [denomination, setDenomination] = useState("");
  const [city, setCity] = useState("");
  const [theme, setTheme] = useState("gold_navy");
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
      <div style={b.page}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>

        {/* Fixed header bar */}
        <div style={b.header}>
          <span style={b.headerCross}>✝</span>
          <span style={b.headerName}>Devotion</span>
          <span style={b.headerTag}>Church Portal</span>
        </div>

        <div style={b.planPage}>
          <h1 style={b.title}>Choose Your Plan</h1>
          <p style={b.subtitle}>Start managing your congregation's spiritual journey</p>

          <div style={b.planGrid}>
            {PLANS.map((plan) => {
              const selected = selectedPlan === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  style={{
                    ...b.planCard,
                    borderColor: selected ? BRAND.gold : BRAND.border,
                    boxShadow: selected ? `0 0 30px ${BRAND.goldDim}` : "none",
                  }}
                >
                  {plan.popular && (
                    <div style={b.popularBadge}>Most Popular</div>
                  )}
                  <div style={b.planName}>{plan.name}</div>
                  <div style={b.planPriceRow}>
                    <span style={b.planPrice}>{plan.price}</span>
                    <span style={b.planPeriod}>{plan.period}</span>
                  </div>
                  <div style={b.planMembers}>{plan.members}</div>
                  <div style={b.planDivider} />
                  <ul style={b.featureList}>
                    {plan.features.map((f, i) => (
                      <li key={i} style={b.featureItem}>
                        <span style={b.checkmark}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <div style={{
                    ...b.planRadio,
                    borderColor: selected ? BRAND.gold : BRAND.border,
                  }}>
                    {selected && <div style={b.planRadioInner} />}
                  </div>
                </div>
              );
            })}
          </div>

          {error && <p style={b.error}>{error}</p>}

          <button
            onClick={handleStripeCheckout}
            disabled={checkoutLoading}
            style={b.subscribeBtn}
          >
            {checkoutLoading
              ? "Redirecting to payment..."
              : `Subscribe — ${PLANS.find(p => p.id === selectedPlan)?.price}/month`}
          </button>

          <p style={b.footer}>
            Already have an account?{" "}
            <Link to="/portal/login" style={b.link}>Sign in</Link>
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
    <div style={b.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
      `}</style>

      <div style={b.formCard}>
        <div style={b.formCross}>✝</div>
        <h1 style={b.formTitle}>{stepTitles[step]}</h1>
        <p style={b.formSubtitle}>{stepSubtitles[step]}</p>

        {/* Step indicator */}
        <div style={b.steps}>
          {[1, 2, 3].map((n, i) => (
            <div key={n} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && <div style={b.stepLine} />}
              <div style={{
                ...b.stepDot,
                background: step >= n ? BRAND.gold : BRAND.border,
              }} />
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={b.form}>
          {step === 1 && (
            <>
              <label style={b.label}>Registration Code</label>
              <input
                type="text"
                value={regCode}
                onChange={(e) => setRegCode(e.target.value.toUpperCase())}
                style={{ ...b.input, fontFamily: "'Courier New', monospace", fontSize: 16, letterSpacing: "0.08em", textAlign: "center" }}
                placeholder="HOLY-XXXX-XXXX"
                autoFocus
              />
            </>
          )}

          {step === 2 && (
            <>
              <label style={b.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={b.input}
                placeholder="pastor@church.org"
                autoFocus
              />

              <label style={{ ...b.label, marginTop: 16 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={b.input}
                placeholder="At least 6 characters"
              />
            </>
          )}

          {step === 3 && (
            <>
              <label style={b.label}>Church Name *</label>
              <input
                type="text"
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
                required
                style={b.input}
                placeholder="Grace Community Church"
                autoFocus
              />

              <label style={{ ...b.label, marginTop: 16 }}>
                Denomination <span style={{ opacity: 0.5 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={denomination}
                onChange={(e) => setDenomination(e.target.value)}
                style={b.input}
                placeholder="e.g. Baptist, Non-denominational"
              />

              <label style={{ ...b.label, marginTop: 16 }}>
                City <span style={{ opacity: 0.5 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={b.input}
                placeholder="e.g. Dallas, TX"
              />

              <label style={{ ...b.label, marginTop: 20 }}>Theme</label>
              <div style={b.themeGrid}>
                {Object.entries(THEMES).map(([key, t]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTheme(key)}
                    style={{
                      ...b.themeCard,
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

          {error && <p style={b.error}>{error}</p>}

          <button type="submit" disabled={loading} style={{
            ...b.subscribeBtn,
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
            style={b.backBtn}
          >
            ← Back
          </button>
        </form>

        <p style={b.footer}>
          Already have an account?{" "}
          <Link to="/portal/login" style={b.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

// ─── Brand styles (dark navy + gold) ────────────────────
const b = {
  page: {
    minHeight: "100vh",
    background: BRAND.bg,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "'DM Sans', sans-serif",
  },

  // Header
  header: {
    width: "100%",
    padding: "20px 32px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    borderBottom: `1px solid ${BRAND.border}`,
  },
  headerCross: {
    fontSize: 22,
    color: BRAND.gold,
  },
  headerName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 20,
    fontWeight: 700,
    color: BRAND.text,
  },
  headerTag: {
    fontSize: 11,
    color: BRAND.textMuted,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginLeft: 4,
  },

  // Plan page
  planPage: {
    width: "100%",
    maxWidth: 920,
    textAlign: "center",
    padding: "48px 20px 60px",
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 32,
    fontWeight: 700,
    color: BRAND.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: BRAND.textMuted,
    marginBottom: 40,
  },

  // Plan grid
  planGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
    marginBottom: 36,
  },
  planCard: {
    position: "relative",
    padding: "32px 22px 22px",
    borderRadius: 16,
    border: `1.5px solid ${BRAND.border}`,
    background: BRAND.navy,
    cursor: "pointer",
    transition: "all 0.25s ease",
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
    padding: "5px 16px",
    borderRadius: 20,
    background: `linear-gradient(135deg, ${BRAND.gold}, #b8973e)`,
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: "nowrap",
    letterSpacing: "0.02em",
  },
  planName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 20,
    fontWeight: 700,
    color: BRAND.text,
    marginBottom: 14,
  },
  planPriceRow: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 2,
    marginBottom: 6,
  },
  planPrice: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 40,
    fontWeight: 700,
    color: BRAND.gold,
  },
  planPeriod: {
    fontSize: 14,
    color: BRAND.textMuted,
  },
  planMembers: {
    fontSize: 13,
    color: BRAND.goldLight,
    fontWeight: 600,
    marginBottom: 18,
  },
  planDivider: {
    width: "100%",
    height: 1,
    background: BRAND.border,
    marginBottom: 18,
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
    fontSize: 13,
    color: BRAND.textMuted,
    padding: "5px 0",
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    lineHeight: 1.4,
  },
  checkmark: {
    color: BRAND.gold,
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0,
  },
  planRadio: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    border: `2px solid ${BRAND.border}`,
    marginTop: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "border-color 0.2s",
  },
  planRadioInner: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: BRAND.gold,
  },

  // Subscribe button
  subscribeBtn: {
    width: "100%",
    maxWidth: 420,
    margin: "0 auto",
    display: "block",
    padding: "16px 0",
    borderRadius: 12,
    border: "none",
    background: `linear-gradient(135deg, ${BRAND.gold}, #b8973e)`,
    color: "#fff",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "opacity 0.2s",
    boxShadow: `0 4px 20px rgba(201, 168, 76, 0.3)`,
  },

  // Form card (steps 1-3)
  formCard: {
    width: "100%",
    maxWidth: 440,
    margin: "80px auto 40px",
    padding: "48px 36px",
    borderRadius: 20,
    background: BRAND.navy,
    border: `1px solid ${BRAND.border}`,
    textAlign: "center",
  },
  formCross: {
    fontSize: 32,
    color: BRAND.gold,
    marginBottom: 16,
  },
  formTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 28,
    fontWeight: 700,
    color: BRAND.text,
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 14,
    color: BRAND.textMuted,
    marginBottom: 24,
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
    background: BRAND.border,
  },

  // Form
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
