import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { post } from "../api";

const API_BASE = "https://devotion-backend-production.up.railway.app";

const THEMES = {
  gold_navy:    { label: "Gold & Navy",    accent: "#c9a84c", bg: "#0D1F35" },
  royal_purple: { label: "Royal Purple",   accent: "#9b59b6", bg: "#1a0e2e" },
  forest_green: { label: "Forest Green",   accent: "#27ae60", bg: "#0e1a14" },
  crimson:      { label: "Crimson",        accent: "#c0392b", bg: "#1a0e0e" },
  ocean_blue:   { label: "Ocean Blue",     accent: "#2980b9", bg: "#0e141a" },
  rose:         { label: "Rose",           accent: "#e84393", bg: "#1a0e16" },
  copper:       { label: "Copper",         accent: "#d4a373", bg: "#1a140e" },
  silver:       { label: "Silver",         accent: "#bdc3c7", bg: "#12141a" },
};

const SAGE = "#3D6B5E";
const LINEN = "#FAF8F5";

const PROGRESS = { 0: 0, 1: 0.2, 2: 0.35, 3: 0.5, 4: 0.65, 5: 0.8, 6: 0.95 };

const DENOMINATIONS = [
  "Baptist", "Catholic", "Non-denominational", "Methodist", "Presbyterian",
  "Pentecostal", "Anglican", "Lutheran", "Other",
];

// ─── QR Code Generator (inline, zero deps) ────────────────────

function generateQRDataURL(text) {
  // Simple QR code using external API as img src
  // This is reliable and avoids a complex inline QR algorithm
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
}

// ─── Typewriter Hook ──────────────────────────────────────────

