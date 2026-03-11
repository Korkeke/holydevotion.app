import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ──────────────────────────────────────────────────────
const COLORS = {
  bg: "#0a0e1a",
  bgDeep: "#060911",
  bgCard: "rgba(15, 22, 45, 0.7)",
  navy: "#0f1632",
  navyLight: "#1a2347",
  gold: "#c9a84c",
  goldLight: "#e8cc6e",
  goldDim: "rgba(201, 168, 76, 0.15)",
  goldGlow: "rgba(201, 168, 76, 0.08)",
  text: "#e8e4dc",
  textMuted: "rgba(232, 228, 220, 0.5)",
  textDim: "rgba(232, 228, 220, 0.3)",
  white: "#fff",
  border: "rgba(201, 168, 76, 0.1)",
  borderHover: "rgba(201, 168, 76, 0.25)",
};

const PAGES = ["Home", "Features", "Churches", "Privacy", "Contact"];



// ─── Hooks ──────────────────────────────────────────────────────────
function useInView(opts = {}) {
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && !done) { setVisible(true); setDone(true); } },
      { threshold: opts.threshold ?? 0.12 }
    );
    obs.observe(el);
    return () => obs.unobserve(el);
  }, [done]);
  return [ref, visible];
}

function useMouseGlow() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const h = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);
  return pos;
}

