import { useCallback } from "react";
import { useToast } from "@/components/z/toast";
import { useFocusActions, type Overview } from "@/hooks/useFocusData";
import { fmt, lateShift, toHHMM, type Session } from "@/lib/focus";
import type { DailyLog } from "@/lib/types";

/** Today's score if `s` were finished now. */
export function scoreIfDone(today: Session[], s: Session): number {
  const plan = today.reduce((a, x) => a + x.mins, 0);
  if (!plan) return 0;
  const done = today.reduce((a, x) => a + (x.key === s.key ? x.mins : x.actual), 0);
  return Math.min(100, Math.round((done / plan) * 100));
}

/** The values a patch overwrote, so it can be undone. */
function snapshot(s: Session, keys: (keyof DailyLog)[]): Partial<DailyLog> {
  const out: Partial<DailyLog> = {};
  for (const k of keys) (out as Record<string, unknown>)[k] = s.log?.[k] ?? null;
  if (keys.includes("completed")) out.completed = !!s.log?.completed;
  if (keys.includes("skipped")) out.skipped = !!s.log?.skipped;
  if (keys.includes("extra_minutes")) out.extra_minutes = s.log?.extra_minutes ?? 0;
  if (keys.includes("snoozed_count")) out.snoozed_count = s.log?.snoozed_count ?? 0;
  return out;
}

/** Writes for one block today, each with a toast and (where it helps) Undo. */
export function useBlockActions(o: Overview) {
  const { patchLog } = useFocusActions();
  const toast = useToast();

  const patch = useCallback(
    (s: Session, p: Partial<DailyLog>, opts?: { onSuccess?: () => void }) =>
      patchLog.mutate(
        { s, patch: p },
        { onSuccess: opts?.onSuccess, onError: () => toast("Couldn't save that. Check your connection.") }
      ),
    [patchLog, toast]
  );

  const undoable = useCallback(
    (s: Session, p: Partial<DailyLog>, msg: string) => {
      const prev = snapshot(s, Object.keys(p) as (keyof DailyLog)[]);
      patch(s, p);
      toast(msg, { label: "Undo", onPress: () => patch(s, prev) });
    },
    [patch, toast]
  );

  /** Marks `s` done; returns the score before and after. */
  const done = useCallback(
    (s: Session, opts?: { quiet?: boolean }) => {
      const before = o.todayScore;
      const after = scoreIfDone(o.today, s);
      const p: Partial<DailyLog> = { completed: true, skipped: false, completed_at: new Date().toISOString(), focused_minutes: s.mins };
      if (opts?.quiet) patch(s, p);
      else undoable(s, p, `${s.block.title} done. Focus Score +${Math.max(0, after - before)}`);
      return { before, after };
    },
    [o.todayScore, o.today, patch, undoable]
  );

  const skip = useCallback((s: Session, msg = "Skipped. Tomorrow's another go.") => undoable(s, { skipped: true, completed: false }, msg), [undoable]);

  const moveTo = useCallback((s: Session, to: number) => undoable(s, { planned_start: toHHMM(to) }, `Moved to ${fmt(to)}`), [undoable]);

  const note = useCallback(
    (s: Session, text: string) => patch(s, { block_note: text.trim() || null }, { onSuccess: () => toast("Note saved") }),
    [patch, toast]
  );

  const extend = useCallback((s: Session, by: number) => patch(s, { extra_minutes: s.extra + by }), [patch]);

  /** Pushes the current block's end and every later block back by 15 minutes. */
  const runningLate = useCallback(() => {
    const { cur, later } = lateShift(o.today, o.nowMin);
    const n = later.length + (cur ? 1 : 0);
    if (!n) return toast("Nothing left to move today");
    const undo: [Session, Partial<DailyLog>][] = [];
    if (cur) {
      undo.push([cur, snapshot(cur, ["extra_minutes", "snoozed_count"])]);
      patch(cur, { extra_minutes: cur.extra + 15, snoozed_count: (cur.log?.snoozed_count ?? 0) + 1 });
    }
    for (const s of later) {
      undo.push([s, snapshot(s, ["planned_start", "snoozed_count"])]);
      patch(s, { planned_start: toHHMM(s.start + 15), snoozed_count: (s.log?.snoozed_count ?? 0) + 1 });
    }
    toast(`Pushed ${n} block${n === 1 ? "" : "s"} back 15 min`, { label: "Undo", onPress: () => undo.forEach(([s, p]) => patch(s, p)) });
  }, [o.today, o.nowMin, patch, toast]);

  return { done, skip, moveTo, note, extend, runningLate, patch };
}

/** Milliseconds since the epoch for minute `min` of the day `date` ("yyyy-MM-dd"). */
export function msAt(date: string, min: number): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime() + min * 60000;
}
