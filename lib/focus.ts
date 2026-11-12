/**
 * Focus planner logic: turns recurring blocks + daily logs into sessions,
 * scores, growth, streaks and "planner that learns" suggestions. Pure functions.
 */
import { addDays, format, getDay, subDays } from "date-fns";
import { DOT_STAGES, FOCUS_TYPES, GOOD_DAY_SCORE, type FocusType } from "@/constants/focusd";
import type { DailyLog, TimetableBlock } from "@/lib/types";

/* ---------- time ---------- */
export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};
export const toHHMM = (min: number) => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};
export function fmt(min: number, ampm = true): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h % 12 || 12}:${String(mm).padStart(2, "0")}${ampm ? (h >= 12 ? " pm" : " am") : ""}`;
}
export function rangeLabel(start: number, end: number): string {
  const same = start % 1440 < 720 === end % 1440 < 720;
  return `${fmt(start, !same)} – ${fmt(end)}`;
}
export function dur(m: number): string {
  const h = Math.floor(m / 60);
  const mm = Math.round(m % 60);
  return h ? `${h} h${mm ? ` ${mm} min` : ""}` : `${mm} min`;
}
export const dateKey = (d: Date) => format(d, "yyyy-MM-dd");
export const nowMinutes = (d = new Date()) => d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;

/* ---------- focus types ---------- */
const LEGACY: Record<string, FocusType | null> = {
  homework: "study",
  school: "study",
  hobby: "hobby",
  exercise: "hobby",
  custom: "study",
  free_time: null,
  chores: null,
  wind_down: null,
  sleep: null,
  meal: null,
};

/** Focus type of a block, or null for old full-day blocks (meals, sleep…) that V1 hides. */
export function focusTypeOf(category: string): FocusType | null {
  if (category in FOCUS_TYPES) return category as FocusType;
  return category in LEGACY ? LEGACY[category] : "study";
}

export function guessType(title: string): FocusType {
  const t = title.toLowerCase();
  if (/(guitar|piano|drum|violin|drawing|paint|sport|drill|dance|sing|music|practi)/.test(t)) return "hobby";
  if (/(read|book|novel)/.test(t)) return "reading";
  if (/(cod|project|portfolio|art|writ|build|design)/.test(t)) return "project";
  return "study";
}

export function blockMinutes(b: Pick<TimetableBlock, "start_time" | "end_time">): number {
  const s = toMin(b.start_time);
  let e = toMin(b.end_time);
  if (e <= s) e += 1440;
  return e - s;
}

/* ---------- sessions ---------- */
export type SessionStatus = "todo" | "done" | "skip";

export interface Session {
  key: string;
  block: TimetableBlock;
  type: FocusType;
  date: string;
  start: number;
  end: number;
  mins: number;
  status: SessionStatus;
  /** Minutes focused when done (can be less than mins if popped early). */
  actual: number;
  log: DailyLog | null;
  moved: boolean;
}

export function sessionsOn(date: Date, blocks: TimetableBlock[], logs: DailyLog[]): Session[] {
  const key = dateKey(date);
  const dow = getDay(date);
  const logMap = new Map<string, DailyLog>();
  for (const l of logs) if (l.date === key) logMap.set(l.block_id, l);
  const out: Session[] = [];
  for (const b of blocks) {
    if (!b.days_of_week?.includes(dow)) continue;
    const type = focusTypeOf(b.category);
    if (!type) continue;
    const log = logMap.get(b.id) ?? null;
    const mins = blockMinutes(b);
    const start = log?.planned_start ? toMin(log.planned_start) : toMin(b.start_time);
    const status: SessionStatus = log?.completed ? "done" : log?.skipped ? "skip" : "todo";
    out.push({
      key: `${b.id}:${key}`,
      block: b,
      type,
      date: key,
      start,
      end: start + mins,
      mins,
      status,
      actual: status === "done" ? Math.min(mins, log?.focused_minutes ?? mins) : 0,
      log,
      moved: !!log?.planned_start && log.planned_start !== b.start_time,
    });
  }
  return out.sort((a, b) => a.start - b.start);
}

/** Today's Focus Score: minutes popped ÷ minutes planned. null on a rest day. */
export function dayScore(sessions: Session[]): number | null {
  if (!sessions.length) return null;
  const plan = sessions.reduce((a, s) => a + s.mins, 0);
  const done = sessions.reduce((a, s) => a + s.actual, 0);
  return Math.min(100, Math.round((done / plan) * 100));
}

export interface DayStat {
  date: string;
  dow: number;
  score: number | null;
  minutes: number;
  planned: number;
  sessions: Session[];
}

/** One entry per day from `days - 1` days ago to today (oldest first). */
export function dayStats(blocks: TimetableBlock[], logs: DailyLog[], today: Date, days: number, firstDay: string | null): DayStat[] {
  const out: DayStat[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(today, i);
    const key = dateKey(d);
    const before = firstDay ? key < firstDay : false;
    const ss = before ? [] : sessionsOn(d, blocks, logs);
    out.push({
      date: key,
      dow: getDay(d),
      score: before ? null : dayScore(ss),
      minutes: ss.reduce((a, s) => a + s.actual, 0),
      planned: ss.reduce((a, s) => a + s.mins, 0),
      sessions: ss,
    });
  }
  return out;
}

const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;

/**
 * Overall score: average day over the last 7 days, rest days left out. Today
 * joins mid-day only if it raises the average; otherwise once the day is over.
 */
export function overallScore(stats: DayStat[], todayOver: boolean): number {
  const today = stats[stats.length - 1];
  const prev = stats.slice(-7, -1).map((d) => d.score).filter((s): s is number => s !== null);
  const t = today?.score;
  if (!prev.length) return t ?? 0;
  const base = avg(prev);
  if (t !== null && t !== undefined && (t > base || todayOver)) return Math.round(avg([...prev, t]));
  return Math.round(base);
}

/** The same number, one week earlier (for the trend). */
export function lastWeekOverall(stats: DayStat[]): number | null {
  const prev = stats.slice(-14, -7).map((d) => d.score).filter((s): s is number => s !== null);
  return prev.length ? Math.round(avg(prev)) : null;
}

export const isGood = (score: number | null) => score !== null && score >= GOOD_DAY_SCORE;

export function goodDayCount(stats: DayStat[]): number {
  return stats.filter((d) => isGood(d.score)).length;
}

/** Good days in a row. Rest days don't break it, and today only counts once it's good. */
export function streakOf(stats: DayStat[]): number {
  let n = 0;
  for (let i = stats.length - 1; i >= 0; i--) {
    const d = stats[i];
    const isToday = i === stats.length - 1;
    if (d.score === null) continue;
    if (isGood(d.score)) n++;
    else if (isToday) continue;
    else break;
  }
  return n;
}

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 180, 365];

export function stageOf(goodDays: number) {
  let i = 0;
  DOT_STAGES.forEach((s, j) => {
    if (goodDays >= s.goodDays) i = j;
  });
  const next = DOT_STAGES[i + 1] ?? null;
  return {
    index: i,
    name: DOT_STAGES[i].name,
    next,
    progress: next ? (goodDays - DOT_STAGES[i].goodDays) / (next.goodDays - DOT_STAGES[i].goodDays) : 1,
    toNext: next ? next.goodDays - goodDays : 0,
  };
}

/** Dot's size for a number of good days: it grows a little with every good day and never shrinks. */
export function dotGrowth(goodDays: number) {
  const st = stageOf(goodDays);
  const from = DOT_STAGES[st.index].scale;
  return st.next ? from + (st.next.scale - from) * st.progress : from;
}

/* ---------- Now ---------- */
export type NowState =
  | { kind: "empty" }
  | { kind: "done" }
  | { kind: "ready"; s: Session }
  | { kind: "between"; s: Session }
  | { kind: "missed"; s: Session };

export function nowState(sessions: Session[], now: number, activeKey: string | null): NowState {
  if (!sessions.length) return { kind: "empty" };
  const todo = sessions.filter((s) => s.status === "todo");
  if (!todo.length) return { kind: "done" };
  if (activeKey) {
    const a = todo.find((s) => s.key === activeKey);
    if (a) return { kind: "ready", s: a };
  }
  const cur = todo.find((s) => s.start <= now + 10 && now < s.end);
  if (cur) return { kind: "ready", s: cur };
  const missed = todo.find((s) => s.end <= now);
  if (missed) return { kind: "missed", s: missed };
  const next = todo.find((s) => s.start > now);
  return next ? { kind: "between", s: next } : { kind: "done" };
}

/* ---------- Running late ---------- */
export interface Reshuffle {
  s: Session;
  /** New start, or null when it would run into quiet hours (skips today). */
  to: number | null;
}

export function reshuffle(sessions: Session[], now: number, lateBy: number, quietStart: number): Reshuffle[] {
  const left = sessions.filter((s) => s.status === "todo" && s.end > now);
  let prevEnd = -1;
  return left.map((s, i) => {
    let ns = i === 0 ? Math.max(s.start, now) + lateBy : Math.max(s.start, prevEnd + 10);
    ns = Math.ceil(ns / 5) * 5;
    prevEnd = ns + s.mins;
    const limit = quietStart > 12 * 60 ? quietStart : 24 * 60;
    return { s, to: prevEnd > limit ? null : ns };
  });
}

/* ---------- overlaps ---------- */
export function overlaps(
  blocks: TimetableBlock[],
  draft: { id?: string | null; start: number; mins: number; days: number[] }
): { block: TimetableBlock; day: number }[] {
  const out: { block: TimetableBlock; day: number }[] = [];
  for (const b of blocks) {
    if (b.id === draft.id || !focusTypeOf(b.category)) continue;
    const s = toMin(b.start_time);
    const e = s + blockMinutes(b);
    for (const d of draft.days) {
      if (b.days_of_week.includes(d) && draft.start < e && s < draft.start + draft.mins) {
        out.push({ block: b, day: d });
        break;
      }
    }
  }
  return out;
}

/* ---------- planner that learns ---------- */
export interface Suggestion {
  id: string;
  kind: "move" | "shorten";
  block: TimetableBlock;
  to: number;
  title: string;
  why: string;
}

interface Occurrence {
  block: TimetableBlock;
  start: number;
  done: boolean;
  actual: number;
  mins: number;
  snoozes: number;
}

function pastOccurrences(blocks: TimetableBlock[], logs: DailyLog[], today: Date, days = 28): Occurrence[] {
  const out: Occurrence[] = [];
  for (let i = 1; i <= days; i++) {
    const d = subDays(today, i);
    for (const s of sessionsOn(d, blocks, logs)) {
      out.push({
        block: s.block,
        start: s.start,
        done: s.status === "done",
        actual: s.actual,
        mins: s.mins,
        snoozes: s.log?.snoozed_count ?? 0,
      });
    }
  }
  return out;
}

export function suggestions(blocks: TimetableBlock[], logs: DailyLog[], today: Date, firstDay: string | null): Suggestion[] {
  const occ = pastOccurrences(blocks, logs, today).filter((o) => !firstDay || true);
  if (occ.length < 4) return [];
  // success rate by start time (30-min buckets)
  const buckets = new Map<number, { n: number; ok: number }>();
  for (const o of occ) {
    const k = Math.floor(o.start / 30) * 30;
    const b = buckets.get(k) ?? { n: 0, ok: 0 };
    b.n++;
    if (o.done) b.ok++;
    buckets.set(k, b);
  }
  const good = [...buckets.entries()]
    .filter(([, b]) => b.n >= 3 && b.ok / b.n >= 0.7)
    .sort((a, b) => b[1].ok / b[1].n - a[1].ok / a[1].n);
  const out: Suggestion[] = [];
  for (const block of blocks) {
    if (!focusTypeOf(block.category)) continue;
    const mine = occ.filter((o) => o.block.id === block.id);
    if (mine.length < 2) continue;
    const missed = mine.filter((o) => !o.done).length;
    const start = toMin(block.start_time);
    const mins = blockMinutes(block);
    if (missed >= 2 && missed / mine.length >= 0.5) {
      for (const [to, b] of good) {
        if (Math.abs(to - start) < 60) continue;
        if (overlaps(blocks, { id: block.id, start: to, mins, days: block.days_of_week }).length) continue;
        out.push({
          id: `move:${block.id}:${to}`,
          kind: "move",
          block,
          to,
          title: `Move ${block.title} to ${fmt(to)}`,
          why: `You've missed it ${missed} of the last ${mine.length} times at ${fmt(start)}, but you pop ${Math.round((b.ok / b.n) * 100)}% of sessions around ${fmt(to)}.`,
        });
        break;
      }
    }
    const done = mine.filter((o) => o.done && o.actual > 0);
    if (done.length >= 2) {
      const a = avg(done.map((o) => o.actual));
      if (a <= mins * 0.75 && mins - a >= 10) {
        const to = Math.max(15, Math.round(a / 5) * 5);
        out.push({
          id: `shorten:${block.id}:${to}`,
          kind: "shorten",
          block,
          to,
          title: `${block.title}: ${mins} → ${to} min`,
          why: `You usually pop it after about ${Math.round(a)} minutes.`,
        });
      }
    }
  }
  return out;
}