// ─── Shared Components ──────────────────────────────────────────────
function RevealBlock({ children, delay = 0, style = {} }) {
  const [ref, vis] = useInView();
  return (
    <div ref={ref} style={{
      height: "100%",
      ...style,
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(36px)",
      transition: `all 0.75s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
    }}>{children}</div>
  );
}

function GoldButton({ children, onClick, outline = false, large = false }) {
  const [h, setH] = useState(false);
  const base = {
    padding: large ? "18px 44px" : "14px 32px",
    fontSize: large ? "16px" : "14px",
    fontFamily: "'Nunito Sans', sans-serif",
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    border: outline ? `1.5px solid ${COLORS.gold}` : "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
    background: outline
      ? (h ? COLORS.goldDim : "transparent")
      : (h ? COLORS.goldLight : COLORS.gold),
    color: outline ? COLORS.gold : COLORS.bgDeep,
    boxShadow: !outline && h ? `0 8px 40px rgba(201,168,76,0.3)` : "none",
    transform: h ? "translateY(-2px)" : "translateY(0)",
  };
  return (
    <button style={base} onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
      {children}
    </button>
  );
}

function SectionTag({ children }) {
  return <p style={s.sectionTag}>{children}</p>;
}

function SectionTitle({ children }) {
  return <h2 style={s.sectionTitle}>{children}</h2>;
}

function CrossIcon({ size = 20, color = COLORS.gold }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M12 2v20M7 7h10" strokeLinecap="round" />
    </svg>
  );
}

// ─── Icon Set ───────────────────────────────────────────────────────
const I = {
  book: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.3" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/><path d="M8 7h8M8 11h5"/></svg>,
  hands: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.3" strokeLinecap="round"><path d="M7 20l3-3m0 0l2-2m-2 2l-2-2m2 2l2 2"/><path d="M12 4C8 4 5 7 5 10c0 2 1 3.5 2.5 4.5"/><path d="M12 4c4 0 7 3 7 6 0 2-1 3.5-2.5 4.5"/><path d="M12 4v4"/></svg>,
  compass: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.3"><circle cx="12" cy="12" r="9"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88" fill="none" stroke={COLORS.gold} strokeWidth="1.3"/></svg>,
  flame: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.3" strokeLinecap="round"><path d="M12 22c4-2 7-5.5 7-10 0-3.5-2-6.5-4-8.5-1 2-2.5 3-4 3S8 5 7 3.5C5 5.5 5 8 5 10c0 5.5 3 8 7 12z"/></svg>,
  star: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.3" strokeLinecap="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z"/></svg>,
  bookmark: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.3" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>,
  church: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.3" strokeLinecap="round"><path d="M18 21H6a1 1 0 01-1-1v-7l7-8 7 8v7a1 1 0 01-1 1z"/><path d="M12 2v3M10 4h4"/><path d="M10 21v-4h4v4"/></svg>,
  chat: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.3" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  lock: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.3" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><circle cx="12" cy="16" r="1" fill={COLORS.gold}/></svg>,
  path: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.3" strokeLinecap="round"><path d="M18 6l-6 6-4-4-6 6"/><path d="M14 6h4v4"/></svg>,
  journal: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.3" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg>,
  calendar: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.3" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h2v2H8z" fill={COLORS.gold}/></svg>,
  chart: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.3" strokeLinecap="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  palette: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.3" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="8" r="1.5" fill={COLORS.gold}/><circle cx="8" cy="12" r="1.5" fill={COLORS.gold}/><circle cx="16" cy="12" r="1.5" fill={COLORS.gold}/><circle cx="12" cy="16" r="1.5" fill={COLORS.gold}/></svg>,
  heart: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.3" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/></svg>,
  shield: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.3" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
  sun: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.3" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>,
  water: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.3" strokeLinecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>,
  link: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.3" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  dove: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.3" strokeLinecap="round"><path d="M18 8c2 0 4-1 4-3-3 0-4 1-4 3zm0 0c0 3-2 6-6 8l-4 2-2-2 4-4c-3 0-5-1-6-3s-1-5 1-7l3 3c1-2 4-4 7-4h3v3z"/></svg>,
};

function Icon({ name, size = 26 }) {
  const fn = I[name];
  return fn ? <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{fn(size)}</div> : <span>✦</span>;
}

// ─── Floating Particles ─────────────────────────────────────────────
function Particles() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    resize();
    window.addEventListener("resize", resize);

    // Create particles
    const count = window.innerWidth < 768 ? 20 : 40;
    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * w(),
      y: Math.random() * h(),
      size: Math.random() * 2.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.15,
      speedY: -Math.random() * 0.2 - 0.05,
      opacity: Math.random() * 0.4 + 0.1,
      opacitySpeed: (Math.random() - 0.5) * 0.003,
      glow: Math.random() > 0.7,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, w(), h());

      particlesRef.current.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.opacity += p.opacitySpeed;

        if (p.opacity <= 0.05 || p.opacity >= 0.5) p.opacitySpeed *= -1;
        if (p.y < -10) { p.y = h() + 10; p.x = Math.random() * w(); }
        if (p.x < -10) p.x = w() + 10;
        if (p.x > w() + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 168, 76, ${p.opacity})`;
        ctx.fill();

        if (p.glow) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
          grad.addColorStop(0, `rgba(201, 168, 76, ${p.opacity * 0.3})`);
          grad.addColorStop(1, `rgba(201, 168, 76, 0)`);
          ctx.fillStyle = grad;
          ctx.fill();
        }
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}

// ─── Navigation ─────────────────────────────────────────────────────
function Navbar({ page, setPage }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav style={{
      ...s.nav,
      background: scrolled ? "rgba(6,9,17,0.92)" : "transparent",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom: scrolled ? `1px solid ${COLORS.border}` : "1px solid transparent",
    }}>
      <div style={s.navInner}>
        <div style={s.logo} onClick={() => { setPage("Home"); window.scrollTo(0,0); }}>
          <CrossIcon size={22} />
          <span style={s.logoText}>DEVOTION</span>
        </div>

        <div className="nav-links" style={s.navLinks}>
          {PAGES.map((p) => (
            <button key={p} onClick={() => { setPage(p); window.scrollTo(0,0); setMenuOpen(false); }}
              style={{
                ...s.navLink,
                color: page === p ? COLORS.gold : COLORS.textMuted,
              }}>
              {p}
            </button>
          ))}
        </div>

        <div className="nav-download">
          <GoldButton onClick={() => {}}>Download</GoldButton>
        </div>

        <button className="nav-hamburger" style={s.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
          <div style={{ ...s.hamLine, transform: menuOpen ? "rotate(45deg) translateY(6px)" : "none" }} />
          <div style={{ ...s.hamLine, opacity: menuOpen ? 0 : 1 }} />
          <div style={{ ...s.hamLine, transform: menuOpen ? "rotate(-45deg) translateY(-6px)" : "none" }} />
        </button>
      </div>

      {menuOpen && (
        <div style={s.mobileMenu}>
          {PAGES.map((p) => (
            <button key={p} onClick={() => { setPage(p); window.scrollTo(0,0); setMenuOpen(false); }}
              style={{
                ...s.mobileLink,
                color: page === p ? COLORS.gold : COLORS.text,
              }}>
              {p}
            </button>
          ))}
          <GoldButton onClick={() => setMenuOpen(false)}>Download App</GoldButton>
        </div>
      )}
    </nav>
  );
}

// ─── Phone Mockup Component ─────────────────────────────────────────
function PhoneMockup({ screen, style = {}, animate = false, delay = 0 }) {
  const [ref, vis] = useInView();
  const screens = {
    home: (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "linear-gradient(180deg, #0f1a30 0%, #0a1020 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><path d="M3 21h18M5 21V10l7-7 7 7v11"/></svg>
            </div>
            <span style={{ fontSize: 7, color: COLORS.textMuted }}>Good morning</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ fontSize: 6.5, color: COLORS.gold, background: "rgba(201,168,76,0.12)", padding: "2px 6px", borderRadius: 8, display: "flex", alignItems: "center", gap: 2 }}>
              <span>✦ 0/5</span>
              <svg width="7" height="7" viewBox="0 0 24 24" fill={COLORS.gold} stroke="none"><path d="M12 22c4-2 7-5.5 7-10 0-3.5-2-6.5-4-8.5-1 2-2.5 3-4 3S8 5 7 3.5C5 5.5 5 8 5 10c0 5.5 3 8 7 12z"/></svg>
              <span>3</span>
            </div>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", padding: "8px 0 6px" }}>
          <div style={{ color: COLORS.gold, fontSize: 22, lineHeight: 1, marginBottom: 3 }}>✝</div>
          <div style={{ fontSize: 11, letterSpacing: "0.18em", fontWeight: 700, color: COLORS.text }}>DEVOTION</div>
          <div style={{ fontSize: 7.5, color: COLORS.gold, opacity: 0.6, fontStyle: "italic", marginTop: 2 }}>Your daily faith companion</div>
        </div>
        <div style={{ padding: "0 10px", flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ background: "linear-gradient(145deg, rgba(201,168,76,0.08), rgba(201,168,76,0.02))", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "9px 10px", marginBottom: 7, textAlign: "center" }}>
            <div style={{ fontSize: 6.5, color: COLORS.gold, letterSpacing: "0.14em", fontWeight: 600, marginBottom: 4 }}>TODAY'S SCRIPTURE</div>
            <div style={{ fontSize: 8, color: COLORS.text, fontStyle: "italic", lineHeight: 1.5, marginBottom: 3 }}>"For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end."</div>
            <div style={{ fontSize: 7, color: COLORS.textDim }}>Jeremiah 29:11, KJV</div>
          </div>
          <div style={{ fontSize: 8.5, color: COLORS.text, textAlign: "center", marginBottom: 4, fontWeight: 500 }}>What's on your heart today?</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 16, padding: "5px 8px", marginBottom: 8 }}>
            <span style={{ fontSize: 7.5, color: COLORS.textDim }}>What does God say about anxiety?</span>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: COLORS.gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: COLORS.bgDeep }}>→</div>
          </div>
          <div style={{ fontSize: 7, color: COLORS.text, letterSpacing: "0.12em", fontWeight: 700, marginBottom: 5 }}>TODAY'S PATH</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            {[
              { name: "Guided Prayer", sub: "Pray together today.", bg: "rgba(56,130,130,0.35)",
                svg: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#5ba8a0" strokeWidth="2" strokeLinecap="round"><path d="M12 21c-4-3-8-6-8-10a4 4 0 018 0 4 4 0 018 0c0 4-4 7-8 10z"/></svg> },
              { name: "Daily Devotional", sub: "Today's reading.", bg: "rgba(201,168,76,0.25)",
                svg: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg> },
              { name: "Wisdom Challenge", sub: "Today's question.", bg: "rgba(56,130,130,0.35)",
                svg: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#5ba8a0" strokeWidth="2" strokeLinecap="round"><path d="M8 21h8M12 17v4M7 4h10l-2 8H9L7 4z"/><path d="M5 4h14"/></svg> },
              { name: "Daily Saint", sub: "Today's story of faith", bg: "rgba(201,168,76,0.25)",
                svg: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="7" r="3"/><path d="M12 10v10M9 14h6"/></svg> },
            ].map((t, i) => (
              <div key={i} style={{ background: "rgba(30,50,80,0.5)", border: "1px solid rgba(201,168,76,0.08)", borderRadius: 7, padding: "7px 6px" }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>{t.svg}</div>
                <div style={{ fontSize: 7.5, color: COLORS.text, fontWeight: 600, marginBottom: 1 }}>{t.name}</div>
                <div style={{ fontSize: 6.5, color: COLORS.textDim }}>{t.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.08)", borderRadius: 7, padding: "6px 8px", marginTop: 5 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(201,168,76,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="2"><circle cx="12" cy="12" r="9"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88" fill="none" stroke={COLORS.gold} strokeWidth="2"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 7.5, fontWeight: 600, color: COLORS.text }}>Start Your Journey</div>
              <div style={{ fontSize: 6.5, color: COLORS.textDim }}>A guided path through what you're facing</div>
            </div>
            <div style={{ fontSize: 8, color: COLORS.textDim }}>›</div>
          </div>
        </div>
        <div style={{ display: "flex", padding: "5px 6px 3px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {[
            { label: "Home", active: true, svg: <svg width="11" height="11" viewBox="0 0 24 24" fill={COLORS.gold} stroke="none"><path d="M3 12l9-9 9 9v9a1 1 0 01-1 1h-5v-6h-4v6H6a1 1 0 01-1-1z"/></svg> },
            { label: "Bible", active: false, svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg> },
            { label: "Chat", active: false, svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
            { label: "Journal", active: false, svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5z"/></svg> },
            { label: "Verses", active: false, svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg> },
          ].map((n, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ opacity: n.active ? 1 : 0.5 }}>{n.svg}</div>
              <div style={{ fontSize: 5.5, color: n.active ? COLORS.gold : COLORS.textDim, marginTop: 1 }}>{n.label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    chat: (
      <div style={{ padding: 16, height: "100%", display: "flex", flexDirection: "column", background: "linear-gradient(180deg, #0f1a30 0%, #0a1020 100%)" }}>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.3)", margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.5" strokeLinecap="round"><path d="M12 21c-4-3-8-6-8-10a4 4 0 018 0 4 4 0 018 0c0 4-4 7-8 10z"/></svg>
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: COLORS.text }}>Guided Prayer</div>
          <div style={{ fontSize: 9, color: COLORS.textMuted, fontStyle: "italic", marginTop: 4 }}>Draw near to God and He will draw near to you.</div>
        </div>
        <div style={{ fontSize: 11, color: COLORS.text, textAlign: "center", marginBottom: 10 }}>What would you like to bring to God today?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, justifyContent: "center", marginBottom: 12 }}>
          {["Anxiety", "Grief", "Gratitude", "Forgiveness", "Healing", "Family", "Doubt", "Purpose"].map((t, i) => (
            <div key={i} style={{ padding: "5px 10px", borderRadius: 14, border: "1px solid rgba(201,168,76,0.15)", background: i === 0 ? "rgba(201,168,76,0.1)" : "transparent", fontSize: 9, color: i === 0 ? COLORS.gold : COLORS.textMuted }}>{t}</div>
          ))}
        </div>
        <div style={{ fontSize: 8, color: COLORS.gold, letterSpacing: "0.1em", fontWeight: 600, marginBottom: 6 }}>ANYTHING SPECIFIC?</div>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.1)", borderRadius: 8, padding: "8px 10px", marginBottom: 12, fontSize: 9, color: COLORS.textDim, minHeight: 36 }}>e.g. my mother's surgery...</div>
        <div style={{ marginTop: "auto", padding: "10px 0", textAlign: "center", background: COLORS.gold, borderRadius: 8, color: COLORS.bgDeep, fontSize: 11, fontWeight: 600 }}>Generate My Prayer</div>
      </div>
    ),
    bible: (
      <div style={{ padding: 16, height: "100%", display: "flex", flexDirection: "column", background: "linear-gradient(180deg, #0f1a30 0%, #0a1020 100%)" }}>
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.3)", margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: COLORS.text }}>Bible Search</div>
          <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 4 }}>Explore 31,102 verses of Scripture.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "7px 10px", marginBottom: 12 }}>
          <span style={{ fontSize: 9, color: COLORS.textDim, flex: 1 }}>Search the Scriptures...</span>
          <div style={{ padding: "4px 10px", background: COLORS.gold, borderRadius: 5, fontSize: 8, fontWeight: 600, color: COLORS.bgDeep }}>Search</div>
        </div>
        <div style={{ fontSize: 7, color: COLORS.gold, letterSpacing: "0.12em", fontWeight: 600, textAlign: "center", marginBottom: 6 }}>POPULAR TOPICS</div>
        <div style={{ display: "flex", gap: 5, justifyContent: "center", flexWrap: "wrap", marginBottom: 14 }}>
          {["love", "forgiveness", "anxiety", "hope"].map((t, i) => (
            <div key={i} style={{ padding: "4px 12px", borderRadius: 14, border: "1px solid rgba(201,168,76,0.15)", fontSize: 9, color: COLORS.textMuted }}>{t}</div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 10 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(201,168,76,0.15)" }} />
          <span style={{ fontSize: 8, color: COLORS.gold }}>✦</span>
          <div style={{ flex: 1, height: 1, background: "rgba(201,168,76,0.15)" }} />
        </div>
        <div style={{ fontSize: 8, color: COLORS.gold, letterSpacing: "0.15em", fontWeight: 600, textAlign: "center", marginBottom: 10 }}>THE SCRIPTURES</div>
        {["Old Testament", "New Testament"].map((t, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", marginBottom: 6, borderRadius: 8, border: "1px solid rgba(201,168,76,0.12)", background: "rgba(255,255,255,0.02)" }}>
            <span style={{ fontSize: 10, color: COLORS.text, fontWeight: 500 }}>{t}</span>
            <span style={{ fontSize: 8, color: COLORS.textDim }}>{i === 0 ? "39 books" : "27 books"} ›</span>
          </div>
        ))}
        <div style={{ marginTop: "auto", padding: "10px 0", textAlign: "center", background: COLORS.gold, borderRadius: 8, color: COLORS.bgDeep, fontSize: 10, fontWeight: 600 }}>Read from the Beginning</div>
      </div>
    ),
    journey: (
      <div style={{ padding: 16, height: "100%", display: "flex", flexDirection: "column", background: "linear-gradient(180deg, #0f1a30 0%, #0a1020 100%)" }}>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: COLORS.gold }}>Choose Your Path</div>
          <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 4 }}>What are you walking through right now?</div>
          <div style={{ width: 30, height: 1, background: COLORS.gold, margin: "10px auto 0", opacity: 0.3 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, flex: 1 }}>
          {[
            { icon: "🌊", name: "Anxiety", sub: "Finding peace in the storm" },
            { icon: "💧", name: "Grief", sub: "Walking through loss with God" },
            { icon: "🤝", name: "Forgiveness", sub: "Releasing the weight you carry" },
            { icon: "✨", name: "New to Faith", sub: "Exploring what it means to believe" },
            { icon: "💛", name: "Marriage", sub: "Strengthening your covenant" },
            { icon: "🔥", name: "Purpose", sub: "Discovering why you're here" },
          ].map((p, i) => (
            <div key={i} style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.1)", borderRadius: 10, padding: "10px 8px", display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 16, marginBottom: 4 }}>{p.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.text, marginBottom: 2 }}>{p.name}</div>
              <div style={{ fontSize: 8, color: COLORS.textMuted, lineHeight: 1.4 }}>{p.sub}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    community: (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "linear-gradient(180deg, #0f1a30 0%, #0a1020 100%)" }}>
        <div style={{ background: "linear-gradient(180deg, rgba(201,168,76,0.1), rgba(10,14,26,0.95))", padding: "30px 16px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 24, color: COLORS.gold, marginBottom: 8 }}>✝</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: COLORS.text, fontWeight: 400 }}>Your Church</div>
          <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 2 }}>Faith grows stronger together</div>
        </div>
        <div style={{ padding: "12px 16px", flex: 1 }}>
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.1)", borderRadius: 10, padding: "10px 12px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(201,168,76,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="1.5" strokeLinecap="round"><path d="M18 21H6a1 1 0 01-1-1v-7l7-8 7 8v7a1 1 0 01-1 1z"/><path d="M12 2v3M10 4h4"/><path d="M10 21v-4h4v4"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.text }}>Invite Your Pastor</div>
              <div style={{ fontSize: 8, color: COLORS.textMuted }}>Bring Devotion to your congregation</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.08)", borderRadius: 10, padding: 12, textAlign: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 6 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.text }}>Find a Church</div>
              <div style={{ fontSize: 8, color: COLORS.textMuted }}>Discover churches near you</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.08)", borderRadius: 10, padding: 12, textAlign: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 6 }}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/></svg>
              <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.text }}>Invite Friends</div>
              <div style={{ fontSize: 8, color: COLORS.textMuted }}>Walk this path together</div>
            </div>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div ref={animate ? ref : undefined} style={{
      ...style,
      opacity: animate ? (vis ? 1 : 0) : 1,
      transform: animate ? (vis ? "translateY(0)" : "translateY(40px)") : "none",
      transition: animate ? `all 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s` : "none",
    }}>
      <div style={{
        width: 220,
        height: 500,
        borderRadius: 28,
        border: "2px solid rgba(201,168,76,0.2)",
        background: "linear-gradient(165deg, #0d1229, #080c1a)",
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(201,168,76,0.04)",
        fontFamily: "'Nunito Sans', sans-serif",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 20px 4px", fontSize: 10, color: COLORS.textMuted }}>
          <span>9:41</span>
          <div style={{ width: 60, height: 18, borderRadius: 10, background: "rgba(0,0,0,0.5)" }} />
          <span>●●●</span>
        </div>
        <div style={{ height: "calc(100% - 30px)", overflow: "hidden" }}>
          {screens[screen]}
        </div>
      </div>
    </div>
  );
}


