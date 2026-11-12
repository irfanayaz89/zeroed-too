import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { DailyLog, DailyReflection, Mood, Profile, TimetableBlock } from "@/lib/types";
import {
  dateKey,
  dayStats,
  goodDayCount,
  lastWeekOverall,
  nowMinutes,
  overallScore,
  sessionsOn,
  stageOf,
  streakOf,
  type Session,
} from "@/lib/focus";

const LOOKBACK = 120;

export function useBlocks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["blocks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("timetable_blocks").select("*").eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []) as TimetableBlock[];
    },
  });
}

export function useLogs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["logs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user!.id)
        .gte("date", dateKey(subDays(new Date(), LOOKBACK)));
      if (error) throw error;
      return (data ?? []) as DailyLog[];
    },
  });
}

export function useReflections() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["reflections", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_reflections")
        .select("*")
        .eq("user_id", user!.id)
        .gte("date", dateKey(subDays(new Date(), 30)));
      if (error) throw error;
      return (data ?? []) as DailyReflection[];
    },
  });
}

/** A clock that ticks every `ms`. */
export function useNow(ms = 15000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/** Everything the tabs need, computed from blocks + logs. */
export function useFocusOverview() {
  const blocksQ = useBlocks();
  const logsQ = useLogs();
  const reflQ = useReflections();
  const now = useNow();
  const { profile } = useAuth();
  const blocks = useMemo(() => blocksQ.data ?? [], [blocksQ.data]);
  const logs = useMemo(() => logsQ.data ?? [], [logsQ.data]);
  const todayKey = dateKey(now);

  return useMemo(() => {
    const firstLog = logs.reduce<string | null>((m, l) => (!m || l.date < m ? l.date : m), null);
    const created = profile?.created_at ? dateKey(new Date(profile.created_at)) : null;
    const firstDay = [firstLog, created, todayKey].filter(Boolean).sort()[0] as string;
    const stats = dayStats(blocks, logs, now, 60, firstDay);
    const today = sessionsOn(now, blocks, logs);
    const todayStat = stats[stats.length - 1];
    const todayOver = today.length > 0 && !today.some((s) => s.status === "todo");
    const good = goodDayCount(stats);
    const reflections = reflQ.data ?? [];
    return {
      loading: blocksQ.isLoading || logsQ.isLoading,
      error: blocksQ.error || logsQ.error,
      now,
      nowMin: nowMinutes(now),
      blocks,
      logs,
      stats,
      firstDay,
      today,
      todayScore: todayStat.score ?? 0,
      restDay: todayStat.score === null,
      overall: overallScore(stats, todayOver),
      lastWeek: lastWeekOverall(stats),
      best: Math.max(0, ...stats.map((d) => d.score ?? 0)),
      goodDays: good,
      stage: stageOf(good),
      streak: streakOf(stats),
      reflections,
      todayReflection: reflections.find((r) => r.date === todayKey) ?? null,
      refetch: () => Promise.all([blocksQ.refetch(), logsQ.refetch(), reflQ.refetch()]),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks, logs, reflQ.data, todayKey, Math.floor(now.getTime() / 60000), profile?.created_at, blocksQ.isLoading, logsQ.isLoading]);
}

export type Overview = ReturnType<typeof useFocusOverview>;

/** Writes for sessions, blocks, reflections and the profile. Keeps the cache in step. */
export function useFocusActions() {
  const qc = useQueryClient();
  const { user, refreshProfile } = useAuth();
  const uid = user?.id;

  const patchLog = useMutation({
    mutationFn: async ({ s, patch }: { s: Pick<Session, "block" | "date" | "log">; patch: Partial<DailyLog> }) => {
      if (!uid) throw new Error("Not signed in");
      const cached = (qc.getQueryData<DailyLog[]>(["logs", uid]) ?? []).find(
        (l) => l.block_id === s.block.id && l.date === s.date
      );
      const existing = cached ?? s.log;
      if (existing?.id && !existing.id.startsWith("tmp")) {
        const { data, error } = await supabase.from("daily_logs").update(patch).eq("id", existing.id).select().single();
        if (error) throw error;
        return data as DailyLog;
      }
      const { data, error } = await supabase
        .from("daily_logs")
        .insert({ user_id: uid, block_id: s.block.id, date: s.date, completed: false, ...patch })
        .select()
        .single();
      if (error) throw error;
      return data as DailyLog;
    },
    onMutate: ({ s, patch }) => {
      qc.setQueryData<DailyLog[]>(["logs", uid], (old = []) => {
        const i = old.findIndex((l) => l.block_id === s.block.id && l.date === s.date);
        if (i >= 0) {
          const copy = old.slice();
          copy[i] = { ...copy[i], ...patch };
          return copy;
        }
        return [
          ...old,
          { id: `tmp-${s.block.id}-${s.date}`, user_id: uid!, block_id: s.block.id, date: s.date, completed: false, ...patch } as DailyLog,
        ];
      });
    },
    onSuccess: (row) => {
      qc.setQueryData<DailyLog[]>(["logs", uid], (old = []) => {
        const rest = old.filter((l) => !(l.block_id === row.block_id && l.date === row.date));
        return [...rest, row];
      });
    },
    onError: () => qc.invalidateQueries({ queryKey: ["logs", uid] }),
  });

  const saveBlock = useMutation({
    mutationFn: async (b: Partial<TimetableBlock> & { title: string; category: string; start_time: string; end_time: string; days_of_week: number[] }) => {
      if (!uid) throw new Error("Not signed in");
      if (b.id) {
        const { id, ...rest } = b;
        const { error } = await supabase.from("timetable_blocks").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("timetable_blocks")
          .insert({ reminder_enabled: false, ...b, user_id: uid });
        if (error) throw error;
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["blocks", uid] }),
  });

  const insertBlocks = useMutation({
    mutationFn: async (rows: { title: string; category: string; start_time: string; end_time: string; days_of_week: number[] }[]) => {
      if (!uid) throw new Error("Not signed in");
      if (!rows.length) return;
      const { error } = await supabase
        .from("timetable_blocks")
        .insert(rows.map((r) => ({ ...r, user_id: uid, reminder_enabled: false })));
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["blocks", uid] }),
  });

  const deleteBlock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("timetable_blocks").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: (id) => {
      const prev = qc.getQueryData<TimetableBlock[]>(["blocks", uid]);
      qc.setQueryData<TimetableBlock[]>(["blocks", uid], (old = []) => old.filter((b) => b.id !== id));
      return { prev };
    },
    onError: (_e, _id, ctx) => ctx?.prev && qc.setQueryData(["blocks", uid], ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ["blocks", uid] }),
  });

  const saveReflection = useMutation({
    mutationFn: async ({ date, mood, note }: { date: string; mood: Mood; note: string }) => {
      if (!uid) throw new Error("Not signed in");
      const { data: existing } = await supabase
        .from("daily_reflections")
        .select("id")
        .eq("user_id", uid)
        .eq("date", date)
        .maybeSingle();
      const payload = { user_id: uid, date, mood, note: note || null };
      const { error } = existing?.id
        ? await supabase.from("daily_reflections").update(payload).eq("id", existing.id)
        : await supabase.from("daily_reflections").insert(payload);
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["reflections", uid] }),
  });

  const updateProfile = useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      if (!uid) throw new Error("Not signed in");
      const { error } = await supabase.from("profiles").update(patch).eq("id", uid);
      if (error) throw error;
    },
    onSuccess: () => refreshProfile(),
  });

  return { patchLog, saveBlock, insertBlocks, deleteBlock, saveReflection, updateProfile };
}
