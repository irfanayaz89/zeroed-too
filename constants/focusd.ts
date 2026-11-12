/**
 * Focus'd design tokens: app themes (light + dark), Dot's body colours and the
 * focus types each session balloon can be.
 */

export type ThemeName = "pink" | "burgundy" | "blue" | "green";
export type DotColorName =
  | "blueberry"
  | "tangerine"
  | "sky"
  | "pink"
  | "peach"
  | "rose"
  | "butter"
  | "coral"
  | "cream";

export interface FdColors {
  bg: string;
  card: string;
  ink: string;
  sub: string;
  soft: string;
  line: string;
  bar: string;
  tip: string;
  tipInk: string;
  tab: string;
  field: string;
  dash: string;
  /** Light accent (focus button, ddots). */
  accentLight: string;
  /** Main accent (rings, active tab, links). */
  accent: string;
  nowTop: string;
  /** Focus screen background (always dark). */
  night: string;
  night2: string;
  fInk: string;
  fSub: string;
  danger: string;
  onAccent: string;
}

type Palette = { name: string; dot: DotColorName; light: FdColors; dark: Partial<FdColors> };

const shared = { danger: "#E5484D", onAccent: "#FFFFFF" };

export const THEMES: Record<ThemeName, Palette> = {
  pink: {
    name: "Pink",
    dot: "blueberry",
    light: {
      bg: "#FFE3EE", card: "#FFFFFF", ink: "#3B1530", sub: "#8A3D6E", soft: "#6B3A5C",
      line: "rgba(59,21,48,0.12)", bar: "#FFD0E3", tip: "#FFF9C9", tipInk: "#3B1530",
      tab: "#2A0F22", field: "#FFFFFF", dash: "rgba(224,67,138,0.38)", accentLight: "#FF8FC0",
      accent: "#D93A83", nowTop: "#F2669F", night: "#2A0F22", night2: "#3E1A33",
      fInk: "#FFE3EE", fSub: "#E9AFCF", ...shared,
    },
    dark: {
      bg: "#1F0B19", card: "#341529", ink: "#FFE3EE", sub: "#E9AFCF", soft: "#D9A3C3",
      line: "rgba(255,227,238,0.14)", bar: "#4A2140", tip: "#3F3413", tipInk: "#FFF3B8",
      tab: "#0F050C", field: "#2A1022", dash: "rgba(255,143,192,0.35)",
    },
  },
  burgundy: {
    name: "Burgundy",
    dot: "peach",
    light: {
      bg: "#F7E9EC", card: "#FFFFFF", ink: "#3A0D1A", sub: "#8C2F45", soft: "#6E3442",
      line: "rgba(58,13,26,0.12)", bar: "#EDCCD4", tip: "#FFF0D4", tipInk: "#3A0D1A",
      tab: "#3A0D1A", field: "#FFFFFF", dash: "rgba(142,27,58,0.35)", accentLight: "#E58FA4",
      accent: "#8E1B3A", nowTop: "#B23656", night: "#2B0A14", night2: "#47182A",
      fInk: "#FBE6EC", fSub: "#E3A2B4", ...shared,
    },
    dark: {
      bg: "#1E0910", card: "#36131F", ink: "#FBE6EC", sub: "#E3A2B4", soft: "#D196A8",
      line: "rgba(251,230,236,0.13)", bar: "#4E1B2B", tip: "#3E2E12", tipInk: "#FFE7B8",
      tab: "#0F0408", field: "#2A0E18", dash: "rgba(229,143,164,0.35)", accent: "#C2385C",
    },
  },
  blue: {
    name: "Blue",
    dot: "tangerine",
    light: {
      bg: "#E5EEFF", card: "#FFFFFF", ink: "#0F2147", sub: "#3B5A9A", soft: "#3E4F75",
      line: "rgba(15,33,71,0.12)", bar: "#CADBFB", tip: "#FFF6CF", tipInk: "#0F2147",
      tab: "#0F2147", field: "#FFFFFF", dash: "rgba(47,91,234,0.35)", accentLight: "#8FB0FF",
      accent: "#2F5BEA", nowTop: "#5B82F5", night: "#0B1733", night2: "#1B2D57",
      fInk: "#E6EEFF", fSub: "#A9BFF2", ...shared,
    },
    dark: {
      bg: "#0A1428", card: "#16264A", ink: "#E6EEFF", sub: "#9FB7EE", soft: "#A8B8DA",
      line: "rgba(230,238,255,0.13)", bar: "#22396B", tip: "#3A3415", tipInk: "#FFF0B8",
      tab: "#050B18", field: "#0F1D3A", dash: "rgba(143,176,255,0.35)", accent: "#4D78F5",
    },
  },
  green: {
    name: "Green",
    dot: "blueberry",
    light: {
      bg: "#E4F3E9", card: "#FFFFFF", ink: "#0E2A1C", sub: "#2F6B4A", soft: "#3D5A49",
      line: "rgba(14,42,28,0.12)", bar: "#C6E7D1", tip: "#FFF5CF", tipInk: "#0E2A1C",
      tab: "#0E2A1C", field: "#FFFFFF", dash: "rgba(31,138,87,0.35)", accentLight: "#86D9AA",
      accent: "#1F8A57", nowTop: "#3AAE74", night: "#0A2016", night2: "#173A28",
      fInk: "#E2F5E8", fSub: "#A6D6B7", ...shared,
    },
    dark: {
      bg: "#08190F", card: "#13301F", ink: "#E2F5E8", sub: "#95CFAA", soft: "#A3C7AF",
      line: "rgba(226,245,232,0.13)", bar: "#1E4A31", tip: "#363314", tipInk: "#FFF0B8",
      tab: "#030C07", field: "#0D2417", dash: "rgba(134,217,170,0.35)", accent: "#2FA86C",
    },
  },
};