// ─── Store Badges ───────────────────────────────────────────────────
function StoreBadges({ style = {} }) {
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", ...style }}>
      {/* App Store */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 18px", borderRadius: 8,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        cursor: "pointer",
        transition: "all 0.3s ease",
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill={COLORS.text}>
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
        <div>
          <div style={{ fontSize: 8, color: COLORS.textMuted, lineHeight: 1 }}>Download on the</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, lineHeight: 1.2 }}>App Store</div>
        </div>
      </div>
      {/* Google Play */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 18px", borderRadius: 8,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        cursor: "pointer",
        transition: "all 0.3s ease",
      }}>
        <svg width="18" height="20" viewBox="0 0 18 20" fill="none">
          <path d="M0.6 0.4L10.2 10L0.6 19.6C0.2 19.2 0 18.6 0 18V2C0 1.4 0.2 0.8 0.6 0.4Z" fill="#4285F4"/>
          <path d="M13.4 6.8L10.2 10L13.4 13.2L17.2 11C17.8 10.6 17.8 9.4 17.2 9L13.4 6.8Z" fill="#FBBC04"/>
          <path d="M0.6 19.6L10.2 10L13.4 13.2L1.8 19.8C1.4 20 0.9 19.9 0.6 19.6Z" fill="#EA4335"/>
          <path d="M0.6 0.4C0.9 0.1 1.4 0 1.8 0.2L13.4 6.8L10.2 10L0.6 0.4Z" fill="#34A853"/>
        </svg>
        <div>
          <div style={{ fontSize: 8, color: COLORS.textMuted, lineHeight: 1 }}>GET IT ON</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, lineHeight: 1.2 }}>Google Play</div>
        </div>
      </div>
    </div>
  );
}

// ─── HOME PAGE ──────────────────────────────────────────────────────
function HomePage({ mouse, setPage }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setTimeout(() => setLoaded(true), 150); }, []);

  const testimonials = [
    { text: "Devotion has transformed my morning routine. It's like having a gentle, wise companion who actually understands where I am in my walk.", author: "Sarah M.", location: "Toronto" },
    { text: "I've tried other faith apps but nothing felt this personal. The prayer guide helped me reconnect with God after years of feeling distant.", author: "James R.", location: "Vancouver" },
    { text: "Our small group started using Devotion together and it's brought us so much closer. The shared devotionals give us real things to talk about.", author: "Pastor David K.", location: "Calgary" },
  ];

  return (
    <>
      {/* HERO */}
      <section style={s.hero}>
        <div style={{
          ...s.heroOrb1,
          transform: `translate(${(mouse.x / window.innerWidth - 0.5) * 60}px, ${(mouse.y / window.innerHeight - 0.5) * 60}px)`,
        }} />
        <div style={{
          ...s.heroOrb2,
          transform: `translate(${(mouse.x / window.innerWidth - 0.5) * -40}px, ${(mouse.y / window.innerHeight - 0.5) * -40}px)`,
        }} />
        <Particles />
        <div style={s.heroRadial} />

        <div style={s.heroSplit}>
          {/* Left: text */}
          <div className="hero-text-side" style={s.heroTextSide}>
            <div style={{
              ...s.heroBadge,
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(16px)",
              transition: "all 0.7s cubic-bezier(0.16,1,0.3,1) 0.3s",
            }}>
              ✦ YOUR PERSONAL FAITH COMPANION
            </div>

            <h1 style={s.heroH1}>
              {["A companion for", "\n", "your walk with God."].map((segment, si) => {
                if (segment === "\n") return <br key={si} />;
                return segment.split(" ").map((word, wi) => {
                  const idx = si === 0 ? wi : wi + 3;
                  return (
                    <span key={`${si}-${wi}`} style={{
                      display: "inline-block",
                      opacity: loaded ? 1 : 0,
                      transform: loaded ? "translateY(0)" : "translateY(50px)",
                      transition: `all 0.6s cubic-bezier(0.16,1,0.3,1) ${0.5 + idx * 0.08}s`,
                      marginRight: "0.25em",
                    }}>{word}</span>
                  );
                });
              })}
            </h1>

            <p style={{
              ...s.heroSub,
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(24px)",
              transition: "all 0.7s cubic-bezier(0.16,1,0.3,1) 1.3s",
            }}>
              Daily devotionals, guided prayers, and a personalized faith journey
              rooted in Scripture and shaped for you.
            </p>

            <div className="hero-badges" style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(24px)",
              transition: "all 0.7s cubic-bezier(0.16,1,0.3,1) 1.6s",
            }}>
              <StoreBadges />
            </div>
          </div>

          {/* Right: phone */}
          <div className="hero-phone" style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0) rotate(2deg)" : "translateY(60px) rotate(2deg)",
            transition: "all 1s cubic-bezier(0.16,1,0.3,1) 0.8s",
            flexShrink: 0,
          }}>
            <PhoneMockup screen="home" />
          </div>
        </div>

      </section>

      {/* Gold divider */}
      <div style={s.heroDivider}>
        <div style={s.heroDividerLine} />
        <div style={s.heroDividerIcon}>✦</div>
        <div style={s.heroDividerLine} />
      </div>

      {/* WHAT IT DOES */}
      <section style={s.section}>
        <RevealBlock style={{ textAlign: "center", marginBottom: 56 }}>
          <SectionTag>WHAT IS DEVOTION?</SectionTag>
          <SectionTitle>Faith made personal,{"\n"}every single day.</SectionTitle>
        </RevealBlock>

        <div style={s.threeGrid}>
          {[
            { icon: <Icon name="book" />, title: "Daily Devotionals", desc: "Scripture-grounded reflections tailored to where you are in your faith journey. Not generic. Written for you." },
            { icon: <Icon name="hands" />, title: "Guided Prayer", desc: "A conversational guide that helps you pray with intention, based on your life, your struggles, and your gratitude." },
            { icon: <Icon name="compass" />, title: "Faith Journey", desc: "A personalized spiritual growth plan with reflections, milestones, and gentle accountability. At your pace." },
          ].map((item, i) => (
            <RevealBlock key={i} delay={i * 0.12}>
              <FeatureCardHome {...item} />
            </RevealBlock>
          ))}
        </div>
      </section>

      {/* APP SCREENSHOTS */}
      <section style={s.section}>
        <RevealBlock style={{ textAlign: "center", marginBottom: 56 }}>
          <SectionTag>SEE IT IN ACTION</SectionTag>
          <SectionTitle>Designed for your{"\n"}daily walk.</SectionTitle>
        </RevealBlock>

        <div style={s.screenshotsRow}>
          {[
            { screen: "home", label: "Daily Home", desc: "Your personalized dashboard with today's devotional and faith journey progress." },
            { screen: "chat", label: "Spiritual Guide", desc: "A compassionate companion for prayer, reflection, and working through life's challenges." },
            { screen: "journey", label: "Faith Journey", desc: "Structured growth plans with milestones that meet you where you are." },
            { screen: "community", label: "Church Community", desc: "Your church's space inside the app with shared devotionals and prayer." },
          ].map((item, i) => (
            <div key={i} className="screenshot-phone" style={{ textAlign: "center" }}>
              <PhoneMockup screen={item.screen} animate delay={i * 0.15} />
              <RevealBlock delay={i * 0.15 + 0.2}>
                <div style={s.screenshotLabel}>{item.label}</div>
                <div style={s.screenshotDesc}>{item.desc}</div>
              </RevealBlock>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={s.section}>
        <RevealBlock style={{ textAlign: "center", marginBottom: 56 }}>
          <SectionTag>TESTIMONIALS</SectionTag>
          <SectionTitle>Hear from people{"\n"}walking with Devotion.</SectionTitle>
        </RevealBlock>

        <div style={s.threeGrid}>
          {testimonials.map((t, i) => (
            <RevealBlock key={i} delay={i * 0.1}>
              <TestimonialCard {...t} />
            </RevealBlock>
          ))}
        </div>
      </section>

      {/* CHURCH CTA */}
      <section style={s.section}>
        <div style={s.churchCTA}>
          <div style={s.churchCTAGlow} />
          <RevealBlock style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
            <SectionTag>FOR CHURCHES</SectionTag>
            <SectionTitle>Bring your congregation{"\n"}into Devotion.</SectionTitle>
            <p style={{ ...s.heroSub, marginBottom: 32, fontSize: 16 }}>
              Create a branded community space for your church inside the app.<br />
              Custom dashboard, member engagement tools, and shared devotionals.
            </p>
            <GoldButton large onClick={() => { setPage("Churches"); window.scrollTo(0,0); }}>Learn About Church Plans →</GoldButton>
          </RevealBlock>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ ...s.section, paddingBottom: 120 }}>
        <RevealBlock style={{ textAlign: "center" }}>
          <SectionTitle>Begin your journey today.</SectionTitle>
          <p style={{ ...s.heroSub, marginBottom: 32, fontSize: 17 }}>
            Free to download. No credit card required.
          </p>
          <StoreBadges style={{ justifyContent: "center" }} />
        </RevealBlock>
      </section>
    </>
  );
}

