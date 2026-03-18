import { useAuth } from "./AuthContext";

/**
 * Dynamic color palette that uses the church's accent and secondary colors.
 * Replaces the static COLORS import across all portal pages.
 *
 * Usage: const COLORS = useChurchColors();
 *
 * Falls back to sage green + warm gold if no church is loaded yet.
 */
export function useChurchColors() {
  const { church } = useAuth();
  const accent = church?.accent_color || "#3D6B5E";
  const secondary = church?.secondary_color || "#D4A853";

  return {
    // Static base colors (don't change per church)
    bg: "#FAF8F5",
    bgSidebar: "#FDFCFA",
    card: "#FFFFFF",
    border: "#EDE9E3",
    sand: "#F5F0EA",
    text: "#2C2C2C",
    textBody: "#4A4A4A",
    textSec: "#7A7672",
    textMuted: "#A8A29E",
    red: "#C45A4A",
    green: "#4A8B6F",
    white: "#FFFFFF",

    // Dynamic church colors
    accent,
    secondary,
    accentLight: accent + "15",
    accentMid: accent + "40",
    accentDark: accent,
    amber: secondary, // secondary doubles as amber/warm accent
    gold: secondary, // legacy alias

    // Computed
    bgCard: "#FFFFFF",
  };
}
