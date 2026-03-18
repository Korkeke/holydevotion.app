import { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  deleteUser,
} from "firebase/auth";
import { auth } from "../firebase";
import { get, post } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [church, setChurch] = useState(null);
  const [role, setRole] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [churchLoading, setChurchLoading] = useState(false);
  const signingUpRef = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (firebaseUser && !signingUpRef.current) {
        loadChurch();
      } else if (!firebaseUser) {
        setChurch(null);
        setRole(null);
      }
    });
    return unsub;
  }, []);

  async function loadChurch() {
    setChurchLoading(true);
    try {
      const data = await get("/api/churches/me");
      const churches = data?.churches || [];
      if (churches.length > 0) {
        setChurch(churches[0].church);
        setRole(churches[0].role);
      }
      // Don't null out church on empty response — it may have been
      // set directly by signUp() and the membership record just hasn't
      // propagated yet. Only clear on explicit sign-out.
    } catch {
      // Network error during load — keep existing church state
    } finally {
      setChurchLoading(false);
    }
  }

  async function signIn(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will fire and load church
  }

  async function signUp(email, password, churchData) {
    // Guard: prevent onAuthStateChanged from calling loadChurch()
    // before the church record exists in the database.
    signingUpRef.current = true;
    let firebaseUser;
    try {
      // Step 1: Create or sign into Firebase account.
      // If a previous signup attempt created the account but church creation
      // failed, the account already exists. Sign in with it instead.
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUser = cred.user;
      } catch (fbErr) {
        if (fbErr?.code === "auth/email-already-in-use") {
          try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            firebaseUser = cred.user;
          } catch (signInErr) {
            if (signInErr?.code === "auth/invalid-credential" || signInErr?.code === "auth/wrong-password") {
              throw new Error("An account with this email already exists but the password doesn't match. Try a different password or log in at the portal.");
            }
            throw signInErr;
          }
        } else {
          throw fbErr;
        }
      }

      // Step 2: Create church via API with timeout + auto-retry.
      // Uses raw fetch (not api.js) to avoid automatic 401 → /portal/login redirect.
      // If the first attempt fails with a network error, retry once — the backend
      // is idempotent (returns existing church if code was already used by this user).
      const token = await firebaseUser.getIdToken(true);
      const BASE = "https://devotion-backend-production.up.railway.app";

      async function createChurchRequest() {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        try {
          const res = await fetch(`${BASE}/api/churches`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(churchData),
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (!res.ok) {
            let detail = `Church creation failed (${res.status})`;
            try {
              const body = await res.json();
              detail = body?.detail || detail;
            } catch { /* not JSON */ }
            throw new Error(detail);
          }
          return await res.json();
        } catch (err) {
          clearTimeout(timeout);
          throw err;
        }
      }

      let resp;
      try {
        resp = await createChurchRequest();
      } catch (firstErr) {
        // Network error or timeout — wait and retry once (backend is idempotent)
        if (firstErr.name === "AbortError" || firstErr.message === "Failed to fetch") {
          await new Promise((r) => setTimeout(r, 1500));
          resp = await createChurchRequest();
        } else {
          throw firstErr;
        }
      }

      setChurch(resp?.church || resp);
      setRole("owner");
      return resp;
    } catch (err) {
      const msg = err?.message || "Failed to create church. Please try again.";
      throw new Error(msg);
    } finally {
      signingUpRef.current = false;
    }
  }

  async function signOutUser() {
    await firebaseSignOut(auth);
    setUser(null);
    setChurch(null);
    setRole(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        church,
        role,
        authLoading,
        churchLoading,
        signIn,
        signUp,
        signOut: signOutUser,
        reloadChurch: loadChurch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