function TestimonialCard({ text, author, location }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        ...s.homeCard,
        borderColor: h ? "rgba(201, 168, 76, 0.4)" : "rgba(201, 168, 76, 0.2)",
        background: h ? `linear-gradient(145deg, ${COLORS.goldGlow}, transparent)` : COLORS.bgCard,
        transform: h ? "translateY(-6px)" : "translateY(0)",
        boxShadow: h ? "0 8px 40px rgba(201, 168, 76, 0.08)" : "none",
        display: "flex", flexDirection: "column",
        padding: "36px 30px",
      }}>
      <div style={{ fontSize: 36, color: COLORS.gold, opacity: 0.4, marginBottom: 14, lineHeight: 1 }}>"</div>
      <p style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 20, fontWeight: 300, lineHeight: 1.6,
        color: "#fff", flex: 1, marginBottom: 20,
      }}>{text}</p>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{author}</div>
        <div style={{ fontSize: 13, color: COLORS.textMuted }}>{location}</div>
      </div>
    </div>
  );
}

function FeatureCardHome({ icon, title, desc }) {
  const [h, setH] = useState(false);
  return (
    <div
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        ...s.homeCard,
        borderColor: h ? "rgba(201, 168, 76, 0.4)" : "rgba(201, 168, 76, 0.2)",
        background: h
          ? `linear-gradient(145deg, ${COLORS.goldGlow}, transparent)`
          : COLORS.bgCard,
        transform: h ? "translateY(-6px)" : "translateY(0)",
        boxShadow: h ? "0 8px 40px rgba(201, 168, 76, 0.08)" : "none",
      }}
    >
      <div style={{ marginBottom: 16 }}>{icon}</div>
      <h3 style={s.homeCardTitle}>{title}</h3>
      <p style={s.homeCardDesc}>{desc}</p>
    </div>
  );
}

// ─── FEATURES PAGE ──────────────────────────────────────────────────
function FeaturesPage() {
  // Hero features - the big visual sections
  const heroFeatures = [
    {
      tag: "YOUR DAILY COMPANION",
      title: "Starts every morning\nwith you.",
      desc: "Open Devotion and you're greeted with today's Scripture, your daily path, and a simple question: \"What's on your heart today?\" From there, your companion walks with you through Guided Prayer, Daily Devotionals, Wisdom Challenges, and your personal Faith Journey. Everything shaped to where you are right now.",
      screen: "home",
      reverse: false,
    },
    {
      tag: "A GUIDE THAT LISTENS",
      title: "Pray with someone\nwho remembers.",
      desc: "Devotion's spiritual guide isn't a chatbot. It's a companion that remembers your story, your struggles, and your prayers. Choose what's weighing on you, whether it's anxiety, grief, relationships, doubt, or gratitude, and receive a prayer written from the heart, grounded in Scripture, shaped for your life. Save it to your Prayer Journal. Come back and see how God answers.",
      screen: "chat",
      reverse: true,
    },
    {
      tag: "THE FULL BIBLE",
      title: "31,102 verses.\nSearch any of them.",
      desc: "The complete Bible at your fingertips in multiple translations including KJV, NIV, ESV, and more. Search by topic, by feeling, by life situation. Save the verses that speak to you. Build your own personal Scripture collection that grows alongside your faith.",
      screen: "bible",
      reverse: false,
    },
    {
      tag: "YOUR FAITH JOURNEY",
      title: "Choose your path.\nGrow at your pace.",
      desc: "Walking through anxiety? Grief? Doubt? Exploring faith for the first time? Choose a personalized journey and Devotion walks with you day by day. Each path includes Scripture, reflections, and gentle prompts tailored to what you're facing. You set the pace. There's no rushing, no guilt, just growth.",
      screen: "journey",
      reverse: true,
    },
  ];

  // Grid features - the smaller cards
  const gridFeatures = [
    { icon: <Icon name="book" />, title: "Daily Devotionals", desc: "Scripture-grounded reflections tailored to your personal faith season and what you're walking through. Multiple Bible translations available including KJV, NIV, ESV, and more. Every day, a new reflection written for you." },
    { icon: <Icon name="journal" />, title: "Prayer Journal", desc: "Record your prayers and watch God answer. Track what you're praying about, mark prayers as answered, and look back on how your prayer life has deepened over time." },
    { icon: <Icon name="flame" />, title: "Streaks & Light", desc: "Build holy habits with a streak system that rewards consistency, not perfection. Earn Light through daily practice, climb through ranks from Seeker to Saint, and see your weekly progress at a glance." },
    { icon: <Icon name="sun" />, title: "Today's Path", desc: "Your daily to-do list for spiritual growth. Guided Prayer, Daily Devotional, Wisdom Challenge, and your current Journey, all in one place. Check them off as you go." },
    { icon: <Icon name="bookmark" />, title: "Saved Verses", desc: "Build a personal collection of the Scriptures that matter most to you. One tap to save any verse. Revisit them anytime. Your own living library of God's Word." },
    { icon: <Icon name="church" />, title: "Your Church", desc: "Find churches near you, invite your pastor, or join your congregation's community inside the app. Shared devotionals, prayer walls, and events. Faith grows stronger together." },
    { icon: <Icon name="chat" />, title: "A Companion with Memory", desc: "Your spiritual guide remembers your journey. Past conversations, prayer themes, struggles, and growth. Every time you open Devotion, it picks up right where you left off." },
    { icon: <Icon name="lock" />, title: "Private & Sacred", desc: "Your prayers and reflections stay between you and God. Encrypted, never sold, never shared. Your faith journey is no one else's business." },
  ];

  return (
    <>
      {/* Hero */}
      <section style={{ ...s.section, paddingTop: 140, paddingBottom: 40 }}>
        <RevealBlock style={{ textAlign: "center", marginBottom: 20 }}>
          <SectionTag>FEATURES</SectionTag>
          <SectionTitle>More than an app.{"\n"}A companion for your walk.</SectionTitle>
          <p style={{ ...s.heroSub, fontSize: 16, maxWidth: 560, margin: "20px auto 0" }}>
            Devotion meets you where you are with the tools, guidance, and gentle encouragement
            you need to grow closer to God, every single day.
          </p>
        </RevealBlock>
      </section>

      {/* Big visual feature sections */}
      {heroFeatures.map((feat, i) => (
        <section key={i} style={{
          ...s.section,
          borderTop: i === 0 ? `1px solid ${COLORS.border}` : "none",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "clamp(32px, 5vw, 72px)",
            flexDirection: feat.reverse ? "row-reverse" : "row",
            flexWrap: "wrap",
          }}>
            {/* Phone */}
            <PhoneMockup screen={feat.screen} animate delay={0.1} />

            {/* Text */}
            <RevealBlock delay={0.2} style={{ flex: "1 1 340px", maxWidth: 480 }}>
              <SectionTag>{feat.tag}</SectionTag>
              <SectionTitle>{feat.title}</SectionTitle>
              <p style={{
                ...s.heroSub, fontSize: 15, marginTop: 16, marginBottom: 0,
                lineHeight: 1.75,
              }}>{feat.desc}</p>
            </RevealBlock>
          </div>
        </section>
      ))}

      {/* Divider */}
      <div style={s.heroDivider}>
        <div style={s.heroDividerLine} />
        <div style={s.heroDividerIcon}>✦</div>
        <div style={s.heroDividerLine} />
      </div>

      {/* Grid features */}
      <section style={s.section}>
        <RevealBlock style={{ textAlign: "center", marginBottom: 56 }}>
          <SectionTag>EVERYTHING YOU NEED</SectionTag>
          <SectionTitle>Built for a deeper{"\n"}faith life.</SectionTitle>
        </RevealBlock>

        <div style={s.featuresGrid}>
          {gridFeatures.map((f, i) => (
            <RevealBlock key={i} delay={i * 0.06}>
              <FeatureCardFull icon={f.icon} title={f.title} desc={f.desc} />
            </RevealBlock>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ ...s.section, paddingBottom: 120 }}>
        <RevealBlock style={{ textAlign: "center" }}>
          <SectionTitle>Ready to start walking?</SectionTitle>
          <p style={{ ...s.heroSub, marginBottom: 32, fontSize: 17 }}>
            Free to download. Your journey begins today.
          </p>
          <StoreBadges style={{ justifyContent: "center" }} />
        </RevealBlock>
      </section>
    </>
  );
}

function FeatureCardFull({ icon, title, desc, tag }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        ...s.featureCardFull,
        borderColor: h ? "rgba(201, 168, 76, 0.4)" : "rgba(201, 168, 76, 0.2)",
        transform: h ? "translateY(-4px)" : "translateY(0)",
        boxShadow: h ? "0 8px 40px rgba(201, 168, 76, 0.08)" : "none",
        background: h
          ? `linear-gradient(145deg, ${COLORS.goldGlow}, ${COLORS.bgCard})`
          : COLORS.bgCard,
      }}>
      {tag ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <span>{icon}</span>
          <span style={s.featureTag}>{tag}</span>
        </div>
      ) : (
        <div style={{ marginBottom: 14 }}>{icon}</div>
      )}
      <h3 style={s.featureCardTitle}>{title}</h3>
      <p style={s.featureCardDesc}>{desc}</p>
    </div>
  );
}

