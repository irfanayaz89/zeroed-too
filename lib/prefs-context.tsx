import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DOT_COLORS,
  THEMES,
  themeColors,
  type DotBody,
  type DotColorName,
  type FdColors,
  type ThemeName,
} from "@/constants/focusd";

/** Device-level settings: how the app looks and what it may do on the lock screen. */
export interface Prefs {
  theme: ThemeName;
  /** "system" follows the phone. */
  appearance: "system" | "light" | "dark";
  /** null = the theme's default Dot colour. */
  dotColor: DotColorName | null;
  liveActivity: boolean;
  nudge: boolean;
  /** Minutes after midnight. */
  quietStart: number;
  quietEnd: number;
}

const DEFAULT_PREFS: Prefs = {
  theme: "burgundy",
  appearance: "system",
  dotColor: null,
  liveActivity: true,
  nudge: true,
  quietStart: 22 * 60,
  quietEnd: 7 * 60,
};

const KEY = "focusd_prefs_v1";

interface PrefsValue {
  prefs: Prefs;
  setPrefs: (patch: Partial<Prefs>) => void;
  colors: FdColors;
  isDark: boolean;
  dot: DotBody;
  dotColorName: DotColorName;
  loaded: boolean;
}

const PrefsContext = createContext<PrefsValue | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const [prefs, setState] = useState<Prefs>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setState({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const setPrefs = useCallback((patch: Partial<Prefs>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<PrefsValue>(() => {
    const isDark = prefs.appearance === "system" ? scheme === "dark" : prefs.appearance === "dark";
    const dotColorName = prefs.dotColor ?? THEMES[prefs.theme].dot;
    return {
      prefs,
      setPrefs,
      colors: themeColors(prefs.theme, isDark),
      isDark,
      dot: DOT_COLORS[dotColorName],
      dotColorName,
      loaded,
    };
  }, [prefs, scheme, setPrefs, loaded]);

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): PrefsValue {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used within PrefsProvider");
  return ctx;
}

/** Shorthand for the current colours. */
export function useFd() {
  const { colors, isDark, dot } = usePrefs();
  return { c: colors, isDark, dot };
}
