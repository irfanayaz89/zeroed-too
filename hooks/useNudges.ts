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
 * One gentle nudge per session: a notification 5 minutes before each of
 * today's remaining sessions. Off in quiet hours or when turned off in Me.
 */
export function useNudges() {
  const { user, profile } = useAuth();
  const buddy = profile?.buddy_name?.trim() || "Dot";
  const { prefs } = usePrefs();
  const blocks = useBlocks();
  const logs = useLogs();
  const today = dateKey(new Date());

  const due = useMemo(() => {
    if (!blocks.data || !logs.data) return [];
    const now = nowMinutes();
    return sessionsOn(new Date(), blocks.data, logs.data)
      .filter((s) => s.status === "todo" && s.start - 5 > now)
      .filter((s) => !inQuiet(s.start - 5, prefs.quietStart, prefs.quietEnd))
      .map((s) => ({ key: s.key, title: s.block.title, start: s.start, mins: s.mins }));
  }, [blocks.data, logs.data, prefs.quietStart, prefs.quietEnd]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    let cancelled = false;
    (async () => {
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        if (!user || !prefs.nudge || !due.length) return;
        // Permission is asked once, with an example, during onboarding (or from Me). Never cold.
        const { granted } = await Notifications.getPermissionsAsync();
        if (!granted || cancelled) return;
        const midnight = new Date();
        midnight.setHours(0, 0, 0, 0);
        for (const s of due) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `${s.title} at ${fmt(s.start)}`,
              body: `Starts in 5 minutes. ${buddy}'s ready when you are.`,
              data: { url: "/now" },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: new Date(midnight.getTime() + (s.start - 5) * 60000),
            },
          });
        }
      } catch {
        // Notifications are a nice-to-have; never block the app on them.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, prefs.nudge, due, today, buddy]);
}
