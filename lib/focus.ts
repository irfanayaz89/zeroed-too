/**
 * Focus planner logic: turns recurring blocks + daily logs into today's
 * blocks, Focus Scores, streaks and "better time" suggestions. Pure functions.
 *
 * Blocks run on the clock: a block is "now" from its start to its end, and
 * the countdown counts down to its end.
 */
import { addDays, format, getDay, subDays } from "date-fns";
import { CATEGORIES, GOOD_DAY_SCORE, type CategoryId } from "@/constants/theme";
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
/** "2:30 PM" */
export function fmt(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  return `${h % 12 || 12}:${String(m % 60).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
/** "2pm", "2:30pm" (the Plan time column). */
export function fmtShort(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h % 12 || 12}${mm ? `:${String(mm).padStart(2, "0")}` : ""}${h >= 12 ? "pm" : "am"}`;
}
export const rangeLabel = (start: number, end: number) => `${fmt(start)} – ${fmt(end)}`;
/** "45 min", "1h 30m" */
export function dur(m: number): string {
  const r = Math.round(m);
  const h = Math.floor(r / 60);
  const mm = r % 60;
  return h ? `${h}h${mm ? ` ${mm}m` : ""}` : `${mm} min`;
}
/** "in 1h 22m", "in 5 min", "now" */
export function untilText(min: number): string {
  const m = Math.ceil(min);
  return m <= 0 ? "now" : `in ${dur(m)}`;
}
export const dateKey = (d: Date) => format(d, "yyyy-MM-dd");
export const nowMinutes = (d = new Date()) => d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60 + d.getMilliseconds() / 60000;

/* ---------- categories ---------- */
const LEGACY: Record<string, CategoryId> = {
  study: "learning",
  reading: "learning",
  homework: "learning",
  school: "learning",
  project: "side",
  hobby: "personal",
  exercise: "health",
};

export function categoryOf(category: string): CategoryId {
  if (category in CATEGORIES) return category as CategoryId;
  return LEGACY[category] ?? "work";
}

export function guessCategory(title: string): CategoryId {
  const t = title.toLowerCase();
  if (/(gym|run|yoga|workout|walk|swim|stretch|lift|cycle|tennis|climb|pilates)/.test(t)) return "health";
  if (/(spanish|french|german|language|course|study|learn|read|book|lesson|practice|class|exam)/.test(t)) return "learning";
  if (/(side|startup|app|blog|podcast|newsletter|portfolio|music|paint|draw|guitar|piano)/.test(t)) return "side";
  if (/(journal|budget|admin|tax|tidy|clean|errand|meal|plan the week|family|call)/.test(t)) return "personal";
  return "work";
}

export function blockMinutes(b: Pick<TimetableBlock, "start_time" | "end_time">): number {
  const s = toMin(b.start_time);
  let e = toMin(b.end_time);
  if (e <= s) e += 1440;
  return e - s;
}

/* ---------- sessions (one block on one day) ---------- */
export type SessionStatus = "todo" | "done" | "skip";

export interface Session {
  key: string;
  block: TimetableBlock;
  cat: CategoryId;
  date: string;
  start: number;
  end: number;
  /** Planned minutes today, including any "+5 min" or "Running late" extension. */
  mins: number;
  extra: number;
  status: SessionStatus;
  /** Minutes that count toward the Focus Score (0 unless done). */
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
    const log = logMap.get(b.id) ?? null;
    const extra = Math.max(0, log?.extra_minutes ?? 0);
    const mins = blockMinutes(b) + extra;
    const start = log?.planned_start ? toMin(log.planned_start) : toMin(b.start_time);
    const status: SessionStatus = log?.completed ? "done" : log?.skipped ? "skip" : "todo";
    out.push({
      key: `${b.id}:${key}`,
      block: b,
      cat: categoryOf(b.category),
      date: key,
      start,
      end: start + mins,
      mins,
      extra,
      status,
      actual: status === "done" ? Math.min(mins, log?.focused_minutes ?? mins) : 0,
      log,
      moved: !!log?.planned_start && log.planned_start !== b.start_time,
    });
  }
  return out.sort((a, b) => a.start - b.start);
}

/** Today's Focus Score: finished minutes ÷ planned minutes. null on a rest day. */
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
 * 7-day score: the average day over the last 7 days, rest days left out.
 * Today joins mid-day only if it raises the average; otherwise once the day is over.
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

export const isGood = (score: number | null) => score !== null && score >= GOOD_DAY_SCORE;

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