function useTypewriter(lines, speed = 30, pauseBetween = 500) {
  const [displayedLines, setDisplayedLines] = useState([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (currentLine >= lines.length) {
      setDone(true);
      return;
    }

    const line = lines[currentLine];

    if (currentChar < line.length) {
      const timer = setTimeout(() => {
        setDisplayedLines((prev) => {
          const copy = [...prev];
          copy[currentLine] = line.slice(0, currentChar + 1);
          return copy;
        });
        setCurrentChar((c) => c + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else {
      // Line complete, pause then move to next
      const timer = setTimeout(() => {
        setCurrentLine((l) => l + 1);
        setCurrentChar(0);
        setDisplayedLines((prev) => [...prev, ""]);
      }, pauseBetween);
      return () => clearTimeout(timer);
    }
  }, [currentLine, currentChar, lines, speed, pauseBetween]);

  return { displayedLines, done };
}

// ─── Main Component ──────────────────────────────────────────

export default function OnboardingWizard() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(null); // null = loading
  const [arriving, setArriving] = useState(false);
  const [arrivalDone, setArrivalDone] = useState(false);
  const [slideDir, setSlideDir] = useState("right");
  const [animating, setAnimating] = useState(false);

  // Stripe
  const [regCode, setRegCode] = useState("");

  // Step 1: Account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Church
  const [churchName, setChurchName] = useState("");
  const [denomination, setDenomination] = useState("");
  const [city, setCity] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  // Step 3: Website
  const [website, setWebsite] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [brandingResult, setBrandingResult] = useState(null);

  // Step 4: Theme
  const [theme, setTheme] = useState("gold_navy");

  // Step 5: Sermon
  const [sermonDescription, setSermonDescription] = useState("");
  const [sermonLoading, setSermonLoading] = useState(false);
  const [sermonResult, setSermonResult] = useState(null);

  // Step 6: Invite
  const [inviteCode, setInviteCode] = useState("");
  const [churchId, setChurchId] = useState("");
  const [copied, setCopied] = useState("");

  // General
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Accent color: sage before step 4, church's chosen theme after
  const accent = currentStep != null && currentStep >= 4
    ? (THEMES[theme]?.accent || SAGE)
    : SAGE;

  // ─── Stripe session check on mount ───────────────────────────

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      fetch(`${API_BASE}/api/stripe/success?session_id=${sessionId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.code) {
            setRegCode(data.code);
            if (data.email) setEmail(data.email);
            setArriving(true);
          } else {
            window.location.href = "/churches";
          }
        })
        .catch(() => {
          window.location.href = "/churches";
        });
    } else if (searchParams.get("cancelled")) {
      setError("Payment was cancelled. You can try again on the Churches page.");
      setCurrentStep(0);
    } else {
      window.location.href = "/churches";
    }
  }, []);

  // Arrival animation timing
  useEffect(() => {
    if (arriving) {
      const timer = setTimeout(() => {
        setArrivalDone(true);
        setCurrentStep(0);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [arriving]);

  // ─── Step navigation ─────────────────────────────────────────

  function goTo(step) {
    setError("");
    setSlideDir(step > currentStep ? "right" : "left");
    setAnimating(true);
    setTimeout(() => {
      setCurrentStep(step);
      setAnimating(false);
    }, 150);
  }

  // ─── Step 3: Detect branding ─────────────────────────────────

  async function handleDetectBranding() {
    if (!website.trim()) return;
    setDetecting(true);
    setError("");
    try {
      const resp = await fetch(`${API_BASE}/api/churches/detect-branding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: website.trim() }),
      });
      const data = await resp.json();
      if (data.detected) {
        setBrandingResult(data);
        if (data.suggested_theme && THEMES[data.suggested_theme]) {
          setTheme(data.suggested_theme);
        }
      }
    } catch {
      // Fail silently, they'll pick colors manually
    }
    setDetecting(false);
    goTo(4);
  }

  // ─── Step 4 → signUp (between 4 and 5) ──────────────────────

  async function handleCreateChurch() {
    setError("");
    setLoading(true);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      goTo(1);
      return;
    }

    try {
      const resp = await signUp(email, password, {
        name: churchName,
        denomination: denomination || undefined,
        city: city || undefined,
        website: website || undefined,
        theme,
        registration_code: regCode.trim(),
      });

      const church = resp?.church || resp;
      setChurchId(church?.id || "");
      setInviteCode(church?.invite_code || "");
      setLoading(false);
      goTo(5);
    } catch (err) {
      const msg = err?.code || err?.message || "";
      if (msg.includes("email-already-in-use")) {
        setError("An account with this email already exists.");
        setLoading(false);
        goTo(1);
      } else if (msg.includes("Invalid registration code") || msg.includes("already used")) {
        setError(msg);
        setLoading(false);
      } else {
        setError(err.message || "Something went wrong. Please try again.");
        setLoading(false);
      }
    }
  }

  // ─── Step 5: Quick sermon ────────────────────────────────────

  async function handleQuickSermon() {
    if (!sermonDescription.trim()) return;
    setSermonLoading(true);
    setError("");
    try {
      // Calculate this Monday's date
      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diff);
      const weekStart = monday.toISOString().split("T")[0];

      const resp = await post(`/api/churches/${churchId}/sermons/quick`, {
        description: sermonDescription.trim(),
        week_start_date: weekStart,
      });
      setSermonResult(resp);
    } catch (err) {
      setError("Could not generate sermon study. You can add one later from your dashboard.");
    }
    setSermonLoading(false);
  }

  // ─── Copy helpers ────────────────────────────────────────────

  function copyText(text, label) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(""), 2000);
    });
  }

  const sundayText = `We're excited to announce that our church is now on Devotion, an app that helps you grow in faith every day with guided sermon reflections, prayer, and community. Download Devotion from the App Store or Google Play, open the app, tap Church, and enter our code: ${inviteCode}. You'll be connected to our church and can start this week's sermon reflection right away.`;
  const socialText = `Our church is on Devotion! Download the app, tap Church, and enter code ${inviteCode} to connect with our community and grow in faith together every day.`;
  const directText = `Hey! Our church just joined Devotion. Download it and enter code ${inviteCode} in the Church section to connect. It's free for our members!`;

  // ─── Arrival Animation ───────────────────────────────────────

  if (arriving && !arrivalDone) {
    return (
      <div style={s.arrivalPage}>
        <style>{arrivalCSS}</style>
        <div className="arrival-bloom" />
        <div className="arrival-cross">✝</div>
      </div>
    );
  }

  // ─── Loading (Stripe check) ──────────────────────────────────

  if (currentStep === null) {
    return (
      <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{baseCSS}</style>
        <div style={s.spinner} />
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div style={s.page}>
      <style>{baseCSS}</style>

      {/* Progress bar */}
      {currentStep > 0 && (
        <div style={s.progressTrack}>
          <div style={{ ...s.progressFill, width: `${(PROGRESS[currentStep] || 0) * 100}%`, background: accent }} />
        </div>
      )}

      <div style={{ ...s.container, opacity: animating ? 0 : 1, transform: animating ? `translateX(${slideDir === "right" ? "20px" : "-20px"})` : "translateX(0)" }}>

        {/* ─── Step 0: Welcome ─── */}
        {currentStep === 0 && <WelcomeStep onContinue={() => goTo(1)} />}

        {/* ─── Step 1: Account ─── */}
        {currentStep === 1 && (
          <div style={s.card}>
            <h1 style={s.heading}>First, let's create your account</h1>
            <p style={s.sub}>This is your personal login for managing your church.</p>

            <label style={s.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                style={s.input}
                placeholder="At least 6 characters"
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

            <button
              style={{ ...s.btn, background: accent }}
              onClick={() => {
                if (!email.trim()) { setError("Email is required."); return; }
                if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
                goTo(2);
              }}
            >
              Continue →
            </button>
          </div>
        )}

        {/* ─── Step 2: Church Name ─── */}
        {currentStep === 2 && (
          <div style={s.card}>
            <h1 style={s.heading}>What's your church called?</h1>
            <p style={s.sub}>This is how your congregation will see it in the app.</p>

            <input
              type="text"
              value={churchName}
              onChange={(e) => setChurchName(e.target.value)}
              style={{ ...s.input, fontSize: 20, padding: "16px 18px" }}
              placeholder="Grace Community Church"
              autoFocus
            />

            {!showDetails && (
              <button style={s.textLink} onClick={() => setShowDetails(true)}>
                + Add details
              </button>
            )}

            {showDetails && (
              <>
                <label style={{ ...s.label, marginTop: 20 }}>
                  Denomination <span style={{ opacity: 0.5 }}>(optional)</span>
                </label>
                <select
                  value={denomination}
                  onChange={(e) => setDenomination(e.target.value)}
                  style={s.input}
                >
                  <option value="">Select denomination...</option>
                  {DENOMINATIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

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

            <button
              style={{ ...s.btn, background: accent }}
              onClick={() => {
                if (!churchName.trim()) { setError("Church name is required."); return; }
                goTo(3);
              }}
            >
              Continue →
            </button>
            <button style={s.backLink} onClick={() => goTo(1)}>Back</button>
          </div>
        )}

        {/* ─── Step 3: Website ─── */}
        {currentStep === 3 && (
          <div style={s.card}>
            <h1 style={s.heading}>Do you have a church website?</h1>
            <p style={s.sub}>Paste your URL and we'll try to match your church's branding automatically.</p>

            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              style={s.input}
              placeholder="https://yourchurch.com"
              autoFocus
            />

            {error && <p style={s.error}>{error}</p>}

            <button
              style={{ ...s.btn, background: accent }}
              onClick={handleDetectBranding}
              disabled={detecting}
            >
              {detecting ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={s.miniSpinner} /> Scanning your website...
                </span>
              ) : (
                "Detect My Branding ✨"
              )}
            </button>

            <button style={s.textLink} onClick={() => goTo(4)}>
              Skip, I'll pick colors manually
            </button>
            <button style={s.backLink} onClick={() => goTo(2)}>Back</button>
          </div>
        )}

        {/* ─── Step 4: Theme ─── */}
        {currentStep === 4 && (
          <div style={s.card}>
            <h1 style={s.heading}>Make it yours</h1>
            <p style={s.sub}>Choose the color that represents your church. This sets the look and feel of your church space in the app.</p>

            {brandingResult?.detected && (
              <div style={{ ...s.detectedCard, borderColor: `${accent}33` }}>
                <p style={{ margin: 0, fontSize: 13, color: "#7A7672" }}>We found this from your website:</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: THEMES[theme]?.accent || SAGE }} />
                  <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, color: "#2C2C2C" }}>
                    {THEMES[theme]?.label}
                  </span>
                </div>
              </div>
            )}

            <div style={s.themeGrid}>
              {Object.entries(THEMES).map(([key, t]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTheme(key)}
                  style={{
                    ...s.themeCard,
                    borderColor: theme === key ? t.accent : "#EDE9E3",
                    boxShadow: theme === key ? `0 0 16px ${t.accent}33` : "none",
                  }}
                >
                  <div style={{
                    width: "100%", height: 32, borderRadius: 8,
                    background: t.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: t.accent }} />
                  </div>
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                    color: theme === key ? t.accent : "#7A7672",
                    fontWeight: theme === key ? 700 : 400,
                    marginTop: 6,
                  }}>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Live preview */}
            <div style={{ ...s.previewCard, borderColor: `${THEMES[theme]?.accent || SAGE}44` }}>
              <div style={{
                background: THEMES[theme]?.bg || "#0a0e1a",
                borderRadius: 12,
                padding: "20px 16px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 20, color: THEMES[theme]?.accent || SAGE, marginBottom: 4 }}>✝</div>
                <h3 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 16, fontWeight: 700,
                  color: "#e8e4dc", margin: "0 0 6px",
                }}>{churchName || "Your Church"}</h3>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12, color: "rgba(232, 228, 220, 0.5)", margin: 0,
                }}>Welcome to our community</p>
                <div style={{
                  marginTop: 12, padding: "8px 16px", borderRadius: 8,
                  background: THEMES[theme]?.accent || SAGE, display: "inline-block",
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
                    Join Church
                  </span>
                </div>
              </div>
            </div>

            {error && <p style={s.error}>{error}</p>}

            <button
              style={{ ...s.btn, background: THEMES[theme]?.accent || SAGE }}
              onClick={handleCreateChurch}
              disabled={loading}
            >
              {loading ? "Creating your church..." : "Looks great →"}
            </button>
            <button style={s.backLink} onClick={() => goTo(3)}>Back</button>
          </div>
        )}

        {/* ─── Step 5: Sermon ─── */}
        {currentStep === 5 && (
          <div style={s.card}>
            <h1 style={s.heading}>What did you preach about last Sunday?</h1>
            <p style={s.sub}>Type a sentence or two and watch Devotion build a full week of guided reflections for your congregation.</p>

            {!sermonResult && (
              <>
                <textarea
                  value={sermonDescription}
                  onChange={(e) => setSermonDescription(e.target.value)}
                  style={s.textarea}
                  placeholder="e.g. I preached about finding peace in the storm from Mark 4, about trusting God when life feels out of control"
                  rows={4}
                  autoFocus
                />

                {error && <p style={s.error}>{error}</p>}

                <button
                  style={{ ...s.btn, background: accent }}
                  onClick={handleQuickSermon}
                  disabled={sermonLoading}
                >
                  {sermonLoading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <span style={s.miniSpinner} /> Building 7 days of guided reflections...
                    </span>
                  ) : (
                    "Create Sermon Study ✨"
                  )}
                </button>
              </>
            )}

            {sermonResult && (
              <div style={s.sermonPreview}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ color: accent, fontSize: 18 }}>✓</span>
                  <span style={{ fontWeight: 600, color: "#2C2C2C", fontFamily: "'DM Sans', sans-serif" }}>
                    Sermon study created
                  </span>
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#2C2C2C", margin: "0 0 12px" }}>
                  {sermonResult.sermon?.title || "Your Sermon"}
                </h3>
                {sermonResult.reflections?.map((r, i) => (
                  <div key={i} style={s.reflectionRow}>
                    <span style={{ fontSize: 11, color: "#7A7672", fontWeight: 600, minWidth: 60 }}>
                      Day {r.day_number}
                    </span>
                    <span style={{ fontSize: 13, color: "#4A4A4A" }}>{r.title}</span>
                  </div>
                ))}

                <button
                  style={{ ...s.btn, background: accent, marginTop: 16 }}
                  onClick={() => goTo(6)}
                >
                  Continue →
                </button>
              </div>
            )}

            {!sermonResult && (
              <button style={s.textLink} onClick={() => goTo(6)}>
                Skip for now, I'll add a sermon later
              </button>
            )}
          </div>
        )}

        {/* ─── Step 6: Invite ─── */}
        {currentStep === 6 && (
          <div style={s.card}>
            <h1 style={s.heading}>Time to bring your people in</h1>
            <p style={s.sub}>Share this code with your congregation. They download Devotion, tap Church, and enter the code. That's it.</p>

            <div style={s.codeBox}>
              <span style={s.codeText}>{inviteCode}</span>
              <button
                style={s.copyIcon}
                onClick={() => copyText(inviteCode, "code")}
              >
                {copied === "code" ? "✓" : "Copy"}
              </button>
            </div>

            {inviteCode && (
              <div style={{ textAlign: "center", margin: "16px 0" }}>
                <img
                  src={generateQRDataURL(`https://holydevotion.app/join/${inviteCode}`)}
                  alt="QR Code"
                  width={160}
                  height={160}
                  style={{ borderRadius: 8 }}
                />
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
              <button
                style={s.shareBtn}
                onClick={() => copyText(sundayText, "sunday")}
              >
                {copied === "sunday" ? "Copied!" : "Copy announcement for Sunday"}
              </button>
              <button
                style={s.shareBtn}
                onClick={() => copyText(socialText, "social")}
              >
                {copied === "social" ? "Copied!" : "Copy for social media"}
              </button>
              <button
                style={s.shareBtn}
                onClick={() => copyText(directText, "direct")}
              >
                {copied === "direct" ? "Copied!" : "Copy for text or email"}
              </button>
            </div>

            <button
              style={{ ...s.btn, background: accent, marginTop: 24 }}
              onClick={() => navigate("/portal")}
            >
              Go to My Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


// ─── Welcome Step (with typewriter) ─────────────────────────────

function WelcomeStep({ onContinue }) {
  const lines = [
    "Welcome to Devotion.",
    "Our mission is to bring your congregation closer to each other and closer to God. Not just on Sunday, but every day of the week.",
    "In the next 60 seconds, we'll set up your church's home inside the Devotion app. Your congregation will have a beautiful, branded space to grow in faith together.",
  ];

  const { displayedLines, done } = useTypewriter(lines, 30, 500);
  const [cardsVisible, setCardsVisible] = useState(0);

  useEffect(() => {
    if (done) {
      const timers = [
        setTimeout(() => setCardsVisible(1), 200),
        setTimeout(() => setCardsVisible(2), 400),
        setTimeout(() => setCardsVisible(3), 600),
        setTimeout(() => setCardsVisible(4), 800),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [done]);

  const features = [
    { icon: "📖", title: "Guided Sermon Studies", desc: "You enter your sermon once. Devotion creates 7 daily reflections for your congregation. Scripture-grounded, theologically thoughtful, ready in seconds." },
    { icon: "💡", title: "Spiritual Pulse", desc: "See what your congregation is seeking guidance on. Anonymous conversation themes like anxiety, grief, and purpose, updated weekly so you can preach to real needs." },
    { icon: "🔔", title: "Pastoral Intelligence", desc: "Know who needs encouragement before they ask. Devotion tracks engagement and alerts you when a member goes quiet, hits a milestone, or might need a pastoral visit." },
  ];

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 0" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 28, color: SAGE, marginBottom: 24 }}>✝</div>

        {displayedLines[0] !== undefined && (
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 28, fontWeight: 700,
            color: "#2C2C2C", marginBottom: 16,
            minHeight: 36,
          }}>
            {displayedLines[0]}
            {!displayedLines[1] && displayedLines[0] && <span style={s.cursor}>|</span>}
          </h1>
        )}

        {displayedLines[1] !== undefined && (
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 16, color: "#4A4A4A",
            lineHeight: 1.7, marginBottom: 12,
            minHeight: 50,
          }}>
            {displayedLines[1]}
            {!displayedLines[2] && displayedLines[1] && <span style={s.cursor}>|</span>}
          </p>
        )}

        {displayedLines[2] !== undefined && (
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 16, color: "#4A4A4A",
            lineHeight: 1.7, marginBottom: 8,
          }}>
            {displayedLines[2]}
            {!done && displayedLines[2] && <span style={s.cursor}>|</span>}
          </p>
        )}
      </div>

      {/* Feature cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {features.map((f, i) => (
          <div
            key={i}
            style={{
              ...s.featureCard,
              opacity: cardsVisible > i ? 1 : 0,
              transform: cardsVisible > i ? "translateY(0)" : "translateY(12px)",
            }}
          >
            <div style={{ fontSize: 24, lineHeight: 1 }}>{f.icon}</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, color: "#2C2C2C", margin: "0 0 4px" }}>
                {f.title}
              </h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#7A7672", margin: 0, lineHeight: 1.5 }}>
                {f.desc}
              </p>
            </div>
          </div>
        ))}

        {/* "Just getting started" card */}
        <div style={{
          ...s.featureCard,
          borderColor: `${SAGE}33`,
          background: "transparent",
          opacity: cardsVisible > 3 ? 1 : 0,
          transform: cardsVisible > 3 ? "translateY(0)" : "translateY(12px)",
        }}>
          <div style={{ fontSize: 24, lineHeight: 1 }}>🚀</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, color: "#2C2C2C", margin: "0 0 4px" }}>
              And we're just getting started
            </h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#7A7672", margin: 0, lineHeight: 1.5 }}>
              Smart small group guides, volunteer engagement tools, giving insights, and deeper analytics are on the way. Your subscription includes everything we build.
            </p>
          </div>
        </div>
      </div>

      {done && (
        <div style={{ textAlign: "center", marginTop: 32, opacity: cardsVisible >= 4 ? 1 : 0, transition: "opacity 0.3s ease" }}>
          <button style={{ ...s.btn, background: SAGE, maxWidth: 360 }} onClick={onContinue}>
            Let's Set Up Your Church →
          </button>
        </div>
      )}
    </div>
  );
}


