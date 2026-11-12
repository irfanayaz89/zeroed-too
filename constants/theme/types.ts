export interface ProgressColors {
  settling: string;
  focused: string;
  lockedIn: string;
  complete: string;
  statusSettling: string;
  neutralArc: string;
}

export interface CategoryColors {
  school: string;
  homework: string;
  hobby: string;
  free_time: string;
  chores: string;
  exercise: string;
  wind_down: string;
  sleep: string;
  meal: string;
  custom: string;
  [key: string]: string;
}

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textOnPrimary: string;
  textOnPrimaryMuted: string;
  border: string;
  borderSubtle: string;
  borderLight: string;
  primary: string;
  primaryLight: string;
  primaryGradientMid: string;
  primaryTintBg: string;
  accent: string;
  success: string;
  danger: string;
  errorBackground: string;
  warning: string;
  info: string;
  highlight: string;
  overlay: string;
  overlayLight: string;
  progressTrack: string;
  checkboxEmpty: string;
  checkboxFilled: string;
  tabIconDefault: string;
  tabIconSelected: string;
  tabBarBg: string;
  tabBarBorder: string;
  dotInactive: string;
  arcDotFill: string;
  primaryTint12: string;
  primaryTint8: string;
  confetti: readonly string[];
  progress: ProgressColors;
  category: CategoryColors;
  /** @deprecated Use textPrimary — kept for intro/welcome migration */
  introTextPrimary: string;
}

export interface Theme {
  isDark: boolean;
  colors: ThemeColors;
}