export interface SlipReport {
  lines: string[];
}

export function slipReport(blocks: TimetableBlock[], logs: DailyLog[], today: Date): SlipReport {
  const occ = pastOccurrences(blocks, logs, today, 14);
  const lines: string[] = [];
  const byBlock = new Map<string, { title: string; start: number; miss: number }>();
  for (const o of occ) {
    if (o.done) continue;
    const e = byBlock.get(o.block.id) ?? { title: o.block.title, start: o.start, miss: 0 };
    e.miss++;
    byBlock.set(o.block.id, e);
  }
  const worst = [...byBlock.values()].sort((a, b) => b.miss - a.miss)[0];
  if (worst && worst.miss >= 2) lines.push(`${worst.title} around ${fmt(worst.start)} slipped ${worst.miss} times.`);
  const snoozes = occ.reduce((a, o) => a + o.snoozes, 0);
  if (snoozes >= 2) lines.push(`You hit Running late ${snoozes} times.`);
  const byHour = new Map<number, { n: number; ok: number }>();
  for (const o of occ) {
    const h = Math.floor(o.start / 60);
    const b = byHour.get(h) ?? { n: 0, ok: 0 };
    b.n++;
    if (o.done) b.ok++;
    byHour.set(h, b);
  }
  const best = [...byHour.entries()].filter(([, b]) => b.n >= 3).sort((a, b) => b[1].ok / b[1].n - a[1].ok / a[1].n)[0];
  if (best) lines.push(`Sessions around ${fmt(best[0] * 60)} get popped ${Math.round((best[1].ok / best[1].n) * 100)}% of the time.`);
  return { lines };
}

