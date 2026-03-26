import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "../AuthContext";

/**
 * Portal-only palette system. Controls sidebar and insight card chrome.
 * Does NOT replace useChurchColors() — that still controls accent buttons
 * and church branding everywhere else.
 *
 * Stored in localStorage per church. Falls back to "cream".
 */

export const palettes = {
  cream: {
    name: "Warm Linen",
    preview: ["#f5f0e8", "#e0dbd1", "#c8a855"],
    sidebar: {
      bg: "#f5f0e8", text: "#5a5647", muted: "#9e9888",
      active: "#3d6b44", activeBg: "rgba(61,107,68,0.1)",
      border: "#e0dbd1", brand: "#2c2a25",
      switchBg: "rgba(0,0,0,0.04)", chevron: "#b0a998",
    },
    insight: {
      bg: "linear-gradient(135deg, #f5f0e8, #ece5d6)",
      glow1: "rgba(139,105,20,0.1)", glow2: "rgba(139,105,20,0.05)",
      text: "#5a5647", title: "#2c2a25", sub: "#9e9888",
      accent: "#8b6914", accentBg: "rgba(139,105,20,0.08)",
      accentBorder: "rgba(139,105,20,0.2)",
    },
  },
  sage: {
    name: "Garden Sage",
    preview: ["#e8f0e9", "#c8dcc9", "#3d6b44"],
    sidebar: {
      bg: "#e8f0e9", text: "#3d5a41", muted: "#7a9b7e",
      active: "#3d6b44", activeBg: "rgba(61,107,68,0.12)",
      border: "#c8dcc9", brand: "#2c4a30",
      switchBg: "rgba(0,0,0,0.04)", chevron: "#7a9b7e",
    },
    insight: {
      bg: "linear-gradient(135deg, #e8f0e9, #d5e5d7)",
      glow1: "rgba(61,107,68,0.08)", glow2: "rgba(61,107,68,0.04)",
      text: "#3d5a41", title: "#2c4a30", sub: "#7a9b7e",
      accent: "#3d6b44", accentBg: "rgba(61,107,68,0.08)",
      accentBorder: "rgba(61,107,68,0.2)",
    },
  },
  dark: {
    name: "Evening",
    preview: ["#2c2a25", "#3a3732", "#c8a855"],
    sidebar: {
      bg: "#2c2a25", text: "#b0a998", muted: "#6e6a5f",
      active: "#e2c87a", activeBg: "rgba(200,168,85,0.12)",
      border: "rgba(255,255,255,0.06)", brand: "#fff",
      switchBg: "rgba(255,255,255,0.05)", chevron: "#9e9888",
    },
    insight: {
      bg: "linear-gradient(135deg, #2c2a25, #3a3732)",
      glow1: "rgba(200,168,85,0.15)", glow2: "rgba(200,168,85,0.06)",
      text: "#c5bfb2", title: "#fff", sub: "#9e9888",
      accent: "#e2c87a", accentBg: "rgba(200,168,85,0.1)",
      accentBorder: "rgba(200,168,85,0.3)",
    },
  },
  navy: {
    name: "Deep Water",
    preview: ["#1e2a3a", "#2a3a4e", "#c8a855"],
    sidebar: {
      bg: "#1e2a3a", text: "#8a9eb4", muted: "#4a6478",
      active: "#c8a855", activeBg: "rgba(200,168,85,0.12)",
      border: "rgba(255,255,255,0.06)", brand: "#e0dbd1",
      switchBg: "rgba(255,255,255,0.05)", chevron: "#5a7a94",
    },
    insight: {
      bg: "linear-gradient(135deg, #1e2a3a, #2a3a4e)",
      glow1: "rgba(200,168,85,0.12)", glow2: "rgba(200,168,85,0.05)",
      text: "#8a9eb4", title: "#e0dbd1", sub: "#5a7a94",
      accent: "#c8a855", accentBg: "rgba(200,168,85,0.1)",
      accentBorder: "rgba(200,168,85,0.3)",
    },
  },
};

const ThemeCtx = createContext(null);

export function ThemeProvider({ children }) {
  const { church } = useAuth();
  const storageKey = church?.id ? `portal_palette_${church.id}` : null;

  const [paletteKey, setPaletteKeyState] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved && palettes[saved]) return saved;
    }
    return "cream";
  });

  // Re-read from localStorage when church loads (storageKey changes from null to real key)
  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved && palettes[saved]) setPaletteKeyState(saved);
    }
  }, [storageKey]);

  const setPaletteKey = useCallback((key) => {
    if (!palettes[key]) return;
    setPaletteKeyState(key);
    if (storageKey) localStorage.setItem(storageKey, key);
  }, [storageKey]);

  const palette = palettes[paletteKey] || palettes.cream;

  return (
    <ThemeCtx.Provider value={{ palette, paletteKey, setPaletteKey, palettes }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function usePortalTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("usePortalTheme must be inside ThemeProvider");
  return ctx;
}