export function themeColors(name: ThemeName, dark: boolean): FdColors {
  const t = THEMES[name] ?? THEMES.burgundy;
  return dark ? { ...t.light, ...t.dark } : t.light;
}

export interface DotBody {
  name: string;
  body: string;
  deep: string;
  sleepy: string;
}

export const DOT_COLORS: Record<DotColorName, DotBody> = {
  blueberry: { name: "Blueberry", body: "#8C9BFF", deep: "#5462E0", sleepy: "#AEB8FF" },
  tangerine: { name: "Tangerine", body: "#FFA866", deep: "#E8732C", sleepy: "#FFC79B" },
  sky: { name: "Sky", body: "#8ED3FF", deep: "#3D9BE0", sleepy: "#B5E2FF" },
  pink: { name: "Pink", body: "#FF8FC0", deep: "#D93A83", sleepy: "#F7B6D2" },
  peach: { name: "Peach", body: "#FFB894", deep: "#E4805A", sleepy: "#FFD2BB" },
  rose: { name: "Rose", body: "#F7A8BC", deep: "#D0607E", sleepy: "#F9C7D3" },
  butter: { name: "Butter", body: "#FFD97A", deep: "#D9A632", sleepy: "#FFE8AE" },
  coral: { name: "Soft coral", body: "#FF968C", deep: "#DB5F57", sleepy: "#FFBDB6" },
  cream: { name: "Cream", body: "#FBE8D8", deep: "#D9B497", sleepy: "#FDF2E8" },
};

/** Fixed colours used on top of the themes. */
export const FIXED = {
  white: "#FFFFFF",
  dotInk: "#3B1530",
  blush: "#D93A83",
  lime: "#B6EE4E",
  limeDeep: "#86C22A",
  sun: "#F2C23C",
  glow: "#FFF7B0",
  confetti: ["#B6EE4E", "#F2C23C", "#D93A83", "#FFFFFF", "#86C22A", "#C9A6FF"],
};

export type FocusType = "study" | "project" | "hobby" | "reading";

export const FOCUS_TYPES: Record<FocusType, { label: string; color: string; deep: string }> = {
  study: { label: "Study", color: "#B6EE4E", deep: "#86C22A" },
  project: { label: "Project", color: "#7FE0D0", deep: "#36B5A2" },
  hobby: { label: "Hobby practice", color: "#F7D154", deep: "#D9A21E" },
  reading: { label: "Reading", color: "#C9A6FF", deep: "#9B6FEA" },
};

export const FONTS = {
  display: "BagelFatOne_400Regular",
  regular: "Gabarito_500Medium",
  semibold: "Gabarito_600SemiBold",
  bold: "Gabarito_700Bold",
  heavy: "Gabarito_800ExtraBold",
};

/** Dot starts small and grows: `scale` is Dot's size at the start of each stage. */
export const DOT_STAGES = [
  { name: "Wisp", goodDays: 0, scale: 0.6 },
  { name: "Fluff", goodDays: 5, scale: 0.74 },
  { name: "Floof", goodDays: 15, scale: 0.87 },
  { name: "Cloudling", goodDays: 35, scale: 1 },
] as const;

/** Dot's size before any good days (a brand-new Wisp). */
export const DOT_START = DOT_STAGES[0].scale;

/** A day counts as good when today's Focus Score reaches this. */
export const GOOD_DAY_SCORE = 50;

/** Font sizes for one-off text in screens (variants in components/fd/ui.tsx cover most text). */
export const FS = {
  tiny: 11.5,
  caption: 12,
  chip: 12.5,
  sm: 13,
  md: 14,
  body: 15.5,
  lg: 16,
  btn: 16.5,
  xl: 17,
  h3: 22,
  h2: 24,
  num: 26,
  timer: 46,
  hero: 52,
  pop: 64,
  huge: 76,
  giant: 96,
} as const;
