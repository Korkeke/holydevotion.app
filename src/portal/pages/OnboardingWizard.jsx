import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../AuthContext";
import { post } from "../api";

const API_BASE = "https://devotion-backend-production.up.railway.app";

const THEMES = {
  devotion:       { label: "Devotion",              accent: "#0A0E1A", secondary: "#C9A84C" },
  classic_navy:   { label: "Classic Navy",          accent: "#1B3A5C", secondary: "#C8A96E" },
  sage_green:     { label: "Sage Green",            accent: "#3D6B5E", secondary: "#D4A853" },
  burgundy:       { label: "Burgundy",              accent: "#7B2D3B", secondary: "#D4B896" },
  warm_slate:     { label: "Warm Slate",            accent: "#4A5568", secondary: "#C08552" },
  deep_teal:      { label: "Deep Teal",             accent: "#1A5E63", secondary: "#E8C16D" },
  forest_green:   { label: "Forest Green",          accent: "#2E5E3F", secondary: "#D9C8A9" },
  ivory_gold:     { label: "Ivory and Gold",        accent: "#B8A88A", secondary: "#7A6B4F" },
  purple_gold:    { label: "Purple and Warm Gold",  accent: "#4A3060", secondary: "#C9B57A" },
};

const SAGE = "#3D6B5E";
const LINEN = "#FAF8F5";
const GOLD = "#c9a84c";

const STEP_LABELS = ["", "Account", "Your Church", "Website", "Colors", "Sermon", "Invite"];
const PROGRESS = { 0: 0, 1: 0.17, 2: 0.33, 3: 0.5, 4: 0.67, 5: 0.83, 6: 1.0 };

// ─── QR Code Generator (inline, zero deps) ────────────────────

function generateQRDataURL(text) {
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

// ─── Phone Mockup Component ──────────────────────────────────

function PhoneMockup({ churchName, accentColor, secondaryColor }) {
  const pulseThemes = [
    { label: "Anxiety", pct: 34 },
    { label: "Purpose", pct: 22 },
    { label: "Gratitude", pct: 18 },
  ];
  return (
    <div style={{
      width: 320, margin: "0 auto",
      background: "#1a1a2e", borderRadius: 36,
      padding: "14px 10px 10px", boxShadow: "0 12px 48px rgba(0,0,0,0.18)",
      border: "4px solid #2a2a3e",
    }}>
      {/* Dynamic Island / Notch */}
      <div style={{ width: 80, height: 8, background: "#2a2a3e", borderRadius: 4, margin: "0 auto 10px" }} />

      {/* Screen */}
      <div style={{
        background: "#FAF8F5", borderRadius: 24, overflow: "hidden",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Church Header */}
        <div style={{ padding: "18px 18px 14px", textAlign: "center", borderBottom: "1px solid #EDE9E3" }}>
          <div style={{ fontSize: 20, color: secondaryColor, marginBottom: 4 }}>✝</div>
          <div style={{
            fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700,
            color: accentColor,
          }}>{churchName || "Your Church"}</div>
          <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 3 }}>12 members</div>
        </div>

        {/* Sermon Card */}
        <div style={{ padding: "14px 18px 10px" }}>
          <div style={{ fontSize: 10, color: "#A8A29E", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 8 }}>
            This Week's Sermon
          </div>
          <div style={{
            background: "#fff", borderRadius: 14, padding: "14px 16px",
            border: "1px solid #EDE9E3",
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: accentColor, marginBottom: 6 }}>
              Finding Peace in the Storm
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{
                fontSize: 10, padding: "3px 8px", borderRadius: 6,
                background: `${secondaryColor}18`, color: secondaryColor, fontWeight: 600,
              }}>Mark 4:35-41</span>
              <span style={{
                fontSize: 10, padding: "3px 8px", borderRadius: 6,
                background: `${secondaryColor}18`, color: secondaryColor, fontWeight: 600,
              }}>Trust</span>
            </div>
            <div style={{ fontSize: 11, color: "#7A7672", lineHeight: 1.5 }}>
              Day 1 of 7 — Settling Into the Passage
            </div>
            <div style={{ height: 4, borderRadius: 2, background: "#EDE9E3", marginTop: 8 }}>
              <div style={{ height: "100%", borderRadius: 2, background: accentColor, width: "14%" }} />
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div style={{ padding: "4px 18px 14px" }}>
          <div style={{
            background: accentColor, borderRadius: 10, padding: "10px 0",
            textAlign: "center", fontSize: 12, fontWeight: 700, color: "#fff",
          }}>
            Continue Today's Reflection
          </div>
        </div>

        {/* Spiritual Pulse mini */}
        <div style={{ padding: "0 18px 14px" }}>
          <div style={{ fontSize: 10, color: "#A8A29E", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 8 }}>
            Spiritual Pulse
          </div>
          {pulseThemes.map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: "#7A7672", width: 56, flexShrink: 0 }}>{t.label}</span>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: "#EDE9E3" }}>
                <div style={{ height: "100%", borderRadius: 3, background: i === 0 ? accentColor : secondaryColor, width: `${t.pct}%`, opacity: i === 0 ? 1 : 0.6 }} />
              </div>
              <span style={{ fontSize: 9, color: "#A8A29E", width: 24, textAlign: "right" }}>{t.pct}%</span>
            </div>
          ))}
        </div>

        {/* Bottom Nav */}
        <div style={{
          display: "flex", justifyContent: "space-around", padding: "10px 0",
          borderTop: "1px solid #EDE9E3", fontSize: 10, color: "#A8A29E",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, marginBottom: 2 }}>🏠</div>
            <div style={{ color: accentColor, fontWeight: 600 }}>Home</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, marginBottom: 2 }}>📖</div>
            <div>Sermons</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, marginBottom: 2 }}>🙏</div>
            <div>Prayer</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, marginBottom: 2 }}>👥</div>
            <div>Community</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

