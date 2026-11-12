import React, { useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDays, format, isSameDay } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { FONTS, FOCUS_TYPES, FS, FIXED } from "@/constants/focusd";
import { Btn, Card, Dialog, Row, Screen, Sheet, T } from "@/components/fd/ui";
import { MiniBalloon, PoppedIcon } from "@/components/fd/Balloon";
import { SessionSheet, useBuddyName, useStartFocus } from "@/components/fd/shared";
import { useToast } from "@/components/fd/toast";
import { useFocusActions, useFocusOverview } from "@/hooks/useFocusData";
import { useFd } from "@/lib/prefs-context";
import { useAuth } from "@/lib/auth-context";
import {
  DAY_SHORT,
  blockMinutes,
  dateKey,
  dur,
  fmt,
  sessionsOn,
  suggestions,
  toHHMM,
  toMin,
  weekDates,
  type Session,
  type Suggestion,
} from "@/lib/focus";
import type { TimetableBlock } from "@/lib/types";

const DISMISSED_KEY = "focusd_dismissed_suggestions_v1";
const FULL_DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function useDismissed() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    AsyncStorage.getItem(DISMISSED_KEY)
      .then((r) => r && setIds(JSON.parse(r)))
      .catch(() => {});
  }, []);
  const add = (more: string[]) =>
    setIds((prev) => {
      const next = [...new Set([...prev, ...more])];
      AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  return [ids, add] as const;
}

/** Applies a suggestion to its block. */
function applied(s: Suggestion): Partial<TimetableBlock> & Pick<TimetableBlock, "title" | "category" | "start_time" | "end_time" | "days_of_week"> {
  const b = s.block;
  if (s.kind === "move") return { ...b, start_time: toHHMM(s.to), end_time: toHHMM(s.to + blockMinutes(b)) };
  return { ...b, end_time: toHHMM(toMin(b.start_time) + s.to) };
}

export default function PlanScreen() {
  const o = useFocusOverview();
  const { c } = useFd();
  const router = useRouter();
  const toast = useToast();
  const buddy = useBuddyName();
  const { profile } = useAuth();
  const params = useLocalSearchParams<{ day?: string }>();
  const { saveBlock, deleteBlock } = useFocusActions();
  const startFocus = useStartFocus();
  const [day, setDay] = useState(() => new Date());
  const [detail, setDetail] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<Session | null>(null);
  const [weekly, setWeekly] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [dismissed, dismiss] = useDismissed();

  useEffect(() => {
    if (params.day === "tomorrow") setDay(addDays(new Date(), 1));
  }, [params.day]);

  const today = o.now;
  const isToday = isSameDay(day, today);
  const isPast = dateKey(day) < dateKey(today);
  const week = weekDates(today);
  const list = useMemo(() => sessionsOn(day, o.blocks, o.logs), [day, o.blocks, o.logs]);
  const todaySessions = o.today;
  const all = useMemo(
    () => suggestions(o.blocks, o.logs, today, o.firstDay).filter((s) => !dismissed.includes(s.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [o.blocks, o.logs, dateKey(today), o.firstDay, dismissed]
  );
  const tip = all[0];
  const showWeekly = all.length > 1 && [5, 6, 0].includes(today.getDay());
  const selected = list.find((s) => s.key === detail) ?? null;

  const popped = list.filter((s) => s.status === "done").length;
  const left = list.filter((s) => s.status === "todo").length;
  const eye = isToday
    ? `${popped} popped · ${left} to go`
    : isPast
      ? `${popped} of ${list.length} popped`
      : `${list.length} session${list.length === 1 ? "" : "s"} planned`;

  const applySuggestion = (s: Suggestion) => {
    const prev = { ...s.block };
    saveBlock.mutate(applied(s), {
      onSuccess: () =>
        toast(s.kind === "move" ? `Moved to ${fmt(s.to)}` : `Now ${s.to} min`, {
          label: "Undo",
          onPress: () => saveBlock.mutate(prev),
        }),
      onError: () => toast("Couldn't save. Try again."),
    });
  };

  const remove = (s: Session, scope: "day" | "all") => {
    const b = s.block;
    setConfirmDel(null);
    if (scope === "all" || b.days_of_week.length <= 1) {
      deleteBlock.mutate(b.id, {
        onSuccess: () =>
          toast(`Deleted ${b.title}`, {
            label: "Undo",
            onPress: () => {
              const { id: _id, ...rest } = b;
              saveBlock.mutate(rest);
            },
          }),
        onError: () => toast("Couldn't delete. Try again."),
      });
    } else {
      const dow = day.getDay();
      saveBlock.mutate(
        { ...b, days_of_week: b.days_of_week.filter((d) => d !== dow) },
        {
          onSuccess: () =>
            toast(`Removed from ${FULL_DAY[dow]}s`, { label: "Undo", onPress: () => saveBlock.mutate(b) }),
        }
      );
    }
  };

  const nowMin = o.nowMin;
  const rows: React.ReactNode[] = [];
  list.forEach((s, i) => {
    if (i) {
      const gap = s.start - list[i - 1].end;
      if (gap >= 30)
        rows.push(
          <T key={`gap-${s.key}`} v="small" style={{ textAlign: "center", paddingVertical: 2 }}>
            Free · {dur(gap)}
          </T>
        );
    }
    const isNow = isToday && s.status === "todo" && s.start <= nowMin + 10 && nowMin < s.end;
    const missed = s.status === "todo" && (isPast || (isToday && s.end <= nowMin));
    const dim = s.status === "skip" || missed;
    const right =
      s.status === "done" ? (
        <PoppedIcon size={30} />
      ) : s.status === "skip" ? (
        <T v="small">Skipped</T>
      ) : missed ? (
        <T v="small">Didn&apos;t happen</T>
      ) : isNow ? (
        <Pressable onPress={() => startFocus(s, todaySessions)} style={{ backgroundColor: c.accent, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 }}>
          <T v="bodyStrong" color={FIXED.white} style={{ fontSize: FS.sm }}>Start</T>
        </Pressable>
      ) : (
        <MiniBalloon type={s.type} size={24} />
      );
    rows.push(
      <ReanimatedSwipeable
        key={s.key}
        friction={1.6}
        rightThreshold={40}
        overshootRight={false}
        renderRightActions={() => (
          <Pressable
            testID={`delete-${s.block.id}`}
            onPress={() => (s.block.days_of_week.length > 1 ? setConfirmDel(s) : remove(s, "all"))}
            style={{ width: 96, marginLeft: 8, borderRadius: 22, backgroundColor: c.danger, alignItems: "center", justifyContent: "center" }}
          >
            <T v="bodyStrong" color={FIXED.white}>Delete</T>
          </Pressable>
        )}
      >
        <Pressable
          testID={`session-${s.block.id}`}
          onPress={() => setDetail(s.key)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            backgroundColor: c.card,
            borderRadius: 22,
            paddingVertical: 13,
            paddingHorizontal: 16,
            opacity: dim ? 0.55 : 1,
            borderWidth: 2,
            borderColor: isNow ? c.accent : "transparent",
          }}
        >
          <T v="bodyStrong" style={{ width: 48, fontSize: FS.md }}>{fmt(s.start, false)}</T>
          <View style={{ width: 4, alignSelf: "stretch", borderRadius: 2, backgroundColor: FOCUS_TYPES[s.type].color }} />
          <View style={{ flex: 1 }}>
            <T v="bodyStrong" style={s.status === "done" ? { textDecorationLine: "line-through" } : undefined}>{s.block.title}</T>
            <T v="small">
              {FOCUS_TYPES[s.type].label} · {s.mins} min{s.moved ? " · moved" : ""}
            </T>
          </View>
          {right}
        </Pressable>
      </ReanimatedSwipeable>
    );
  });

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Screen tabs>
        <Row style={{ justifyContent: "space-between" }}>
          <View>
            <T v="eyebrow">{eye}</T>
            <T v="display">{isToday ? "Today" : format(day, "EEEE")}</T>
          </View>
          <Pressable
            testID="add-session"
            accessibilityLabel="Add a session"
            onPress={() => router.push({ pathname: "/add-block", params: { day: String(day.getDay()) } })}
            style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.ink, alignItems: "center", justifyContent: "center" }}
          >
            <T v="title" color={c.bg} style={{ marginTop: -2 }}>+</T>
          </Pressable>
        </Row>

        <Row gap={6} style={{ justifyContent: "space-between" }}>
          {week.map((d, i) => {
            const on = isSameDay(d, day);
            const td = isSameDay(d, today);
            const ss = sessionsOn(d, o.blocks, o.logs);
            return (
              <Pressable
                key={i}
                testID={`day-${i}`}
                onPress={() => setDay(d)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 8,
                  borderRadius: 16,
                  backgroundColor: on ? c.ink : c.card,
                  borderWidth: 2,
                  borderColor: td && !on ? c.accent : "transparent",
                }}
              >
                <T v="small" color={on ? c.bg : c.sub} style={{ fontSize: FS.caption }}>{DAY_SHORT[i]}</T>
                <T v="bodyStrong" color={on ? c.bg : c.ink} style={{ fontFamily: FONTS.heavy }}>{format(d, "d")}</T>
                <Row gap={2} style={{ height: 6, marginTop: 2 }}>
                  {ss.slice(0, 4).map((s) => (
                    <View
                      key={s.key}
                      style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: s.status === "done" ? (on ? c.accentLight : c.accent) : on ? c.bg + "88" : c.bar }}
                    />
                  ))}
                </Row>
              </Pressable>
            );
          })}
        </Row>

        {list.length ? (
          rows
        ) : (
          <Card style={{ alignItems: "center", paddingVertical: 24 }}>
            <T v="h2">Rest day</T>
            <T v="small" style={{ marginTop: 4, marginBottom: 12 }}>No focus sessions planned.</T>
            <Btn small kind="secondary" title="+ Add a session" onPress={() => router.push({ pathname: "/add-block", params: { day: String(day.getDay()) } })} />
          </Card>
        )}

        {isToday && tip ? (
          <View style={{ backgroundColor: c.tip, borderRadius: 22, padding: 16, gap: 6 }}>
            <T v="label" color={c.tipInk}>{buddy} noticed</T>
            <T v="bodyStrong" color={c.tipInk}>{tip.title}?</T>
            <T v="small" color={c.tipInk}>{tip.why}</T>
            <Row style={{ marginTop: 6 }}>
              <Btn small kind="primary" title={tip.kind === "move" ? "Move it" : "Shorten it"} onPress={() => { applySuggestion(tip); dismiss([tip.id]); }} />
              <Btn small kind="link" title="Not now" onPress={() => dismiss([tip.id])} />
            </Row>
          </View>
        ) : null}

        {isToday && showWeekly ? (
          <Card onPress={() => { setPicked(all.map((s) => s.id)); setWeekly(true); }} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <T v="eyebrow" color="accent">Weekend plan</T>
              <T v="bodyStrong">Next week&apos;s plan is ready</T>
              <T v="small">{all.length} changes based on this week</T>
            </View>
            <T v="bodyStrong" color="accent">Review</T>
          </Card>
        ) : null}
      </Screen>

      <SessionSheet s={selected} all={isToday ? todaySessions : list} dayLabel={isToday ? "Today" : format(day, "EEEE")} onClose={() => setDetail(null)} />

      <Dialog visible={!!confirmDel} onClose={() => setConfirmDel(null)}>
        <T v="h2">Delete {confirmDel?.block.title}?</T>
        <T color="sub">It repeats on other days too.</T>
        <Btn kind="secondary" title={`Only ${FULL_DAY[day.getDay()]}s`} onPress={() => confirmDel && remove(confirmDel, "day")} />
        <Btn kind="danger" title="Every day it repeats" onPress={() => confirmDel && remove(confirmDel, "all")} />
        <Btn kind="link" title="Cancel" onPress={() => setConfirmDel(null)} />
      </Dialog>

      <Sheet visible={weekly} onClose={() => setWeekly(false)}>
        <T v="eyebrow" color="accent">
          Plan for {format(addDays(week[0], 7), "d")} – {format(addDays(week[6], 7), "d MMM")}
        </T>
        <T v="title">Next week, a bit better</T>
        <T color="sub">Based on what you popped, skipped and moved this week.</T>
        {all.map((s) => {
          const on = picked.includes(s.id);
          return (
            <Pressable
              key={s.id}
              onPress={() => setPicked((p) => (on ? p.filter((x) => x !== s.id) : [...p, s.id]))}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: c.card, borderRadius: 18, padding: 14, borderWidth: 2, borderColor: on ? c.accent : "transparent" }}
            >
              <View style={{ flex: 1 }}>
                <T v="bodyStrong">{s.title}</T>
                <T v="small">{s.why}</T>
              </View>
              <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: c.accent, backgroundColor: on ? c.accent : "transparent" }} />
            </Pressable>
          );
        })}
        <T v="small">
          Everything else stays the same: {profile?.sessions_per_day ?? 3} sessions a day in your usual times.
        </T>
        <Btn
          title="Use this plan"
          onPress={() => {
            all.filter((s) => picked.includes(s.id)).forEach(applySuggestion);
            dismiss(all.map((s) => s.id));
            setWeekly(false);
          }}
        />
        <Btn kind="link" title="Not now" onPress={() => setWeekly(false)} />
      </Sheet>
    </View>
  );
}
