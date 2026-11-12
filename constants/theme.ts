/**
 * Design tokens for the adult app: two dark themes (Graphite, Black), the
 * accent picker, category colours, fonts and the progress states the arc
 * moves through. The app is dark only.
 */

export type ThemeName = "graphite" | "black";
export type AccentName = "glacier" | "cobalt" | "lagoon" | "copper" | "rose" | "sand" | "citron";

interface ThemeBase {
  name: string;
  bg: string;
  surface: string;
  surface2: string;
  line: string;
  text: string;
  text2: string;
  text3: string;
  /** Accent used until the person picks one. */
  defAccent: AccentName;
  /** accentSoft opacity on this theme. */
  softAlpha: number;
}

export const THEMES: Record<ThemeName, ThemeBase> = {
  graphite: {
    name: "Graphite",
    bg: "#232427",
    surface: "#2C2D31",
    surface2: "#35373C",
    line: "#414349",
    text: "#ECEDEF",
    text2: "#A4A7AE",
    text3: "#74777E",
    defAccent: "glacier",
    softAlpha: 0.18,
  },
  black: {
    name: "Black",
    bg: "#0C0B0A",
    surface: "#151312",
    surface2: "#1E1B19",
    line: "#2A2623",
    text: "#F4F1EE",
    text2: "#A39C95",
    text3: "#6B645E",
    defAccent: "lagoon",
    softAlpha: 0.14,
  },
};

/** `c` is the accent, `on` the text colour on top of it. */
export const ACCENTS: Record<AccentName, { name: string; c: string; on: string }> = {
  glacier: { name: "Glacier", c: "#7AB8FF", on: "#07121F" },
  cobalt: { name: "Cobalt", c: "#5B8CFF", on: "#071330" },
  lagoon: { name: "Lagoon", c: "#3CC8C0", on: "#04201E" },
  copper: { name: "Copper", c: "#D9A066", on: "#21140A" },
  rose: { name: "Rose", c: "#F28DAA", on: "#2A0E17" },
  sand: { name: "Sand", c: "#E3D3B4", on: "#211B10" },
  citron: { name: "Citron", c: "#D8E26B", on: "#1C1F05" },
};

export const STATUS = {
  good: "#4CC38A",
  warn: "#E8B04A",
  bad: "#EF6B5B",
  white: "#FFFFFF",
  black: "#000000",
  confettiGold: "#F2C14E",
};

export type CategoryId = "work" | "learning" | "health" | "personal" | "side";

export const CATEGORIES: Record<CategoryId, { label: string; color: string }> = {
  work: { label: "Work", color: "#7AA7FF" },
  learning: { label: "Learning", color: "#C9A2FF" },
  health: { label: "Health", color: "#6FD3A0" },
  personal: { label: "Personal", color: "#F2B66D" },
  side: { label: "Side project", color: "#FF8F8F" },
};

export const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[];

export const FONTS = {
  light: "Sora_300Light",
  display: "Sora_400Regular",
  displaySemi: "Sora_600SemiBold",
  medium: "Manrope_500Medium",
  semibold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  heavy: "Manrope_800ExtraBold",
};

/** Type scale for one-off text (the T variants in components/z/ui.tsx cover most). */
export const FS = {
  unit: 10,
  label: 10.5,
  caps: 11,
  tiny: 11.5,
  caption: 12,
  chip: 12.5,
  sm: 13,
  smPlus: 13.5,
  md: 14,
  mdPlus: 14.5,
  body: 15,
  lg: 17,
  stat: 18,
  h3: 20,
  h2: 21,
  ring: 20,
  title: 24,
  tile: 24,
  page: 28,
  big: 34,
  gain: 56,
} as const;

/** A day counts as good when today's Focus Score reaches this. */
export const GOOD_DAY_SCORE = 50;

/* ---------- colour helpers ---------- */
function parse(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

/** Mixes `a` toward `b` by `t` (0–1). */
export function mix(a: string, b: string, t: number): string {
  const A = parse(a);
  const B = parse(b);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = parse(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

export interface Colors {
  bg: string;
  surface: string;
  surface2: string;
  line: string;
  text: string;
  text2: string;
  text3: string;
  accent: string;
  onAccent: string;
  /** Accent mixed 35% toward white ("Locked in"). */
  accent2: string;
  accentSoft: string;
  good: string;
  warn: string;
  bad: string;
  /** Dim layer behind sheets. */
  scrim: string;
}

export function buildColors(theme: ThemeName, accent: AccentName | null): Colors {
  const t = THEMES[theme] ?? THEMES.graphite;
  const a = ACCENTS[accent ?? t.defAccent] ?? ACCENTS[t.defAccent];
  return {
    bg: t.bg,
    surface: t.surface,
    surface2: t.surface2,
    line: t.line,
    text: t.text,
    text2: t.text2,
    text3: t.text3,
    accent: a.c,
    onAccent: a.on,
    accent2: mix(a.c, STATUS.white, 0.35),
    accentSoft: rgba(a.c, t.softAlpha),
    good: STATUS.good,
    warn: STATUS.warn,
    bad: STATUS.bad,
    scrim: rgba(STATUS.black, 0.55),
  };
}

/* ---------- progress states (arc, badge and status line) ---------- */
export function arcColor(p: number, c: Colors): string {
  if (p < 0.1) return c.text3;
  if (p < 0.6) return c.accent;
  if (p < 0.8) return c.accent2;
  return c.good;
}

export function statusColor(p: number, c: Colors): string {
  if (p < 0.1) return c.text2;
  return arcColor(p, c);
}

export function statusText(p: number): string {
  if (p < 0.1) return "Settling in";
  if (p < 0.6) return "Focused";
  if (p < 0.8) return "Locked in";
  return "Almost there";
}

/** Fixed colours: the Live Activity is drawn by iOS, outside the app theme. */
export const LIVE_ACTIVITY_COLORS = {
  background: THEMES.graphite.bg,
  title: THEMES.graphite.text,
  subtitle: THEMES.graphite.text2,
  progressTint: ACCENTS.glacier.c,
  progressLabel: THEMES.graphite.text,
};
