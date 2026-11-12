import { palette } from "@/constants/tokens/palette";
import { hexToRgba } from "./colorUtils";
import type { CategoryColors, ProgressColors, ThemeColors } from "./types";

export const categoryColors: CategoryColors = {
  school: palette.purple500,
  homework: palette.purple400Brand,
  hobby: palette.teal400,
  free_time: palette.sky400,
  chores: palette.amber400,
  exercise: palette.coral500,
  wind_down: palette.plum300,
  sleep: palette.gray900,
  meal: palette.orange500,
  custom: palette.gray700,
};

export const progressColors: ProgressColors = {
  settling: palette.purple50,
  focused: palette.purple500,
  lockedIn: palette.green500,
  complete: palette.green700,
  statusSettling: palette.purple400,
  neutralArc: palette.neutralArc,
};

/** Fixed colors: the Live Activity is drawn by iOS, outside the app theme. */
export const liveActivityColors = {
  background: palette.gray900,
  title: palette.white,
  subtitle: palette.purple50,
  progressTint: palette.purple400Brand,
  progressLabel: palette.white,
};

export const confettiColors = [
  palette.green600,
  palette.green500,
  palette.purple500,
  palette.yellow400,
  palette.teal400,
] as const;

export function buildLightColors(): ThemeColors {
  return {
    background: palette.gray25,
    surface: palette.white,
    surfaceMuted: palette.gray100,
    textPrimary: palette.gray900,
    textSecondary: palette.gray700,
    textTertiary: palette.gray500,
    textOnPrimary: palette.white,
    textOnPrimaryMuted: "rgba(255, 255, 255, 0.8)",
    border: palette.gray200,
    borderSubtle: palette.gray200,
    borderLight: palette.gray50,
    primary: palette.purple500,
    primaryLight: palette.purple400Brand,
    primaryGradientMid: palette.purpleGradientMid,
    primaryTintBg: palette.purpleTintBg,
    accent: palette.teal400,
    success: palette.teal400,
    danger: palette.coral500,
    errorBackground: palette.errorBg,
    warning: palette.amber400,
    info: palette.sky400,
    highlight: palette.yellow400,
    overlay: "rgba(0, 0, 0, 0.5)",
    overlayLight: "rgba(0, 0, 0, 0.4)",
    progressTrack: palette.gray200,
    checkboxEmpty: palette.gray200,
    checkboxFilled: palette.teal400,
    tabIconDefault: palette.gray700,
    tabIconSelected: palette.purple500,
    tabBarBg: palette.white,
    tabBarBorder: palette.gray200,
    dotInactive: palette.gray300,
    arcDotFill: palette.white,
    primaryTint12: hexToRgba(palette.purple500, 0.12),
    primaryTint8: hexToRgba(palette.purple500, 0.08),
    confetti: confettiColors,
    progress: progressColors,
    category: categoryColors,
    introTextPrimary: palette.navy900,
  };
}

export function buildDarkColors(): ThemeColors {
  return {
    background: palette.navy900,
    surface: palette.navy800,
    surfaceMuted: palette.navy800,
    textPrimary: palette.grayDarkPrimary,
    textSecondary: palette.gray400,
    textTertiary: palette.gray400,
    textOnPrimary: palette.white,
    textOnPrimaryMuted: "rgba(255, 255, 255, 0.8)",
    border: palette.navy700,
    borderSubtle: "rgba(255, 255, 255, 0.1)",
    borderLight: palette.navy700,
    primary: palette.purple500,
    primaryLight: palette.purple400Brand,
    primaryGradientMid: palette.purpleGradientMid,
    primaryTintBg: palette.purpleTintBg,
    accent: palette.teal400,
    success: palette.teal400,
    danger: palette.coral500,
    errorBackground: "rgba(255, 107, 107, 0.12)",
    warning: palette.amber400,
    info: palette.sky400,
    highlight: palette.yellow400,
    overlay: "rgba(0, 0, 0, 0.5)",
    overlayLight: "rgba(0, 0, 0, 0.4)",
    progressTrack: palette.navy700,
    checkboxEmpty: palette.navy700,
    checkboxFilled: palette.teal400,
    tabIconDefault: palette.gray400,
    tabIconSelected: palette.purple500,
    tabBarBg: palette.black,
    tabBarBorder: palette.tabBarBorderDark,
    dotInactive: palette.navy600,
    arcDotFill: palette.navy800,
    primaryTint12: hexToRgba(palette.purple500, 0.12),
    primaryTint8: hexToRgba(palette.purple500, 0.08),
    confetti: confettiColors,
    progress: progressColors,
    category: categoryColors,
    introTextPrimary: palette.gray50,
  };
}