/* ---------- Now ---------- */
export type NowState =
  | { kind: "empty" }
  | { kind: "done" }
  /** A block is running. `ended` is an earlier block nobody confirmed. */
  | { kind: "block"; s: Session; next: Session | null; ended: Session | null }
  /** Between blocks. `s` is the next block (if any), counting down from `gapStart`. */
  | { kind: "gap"; s: Session | null; next: Session | null; ended: Session | null; gapStart: number };

export function nowState(sessions: Session[], now: number): NowState {
  if (!sessions.length) return { kind: "empty" };
  const todo = sessions.filter((s) => s.status === "todo");
  if (!todo.length) return { kind: "done" };
  const ended = todo.filter((s) => s.end <= now).pop() ?? null;
  const cur = todo.find((s) => s.start <= now && now < s.end) ?? null;
  const upcoming = todo.filter((s) => s.start > now);
  if (cur) return { kind: "block", s: cur, next: upcoming[0] ?? null, ended };
  const next = upcoming[0] ?? null;
  if (!next && !ended) return { kind: "done" };
  let gapStart = now;
  if (next) {
    const prev = sessions.filter((x) => x.end <= next.start && x.end <= now).pop();
    gapStart = prev ? prev.end : Math.min(next.start - 60, now);
  }
  return { kind: "gap", s: next, next: next ? (upcoming[1] ?? null) : null, ended, gapStart };
}

/** Next free 15-minute slot today for a block of `mins`, or null if the day is full. */
export function freeSlot(sessions: Session[], mins: number, now: number, exceptKey?: string): number | null {
  const others = sessions.filter((s) => s.key !== exceptKey && s.status !== "skip");
  let t = Math.ceil((now + 15) / 15) * 15;
  while (t + mins <= 24 * 60) {
    if (!others.some((o) => t < o.end && t + mins > o.start)) return t;
    t += 15;
  }
  return null;
}

/** The block that stops `s` from running `by` minutes longer, if any. */
export function extendBlocker(sessions: Session[], s: Session, by: number): Session | null {
  return sessions.find((x) => x.key !== s.key && x.status !== "skip" && x.start >= s.end - 0.01 && x.start < s.end + by) ?? null;
}

/** "Running late": the current block ends later and every block after it moves back. */
export function lateShift(sessions: Session[], now: number) {
  const cur = sessions.find((s) => s.status === "todo" && s.start <= now && now < s.end) ?? null;
  const later = sessions.filter((s) => s.status === "todo" && s.start > now);
  return { cur, later };
}

