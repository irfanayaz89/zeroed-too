import { useEffect, useMemo } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useAuth } from "@/lib/auth-context";
import { usePrefs } from "@/lib/prefs-context";
import { useBlocks, useLogs } from "@/hooks/useFocusData";
import { dateKey, fmt, nowMinutes, sessionsOn } from "@/lib/focus";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

function inQuiet(min: number, start: number, end: number) {
  return start > end ? min >= start || min < end : min >= start && min < end;
}

/**
 * Local notifications for today's remaining blocks: a heads-up a few minutes
 * before each one, and (if switched on) a nudge 5 minutes in if the app wasn't
 * opened during the block. Nothing during quiet hours.
 */
export function useNudges() {
  const { user } = useAuth();
  const { prefs } = usePrefs();
  const blocks = useBlocks();
  const logs = useLogs();
  const today = dateKey(new Date());

  const due = useMemo(() => {
    if (!blocks.data || !logs.data) return [];
    const now = nowMinutes();
    const out: { at: number; title: string; body: string }[] = [];
    for (const s of sessionsOn(new Date(), blocks.data, logs.data)) {
      if (s.status !== "todo") continue;
      const quiet = (m: number) => prefs.quiet && inQuiet(m, prefs.quietStart, prefs.quietEnd);
      const before = s.start - prefs.headsUp;
      if (prefs.nudge && before > now && !quiet(before)) {
        out.push({ at: before, title: `${s.block.title} at ${fmt(s.start)}`, body: `Starts in ${prefs.headsUp} minutes.` });
      }
      const late = s.start + 5;
      if (prefs.notStarted && !s.log?.started_at && late > now && late < s.end && !quiet(late)) {
        out.push({ at: late, title: `${s.block.title} started 5 minutes ago`, body: "Open Zeroed to get going, or move it to later." });
      }
    }
    return out;
  }, [blocks.data, logs.data, prefs.nudge, prefs.headsUp, prefs.notStarted, prefs.quiet, prefs.quietStart, prefs.quietEnd]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    let cancelled = false;
    (async () => {
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        if (!user || !due.length) return;
        // Permission is asked once, with an example, during onboarding (or from Me). Never cold.
        const { granted } = await Notifications.getPermissionsAsync();
        if (!granted || cancelled) return;
        const midnight = new Date();
        midnight.setHours(0, 0, 0, 0);
        for (const n of due) {
          await Notifications.scheduleNotificationAsync({
            content: { title: n.title, body: n.body, data: { url: "/now" } },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(midnight.getTime() + n.at * 60000) },
          });
        }
      } catch {
        // Notifications are a nice-to-have; never block the app on them.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, due, today]);
}