// ─── PRIVACY PAGE ───────────────────────────────────────────────────
function PrivacyPage() {
  const sections = [
    { title: "1. Data We Collect",
      content: null,
      subsections: [
        { subtitle: "Information you provide", content: "Your first name (optional, for personalisation). Faith background and denomination preferences. Reasons for using the app. Bible translation and focus preferences. Prayer journal entries. Chat messages you send." },
        { subtitle: "Information generated by the app", content: "Conversation responses from your spiritual guide. User memory: a summary of key themes from your past conversations (e.g., \"struggling with anxiety\", \"praying for a family member\"). This never includes names of third parties, medical details, financial information, or intimate details. Safety flags: if the guide detects crisis-level distress, a temporary flag is stored to provide heightened sensitivity in future conversations. These flags expire automatically after 30 days. Usage analytics (message counts, feature usage, streaks). Feedback on responses (thumbs up/down and optional text reports)." },
      ]
    },
    { title: "2. Where Your Data Is Stored",
      content: null,
      subsections: [
        { subtitle: "On your device (local storage)", content: "Your preferences and onboarding choices. Chat history and conversation sessions. Prayer journal entries. User memory summaries. Saved verses. Activity and streak data. This data stays on your device and is not synced to any cloud service unless you explicitly enable cloud sync (coming in a future update)." },
        { subtitle: "Sent to our servers for processing", content: "Chat messages: your messages are sent to our backend server and processed to generate responses. Messages are not permanently stored on our servers. Safety flags: stored per user ID on our server and automatically deleted after 30 days. Feedback reports: thumbs-down feedback and optional text reports are stored on our server so we can review and improve response quality." },
      ]
    },
    { title: "3. How We Use Your Data",
      content: "To generate personalised, Scripture-grounded responses. To remember context across conversations (user memory). To detect crisis situations and provide appropriate resources. To improve the quality and safety of responses. We do not sell your data to third parties. We do not use your data for advertising."
    },
    { title: "4. Device Identifiers",
      content: "The App generates a unique device identifier (UUID) to associate your data with your device. This identifier is used to maintain your preferences, memory, and session history across app launches. It is not linked to your real-world identity and is not shared with third parties for advertising purposes."
    },
    { title: "5. Third-Party Services",
      content: "Anthropic: processes your chat messages and generates responses. Anthropic's privacy policy applies to their handling of this data. Firebase (Google): provides authentication and analytics services. Firebase's privacy policy applies. RevenueCat: manages subscription and payment processing. RevenueCat's privacy policy applies. We do not share your personal data with any other third parties."
    },
    { title: "6. Your Rights",
      content: "Delete your data: You can clear your memory in Settings. You can delete individual chat sessions and prayer journal entries within the app. Export your data: Prayer journal and saved verses export is available for Pro subscribers. Access your data: All data stored on your device is accessible within the app. Right to be forgotten: Contact us to request deletion of any server-side data associated with your account."
    },
    { title: "7. Children's Privacy",
      content: "Devotion is intended for users aged 13 and older. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us with personal information, please contact us so we can take appropriate action."
    },
    { title: "8. Data Retention",
      content: "Local data persists until you delete it or uninstall the app. Safety flags expire after 30 days. Feedback reports are retained for quality improvement purposes. Chat messages are not permanently stored on our servers."
    },
    { title: "9. International Users",
      content: "Devotion is available worldwide. Regardless of where you access the App, you have the right to know what personal data we collect and how it is used, the right to request deletion of your personal data, the right to opt out of the sale of personal data (we do not sell your data), and the right to non-discrimination for exercising your privacy rights. If you are in the European Economic Area (EEA), you also have the right to data portability and the right to lodge a complaint with your local data protection authority. If you are a California resident, you have additional rights under the CCPA. To exercise any of these rights, contact us at the email below."
    },
    { title: "10. Changes to This Policy",
      content: "We may update this privacy policy from time to time. When we make significant changes, we will notify you through the App or by updating the \"Last updated\" date at the top of this page. Continued use of the App after changes are posted constitutes acceptance of the revised policy."
    },
    { title: "11. Contact Us",
      content: "If you have questions about this privacy policy or your data, contact us at support@holydevotion.app"
    },
  ];

  return (
    <section style={{ ...s.section, paddingTop: 140, maxWidth: 760 }}>
      <RevealBlock style={{ textAlign: "center", marginBottom: 64 }}>
        <SectionTag>PRIVACY POLICY</SectionTag>
        <SectionTitle>Your faith is personal.{"\n"}We keep it that way.</SectionTitle>
        <p style={{ ...s.heroSub, fontSize: 15, marginTop: 16 }}>Last updated: March 2026</p>
      </RevealBlock>

      {/* Intro */}
      <RevealBlock delay={0.06} style={{ marginBottom: 40 }}>
        <p style={s.privacyText}>
          Devotion is a Christian faith companion that provides Scripture-grounded guidance through personalised conversations. Your privacy matters to us. This policy explains what data we collect, how we use it, and your rights.
        </p>
      </RevealBlock>

      {sections.map((sec, i) => (
        <RevealBlock key={i} delay={(i + 1) * 0.04} style={{ marginBottom: 40 }}>
          <div style={s.privacySection}>
            <h3 style={s.privacyTitle}>{sec.title}</h3>
            {sec.content && <p style={s.privacyText}>{sec.content}</p>}
            {sec.subsections && sec.subsections.map((sub, j) => (
              <div key={j} style={{ marginTop: j > 0 ? 20 : 12 }}>
                <h4 style={s.privacySubtitle}>{sub.subtitle}</h4>
                <p style={s.privacyText}>{sub.content}</p>
              </div>
            ))}
          </div>
        </RevealBlock>
      ))}
    </section>
  );
}

