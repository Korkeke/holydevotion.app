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
      } else {
        setChurch(null);
        setRole(null);
      }
    } catch {
      setChurch(null);
      setRole(null);
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
    let cred;
    try {
      // Step 1: Create Firebase account
      cred = await createUserWithEmailAndPassword(auth, email, password);

      // Step 2: Create church via API
      // IMPORTANT: Use raw fetch instead of the api.js post() helper.
      // api.js redirects to /portal/login on 401, but a brand-new Firebase
      // token may not be fully propagated yet. We handle errors here instead.
      const token = await cred.user.getIdToken(true); // force refresh
      const BASE = "https://devotion-backend-production.up.railway.app";
      const res = await fetch(`${BASE}/api/churches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(churchData),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `Church creation failed: ${res.status}`);
      }

      const resp = await res.json();
      setChurch(resp?.church || resp);
      setRole("owner");
      return resp;
    } catch (err) {
      // Church creation failed — clean up orphaned Firebase account
      if (cred?.user) {
        try { await deleteUser(cred.user); } catch { /* best effort */ }
      }
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
