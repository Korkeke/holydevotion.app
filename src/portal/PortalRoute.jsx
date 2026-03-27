import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { COLORS } from "../colors";

export default function PortalRoute({ children }) {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: COLORS.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          width: 32,
          height: 32,
          border: `2px solid ${COLORS.accent}`,
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/portal/login" replace />;
  }

  const DEMO_EMAILS = ["laryl@hotmail.com"];
  if (!user.emailVerified && !DEMO_EMAILS.includes(user.email)) {
    return <Navigate to="/portal/verify-email" replace />;
  }

  return children;
}