// ─── CONTACT PAGE ───────────────────────────────────────────────────
function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", type: "General", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (form.name && form.email && form.message) setSent(true);
  };

  return (
    <section style={{ ...s.section, paddingTop: 140, maxWidth: 640 }}>
      <RevealBlock style={{ textAlign: "center", marginBottom: 56 }}>
        <SectionTag>GET IN TOUCH</SectionTag>
        <SectionTitle>We'd love to{"\n"}hear from you.</SectionTitle>
        <p style={{ ...s.heroSub, fontSize: 15, marginTop: 16 }}>
          Questions about Devotion, church plans, or partnership opportunities? Drop us a line.
        </p>
      </RevealBlock>

      <RevealBlock delay={0.15}>
        {sent ? (
          <div style={s.sentBox}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
            <h3 style={{ ...s.featureCardTitle, marginBottom: 8 }}>Message Sent</h3>
            <p style={s.featureCardDesc}>Thank you for reaching out. We'll get back to you within 24 hours.</p>
          </div>
        ) : (
          <div style={s.contactForm}>
            {[
              { key: "name", label: "Your Name", type: "text", placeholder: "John" },
              { key: "email", label: "Email", type: "email", placeholder: "john@example.com" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key} style={s.formGroup}>
                <label style={s.formLabel}>{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  style={s.formInput}
                />
              </div>
            ))}

            <div style={s.formGroup}>
              <label style={s.formLabel}>Inquiry Type</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["General", "Church Plans", "Bug Report", "Partnership"].map((t) => (
                  <button key={t}
                    onClick={() => setForm({ ...form, type: t })}
                    style={{
                      ...s.typeBtn,
                      background: form.type === t ? COLORS.gold : "transparent",
                      color: form.type === t ? COLORS.bgDeep : COLORS.textMuted,
                      borderColor: form.type === t ? COLORS.gold : COLORS.border,
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={s.formGroup}>
              <label style={s.formLabel}>Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Tell us what's on your mind..."
                rows={5}
                style={{ ...s.formInput, resize: "vertical", fontFamily: "'Nunito Sans', sans-serif" }}
              />
            </div>

            <GoldButton onClick={handleSubmit} large>Send Message</GoldButton>
          </div>
        )}
      </RevealBlock>

      <RevealBlock delay={0.3} style={{ marginTop: 64, textAlign: "center" }}>
        <p style={s.contactAlt}>
          Or email us directly at <span style={{ color: COLORS.gold }}>support@holydevotion.app</span>
        </p>
      </RevealBlock>
    </section>
  );
}

// ─── CHURCHES PAGE ──────────────────────────────────────────────────
function ChurchesPage({ setPage }) {
  const plans = [
    {
      name: "Community",
      price: "19",
      period: "/month",
      desc: "For small groups, Bible studies, and campus ministries",
      size: "Up to 25 members",
      features: [
        "Shared community space in the app",
        "Group prayer wall",
        "Shared devotional plans",
        "Basic group analytics",
        "1 admin account",
      ],
      highlight: false,
    },
    {
      name: "Church",
      price: "99",
      period: "/month",
      desc: "For established churches ready to deepen member engagement",
      size: "Up to 500 members",
      features: [
        "Everything in Community",
        "Branded church dashboard",
        "Custom banner & logo in app",
        "Event announcements",
        "Member engagement insights",
        "Weekly devotional scheduling",
        "3 admin accounts",
        "Priority support",
      ],
      highlight: true,
    },
    {
      name: "Church Pro",
      price: "249",
      period: "/month",
      desc: "For larger congregations wanting full customization and analytics",
      size: "Unlimited members",
      features: [
        "Everything in Church",
        "Custom color theming in app",
        "Advanced engagement analytics",
        "Multiple ministry dashboards",
        "Custom devotional content",
        "Unlimited admin accounts",
        "API access",
        "Dedicated support",
      ],
      highlight: false,
    },
  ];

  return (
    <>
      {/* Hero */}
      <section style={{ ...s.section, paddingTop: 140, paddingBottom: 40 }}>
        <RevealBlock style={{ textAlign: "center", marginBottom: 24 }}>
          <SectionTag>FOR CHURCHES & COMMUNITIES</SectionTag>
          <SectionTitle>Give your congregation{"\n"}a home inside Devotion.</SectionTitle>
          <p style={{ ...s.heroSub, fontSize: 17, maxWidth: 600, margin: "20px auto 0" }}>
            Whether you lead a small group of 10 or a church of thousands,
            Devotion gives your community a branded space to grow in faith together.
          </p>
        </RevealBlock>
      </section>

      {/* How it works */}
      <section style={s.section}>
        <RevealBlock style={{ textAlign: "center", marginBottom: 64 }}>
          <SectionTag>HOW IT WORKS</SectionTag>
          <SectionTitle>Live in 10 minutes.</SectionTitle>
        </RevealBlock>

        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          {[
            { num: "1", icon: "palette", title: "Make it yours", desc: "Upload your logo, choose your colors, write a welcome message. Your church's space in Devotion is ready before your coffee gets cold.", time: "5 min" },
            { num: "2", icon: "heart", title: "Invite your people", desc: "Share your unique church code from the pulpit, in a text, or in your bulletin. Members join with one tap inside the app.", time: "2 min" },
            { num: "3", icon: "sun", title: "Watch faith grow", desc: "Schedule shared devotionals, see who's engaging, post announcements. Your congregation is growing closer to God and each other.", time: "Ongoing" },
          ].map((step, i) => (
            <RevealBlock key={i} delay={i * 0.15}>
              <div style={{ display: "flex", gap: 24, marginBottom: i < 2 ? 0 : 0 }}>
                {/* Timeline */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%",
                    border: `2px solid ${COLORS.gold}`,
                    background: "rgba(201, 168, 76, 0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon name={step.icon} size={22} />
                  </div>
                  {i < 2 && (
                    <div style={{
                      width: 1, flex: 1, minHeight: 40,
                      background: `linear-gradient(180deg, ${COLORS.gold}, rgba(201,168,76,0.1))`,
                    }} />
                  )}
                </div>

                {/* Content */}
                <div style={{ paddingBottom: i < 2 ? 40 : 0, paddingTop: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 14, color: COLORS.gold, fontWeight: 600,
                    }}>Step {step.num}</span>
                    <span style={{
                      fontSize: 10, color: COLORS.gold, opacity: 0.5,
                      padding: "3px 8px", borderRadius: 4,
                      background: "rgba(201,168,76,0.08)",
                      fontFamily: "'Nunito Sans', sans-serif",
                      fontWeight: 600, letterSpacing: "0.05em",
                    }}>{step.time}</span>
                  </div>
                  <h3 style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 400,
                    color: COLORS.text, marginBottom: 8, lineHeight: 1.2,
                  }}>{step.title}</h3>
                  <p style={{
                    fontFamily: "'Nunito Sans', sans-serif",
                    fontSize: 14, fontWeight: 300, lineHeight: 1.7,
                    color: COLORS.textMuted, maxWidth: 480,
                  }}>{step.desc}</p>
                </div>
              </div>
            </RevealBlock>
          ))}
        </div>
      </section>

      {/* What's included for members */}
      <section style={s.section}>
        <RevealBlock style={{ textAlign: "center", marginBottom: 56 }}>
          <SectionTag>FOR YOUR MEMBERS</SectionTag>
          <SectionTitle>What your congregation{"\n"}experiences in the app.</SectionTitle>
        </RevealBlock>

        <div style={s.threeGrid}>
          {[
            { icon: <Icon name="church" />, title: "Your Church's Space", desc: "A branded community page inside Devotion with your logo, colors, welcome message, and service times. Feels like home." },
            { icon: <Icon name="book" />, title: "Shared Devotionals", desc: "Schedule devotionals for your whole church. Everyone reads the same Scripture and reflects together, even from home." },
            { icon: <Icon name="hands" />, title: "Community Prayer Wall", desc: "Members can share prayer requests and pray for each other. Anonymous or named, their choice. Builds real connection." },
            { icon: <Icon name="calendar" />, title: "Events & Announcements", desc: "Post upcoming services, retreats, small group meetings, and announcements directly to your members' feed in the app." },
            { icon: <Icon name="chart" />, title: "Engagement Insights", desc: "See how your community is engaging. Devotional completion, prayer activity, and active members, without seeing anyone's private data." },
            { icon: <Icon name="palette" />, title: "Your Brand, Your Identity", desc: "Custom logo, banner image, accent colors, and welcome message. Your church's presence in the app looks and feels like yours." },
          ].map((item, i) => (
            <RevealBlock key={i} delay={i * 0.08}>
              <FeatureCardHome {...item} />
            </RevealBlock>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ ...s.section, borderTop: `1px solid ${COLORS.border}` }}>
        <RevealBlock style={{ textAlign: "center", marginBottom: 56 }}>
          <SectionTag>PRICING</SectionTag>
          <SectionTitle>Plans for every size{"\n"}of community.</SectionTitle>
          <p style={{ ...s.heroSub, fontSize: 15, maxWidth: 500, margin: "16px auto 0" }}>
            Try any plan free for 7 days.
          </p>
        </RevealBlock>

        <div style={s.pricingGrid}>
          {plans.map((plan, i) => (
            <RevealBlock key={i} delay={i * 0.1}>
              <PricingCard {...plan} />
            </RevealBlock>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={s.section}>
        <RevealBlock style={{ textAlign: "center", marginBottom: 56 }}>
          <SectionTag>COMMON QUESTIONS</SectionTag>
          <SectionTitle>Answers for pastors{"\n"}and church leaders.</SectionTitle>
        </RevealBlock>

        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          {[
            { q: "Do my members need to pay for the app?", a: "No. Devotion is free to download and use for individuals. Your church plan gives your members access to your community space and shared features at no additional cost to them." },
            { q: "Can I see my members' private prayers or reflections?", a: "Absolutely not. Member privacy is sacred. You can see engagement metrics (who's active, devotional completion rates) but never anyone's personal spiritual content." },
            { q: "How do members join my church in the app?", a: "You'll get a unique church code and invite link. Members tap the 'Communities' button in the app, enter your code, and they're in. Takes seconds." },
            { q: "Can I cancel anytime?", a: "Yes. No contracts, no cancellation fees. Your community data is exported to you if you choose to leave." },
            { q: "What if we outgrow our plan?", a: "Upgrade anytime from your dashboard. Your community, content, and settings carry over seamlessly." },
            { q: "Is the content theologically sound?", a: "Every piece of content in Devotion is validated against Scripture through a dual-layer safety system. Nothing heretical reaches your members." },
          ].map((faq, i) => (
            <RevealBlock key={i} delay={i * 0.06}>
              <FAQItem {...faq} />
            </RevealBlock>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ ...s.section, paddingBottom: 120 }}>
        <div style={s.churchCTA}>
          <div style={s.churchCTAGlow} />
          <RevealBlock style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
            <SectionTitle>Ready to bring your{"\n"}community into Devotion?</SectionTitle>
            <p style={{ ...s.heroSub, marginBottom: 32, fontSize: 16 }}>
              7-day free trial. Setup takes 10 minutes.<br />
              Your congregation can join today.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <GoldButton large>Start Free Trial</GoldButton>
              <GoldButton outline large onClick={() => { setPage("Contact"); window.scrollTo(0,0); }}>Talk to Us First</GoldButton>
            </div>
          </RevealBlock>
        </div>
      </section>
    </>
  );
}

function PricingCard({ name, price, period, desc, size, features, highlight }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: "36px 30px",
        borderRadius: 20,
        border: `1.5px solid ${highlight ? COLORS.gold : (h ? "rgba(201, 168, 76, 0.4)" : "rgba(201, 168, 76, 0.2)")}`,
        background: highlight
          ? `linear-gradient(165deg, rgba(201,168,76,0.08), ${COLORS.bgCard})`
          : (h ? `linear-gradient(165deg, ${COLORS.goldGlow}, ${COLORS.bgCard})` : COLORS.bgCard),
        transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
        transform: h ? "translateY(-6px)" : "translateY(0)",
        boxShadow: h ? `0 12px 50px rgba(201,168,76,${highlight ? '0.12' : '0.08'})` : "none",
        display: "flex", flexDirection: "column",
        position: "relative",
        cursor: "default",
        height: "100%",
      }}>
      {highlight && (
        <div style={{
          position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
          padding: "5px 18px", borderRadius: 20,
          background: COLORS.gold, color: COLORS.bgDeep,
          fontFamily: "'Nunito Sans', sans-serif",
          fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}>MOST POPULAR</div>
      )}

      <h3 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 28, fontWeight: 400, color: COLORS.text,
        marginBottom: 4,
      }}>{name}</h3>

      <p style={{
        fontFamily: "'Nunito Sans', sans-serif",
        fontSize: 13, fontWeight: 300, color: COLORS.textDim,
        marginBottom: 20,
      }}>{desc}</p>

      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
        <span style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 48, fontWeight: 300, color: highlight ? COLORS.gold : COLORS.text,
          lineHeight: 1,
        }}>${price}</span>
        <span style={{
          fontFamily: "'Nunito Sans', sans-serif",
          fontSize: 14, fontWeight: 300, color: COLORS.textDim,
        }}>{period}</span>
      </div>

      <div style={{
        fontFamily: "'Nunito Sans', sans-serif",
        fontSize: 12, fontWeight: 500, color: COLORS.gold,
        marginBottom: 24, opacity: 0.7, letterSpacing: "0.04em",
      }}>{size}</div>

      <div style={{ flex: 1, marginBottom: 28 }}>
        {features.map((f, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "7px 0",
            borderBottom: i < features.length - 1 ? `1px solid rgba(201,168,76,0.05)` : "none",
          }}>
            <span style={{ color: COLORS.gold, fontSize: 12, marginTop: 2, flexShrink: 0 }}>✦</span>
            <span style={{
              fontFamily: "'Nunito Sans', sans-serif",
              fontSize: 13.5, fontWeight: 300, color: COLORS.textMuted,
              lineHeight: 1.5,
            }}>{f}</span>
          </div>
        ))}
      </div>

      <GoldButton large outline={!highlight}>
        {highlight ? "Start Free Trial" : "Get Started"}
      </GoldButton>
    </div>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderBottom: `1px solid ${COLORS.border}`,
      cursor: "pointer",
    }} onClick={() => setOpen(!open)}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 0",
      }}>
        <h4 style={{
          fontFamily: "'Nunito Sans', sans-serif",
          fontSize: 15, fontWeight: 500, color: COLORS.text,
          letterSpacing: "-0.01em",
        }}>{q}</h4>
        <span style={{
          color: COLORS.gold, fontSize: 18, fontWeight: 300,
          transition: "transform 0.3s ease",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
          flexShrink: 0, marginLeft: 16,
        }}>+</span>
      </div>
      <div style={{
        maxHeight: open ? 200 : 0,
        overflow: "hidden",
        transition: "max-height 0.4s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <p style={{
          fontFamily: "'Nunito Sans', sans-serif",
          fontSize: 14, fontWeight: 300, lineHeight: 1.7,
          color: COLORS.textMuted, paddingBottom: 20,
        }}>{a}</p>
      </div>
    </div>
  );
}

