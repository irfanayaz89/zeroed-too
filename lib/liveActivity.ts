import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  startActivity,
  stopActivity,
  updateActivity,
  type LiveActivityConfig,
} from "expo-live-activity";
import { LIVE_ACTIVITY_COLORS as liveActivityColors } from "@/constants/theme";

const ACTIVITY_ID_KEY = "zeroed_live_activity_id";

const activityConfig: LiveActivityConfig = {
  backgroundColor: liveActivityColors.background,
  titleColor: liveActivityColors.title,
  subtitleColor: liveActivityColors.subtitle,
  progressViewTint: liveActivityColors.progressTint,
  progressViewLabelColor: liveActivityColors.progressLabel,
  deepLinkUrl: "/",
  timerType: "digital",
  padding: { horizontal: 20, vertical: 16 },
};

export interface BlockActivityContent {
  title: string;
  subtitle: string;
  /** When the countdown reaches zero (ms). */
  endsAtMs: number;
}

/** Missing in Expo Go, on web and on Android. */
const isSupported =
  Platform.OS === "ios" && !!requireOptionalNativeModule("ExpoLiveActivity");

/** null = no activity; undefined = not read from storage yet. */
let activityId: string | null | undefined;
let queue: Promise<void> = Promise.resolve();

function enqueue(task: () => Promise<void>): Promise<void> {
  queue = queue
    .then(task)
    .catch((e) => console.warn("Live Activity update failed:", e));
  return queue;
}

/** The activity outlives the app process, so its id is kept across launches. */
async function loadActivityId(): Promise<string | null> {
  if (activityId === undefined) {
    activityId = await AsyncStorage.getItem(ACTIVITY_ID_KEY);
  }
  return activityId;
}

async function saveActivityId(id: string | null): Promise<void> {
  activityId = id;
  if (id) await AsyncStorage.setItem(ACTIVITY_ID_KEY, id);
  else await AsyncStorage.removeItem(ACTIVITY_ID_KEY);
}

function toActivityState({ title, subtitle, endsAtMs }: BlockActivityContent) {
  return {
    title,
    subtitle,
    progressBar: { date: endsAtMs },
    dynamicIslandImageName: "zeroed_icon",
  };
}

/** Updates the running activity, or starts one. Must run with the app active. */
export function showBlockActivity(content: BlockActivityContent): Promise<void> {
  if (!isSupported) return Promise.resolve();
  return enqueue(async () => {
    const state = toActivityState(content);
    const id = await loadActivityId();
    if (id) {
      try {
        updateActivity(id, state);
        return;
      } catch {
        // Ended by the system or dismissed by the user: start a new one.
      }
    }
    await saveActivityId(startActivity(state, activityConfig) ?? null);
  });
}

export function endBlockActivity(): Promise<void> {
  if (!isSupported) return Promise.resolve();
  return enqueue(async () => {
    const id = await loadActivityId();
    if (!id) return;
    await saveActivityId(null);
    stopActivity(id, { title: "Zeroed" });
  });
}