export default function OnboardingWizard() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Arrival animation: "The Unveiling"
  const animVariant = "B";

  // Wizard state
  const [currentStep, setCurrentStep] = useState(null); // null = loading
  const [arriving, setArriving] = useState(false);
  const [arrivalDone, setArrivalDone] = useState(false);
  const [slideDir, setSlideDir] = useState("right");
  const [animating, setAnimating] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  // Stripe
  const [regCode, setRegCode] = useState("");

  // Step 1: Account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2: Church
  const [churchName, setChurchName] = useState("");
  const [denomination, setDenomination] = useState("");
  const [denomOther, setDenomOther] = useState("");
  const [city, setCity] = useState("");
  const [citySuggestions, setCitySuggestions] = useState([]);
  const cityDebounceRef = useRef(null);

  // Step 3: Website
  const [website, setWebsite] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [brandingResult, setBrandingResult] = useState(null);

  // Step 4: Theme
  const [theme, setTheme] = useState("sage_green");
  const [accentColor, setAccentColor] = useState("#3D6B5E");
  const [secondaryColor, setSecondaryColor] = useState("#D4A853");
  const [isCustom, setIsCustom] = useState(false);

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

  // Location autocomplete via Nominatim (OpenStreetMap)
  function handleCityChange(value) {
    setCity(value);
    setCitySuggestions([]);
    clearTimeout(cityDebounceRef.current);
    if (value.length < 3) return;
    cityDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&addressdetails=1&limit=5&featuretype=city`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        const suggestions = data
          .filter(r => r.address && (r.address.city || r.address.town || r.address.village))
          .map(r => {
            const place = r.address.city || r.address.town || r.address.village;
            const state = r.address.state || "";
            const country = r.address.country_code?.toUpperCase() || "";
            return state ? `${place}, ${state}, ${country}` : `${place}, ${country}`;
          })
          .filter((v, i, a) => a.indexOf(v) === i); // deduplicate
        setCitySuggestions(suggestions);
      } catch {}
    }, 400);
  }

  // Active colors
  const activePrimary = currentStep != null && currentStep >= 4 ? accentColor : SAGE;
  const activeSecondary = currentStep != null && currentStep >= 4 ? secondaryColor : "#D4A853";
  const accent = activePrimary;

  // ─── Browser back button interception ────────────────────────

  useEffect(() => {
    if (currentStep === null || currentStep <= 0) return;

    const handlePop = (e) => {
      e.preventDefault();
      window.history.pushState(null, "", window.location.href);
      goTo(Math.max(0, currentStep - 1));
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [currentStep]);

  // ─── Stripe session / code check on mount ─────────────────────
  const [showCodeEntry, setShowCodeEntry] = useState(false);
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const codeParam = searchParams.get("code");

    if (sessionId) {
      // Coming from Stripe checkout redirect
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
    } else if (codeParam) {
      // Coming from emailed link with ?code=HOLY-XXXX-XXXX
      setRegCode(codeParam.trim().toUpperCase());
      setArriving(true);
    } else if (searchParams.get("cancelled")) {
      setError("Payment was cancelled. You can try again on the Churches page.");
      setCurrentStep(0);
    } else {
      // No session_id and no code — show manual code entry
      setShowCodeEntry(true);
      setCurrentStep(-1); // special state for code entry screen
    }
  }, []);

  // Arrival animation timing — show continue button after animation finishes
  const [animFinished, setAnimFinished] = useState(false);
  useEffect(() => {
    if (arriving) {
      setAnimFinished(false);
      const timer = setTimeout(() => setAnimFinished(true), 2000);
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
        if (data.suggested_accent) {
          setAccentColor(data.suggested_accent);
          setSecondaryColor(data.suggested_secondary || data.suggested_accent);
          setIsCustom(true);
          setTheme("custom");
        } else if (data.suggested_theme && THEMES[data.suggested_theme]) {
          const preset = THEMES[data.suggested_theme];
          setTheme(data.suggested_theme);
          setAccentColor(preset.accent);
          setSecondaryColor(preset.secondary);
          setIsCustom(false);
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
        denomination: (denomination === "Other" ? denomOther : denomination) || undefined,
        city: city || undefined,
        website: website || undefined,
        theme: isCustom ? "custom" : theme,
        accent_color: accentColor,
        secondary_color: secondaryColor,
        registration_code: regCode.trim(),
      });

      const church = resp?.church || resp;
      setChurchId(church?.id || "");
      setInviteCode(church?.invite_code || "");
      setLoading(false);
      goTo(5);
    } catch (err) {
      const msg = err?.code || err?.message || "";
      if (msg.includes("Invalid registration code") || msg.includes("already used")) {
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

  const cn = churchName || "Our Church";
  const sundayText = `We're excited to share that ${cn} is now on Devotion, a daily faith app with guided sermon reflections, prayer tools, and community features.\n\nHow to join:\n1. Download Devotion from the App Store or Google Play (holydevotion.app/download)\n2. Open the app and tap "Church"\n3. Enter our code: ${inviteCode}\n\nJoining our church on Devotion is completely free and gives you upgraded access, including daily sermon reflections, prayer tools, and community features. Each week you'll receive guided reflections based on the Sunday sermon.\n\nPlease share this only with our congregation.`;
  const socialText = `${cn} is on Devotion! Daily sermon reflections, prayer tools, and community features for our congregation.\n\nDownload: holydevotion.app/download\nTap Church, enter code: ${inviteCode}\n\nGrow in faith together, every day of the week.`;
  const directText = `Hey! ${cn} just joined Devotion, a daily faith app. Download it at holydevotion.app/download, tap Church, and enter code ${inviteCode} to connect with us.\n\nYou'll get upgraded access with daily sermon reflections, prayer tools, and community features at no cost.`;

  // ─── Celebration + navigate ──────────────────────────────────

  function handleFinish() {
    setCelebrating(true);
    setTimeout(() => navigate("/portal"), 2500);
  }

  // ─── Arrival Animation ───────────────────────────────────────

  if (arriving && !arrivalDone) {
    return (
      <div style={s.arrivalPage}>
        {/* ─── The Unveiling ─── */}
        {/* Gold line draws down center */}
        <motion.div
          style={{
            position: "fixed", top: 0, left: "50%", width: 2, zIndex: 10,
            background: GOLD, transform: "translateX(-50%)",
            boxShadow: `0 0 20px rgba(201,168,76,0.6)`,
          }}
          initial={{ height: 0 }}
          animate={{ height: "100vh", opacity: [1, 1, 0] }}
          transition={{ height: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.3, delay: 0.5 } }}
        />
        {/* Left curtain */}
        <motion.div
          style={{ position: "fixed", top: 0, left: 0, width: "50vw", height: "100vh", background: LINEN, zIndex: 5, transformOrigin: "right center" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 60, damping: 18 }}
        />
        {/* Right curtain */}
        <motion.div
          style={{ position: "fixed", top: 0, right: 0, width: "50vw", height: "100vh", background: LINEN, zIndex: 5, transformOrigin: "left center" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 60, damping: 18 }}
        />
        {/* Cross enters with spring bounce */}
        <motion.div
          style={{ position: "fixed", top: "50%", left: "50%", fontSize: 44, color: SAGE, zIndex: 20 }}
          initial={{ x: "-50%", y: "-50%", opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1, type: "spring", stiffness: 150, damping: 10 }}
        >
          ✝
        </motion.div>

        {/* Continue button */}
        <AnimatePresence>
          {animFinished && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              style={{
                position: "fixed", bottom: 0, left: 0, right: 0,
                zIndex: 200, padding: "20px 20px 28px",
                background: "linear-gradient(to top, rgba(10,14,26,0.95) 60%, transparent 100%)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
              }}
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setArrivalDone(true); setCurrentStep(0); }}
                style={{
                  padding: "12px 48px", borderRadius: 10, border: "none", cursor: "pointer",
                  background: GOLD, color: "#0a0e1a",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700,
                  boxShadow: `0 4px 20px rgba(201,168,76,0.3)`,
                }}
              >
                Continue →
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
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

  // ─── Manual Code Entry (no session_id, no code param) ─────────

  if (currentStep === -1 && showCodeEntry) {
    return (
      <div style={s.page}>
        <style>{baseCSS}</style>
        <div style={s.container}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 36, color: SAGE, lineHeight: 1 }}>✝</div>
            <div style={{
              fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600,
              color: SAGE, marginTop: 6, letterSpacing: "0.02em",
            }}>Devotion</div>
          </div>

          <div style={s.card}>
            <h1 style={s.heading}>Have a registration code?</h1>
            <p style={s.sub}>Enter the code from your purchase confirmation email to set up your church.</p>

            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              style={{ ...s.input, fontSize: 18, padding: "14px 16px", textAlign: "center", letterSpacing: "0.05em", fontFamily: "'Playfair Display', serif" }}
              placeholder="HOLY-XXXX-XXXX"
              autoFocus
            />

            {error && <p style={s.error}>{error}</p>}

            <button
              style={{ ...s.btn, background: SAGE }}
              onClick={() => {
                if (!manualCode.trim()) { setError("Please enter your registration code."); return; }
                setRegCode(manualCode.trim());
                setShowCodeEntry(false);
                setArriving(true);
              }}
            >
              Continue →
            </button>

            <div style={{ textAlign: "center", marginTop: 20 }}>
              <p style={{ fontSize: 13, color: "#A8A29E", margin: "0 0 4px" }}>Don't have a code?</p>
              <a
                href="/churches"
                style={{ fontSize: 14, color: SAGE, fontWeight: 600, textDecoration: "none" }}
              >
                Get started at holydevotion.app/churches
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Celebration Screen ──────────────────────────────────────

  if (celebrating) {
    return (
      <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{baseCSS + celebrationCSS}</style>
        <div style={{ textAlign: "center", animation: "fadeSlideUp 0.6s ease" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }} className="celebration-cross">✝</div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700,
            color: "#2C2C2C", marginBottom: 8,
          }}>Your church is live.</h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#7A7672",
            lineHeight: 1.6,
          }}>Welcome to Devotion, Pastor.</p>
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div style={s.page}>
      <style>{baseCSS}</style>

      {/* Progress bar + step label */}
      {currentStep > 0 && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: LINEN, borderBottom: "1px solid #D4CFC7" }}>
          <div style={{ height: 5, background: "#D4CFC7" }}>
            <div style={{ height: "100%", background: accent, width: `${(PROGRESS[currentStep] || 0) * 100}%`, transition: "width 0.4s ease", borderRadius: "0 2px 2px 0", boxShadow: `0 0 8px ${accent}40` }} />
          </div>
          <div style={{
            textAlign: "center", padding: "8px 0 6px",
            fontSize: 12, fontWeight: 600, color: "#7A7672",
            fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.03em",
          }}>
            Step {currentStep} of 6 — {STEP_LABELS[currentStep]}
          </div>
        </div>
      )}

      <div style={s.container}>
        {/* Branded header for steps 1-6 */}
        {currentStep > 0 && (
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 36, color: accent, lineHeight: 1 }}>✝</div>
            <div style={{
              fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600,
              color: accent, marginTop: 6, letterSpacing: "0.02em",
            }}>Devotion</div>
          </div>
        )}

        {/* Step content (animated) */}
        <div style={{ opacity: animating ? 0 : 1, transform: animating ? `translateX(${slideDir === "right" ? "20px" : "-20px"})` : "translateX(0)", transition: "opacity 0.15s ease, transform 0.15s ease" }}>

        {/* ─── Step 0: Welcome ─── */}
        {currentStep === 0 && <WelcomeStep onContinue={() => goTo(1)} />}

        {/* ─── Step 1: Account ─── */}
        {currentStep === 1 && (
          <div style={s.card}>
            <h1 style={s.heading}>Let's secure your account</h1>
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

            <label style={{ ...s.label, marginTop: 16 }}>Confirm Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={s.input}
              placeholder="Re-enter your password"
            />

            {error && <p style={s.error}>{error}</p>}

            <button
              style={{ ...s.btn, background: accent }}
              onClick={async () => {
                setError("");
                if (!email.trim()) { setError("Email is required."); return; }
                if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
                if (password !== confirmPassword) { setError("Passwords don't match."); return; }

                // Quick email-in-use check by attempting to create and immediately catching
                try {
                  const { createUserWithEmailAndPassword: create, deleteUser: del } = await import("firebase/auth");
                  const { auth: fbAuth } = await import("../../firebase");
                  const cred = await create(fbAuth, email, password);
                  // Success — account is new. Delete it so signUp() can recreate it later
                  // with proper error handling and church creation in one flow.
                  await del(cred.user);
                } catch (err) {
                  if (err?.code === "auth/email-already-in-use") {
                    setError("An account with this email already exists. If this is yours, your password must match the one you used before.");
                  } else if (err?.code === "auth/invalid-email") {
                    setError("Please enter a valid email address.");
                    return;
                  }
                  // For other errors (network, etc), let them proceed — signUp() will handle it
                }

                goTo(2);
              }}
            >
              Continue →
            </button>

            <p style={{ fontSize: 12, color: "#A8A29E", textAlign: "center", marginTop: 16 }}>
              Already have an account?{" "}
              <a href="/portal/login" style={{ color: SAGE, fontWeight: 600, textDecoration: "none" }}>Sign in</a>
            </p>
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

            <label style={{ ...s.label, marginTop: 24 }}>
              Denomination
            </label>
            <p style={{ fontSize: 13, color: "#7A7672", margin: "0 0 8px", lineHeight: 1.5 }}>
              Helps us tailor sermon reflections and guidance to your tradition.
            </p>
            <select
              value={denomination}
              onChange={(e) => setDenomination(e.target.value)}
              style={{ ...s.input, appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237A7672' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
            >
              <option value="">Select denomination...</option>
              <option value="Non-denominational">Non-denominational</option>
              <option value="Baptist">Baptist</option>
              <option value="Catholic">Catholic</option>
              <option value="Methodist">Methodist</option>
              <option value="Presbyterian">Presbyterian</option>
              <option value="Pentecostal">Pentecostal</option>
              <option value="Anglican / Episcopal">Anglican / Episcopal</option>
              <option value="Lutheran">Lutheran</option>
              <option value="Church of Christ">Church of Christ</option>
              <option value="Assemblies of God">Assemblies of God</option>
              <option value="Seventh-day Adventist">Seventh-day Adventist</option>
              <option value="Church of God">Church of God</option>
              <option value="Reformed">Reformed</option>
              <option value="Evangelical Free">Evangelical Free</option>
              <option value="Other">Other</option>
            </select>
            {denomination === "Other" && (
              <input
                type="text"
                value={denomOther}
                onChange={(e) => setDenomOther(e.target.value)}
                style={{ ...s.input, marginTop: 8 }}
                placeholder="Enter your denomination"
                autoFocus
              />
            )}

            <label style={{ ...s.label, marginTop: 20 }}>
              Location
            </label>
            <p style={{ fontSize: 13, color: "#7A7672", margin: "0 0 8px", lineHeight: 1.5 }}>
              Helps new members in your area find and join your church.
            </p>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={city}
                onChange={(e) => handleCityChange(e.target.value)}
                onBlur={() => setTimeout(() => setCitySuggestions([]), 200)}
                style={s.input}
                placeholder="e.g. Dallas, TX"
              />
              {citySuggestions.length > 0 && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
                  background: "#fff", border: "1px solid #E0DCD7", borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.1)", marginTop: 4,
                  maxHeight: 200, overflowY: "auto",
                }}>
                  {citySuggestions.map((suggestion, i) => (
                    <div
                      key={i}
                      onMouseDown={() => { setCity(suggestion); setCitySuggestions([]); }}
                      style={{
                        padding: "10px 14px", cursor: "pointer", fontSize: 14, color: "#4A4A4A",
                        borderBottom: i < citySuggestions.length - 1 ? "1px solid #f0ede8" : "none",
                      }}
                      onMouseEnter={(e) => e.target.style.background = "#f5f3ef"}
                      onMouseLeave={(e) => e.target.style.background = "transparent"}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <p style={s.error}>{error}</p>}

            <button
              style={{ ...s.btn, background: accent }}
              onClick={() => {
                if (!churchName.trim()) { setError("Church name is required."); return; }
                if (!denomination && !denomOther.trim()) { setError("Please select a denomination."); return; }
                if (denomination === "Other" && !denomOther.trim()) { setError("Please enter your denomination."); return; }
                if (!city.trim()) { setError("Please enter your church's location."); return; }
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
            <p style={s.sub}>Paste your URL and we'll pull your church's colors automatically.</p>

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
              Skip for now
            </button>
            <button style={s.backLink} onClick={() => goTo(2)}>Back</button>
          </div>
        )}

        {/* ─── Step 4: Theme ─── */}
        {currentStep === 4 && (
          <div style={s.card}>
            <h1 style={s.heading}>Make it yours</h1>
            <p style={s.sub}>Choose the colors that represent your church. This is what your congregation will see.</p>

            {brandingResult?.detected && !isCustom && (
              <div style={{ ...s.detectedCard, borderColor: `${accentColor}33` }}>
                <p style={{ margin: 0, fontSize: 13, color: "#7A7672" }}>We found this from your website:</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: accentColor }} />
                  <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, color: "#2C2C2C" }}>
                    {THEMES[theme]?.label || "Detected"}
                  </span>
                </div>
              </div>
            )}

            {/* Preset grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
              {Object.entries(THEMES).map(([key, t]) => {
                const selected = !isCustom && theme === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setTheme(key);
                      setAccentColor(t.accent);
                      setSecondaryColor(t.secondary);
                      setIsCustom(false);
                    }}
                    style={{
                      padding: "10px 8px 8px",
                      borderRadius: 12,
                      border: `2px solid ${selected ? t.accent : "#EDE9E3"}`,
                      background: selected ? `${t.accent}08` : "#FDFCFA",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      transition: "all 0.2s",
                      boxShadow: selected ? `0 0 16px ${t.accent}22` : "none",
                    }}
                  >
                    <div style={{ display: "flex", gap: 4 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: t.accent, border: "2px solid #fff", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }} />
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: t.secondary, border: "2px solid #fff", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }} />
                    </div>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 10,
                      color: selected ? t.accent : "#7A7672",
                      fontWeight: selected ? 700 : 400,
                      textAlign: "center",
                      lineHeight: 1.2,
                    }}>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom color option */}
            <div style={{
              padding: "16px",
              borderRadius: 12,
              border: `2px solid ${isCustom ? accentColor : "#EDE9E3"}`,
              background: isCustom ? `${accentColor}08` : "#FDFCFA",
              marginBottom: 20,
              transition: "all 0.2s",
            }}>
              <button
                type="button"
                onClick={() => setIsCustom(true)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
                  color: isCustom ? accentColor : "#7A7672",
                  padding: 0, marginBottom: isCustom ? 14 : 0,
                  display: "block", width: "100%", textAlign: "left",
                }}
              >
                🎨 Custom Colors
              </button>
              {isCustom && (
                <div style={{ display: "flex", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...s.label, fontSize: 11, marginBottom: 6 }}>Accent Color</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => { setAccentColor(e.target.value); setTheme("custom"); }}
                        style={{ width: 40, height: 36, border: "none", borderRadius: 8, cursor: "pointer", padding: 0 }}
                      />
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) { setAccentColor(v); setTheme("custom"); } }}
                        style={{ ...s.input, fontFamily: "monospace", fontSize: 13, width: "100%", padding: "8px 10px" }}
                      />
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...s.label, fontSize: 11, marginBottom: 6 }}>Secondary Color</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => { setSecondaryColor(e.target.value); setTheme("custom"); }}
                        style={{ width: 40, height: 36, border: "none", borderRadius: 8, cursor: "pointer", padding: 0 }}
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) { setSecondaryColor(v); setTheme("custom"); } }}
                        style={{ ...s.input, fontFamily: "monospace", fontSize: 13, width: "100%", padding: "8px 10px" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live phone mockup preview */}
            <PhoneMockup churchName={churchName} accentColor={accentColor} secondaryColor={secondaryColor} />

            {error && <p style={s.error}>{error}</p>}

            <button
              style={{ ...s.btn, background: accentColor }}
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
                  placeholder={"e.g. This Sunday I preached on trusting God through uncertainty, from Mark 4:35-41. The boat was sinking, but Jesus was asleep. Sometimes faith means resting in the storm."}
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
              <a
                href={`mailto:?subject=${encodeURIComponent(`${cn} is now on Devotion`)}&body=${encodeURIComponent(directText)}`}
                style={s.shareBtn}
              >
                Send via email
              </a>
            </div>

            <p style={{ fontSize: 12, color: "#A8A29E", textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>
              Please share this code only with your congregation.
            </p>

            <button
              style={{ ...s.btn, background: accent, marginTop: 24 }}
              onClick={handleFinish}
            >
              Go to My Dashboard →
            </button>
          </div>
        )}
        </div>{/* end animation wrapper */}
      </div>{/* end container */}
    </div>
  );
}