// ─── FOOTER ─────────────────────────────────────────────────────────
function Footer({ setPage }) {
  return (
    <footer style={s.footer}>
      <div style={s.footerInner}>
        <div>
          <div style={{ ...s.logo, marginBottom: 12 }}>
            <CrossIcon size={18} />
            <span style={{ ...s.logoText, fontSize: 16 }}>DEVOTION</span>
          </div>
          <p style={{ color: COLORS.textDim, fontSize: 13, lineHeight: 1.6 }}>
            Your personal faith companion.
          </p>
        </div>

        <div style={s.footerLinks}>
          <div>
            <p style={s.footerHead}>Product</p>
            {["Home", "Features", "Churches"].map(p => (
              <button key={p} onClick={() => { setPage(p); window.scrollTo(0,0); }} style={s.footerLink}>{p}</button>
            ))}
          </div>
          <div>
            <p style={s.footerHead}>Company</p>
            {["Privacy", "Contact"].map(p => (
              <button key={p} onClick={() => { setPage(p); window.scrollTo(0,0); }} style={s.footerLink}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={s.footerBottom}>
        <span style={{ color: COLORS.textDim, fontSize: 12 }}>
          © 2026 Devotion. Made with faith in Ontario, Canada.
        </span>
      </div>
    </footer>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────────────
export default function DevotionSite() {
  const [page, setPage] = useState("Home");
  const mouse = useMouseGlow();

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", color: COLORS.text }}>
      <style>{globalCSS}</style>
      <Navbar page={page} setPage={setPage} />
      {page === "Home" && <HomePage mouse={mouse} setPage={setPage} />}
      {page === "Features" && <FeaturesPage />}
      {page === "Churches" && <ChurchesPage setPage={setPage} />}
      {page === "Privacy" && <PrivacyPage />}
      {page === "Contact" && <ContactPage />}
      <Footer setPage={setPage} />
    </div>
  );
}

// ─── GLOBAL CSS ─────────────────────────────────────────────────────
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Nunito+Sans:ital,opsz,wght@0,6..12,300;0,6..12,400;0,6..12,500;0,6..12,600;1,6..12,300&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }

  ::selection {
    background: rgba(201, 168, 76, 0.3);
    color: #fff;
  }

  input:focus, textarea:focus {
    outline: none;
    border-color: rgba(201, 168, 76, 0.4) !important;
    box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.08) !important;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.3; transform: scale(0.8); }
  }

  @keyframes float1 {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-30px); }
  }

  @keyframes float2 {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(20px); }
  }

  /* Desktop: show nav links & download, hide hamburger */
  .nav-links { display: flex; }
  .nav-download { display: block; }
  .nav-hamburger { display: none !important; }

  /* Mobile breakpoint */
  @media (max-width: 768px) {
    .nav-links { display: none !important; }
    .nav-download { display: none !important; }
    .nav-hamburger { display: flex !important; }
  }

  @media (max-width: 640px) {
    .hero-phone { display: none; }
    .hero-text-side { text-align: center !important; }
    .hero-badges { display: flex; justify-content: center; }
    .screenshot-phone { transform: scale(0.85); transform-origin: top center; }
  }