/* ---------- onboarding plan ---------- */
export const FOCUS_GROUPS: [string, string[]][] = [
  ["School and uni", ["Maths", "Science", "English", "History", "Languages", "Exam revision"]],
  ["Projects", ["Coding", "Art project", "Writing", "Portfolio"]],
  ["Hobbies to practise", ["Guitar", "Piano", "Drawing", "Sport drills", "Reading"]],
];

export const FREE_WINDOWS: { id: string; label: string; time: string; weekend: boolean; slots: number[] }[] = [
  { id: "before", label: "Before school or work", time: "7 – 8 am", weekend: false, slots: [7 * 60] },
  { id: "after", label: "After school or work", time: "4 – 6 pm", weekend: false, slots: [16 * 60, 17 * 60 + 30] },
  { id: "evening", label: "Evenings", time: "6 – 9 pm", weekend: false, slots: [18 * 60 + 30, 19 * 60 + 45] },
  { id: "late", label: "Late", time: "9 – 11 pm", weekend: false, slots: [21 * 60] },
  { id: "we_morning", label: "Mornings", time: "10 am – 12", weekend: true, slots: [10 * 60, 11 * 60 + 30] },
  { id: "we_afternoon", label: "Afternoons", time: "2 – 5 pm", weekend: true, slots: [14 * 60, 15 * 60 + 30] },
  { id: "we_evening", label: "Evenings", time: "6 – 9 pm", weekend: true, slots: [18 * 60 + 30, 19 * 60 + 45] },
];