// ─── Welcome Step (with typewriter) ─────────────────────────────

function WelcomeStep({ onContinue }) {
  const lines = [
    "Welcome to Devotion.",
    "You just took a meaningful step for your church. Starting today, your congregation will have a place to grow in faith together, not just on Sundays, but every day of the week.",
    "Let's get your church set up. This will only take a couple of minutes.",
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

  // SVG line icons — 24x24, stroke 1.5, currentColor
  const BookIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </svg>
  );
  const PulseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
  const BellIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
  const SparkleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
    </svg>
  );

  const features = [
    { icon: <BookIcon />, title: "Guided Sermon Studies", desc: "You enter your sermon once. Devotion creates 7 daily reflections for your congregation. Scripture-grounded, theologically thoughtful, ready in seconds." },
    { icon: <PulseIcon />, title: "Spiritual Pulse", desc: "See what your congregation is seeking guidance on. Anonymous conversation themes like anxiety, grief, and purpose, updated weekly so you can preach to real needs." },
    { icon: <BellIcon />, title: "Pastoral Intelligence", desc: "When a member hits a streak milestone or goes quiet for a while, you'll know. So you can reach out before they have to ask." },
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
            <div style={{ color: SAGE, flexShrink: 0 }}>{f.icon}</div>
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
          <div style={{ color: SAGE, flexShrink: 0 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
            </svg>
          </div>
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


// ─── CSS: Arrival Animations ─────────────────────────────────────

function getArrivalCSS() {
  // "The Unveiling"
  return `
      .arrival-line {
        position: fixed; top: 0; left: 50%; width: 2px; height: 0;
        background: ${GOLD}; z-index: 10; transform: translateX(-50%);
        animation: lineDown 0.5s ease forwards, lineFade 0.3s ease 0.5s forwards;
        box-shadow: 0 0 20px rgba(201,168,76,0.6);
      }
      @keyframes lineDown {
        from { height: 0; top: 0; }
        to { height: 100vh; top: 0; }
      }
      @keyframes lineFade {
        to { opacity: 0; }
      }
      .arrival-curtain-left, .arrival-curtain-right {
        position: fixed; top: 0; width: 50vw; height: 100vh;
        background: ${LINEN}; z-index: 5; transform: scaleX(0);
      }
      .arrival-curtain-left {
        left: 0; transform-origin: right center;
        animation: curtainReveal 0.7s ease 0.5s forwards;
      }
      .arrival-curtain-right {
        right: 0; transform-origin: left center;
        animation: curtainReveal 0.7s ease 0.5s forwards;
      }
      @keyframes curtainReveal {
        from { transform: scaleX(0); }
        to { transform: scaleX(1); }
      }
      .arrival-cross-b {
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.8);
        font-size: 40px; color: ${SAGE}; z-index: 20; opacity: 0;
        animation: crossPulse 0.6s ease 1.2s forwards;
      }
      @keyframes crossPulse {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        60% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
        100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }
    `;
}


// ─── CSS: Base + Celebration ────────────────────────────────────

const baseCSS = `
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

const celebrationCSS = `
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .celebration-cross {
    animation: celebPulse 2s ease infinite;
  }
  @keyframes celebPulse {
    0%, 100% { transform: scale(1); opacity: 0.9; }
    50% { transform: scale(1.1); opacity: 1; }
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
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
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
    height: 4,
    background: "#EDE9E3",
  },
  progressFill: {
    height: "100%",
    transition: "width 0.4s ease",
    borderRadius: "0 2px 2px 0",
  },
  container: {
    width: "100%",
    maxWidth: 600,
    paddingTop: 40,
    paddingBottom: 48,
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
  detectedCard: {
    padding: "14px 16px",
    borderRadius: 12,
    border: "1px solid",
    background: "#FDFCFA",
    marginBottom: 20,
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
    display: "block",
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
    boxSizing: "border-box",
    textDecoration: "none",
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
