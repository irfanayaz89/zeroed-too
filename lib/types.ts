export interface Profile {
  id: string;
  name: string | null;
  age?: number | null;
  focus_struggle: string | null;
  onboarding_complete: boolean;
  focus_areas?: string[] | null;
  free_times?: string[] | null;
  sessions_per_day?: number | null;
  session_length?: number | null;
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
  reminder_minutes_before?: number | null;
  reminder_style?: string | null;
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
  /** Today's start after "Running late" or "Move to later today" (HH:MM). */
  planned_start?: string | null;
  /** Minutes added today with "+5 min" or "Running late". */
  extra_minutes?: number | null;
  started_at?: string | null;
  /** Minutes that count toward the Focus Score. */
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