export interface ChallengeOption {
  id: string;
  label: string;
  hint: string;
  /** If-then plan shown when a session starts. */
  plan: string;
  /** Starting values for sessions a day / length, picked to suit the challenge. */
  defaults: { perDay?: number; len?: number };
}

export const CHALLENGE_OPTIONS: ChallengeOption[] = [
  {
    id: "starting",
    label: "Getting started",
    hint: "I put it off until it's late",
    plan: "If I'm stalling, I start with just 5 minutes.",
    defaults: { len: 25 },
  },
  {
    id: "phone",
    label: "My phone",
    hint: "I pick it up without thinking",
    plan: "If I reach for my phone, I put it in another room.",
    defaults: {},
  },
  {
    id: "focus",
    label: "Staying focused",
    hint: "My mind wanders halfway",
    plan: "If my mind wanders, I jot the thought down and come back.",
    defaults: { len: 25 },
  },
  {
    id: "overwhelm",
    label: "Too much to do",
    hint: "I don't know where to begin",
    plan: "If it feels like too much, I pick one small thing for this balloon.",
    defaults: { perDay: 2 },
  },
  {
    id: "forgetting",
    label: "Forgetting",
    hint: "I lose track of the plan",
    plan: "If Dot nudges me, I start before I do anything else.",
    defaults: {},
  },
];

