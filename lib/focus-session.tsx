import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FocusType } from "@/constants/focusd";
import { endBlockActivity, showBlockActivity } from "@/lib/liveActivity";
import { usePrefs } from "@/lib/prefs-context";

/** The session currently being focused on. Kept across app restarts. */
export interface ActiveSession {
  key: string;
  blockId: string;
  date: string;
  title: string;
  type: FocusType;
  start: number;
  end: number;
  index: number;
  count: number;
  plannedMins: number;
  extraMins: number;
  startedAt: number;
  pausedAt: number | null;
  pausedMs: number;
}

/** What Now plays after a pop. */
export interface Celebration {
  mins: number;
  early: boolean;
  scoreBefore: number;
  overallBefore: number;
  at: number;
}

const KEY = "focusd_active_session_v1";

interface Value {
  active: ActiveSession | null;
  start: (a: Omit<ActiveSession, "startedAt" | "pausedAt" | "pausedMs" | "extraMins">) => void;
  togglePause: () => void;
  addFive: () => void;
  /** Ends the session and returns the minutes focused. */
  finish: () => number;
  cancel: () => void;
  elapsedSec: (now?: number) => number;
  totalSec: number;
  celebration: Celebration | null;
  setCelebration: (c: Celebration | null) => void;
}

const Ctx = createContext<Value | null>(null);

export function FocusSessionProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveSession | null>(null);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const { prefs } = usePrefs();

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setActive(JSON.parse(raw)))
      .catch(() => {});
  }, []);

  const persist = useCallback((a: ActiveSession | null) => {
    setActive(a);
    if (a) AsyncStorage.setItem(KEY, JSON.stringify(a)).catch(() => {});
    else AsyncStorage.removeItem(KEY).catch(() => {});
  }, []);

  const totalSec = active ? (active.plannedMins + active.extraMins) * 60 : 0;

  const elapsedSec = useCallback(
    (now = Date.now()) => {
      if (!active) return 0;
      const end = active.pausedAt ?? now;
      return Math.max(0, (end - active.startedAt - active.pausedMs) / 1000);
    },
    [active]
  );

  // Lock Screen / Dynamic Island while focusing.
  useEffect(() => {
    if (!active || !prefs.liveActivity) {
      endBlockActivity();
      return;
    }
    if (active.pausedAt) return;
    showBlockActivity({
      title: active.title,
      subtitle: "Balloon filling · tap to open Focus'd",
      endsAtMs: active.startedAt + active.pausedMs + (active.plannedMins + active.extraMins) * 60000,
    });
  }, [active, prefs.liveActivity]);

  const value = useMemo<Value>(
    () => ({
      active,
      totalSec,
      elapsedSec,
      celebration,
      setCelebration,
      start: (a) => persist({ ...a, startedAt: Date.now(), pausedAt: null, pausedMs: 0, extraMins: 0 }),
      togglePause: () => {
        if (!active) return;
        if (active.pausedAt) persist({ ...active, pausedMs: active.pausedMs + (Date.now() - active.pausedAt), pausedAt: null });
        else persist({ ...active, pausedAt: Date.now() });
      },
      addFive: () => active && persist({ ...active, extraMins: active.extraMins + 5 }),
      finish: () => {
        const mins = Math.max(1, Math.round(elapsedSec() / 60));
        persist(null);
        return mins;
      },
      cancel: () => persist(null),
    }),
    [active, totalSec, elapsedSec, celebration, persist]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFocusSession(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error("useFocusSession must be used within FocusSessionProvider");
  return v;
}
