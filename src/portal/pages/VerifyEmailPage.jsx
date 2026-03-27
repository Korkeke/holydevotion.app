import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const SAGE = "#3D6B5E";
const LINEN = "#FAF8F5";

export default function VerifyEmailPage() {
  const { user, authLoading, resendVerification, signOut } = useAuth();
  const navigate = useNavigate();

  if (authLoading) return null;
  if (!user) return <Navigate to="/portal/login" replace />;
  if (user.emailVerified) return <Navigate to="/portal" replace />;
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function handleResend() {
    setError("");
    try {
      await resendVerification();
      setResent(true);
      setTimeout(() => setResent(false), 30000);
    } catch {
      setError("Could not send email. Please wait a minute and try again.");
    }
  }

  async function handleCheck() {
    setChecking(true);
    setError("");
    try {
      await user.reload();
      if (user.emailVerified) {
        navigate("/portal");
      } else {
        setError("Email not yet verified. Please check your inbox and click the link.");
      }
    } catch {
      setError("Could not check verification status. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate("/portal/login");
  }

  return (
    <div style={s.page}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 36, color: SAGE, lineHeight: 1 }}>✝</div>
        <div style={{
          fontFamily: "var(--heading)", fontSize: 18, fontWeight: 600,
          color: SAGE, marginTop: 6, letterSpacing: "0.02em",
        }}>Devotion</div>
      </div>

      <div style={s.card}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>&#9993;</div>
        <h1 style={s.title}>Verify your email</h1>
        <p style={s.subtitle}>
          We sent a verification link to <strong>{user?.email}</strong>.
          Please check your inbox and click the link to continue.
        </p>

        <p style={{ fontSize: 13, color: "#7A7672", marginBottom: 24 }}>
          Don't see it? Check your spam folder.
        </p>

        {error && <p style={s.error}>{error}</p>}

        <button onClick={handleCheck} disabled={checking} style={s.button}>
          {checking ? "Checking..." : "I've Verified My Email"}
        </button>

        <button
          onClick={handleResend}
          disabled={resent}
          style={s.resendBtn}
        >
          {resent ? "Email sent! Check your inbox" : "Resend verification email"}
        </button>

        <p style={s.footer}>
          Wrong email?{" "}
          <button onClick={handleSignOut} style={s.link}>Sign out</button>
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
    textAlign: "center",
  },
  title: {
    fontFamily: "var(--heading)",
    fontSize: 24,
    fontWeight: 700,
    color: "#2C2C2C",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#7A7672",
    marginBottom: 8,
    lineHeight: 1.6,
  },
  error: {
    fontSize: 13,
    color: "#c0392b",
    marginBottom: 12,
  },
  button: {
    width: "100%",
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
  resendBtn: {
    width: "100%",
    marginTop: 12,
    padding: "12px 0",
    borderRadius: 12,
    border: "1px solid #EDE9E3",
    background: "transparent",
    color: SAGE,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  footer: {
    fontSize: 13,
    color: "#7A7672",
    marginTop: 24,
  },
  link: {
    background: "none",
    border: "none",
    color: SAGE,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    padding: 0,
  },
};