export const challengeOf = (id: string | null | undefined) => CHALLENGE_OPTIONS.find((c) => c.id === id) ?? null;

export interface PlannedBlock {
  title: string;
  category: FocusType;
  start_time: string;
  end_time: string;
  days_of_week: number[];
}

/** Builds a week of 2–4 focus sessions a day inside the chosen free windows. */
export function generatePlan(o: { focus: string[]; free: string[]; perDay: number; len: number }): PlannedBlock[] {
  const focus = o.focus.length ? o.focus : ["Focus time"];
  const byDay: { dow: number; title: string; type: FocusType; start: number; mins: number }[] = [];
  let k = 0;
  // Mon..Sun as JS days
  [1, 2, 3, 4, 5, 6, 0].forEach((dow, i) => {
    const weekend = i >= 5;
    const slots = FREE_WINDOWS.filter((w) => w.weekend === weekend && o.free.includes(w.id))
      .flatMap((w) => w.slots)
      .sort((a, b) => a - b);
    if (!slots.length) return;
    const n = Math.min(weekend ? Math.max(1, o.perDay - 1) : o.perDay, slots.length);
    const pick = new Set<number>();
    for (let j = 0; j < n; j++) pick.add(slots[Math.round((j * (slots.length - 1)) / Math.max(1, n - 1))]);
    for (const st of pick) {
      const f = focus[k++ % focus.length];
      const type = guessType(f);
      const title = type === "hobby" && !/practi/i.test(f) ? `${f} practice` : type === "study" ? `${f}${i % 2 ? " revision" : " homework"}` : f;
      byDay.push({ dow, title, type, start: st, mins: type === "hobby" ? Math.min(30, o.len) : o.len });
    }
  });
  const merged = new Map<string, PlannedBlock>();
  for (const b of byDay) {
    const key = `${b.title}|${b.start}|${b.mins}`;
    const m = merged.get(key);
    if (m) m.days_of_week.push(b.dow);
    else
      merged.set(key, {
        title: b.title,
        category: b.type,
        start_time: toHHMM(b.start),
        end_time: toHHMM(b.start + b.mins),
        days_of_week: [b.dow],
      });
  }
  return [...merged.values()];
}

export const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
/** Monday-first index → JS day (0 = Sunday). */
export const MON_FIRST = [1, 2, 3, 4, 5, 6, 0];

export function weekDates(today: Date): Date[] {
  const js = getDay(today);
  const mondayOffset = js === 0 ? 6 : js - 1;
  const monday = subDays(today, mondayOffset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}
