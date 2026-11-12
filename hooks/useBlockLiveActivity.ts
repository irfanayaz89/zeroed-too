import { useEffect } from "react";
import { AppState } from "react-native";
import { endBlockActivity, showBlockActivity } from "@/lib/liveActivity";
import { msAt } from "@/hooks/useBlockActions";
import { useFocusOverview } from "@/hooks/useFocusData";
import { fmt, nowState } from "@/lib/focus";
import { useAuth } from "@/lib/auth-context";
import { usePrefs } from "@/lib/prefs-context";

/** While a block is running, its countdown is on the Lock Screen and Dynamic Island. */
export function useBlockLiveActivity() {
  const { user } = useAuth();
  const { prefs } = usePrefs();
  const o = useFocusOverview();
  const st = user ? nowState(o.today, o.nowMin) : null;
  const s = st?.kind === "block" ? st.s : null;
  const key = s ? `${s.key}|${s.end}|${s.block.title}` : null;

  useEffect(() => {
    if (!s || !prefs.liveActivity) {
      endBlockActivity();
      return;
    }
    const show = () =>
      showBlockActivity({ title: s.block.title, subtitle: `Ends at ${fmt(s.end)}`, endsAtMs: msAt(s.date, s.end) });
    show();
    // Activities can only start while the app is active.
    const sub = AppState.addEventListener("change", (a) => a === "active" && show());
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, prefs.liveActivity]);
}
