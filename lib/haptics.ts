import * as Haptics from "expo-haptics";

/** Haptics follow the switch in Me. Set by PrefsProvider. */
let enabled = true;
export const setHapticsEnabled = (on: boolean) => {
  enabled = on;
};

export const haptic = {
  select: () => enabled && Haptics.selectionAsync().catch(() => {}),
  light: () => enabled && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  medium: () => enabled && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}),
  success: () => enabled && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  warn: () => enabled && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
};
