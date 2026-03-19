import { useAuth } from "./AuthContext";

/**
 * Dynamic color palette that uses the church's accent and secondary colors.
 * Replaces the static COLORS import across all portal pages.
 *
 * Usage: const C = useChurchColors();
 *
 * Falls back to sage green + warm gold if no church is loaded yet.
 */
export function useChurchColors() {
  const { church } = useAuth();
  const accent = church?.accent_color || "#3D6B5E";
  const secondary = church?.secondary_color || "#D4A853";

  return {
    // Static base colors (don't change per church)
    bg: "#F7F4EF",
    bgDeep: "#F0EBE3",
    card: "#FFFFFF",
    cardWarm: "#FDFAF5",
    border: "#E8E2D9",
    borderLight: "#F0EBE3",
    text: "#2C2C2C",
    body: "#4A4A4A",
    textBody: "#4A4A4A",
    sec: "#7A7672",
    textSec: "#7A7672",
    muted: "#A8A29E",
    textMuted: "#A8A29E",
    red: "#C45A4A",
    redBg: "#FEF2F0",
    green: "#4A8B6F",
    greenBg: "#EDF7F1",
    white: "#FFFFFF",
    purple: "#6B5B8A",
    purpleBg: "#F3F0F8",
    blue: "#3B6FA0",
    blueBg: "#EEF4FB",

    // Dynamic church colors
    accent,
    secondary,
    accentLight: accent + "15",
    accentMid: accent + "40",
    accentDark: accent,
    amber: secondary,
    amberBg: "#FFF8EE",
    gold: secondary,
    goldDim: "rgba(201,168,76,0.12)",
    goldBg: "#F9F5ED",

    // Computed
    bgCard: "#FFFFFF",
  };
}
