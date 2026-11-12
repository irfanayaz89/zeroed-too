import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useReducedMotion } from "react-native-reanimated";
import { buildColors, type AccentName, type Colors, type ThemeName } from "@/constants/theme";
import { setHapticsEnabled } from "@/lib/haptics";

/** Device-level settings: how the app looks and what it may do. */
export interface Prefs {
  theme: ThemeName;
  /** null = the theme's default accent. */
  accent: AccentName | null;
  liveActivity: boolean;
  /** Heads-up notification before each block. */
  nudge: boolean;
  /** Minutes before a block for the heads-up (2, 5 or 10). */
  headsUp: number;
  /** A second nudge if a block started and nothing was marked. */
  notStarted: boolean;
  quiet: boolean;
  /** Minutes after midnight. */
  quietStart: number;
  quietEnd: number;
  haptics: boolean;
  /** Minutes after midnight; new blocks are never suggested before this. */
  dayStart: number;
}

const DEFAULT_PREFS: Prefs = {
  theme: "graphite",
  accent: null,
  liveActivity: true,
  nudge: true,
  headsUp: 5,
  notStarted: true,
  quiet: true,
  quietStart: 22 * 60,
  quietEnd: 7 * 60,
  haptics: true,
  dayStart: 8 * 60,
};

const KEY = "zeroed_prefs_v1";

interface PrefsValue {
  prefs: Prefs;
  setPrefs: (patch: Partial<Prefs>) => void;
  colors: Colors;
  /** The system's Reduce Motion setting. */
  reduceMotion: boolean;
  loaded: boolean;
}

const PrefsContext = createContext<PrefsValue | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setState] = useState<Prefs>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setState({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => setHapticsEnabled(prefs.haptics), [prefs.haptics]);

  const setPrefs = useCallback((patch: Partial<Prefs>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<PrefsValue>(
    () => ({ prefs, setPrefs, colors: buildColors(prefs.theme, prefs.accent), reduceMotion, loaded }),
    [prefs, setPrefs, reduceMotion, loaded]
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): PrefsValue {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used within PrefsProvider");
  return ctx;
}

/** Shorthand for the current colours. */
export function useZ() {
  const { colors, reduceMotion } = usePrefs();
  return { c: colors, reduceMotion };
}
