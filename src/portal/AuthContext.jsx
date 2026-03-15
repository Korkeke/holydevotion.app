import { createContext, useContext, useState, useEffect } from "react";
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (firebaseUser) {
        loadChurch();
      } else {
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
    // Step 1: Create Firebase account
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // Step 2: Create church via API
    try {
      const resp = await post("/api/churches", churchData);
      setChurch(resp?.church || resp);
      setRole("owner");
      return resp;
    } catch (err) {
      // Church creation failed — clean up orphaned Firebase account
      try {
        await deleteUser(cred.user);
      } catch {
        // Best effort cleanup
      }
      // Surface the actual error (e.g. "Invalid registration code")
      const msg = err?.message || "Failed to create church. Please try again.";
      throw new Error(msg);
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