// ─── CSS Keyframes ─────────────────────────────────────────────

const arrivalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');

  .arrival-bloom {
    position: fixed;
    inset: 0;
    background: radial-gradient(circle at center, ${LINEN} 0%, ${LINEN} 100%);
    transform: scale(0);
    border-radius: 50%;
    animation: bloom 0.7s ease 0.5s forwards;
    z-index: 100;
  }

  .arrival-cross {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 36px;
    color: #c9a84c;
    z-index: 101;
    opacity: 0;
    animation: crossFadeIn 0.5s ease forwards, crossTransition 0.7s ease 0.5s forwards;
    filter: drop-shadow(0 0 40px rgba(201, 168, 76, 0.4));
  }

  @keyframes bloom {
    from { transform: scale(0); opacity: 0.8; }
    to { transform: scale(3); opacity: 1; }
  }

  @keyframes crossFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes crossTransition {
    from { color: #c9a84c; filter: drop-shadow(0 0 40px rgba(201, 168, 76, 0.4)); }
    to { color: ${SAGE}; filter: drop-shadow(0 0 0px transparent); }
  }
`;

const baseCSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: ${SAGE} !important;
  }
`;


// ─── Styles ────────────────────────────────────────────────────

const s = {
  arrivalPage: {
    position: "fixed",
    inset: 0,
    background: "#0a0e1a",
    zIndex: 1000,
  },
  page: {
    minHeight: "100vh",
    background: `radial-gradient(ellipse at center, #FDFCFA 0%, ${LINEN} 70%)`,
    fontFamily: "'DM Sans', sans-serif",
    padding: "0 20px",
  },
  spinner: {
    width: 28,
    height: 28,
    border: `2px solid ${SAGE}`,
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  miniSpinner: {
    display: "inline-block",
    width: 16,
    height: 16,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  progressTrack: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    background: "#EDE9E3",
    zIndex: 50,
  },
  progressFill: {
    height: "100%",
    transition: "width 0.4s ease",
    borderRadius: "0 2px 2px 0",
  },
  container: {
    maxWidth: 600,
    margin: "0 auto",
    paddingTop: 48,
    paddingBottom: 48,
    transition: "opacity 0.15s ease, transform 0.15s ease",
  },
  card: {
    background: "#FFFFFF",
    border: "1px solid #EDE9E3",
    borderRadius: 20,
    padding: "40px 36px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
  },
  heading: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 24,
    fontWeight: 700,
    color: "#2C2C2C",
    margin: "0 0 8px",
  },
  sub: {
    fontSize: 14,
    color: "#7A7672",
    margin: "0 0 24px",
    lineHeight: 1.6,
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#7A7672",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
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
  textarea: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: "1px solid #EDE9E3",
    background: "#FDFCFA",
    color: "#2C2C2C",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical",
    lineHeight: 1.6,
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
  btn: {
    width: "100%",
    marginTop: 24,
    padding: "14px 0",
    borderRadius: 12,
    border: "none",
    color: "#fff",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 0.2s",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  },
  textLink: {
    display: "block",
    width: "100%",
    background: "none",
    border: "none",
    color: "#7A7672",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    marginTop: 16,
    textAlign: "center",
    textDecoration: "underline",
    textUnderlineOffset: 3,
  },
  backLink: {
    display: "block",
    width: "100%",
    background: "none",
    border: "none",
    color: "#B0ADA8",
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    marginTop: 12,
    textAlign: "center",
  },
  error: {
    fontSize: 13,
    color: "#c0392b",
    marginTop: 12,
  },
  cursor: {
    animation: "blink 0.8s step-end infinite",
    color: SAGE,
    fontWeight: 100,
  },
  featureCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
    padding: "16px 18px",
    background: "#FFFFFF",
    border: "1px solid #EDE9E3",
    borderRadius: 16,
    boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
    transition: "opacity 0.4s ease, transform 0.4s ease",
  },
  themeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10,
    marginTop: 8,
    marginBottom: 24,
  },
  themeCard: {
    padding: "10px 6px 8px",
    borderRadius: 12,
    border: "2px solid #EDE9E3",
    background: "#FDFCFA",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    transition: "all 0.2s",
  },
  detectedCard: {
    padding: "14px 16px",
    borderRadius: 12,
    border: "1px solid",
    background: "#FDFCFA",
    marginBottom: 20,
  },
  previewCard: {
    border: "1px solid",
    borderRadius: 16,
    padding: 12,
    background: "#FDFCFA",
    marginBottom: 8,
  },
  codeBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: "20px 24px",
    background: "#FDFCFA",
    border: "1px solid #EDE9E3",
    borderRadius: 16,
    marginBottom: 8,
  },
  codeText: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 28,
    fontWeight: 700,
    color: "#2C2C2C",
    letterSpacing: "0.02em",
  },
  copyIcon: {
    background: "none",
    border: "1px solid #EDE9E3",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 13,
    fontWeight: 600,
    color: "#7A7672",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.2s",
  },
  shareBtn: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 10,
    border: "1px solid #EDE9E3",
    background: "#FFFFFF",
    color: "#4A4A4A",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "center",
    transition: "all 0.2s",
  },
  sermonPreview: {
    padding: "20px",
    background: "#FDFCFA",
    border: "1px solid #EDE9E3",
    borderRadius: 16,
  },
  reflectionRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 0",
    borderBottom: "1px solid #EDE9E3",
  },
};