/* ---------- overlaps (add / edit) ---------- */
export function overlaps(
  blocks: TimetableBlock[],
  draft: { id?: string | null; start: number; mins: number; days: number[] }
): { block: TimetableBlock; day: number }[] {
  const out: { block: TimetableBlock; day: number }[] = [];
  for (const b of blocks) {
    if (b.id === draft.id) continue;
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

/* ---------- learning from the last few weeks ---------- */
interface Occurrence {
  block: TimetableBlock;
  start: number;
  done: boolean;
  mins: number;
  late: number;
}

function pastOccurrences(blocks: TimetableBlock[], logs: DailyLog[], today: Date, days: number, firstDay: string | null): Occurrence[] {
  const out: Occurrence[] = [];
  for (let i = 1; i <= days; i++) {
    const d = subDays(today, i);
    if (firstDay && dateKey(d) < firstDay) break;
    for (const s of sessionsOn(d, blocks, logs)) {
      out.push({ block: s.block, start: s.start, done: s.status === "done", mins: s.mins, late: s.log?.snoozed_count ?? 0 });
    }
  }
  return out;
}

const rate = (list: Occurrence[]) => (list.length ? list.filter((o) => o.done).length / list.length : 0);
const pct = (r: number) => Math.round(r * 100);

export interface Suggestion {
  id: string;
  block: TimetableBlock;
  from: number;
  to: number;
  /** Completion rate around `to` and around `from`, 0–100. */
  rateTo: number;
  rateFrom: number;
}

/** "Better time": blocks that keep slipping, and a time of day where you usually finish. */
export function suggestions(blocks: TimetableBlock[], logs: DailyLog[], today: Date, firstDay: string | null): Suggestion[] {
  const occ = pastOccurrences(blocks, logs, today, 28, firstDay);
  if (occ.length < 6) return [];
  const buckets = new Map<number, Occurrence[]>();
  for (const o of occ) {
    const k = Math.floor(o.start / 30) * 30;
    buckets.set(k, [...(buckets.get(k) ?? []), o]);
  }
  const good = [...buckets.entries()]
    .filter(([, l]) => l.length >= 3 && rate(l) >= 0.7)
    .sort((a, b) => rate(b[1]) - rate(a[1]));
  const out: Suggestion[] = [];
  for (const block of blocks) {
    const mine = occ.filter((o) => o.block.id === block.id);
    if (mine.length < 3) continue;
    const r = rate(mine);
    if (r > 0.5) continue;
    const from = toMin(block.start_time);
    const mins = blockMinutes(block);
    for (const [to, l] of good) {
      if (Math.abs(to - from) < 60) continue;
      if (overlaps(blocks, { id: block.id, start: to, mins, days: block.days_of_week }).length) continue;
      out.push({ id: `move:${block.id}:${to}`, block, from, to, rateTo: pct(rate(l)), rateFrom: pct(r) });
      break;
    }
  }
  return out;
}

export interface SlipRow {
  label: string;
  detail: string;
  rate: number;
}

const BANDS: { label: string; from: number; to: number }[] = [
  { label: "Blocks before noon", from: 0, to: 12 * 60 },
  { label: "Blocks from noon to 5 pm", from: 12 * 60, to: 17 * 60 },
  { label: "Blocks from 5 to 8 pm", from: 17 * 60, to: 20 * 60 },
  { label: "Blocks after 8 pm", from: 20 * 60, to: 24 * 60 },
];

/** "What slips": completion by time of day and the block that slips most (last 4 weeks). */
export function slipRows(blocks: TimetableBlock[], logs: DailyLog[], today: Date, firstDay: string | null): SlipRow[] {
  const occ = pastOccurrences(blocks, logs, today, 28, firstDay);
  const rows: SlipRow[] = [];
  for (const b of BANDS) {
    const l = occ.filter((o) => o.start >= b.from && o.start < b.to);
    if (l.length >= 3) rows.push({ label: b.label, detail: `${pct(rate(l))}% done`, rate: rate(l) });
  }
  const byBlock = new Map<string, Occurrence[]>();
  for (const o of occ) byBlock.set(o.block.id, [...(byBlock.get(o.block.id) ?? []), o]);
  const worst = [...byBlock.values()].filter((l) => l.length >= 3).sort((a, b) => rate(a) - rate(b))[0];
  if (worst && rate(worst) < 0.6) {
    const done = worst.filter((o) => o.done).length;
    rows.push({ label: worst[0].block.title, detail: `${done} of ${worst.length} done`, rate: rate(worst) });
  }
  return rows.sort((a, b) => a.rate - b.rate).slice(0, 4);
}

export interface WindowStat {
  label: string;
  rate: number;
}

/** The 2-hour window where blocks most often get finished. */
export function bestWindow(blocks: TimetableBlock[], logs: DailyLog[], today: Date, firstDay: string | null): WindowStat | null {
  const occ = pastOccurrences(blocks, logs, today, 28, firstDay);
  let best: WindowStat | null = null;
  for (let h = 5; h <= 21; h++) {
    const l = occ.filter((o) => o.start >= h * 60 && o.start < (h + 2) * 60);
    if (l.length < 3) continue;
    const r = rate(l);
    if (!best || r > best.rate) best = { label: hourRange(h, h + 2), rate: r };
  }
  return best;
}

function hourRange(a: number, b: number) {
  const h12 = (h: number) => h % 12 || 12;
  const ap = (h: number) => (h % 24 >= 12 ? "pm" : "am");
  return ap(a) === ap(b) ? `${h12(a)}–${h12(b)} ${ap(b)}` : `${h12(a)} ${ap(a)}–${h12(b)} ${ap(b)}`;
}

/** Average length of finished blocks over the last 4 weeks. */
export function avgBlockMinutes(blocks: TimetableBlock[], logs: DailyLog[], today: Date, firstDay: string | null): number | null {
  const done = pastOccurrences(blocks, logs, today, 28, firstDay).filter((o) => o.done);
  return done.length ? Math.round(avg(done.map((o) => o.mins))) : null;
}

/** Next week's plan, as the recurring blocks lay it out. */
export function weekPlan(blocks: TimetableBlock[]) {
  let count = 0;
  let minutes = 0;
  for (const b of blocks) {
    count += b.days_of_week.length;
    minutes += b.days_of_week.length * blockMinutes(b);
  }
  return { count, minutes };
}

/* ---------- onboarding plan ---------- */
export const FOCUS_GROUPS: [CategoryId, string[]][] = [
  ["work", ["Deep work", "Writing", "Planning", "Inbox and admin"]],
  ["learning", ["A language", "An online course", "Reading"]],
  ["health", ["Workout", "Run", "Yoga"]],
  ["personal", ["Journaling", "Budget and bills", "Life admin"]],
  ["side", ["Side project", "Coding", "Music practice"]],
];

export function categoryForFocus(f: string): CategoryId {
  for (const [cat, items] of FOCUS_GROUPS) if (items.includes(f)) return cat;
  return guessCategory(f);
}

export const FREE_WINDOWS: { id: string; label: string; time: string; weekend: boolean; slots: number[] }[] = [
  { id: "early", label: "Early morning", time: "6–8 am", weekend: false, slots: [6 * 60 + 30] },
  { id: "morning", label: "Morning", time: "9 am–12", weekend: false, slots: [9 * 60, 10 * 60 + 30] },
  { id: "lunch", label: "Lunch", time: "12–1 pm", weekend: false, slots: [12 * 60 + 15] },
  { id: "afternoon", label: "Afternoon", time: "1–5 pm", weekend: false, slots: [14 * 60, 15 * 60 + 30] },
  { id: "evening", label: "Evening", time: "6–9 pm", weekend: false, slots: [18 * 60 + 30, 19 * 60 + 45] },
  { id: "late", label: "Late", time: "9–11 pm", weekend: false, slots: [21 * 60] },
  { id: "we_morning", label: "Mornings", time: "9 am–12", weekend: true, slots: [9 * 60 + 30, 11 * 60] },
  { id: "we_afternoon", label: "Afternoons", time: "1–5 pm", weekend: true, slots: [14 * 60, 15 * 60 + 30] },
  { id: "we_evening", label: "Evenings", time: "6–9 pm", weekend: true, slots: [18 * 60 + 30] },
];

export interface ChallengeOption {
  id: string;
  label: string;
  hint: string;
  /** If-then plan shown when a block starts. */
  plan: string;
  /** Starting values for blocks a day / block length, picked to suit the challenge. */
  defaults: { perDay?: number; len?: number };
}

export const CHALLENGE_OPTIONS: ChallengeOption[] = [
  { id: "starting", label: "Getting started", hint: "I put things off until they're urgent", plan: "If I'm stalling, I do five minutes and decide after.", defaults: { len: 25 } },
  { id: "phone", label: "My phone", hint: "I pick it up without thinking", plan: "If I reach for my phone, it goes in another room.", defaults: {} },
  { id: "meetings", label: "Interruptions", hint: "Messages and meetings eat the day", plan: "If someone pings me, I reply after the block ends.", defaults: { len: 45 } },
  { id: "overwhelm", label: "Too much on", hint: "I don't know where to begin", plan: "If it feels like too much, I pick one small piece for this block.", defaults: { perDay: 2 } },
  { id: "energy", label: "Low energy", hint: "I run out of steam by the afternoon", plan: "If I'm flagging, I stand up, drink water and start again.", defaults: { len: 25 } },
];

export const challengeOf = (id: string | null | undefined) => CHALLENGE_OPTIONS.find((c) => c.id === id) ?? null;

export interface PlannedBlock {
  title: string;
  category: CategoryId;
  start_time: string;
  end_time: string;
  days_of_week: number[];
}

/** Builds a week of 2–4 focus blocks a day inside the chosen free windows. */
export function generatePlan(o: { focus: string[]; free: string[]; perDay: number; len: number }): PlannedBlock[] {
  const focus = o.focus.length ? o.focus : ["Deep work"];
  const byDay: { dow: number; title: string; cat: CategoryId; start: number; mins: number }[] = [];
  let k = 0;
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
      const title = focus[k++ % focus.length];
      const cat = categoryForFocus(title);
      byDay.push({ dow, title, cat, start: st, mins: cat === "health" ? Math.min(45, o.len) : o.len });
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
        category: b.cat,
        start_time: toHHMM(b.start),
        end_time: toHHMM(b.start + b.mins),
        days_of_week: [b.dow],
      });
  }
  return [...merged.values()];
}

export const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const FULL_DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
/** Monday-first index → JS day (0 = Sunday). */
export const MON_FIRST = [1, 2, 3, 4, 5, 6, 0];

export function weekDates(today: Date): Date[] {
  const js = getDay(today);
  const monday = subDays(today, js === 0 ? 6 : js - 1);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function greeting(d: Date) {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
