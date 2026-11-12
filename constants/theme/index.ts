import type { ColorSchemeName } from "react-native";
import { radii } from "@/constants/tokens/radii";
import { shadows } from "@/constants/tokens/shadows";
import { spacing } from "@/constants/tokens/spacing";
import { typography } from "@/constants/tokens/typography";
import { buildDarkColors, buildLightColors } from "./semantic";
import type { Theme } from "./types";

export function buildTheme(colorScheme: ColorSchemeName | null | undefined): Theme {
  const isDark = colorScheme === "dark";
  return {
    isDark,
    colors: isDark ? buildDarkColors() : buildLightColors(),
  };
}

export const themeTokens = {
  spacing,
  radii,
  shadows,
  typography,
};

export type { Theme, ThemeColors } from "./types";
export { hexToRgba, categoryTintBg } from "./colorUtils";
export {
  buildLightColors,
  buildDarkColors,
  categoryColors,
  progressColors,
  confettiColors,
} from "./semantic";

export function getArcColor(progress: number, colors = buildLightColors()): string {
  const p = colors.progress;
  if (progress < 0.1) return p.settling;
  if (progress < 0.6) return p.focused;
  if (progress < 0.8) return p.lockedIn;
  return p.complete;
}

export function getStatusColor(progress: number, colors = buildLightColors()): string {
  const p = colors.progress;
  if (progress < 0.1) return p.statusSettling;
  if (progress < 0.6) return p.focused;
  if (progress < 0.8) return p.lockedIn;
  return p.complete;
}

export function getStatusText(progress: number): string {
  if (progress < 0.1) return "Settling in...";
  if (progress < 0.6) return "Focused";
  if (progress < 0.8) return "Locked in";
  return "Almost there!";
}