`;

// ─── STYLES ─────────────────────────────────────────────────────────
const s = {
  // Nav
  nav: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    transition: "all 0.4s ease",
    padding: "0 24px",
  },
  navInner: {
    maxWidth: 1100, margin: "0 auto",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    height: 72,
  },
  logo: {
    display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
  },
  logoText: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 18, fontWeight: 600, letterSpacing: "0.12em",
    color: COLORS.text,
  },
  navLinks: {
    display: "flex", gap: 32,
    "@media (max-width: 768px)": { display: "none" },
  },
  navLink: {
    background: "none", border: "none", cursor: "pointer",
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 14, fontWeight: 400, letterSpacing: "0.02em",
    transition: "color 0.3s ease",
  },
  hamburger: {
    display: "none", flexDirection: "column", gap: 5, background: "none",
    border: "none", cursor: "pointer", padding: 8,
  },
  hamLine: {
    width: 22, height: 1.5, background: COLORS.text,
    transition: "all 0.3s ease",
  },
  mobileMenu: {
    padding: "24px", display: "flex", flexDirection: "column", gap: 16,
    borderTop: `1px solid ${COLORS.border}`,
    background: "rgba(6,9,17,0.97)",
  },
  mobileLink: {
    background: "none", border: "none", cursor: "pointer",
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 18, fontWeight: 400, textAlign: "left",
    padding: "8px 0",
  },

  // Hero
  hero: {
    position: "relative", minHeight: "100vh",
    display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  heroOrb1: {
    position: "absolute", width: 600, height: 600, borderRadius: "50%",
    background: `radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)`,
    top: "-5%", left: "10%", filter: "blur(60px)",
    transition: "transform 0.8s cubic-bezier(0.16,1,0.3,1)",
    animation: "float1 10s ease-in-out infinite",
  },
  heroOrb2: {
    position: "absolute", width: 500, height: 500, borderRadius: "50%",
    background: `radial-gradient(circle, rgba(201,168,76,0.06) 0%, rgba(100,120,255,0.04) 50%, transparent 70%)`,
    bottom: "0%", right: "5%", filter: "blur(60px)",
    transition: "transform 0.8s cubic-bezier(0.16,1,0.3,1)",
    animation: "float2 12s ease-in-out infinite",
  },
  heroRadial: {
    position: "absolute", inset: 0,
    background: "radial-gradient(ellipse at 50% 80%, rgba(201,168,76,0.04) 0%, transparent 60%)",
    pointerEvents: "none",
  },
  heroContent: {
    position: "relative", zIndex: 2, textAlign: "center",
    maxWidth: 780, padding: "0 24px",
  },
  heroSplit: {
    position: "relative", zIndex: 2,
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: "clamp(32px, 5vw, 80px)",
    maxWidth: 1100, padding: "0 24px",
    flexWrap: "wrap",
  },
  heroTextSide: {
    flex: "1 1 400px", maxWidth: 580,
    textAlign: "left",
  },
  heroBadge: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 11, fontWeight: 600, letterSpacing: "0.22em",
    color: COLORS.gold, marginBottom: 28,
  },
  heroH1: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "clamp(38px, 6.5vw, 72px)", fontWeight: 300,
    lineHeight: 1.08, letterSpacing: "-0.02em",
    marginBottom: 28, color: COLORS.text, perspective: "600px",
  },
  heroSub: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: "clamp(15px, 2vw, 18px)", fontWeight: 300,
    lineHeight: 1.7, color: COLORS.textMuted,
    marginBottom: 36, letterSpacing: "-0.005em",
  },

  // Screenshots
  screenshotsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "clamp(16px, 3vw, 40px)",
    justifyItems: "center",
  },
  screenshotLabel: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 14, fontWeight: 600, color: COLORS.text,
    marginTop: 20, letterSpacing: "-0.01em",
  },
  screenshotDesc: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 12, fontWeight: 300, lineHeight: 1.5,
    color: COLORS.textMuted, marginTop: 6,
    maxWidth: 200, margin: "6px auto 0",
  },
  scrollDot: {
    position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)",
    zIndex: 2, width: 8, height: 8,
  },
  scrollDotInner: {
    width: 6, height: 6, borderRadius: "50%",
    background: COLORS.gold, opacity: 0.4,
    animation: "pulse 2.5s ease-in-out infinite",
  },

  // Hero divider
  heroDivider: {
    position: "relative", zIndex: 3,
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 20, padding: "0 24px", marginTop: -1,
  },
  heroDividerLine: {
    flex: 1, height: 1,
    background: `linear-gradient(90deg, transparent, rgba(201, 168, 76, 0.4), rgba(201, 168, 76, 0.4), transparent)`,
  },
  heroDividerIcon: {
    color: COLORS.gold, fontSize: 12, opacity: 0.5,
    flexShrink: 0,
  },

  // Sections
  section: {
    padding: "clamp(60px, 10vw, 100px) 24px", maxWidth: 1100, margin: "0 auto",
  },
  sectionTag: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 11, fontWeight: 600, letterSpacing: "0.25em",
    color: COLORS.gold, marginBottom: 14, textTransform: "uppercase",
    opacity: 0.7,
  },
  sectionTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "clamp(30px, 5vw, 48px)", fontWeight: 300,
    lineHeight: 1.15, letterSpacing: "-0.015em",
    color: COLORS.text, whiteSpace: "pre-line",
  },

  // Home cards
  threeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: 18,
  },
  pricingGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 20,
    alignItems: "stretch",
  },
  homeCard: {
    padding: "32px 28px", borderRadius: 16,
    border: `1px solid rgba(201, 168, 76, 0.2)`,
    background: COLORS.bgCard,
    transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
    cursor: "default",
    height: "100%",
  },
  homeCardTitle: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 17, fontWeight: 600, color: COLORS.text,
    marginBottom: 8, letterSpacing: "-0.01em",
  },
  homeCardDesc: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 14, fontWeight: 300, lineHeight: 1.65,
    color: COLORS.textMuted, letterSpacing: "-0.005em",
  },

  // Stats
  statsRow: {
    display: "flex", gap: 40, justifyContent: "center", flexWrap: "wrap",
  },
  statNum: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "clamp(36px, 5vw, 52px)", fontWeight: 300,
    color: COLORS.gold, lineHeight: 1, marginBottom: 8,
  },
  statLabel: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 13, fontWeight: 300, color: COLORS.textDim,
  },

  // Testimonial
  testimonialText: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 300,
    fontStyle: "italic", lineHeight: 1.55,
    color: COLORS.text, marginBottom: 20,
  },
  testimonialAuthor: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 13, fontWeight: 400, color: COLORS.textDim,
    letterSpacing: "0.04em",
  },

  // Church CTA
  churchCTA: {
    position: "relative", padding: "clamp(48px, 8vw, 80px) clamp(20px, 4vw, 40px)",
    borderRadius: 24, overflow: "hidden",
    border: `1px solid ${COLORS.border}`,
    background: `linear-gradient(145deg, ${COLORS.navy}, ${COLORS.bgDeep})`,
  },
  churchCTAGlow: {
    position: "absolute", top: "50%", left: "50%",
    width: 500, height: 500, borderRadius: "50%",
    background: `radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)`,
    transform: "translate(-50%, -50%)", filter: "blur(60px)",
  },

  // Features page
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 16,
  },
  featureCardFull: {
    padding: "30px 26px", borderRadius: 16,
    border: `1px solid rgba(201, 168, 76, 0.2)`,
    background: COLORS.bgCard, cursor: "default",
    transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
    height: "100%",
  },
  featureTag: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 10, fontWeight: 600, letterSpacing: "0.15em",
    color: COLORS.gold, opacity: 0.6,
    padding: "4px 10px", borderRadius: 4,
    background: COLORS.goldDim,
  },
  featureCardTitle: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 17, fontWeight: 600, color: COLORS.text,
    marginBottom: 8, letterSpacing: "-0.01em",
  },
  featureCardDesc: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 13.5, fontWeight: 300, lineHeight: 1.65,
    color: COLORS.textMuted,
  },

  // Privacy
  privacySection: {
    padding: "28px 0",
    borderBottom: `1px solid ${COLORS.border}`,
  },
  privacyTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 24, fontWeight: 400, color: COLORS.text,
    marginBottom: 12,
  },
  privacyText: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 14, fontWeight: 300, lineHeight: 1.75,
    color: COLORS.textMuted,
  },
  privacySubtitle: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 15, fontWeight: 600, color: COLORS.gold,
    marginBottom: 8, opacity: 0.8,
  },

  // Contact
  contactForm: {
    display: "flex", flexDirection: "column", gap: 20,
  },
  formGroup: {
    display: "flex", flexDirection: "column", gap: 8,
  },
  formLabel: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 12, fontWeight: 600, letterSpacing: "0.08em",
    color: COLORS.textDim, textTransform: "uppercase",
  },
  formInput: {
    padding: "14px 16px",
    background: "rgba(15,22,45,0.6)",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8, color: COLORS.text,
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 15, fontWeight: 300,
    transition: "all 0.3s ease",
  },
  typeBtn: {
    padding: "8px 16px", borderRadius: 6,
    border: `1px solid ${COLORS.border}`,
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 13, fontWeight: 500, cursor: "pointer",
    transition: "all 0.25s ease",
  },
  sentBox: {
    textAlign: "center", padding: "60px 24px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 16, background: COLORS.bgCard,
  },
  contactAlt: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 14, fontWeight: 300, color: COLORS.textMuted,
  },

  // Footer
  footer: {
    borderTop: `1px solid ${COLORS.border}`,
    padding: "56px 24px 32px", maxWidth: 1100, margin: "0 auto",
  },
  footerInner: {
    display: "flex", justifyContent: "space-between",
    flexWrap: "wrap", gap: 40, marginBottom: 40,
  },
  footerLinks: { display: "flex", gap: 56 },
  footerHead: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 11, fontWeight: 600, letterSpacing: "0.15em",
    color: COLORS.textDim, textTransform: "uppercase", marginBottom: 14,
  },
  footerLink: {
    display: "block", background: "none", border: "none", cursor: "pointer",
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 14, fontWeight: 300, color: COLORS.textMuted,
    padding: "4px 0", textAlign: "left",
    transition: "color 0.2s ease",
  },
  footerBottom: {
    paddingTop: 24, borderTop: `1px solid ${COLORS.border}`,
  },
};
