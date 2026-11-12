import { categoryColors } from "@/constants/theme/semantic";

export interface Profile {
  id: string;
  name: string | null;
  age_group: string | null;
  hobbies: string[] | null;
  focus_struggle: string | null;
  onboarding_complete: boolean;
  /** Focus planner fields (migration 20261111000000_focus_planner.sql). */
  age?: number | null;
  focus_areas?: string[] | null;
  free_times?: string[] | null;
  sessions_per_day?: number | null;
  session_length?: number | null;
  buddy_name?: string | null;
  created_at?: string | null;
}

export interface TimetableBlock {
  id: string;
  user_id: string;
  title: string;
  category: string;
  start_time: string;
  end_time: string;
  days_of_week: number[];
  reminder_enabled: boolean;
  reminder_minutes_before?: number;
  reminder_style?: string;
  /** Optional note placeholder for this block (if stored on block). */
  notes_template?: string | null;
}

export interface DailyLog {
  id: string;
  user_id: string;
  block_id: string;
  date: string;
  completed: boolean;
  skipped?: boolean;
  snoozed_count?: number;
  block_note?: string | null;
  completed_at?: string | null;
  /** Today's start after a "Running late" reshuffle (HH:MM). */
  planned_start?: string | null;
  started_at?: string | null;
  /** Minutes actually focused (popping early counts what was done). */
  focused_minutes?: number | null;
}

export type Mood = "great" | "good" | "okay" | "meh" | "rough";

export interface DailyReflection {
  id: string;
  user_id: string;
  date: string;
  mood: Mood | null;
  note?: string | null;
  created_at?: string | null;
}

export type AgeGroup = "kid" | "teen" | "young_adult";

export type Category =
  | "school"
  | "homework"
  | "hobby"
  | "free_time"
  | "chores"
  | "exercise"
  | "wind_down"
  | "sleep"
  | "meal"
  | "custom";

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "school", label: "School" },
  { id: "homework", label: "Homework" },
  { id: "hobby", label: "Hobby" },
  { id: "free_time", label: "Free Time" },
  { id: "chores", label: "Chores" },
  { id: "exercise", label: "Exercise" },
  { id: "wind_down", label: "Wind Down" },
  { id: "sleep", label: "Sleep" },
  { id: "meal", label: "Meal" },
  { id: "custom", label: "Custom" },
];

export const HOBBIES = [
  "Drawing",
  "Reading",
  "Gaming",
  "Sports",
  "Music",
  "Coding",
  "Cooking",
  "Photography",
  "Writing",
  "Dance",
  "Skateboarding",
  "Puzzles",
  "Yoga",
  "Other",
] as const;

export const HOBBY_ICONS: Record<string, { family: string; name: string }> = {
  Drawing: { family: "Ionicons", name: "brush" },
  Reading: { family: "Ionicons", name: "book" },
  Gaming: { family: "Ionicons", name: "game-controller" },
  Sports: { family: "Ionicons", name: "football" },
  Music: { family: "Ionicons", name: "musical-notes" },
  Coding: { family: "Ionicons", name: "code-slash" },
  Cooking: { family: "Ionicons", name: "restaurant" },
  Photography: { family: "Ionicons", name: "camera" },
  Writing: { family: "Ionicons", name: "pencil" },
  Dance: { family: "Ionicons", name: "body" },
  Skateboarding: { family: "MaterialCommunityIcons", name: "skateboard" },
  Puzzles: { family: "Ionicons", name: "extension-puzzle" },
  Yoga: { family: "MaterialCommunityIcons", name: "yoga" },
  Other: { family: "Ionicons", name: "add" },
};

export const CHALLENGES = [
  { id: "homework", label: "Homework", icon: "book" },
  { id: "chores", label: "Chores", icon: "home" },
  { id: "screen_time", label: "Screen Time", icon: "phone-portrait" },
  { id: "sleep", label: "Sleep", icon: "moon" },
  { id: "everything", label: "Everything", icon: "infinite" },
] as const;

export const AGE_GROUPS = [
  { id: "kid" as AgeGroup, label: "Kid", range: "8-12" },
  { id: "teen" as AgeGroup, label: "Teen", range: "13-17" },
  { id: "young_adult" as AgeGroup, label: "Young Adult", range: "18-25" },
] as const;

export const DAY_LABELS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;
export const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0] as const;

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function getCategoryColor(category: string): string {
  return categoryColors[category] || categoryColors.custom;
}

/** Category display label for block detail (e.g. "Homework & Study"). */
export function getCategoryDisplayLabel(category: string): string {
  const c = CATEGORIES.find((x) => x.id === category);
  return c ? c.label : category.replace(/_/g, " ");
}

/** Note input placeholder by category for block detail sheet. */
export function getNotePlaceholder(category: string): string {
  switch (category) {
    case "homework":
      return "What did you work on?";
    case "exercise":
      return "How did it go?";
    case "hobby":
      return "What did you create or try?";
    default:
      return "How did this block go?";
  }
}
