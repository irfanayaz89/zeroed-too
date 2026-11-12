import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDays, format, isSameDay } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CATEGORIES, FONTS, FS, GOOD_DAY_SCORE } from "@/constants/theme";
import { Icon } from "@/components/z/icons";
import { BlockDetailSheet } from "@/components/z/sheets";
import { useToast } from "@/components/z/toast";
import { Btn, Card, PillBtn, Press, Row, Screen, Sheet, SheetTitle, T } from "@/components/z/ui";
import { useBlockActions } from "@/hooks/useBlockActions";
import { useFocusActions, useFocusOverview, useNow } from "@/hooks/useFocusData";
import {
  DAY_SHORT,
  FULL_DAY,
  blockMinutes,
  dateKey,
  dayScore,
  dur,
  fmt,
  fmtShort,
  nowMinutes,
  rangeLabel,
  sessionsOn,
  suggestions,
  toHHMM,
  untilText,
  weekDates,
  weekPlan,
  type Session,
  type Suggestion,
} from "@/lib/focus";
import { haptic } from "@/lib/haptics";
import { useZ } from "@/lib/prefs-context";

const DISMISSED_KEY = "zeroed_dismissed_tips_v1";

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

function B({ children }: { children: React.ReactNode }) {
  const { c } = useZ();
  return <Text style={{ fontFamily: FONTS.bold, color: c.text }}>{children}</Text>;
}

function StatusPill({ kind, label }: { kind: "done" | "skip" | "now" | "up"; label: string }) {
  const { c } = useZ();
  const bg = kind === "done" ? c.good + "24" : kind === "now" ? c.accent : c.surface2;
  const fg = kind === "done" ? c.good : kind === "now" ? c.onAccent : kind === "skip" ? c.text3 : c.text2;
  return (
    <View style={{ backgroundColor: bg, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 8 }}>
      <Text style={{ fontFamily: FONTS.heavy, fontSize: FS.caps, letterSpacing: 0.4, color: fg }}>{label}</Text>
    </View>
  );
}

function BlockRow({ s, isToday, isPast, nowMin, onPress }: { s: Session; isToday: boolean; isPast: boolean; nowMin: number; onPress: () => void }) {
  const { c } = useZ();
  const isNow = isToday && s.status === "todo" && s.start <= nowMin && nowMin < s.end;
  const ended = s.status === "todo" && (isPast || (isToday && s.end <= nowMin));
  const pill =
    s.status === "done" ? (
      <StatusPill kind="done" label="Done" />
    ) : s.status === "skip" ? (
      <StatusPill kind="skip" label="Skipped" />
    ) : isNow ? (
      <StatusPill kind="now" label="Now" />
    ) : ended ? (
      <StatusPill kind="skip" label="Ended" />
    ) : isToday ? (
      <StatusPill kind="up" label={untilText(s.start - nowMin).replace("in ", "In ")} />
    ) : null;
  const progress = isNow ? (nowMin - s.start) / s.mins : 0;
  return (
    <Pressable testID={`block-${s.block.id}`} accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ flexDirection: "row", gap: 12, opacity: pressed ? 0.85 : 1 })}>
      <Text style={{ width: 58, paddingTop: 14, fontFamily: FONTS.bold, fontSize: FS.caption, color: c.text2, fontVariant: ["tabular-nums"] }}>{fmtShort(s.start)}</Text>
      <View style={{ flex: 1, borderRadius: 19, borderWidth: isNow ? 3 : 0, borderColor: c.accentSoft, margin: isNow ? -3 : 0 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: isNow ? c.accent : c.line,
            borderRadius: 16,
            paddingVertical: 12,
            paddingHorizontal: 14,
            overflow: "hidden",
            opacity: s.status === "skip" ? 0.55 : 1,
          }}
        >
          <View style={{ width: 4, alignSelf: "stretch", borderRadius: 2, backgroundColor: CATEGORIES[s.cat].color }} />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: FONTS.bold,
                fontSize: FS.mdPlus,
                color: s.status === "done" ? c.text2 : c.text,
                textDecorationLine: s.status === "done" ? "line-through" : "none",
                textDecorationColor: c.text3,
              }}
            >
              {s.block.title}
            </Text>
            <Text style={{ fontFamily: FONTS.semibold, fontSize: FS.caption, color: c.text2, marginTop: 2 }}>
              {rangeLabel(s.start, s.end)} · {CATEGORIES[s.cat].label}
              {s.moved ? " · moved" : ""}
            </Text>
          </View>
          {pill}
          {isNow ? <View style={{ position: "absolute", left: 0, bottom: 0, height: 3, width: `${Math.min(100, progress * 100)}%`, backgroundColor: c.accent }} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function PlanScreen() {
  const o = useFocusOverview();
  const { c } = useZ();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ day?: string }>();
  const { saveBlock, deleteBlock } = useFocusActions();
  const act = useBlockActions(o);
  const now = useNow(5000);
  const nowMin = nowMinutes(now);
  const [day, setDay] = useState(() => new Date());
  const [detail, setDetail] = useState<string | null>(null);
  const [review, setReview] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [dismissed, dismiss] = useDismissed();

  useEffect(() => {
    if (params.day === "tomorrow") setDay(addDays(new Date(), 1));
    else if (params.day === "today") setDay(new Date());
  }, [params.day]);

  const today = o.now;
  const isToday = isSameDay(day, today);
  const isPast = dateKey(day) < dateKey(today);
  const week = weekDates(today);
  const list = useMemo(() => (isToday ? o.today : sessionsOn(day, o.blocks, o.logs)), [isToday, o.today, day, o.blocks, o.logs]);
  const total = list.reduce((a, s) => a + s.mins, 0);
  const selected = list.find((s) => s.key === detail) ?? null;

  const tips = useMemo(
    () => suggestions(o.blocks, o.logs, today, o.firstDay).filter((s) => !dismissed.includes(s.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [o.blocks, o.logs, dateKey(today), o.firstDay, dismissed]
  );
  const tip = tips[0];
  const next = weekPlan(o.blocks);
  const nextMon = addDays(week[0], 7);
  const weekend = [5, 6, 0].includes(today.getDay());

  const moveBlock = (t: Suggestion) => {
    const b = t.block;
    const prev = { ...b };
    saveBlock.mutate(
      { ...b, start_time: toHHMM(t.to), end_time: toHHMM(t.to + blockMinutes(b)) },
      {
        onSuccess: () => toast(`Moved to ${fmt(t.to)}`, { label: "Undo", onPress: () => saveBlock.mutate(prev) }),
        onError: () => toast("Couldn't save that. Check your connection."),
      }
    );
  };

  const remove = (s: Session) => {
    const b = s.block;
    const dow = day.getDay();
    const onError = () => toast("Couldn't delete that. Check your connection.");
    if (b.days_of_week.length > 1) {
      saveBlock.mutate(
        { ...b, days_of_week: b.days_of_week.filter((d) => d !== dow) },
        { onSuccess: () => toast(`Removed from ${FULL_DAY[dow]}s`, { label: "Undo", onPress: () => saveBlock.mutate(b) }), onError }
      );
    } else {
      deleteBlock.mutate(b.id, {
        onSuccess: () =>
          toast("Block deleted", {
            label: "Undo",
            onPress: () => {
              const { id: _id, ...rest } = b;
              saveBlock.mutate(rest);
            },
          }),
        onError,
      });
    }
  };

  const addBlock = () => router.push({ pathname: "/add-block", params: { day: String(day.getDay()) } });

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Screen tabs contentStyle={{ paddingBottom: 170 + insets.bottom }}>
        <Row style={{ justifyContent: "space-between" }}>
          <View>
            <T v="caps" style={{ fontSize: FS.caps }}>This week</T>
            <T v="page">Plan</T>
          </View>
          {isToday ? <PillBtn icon="late" title="Running late" testID="running-late" onPress={act.runningLate} /> : null}
        </Row>

        <View style={{ flexDirection: "row", gap: 4 }}>
          {week.map((d, i) => {
            const on = isSameDay(d, day);
            const future = dateKey(d) > dateKey(today);
            const sc = future ? null : isSameDay(d, today) ? (o.restDay ? null : o.todayScore) : dayScore(sessionsOn(d, o.blocks, o.logs));
            const before = o.firstDay ? dateKey(d) < o.firstDay : false;
            const dot = sc === null || before ? c.line : sc >= GOOD_DAY_SCORE ? c.good : c.warn;
            return (
              <Pressable
                key={i}
                testID={`day-${i}`}
                accessibilityRole="button"
                accessibilityLabel={`${format(d, "EEEE d MMMM")}`}
                accessibilityState={{ selected: on }}
                onPress={() => {
                  haptic.select();
                  setDay(d);
                }}
                style={{ flex: 1, alignItems: "center", gap: 6, paddingVertical: 8, borderRadius: 14, backgroundColor: on ? c.surface2 : "transparent", borderWidth: 1, borderColor: on ? c.line : "transparent" }}
              >
                <Text style={{ fontFamily: FONTS.bold, fontSize: FS.caps, color: c.text2 }}>{DAY_SHORT[i]}</Text>
                <Text style={{ fontFamily: FONTS.displaySemi, fontSize: FS.lg - 1, color: c.text }}>{format(d, "d")}</Text>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dot }} />
              </Pressable>
            );
          })}
        </View>

        <T v="caps">
          {isToday ? "Today" : FULL_DAY[day.getDay()]} · {list.length} block{list.length === 1 ? "" : "s"} · {dur(total)} planned
        </T>

        <View style={{ gap: 8 }}>
          {list.length ? (
            list.map((s) => <BlockRow key={s.key} s={s} isToday={isToday} isPast={isPast} nowMin={nowMin} onPress={() => setDetail(s.key)} />)
          ) : (
            <Card>
              <T v="body" color="text2" style={{ lineHeight: 21 }}>
                No blocks yet. Tap + to add your first one. Two to four a day is the sweet spot.
              </T>
            </Card>
          )}
        </View>

        {isToday && tip ? (
          <Card testID="better-time" style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: c.accentSoft, alignItems: "center", justifyContent: "center" }}>
              <Icon name="bulb" size={18} color={c.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <T v="caps" style={{ marginBottom: 6 }}>Better time</T>
              <Text style={{ fontFamily: FONTS.semibold, fontSize: FS.sm, lineHeight: 19, color: c.text2 }}>
                You finish <B>{tip.rateTo}%</B> of blocks around {fmt(tip.to)} and <B>{tip.rateFrom}%</B> of <B>{tip.block.title}</B> at {fmt(tip.from)}. Move it to {fmt(tip.to)}?
              </Text>
              <Row gap={8} style={{ marginTop: 10 }}>
                <PillBtn primary title="Move it" testID="tip-move" onPress={() => { moveBlock(tip); dismiss([tip.id]); }} />
                <PillBtn title={`Keep ${fmtShort(tip.from)}`} onPress={() => dismiss([tip.id])} />
              </Row>
            </View>
          </Card>
        ) : null}

        {next.count ? (
          <Card style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: c.accentSoft, alignItems: "center", justifyContent: "center" }}>
              <Icon name="plan" size={18} color={c.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <T v="caps" style={{ marginBottom: 6 }}>Next week</T>
              <Text style={{ fontFamily: FONTS.semibold, fontSize: FS.sm, lineHeight: 19, color: c.text2 }}>
                Your plan for {format(nextMon, "MMM d")} to {format(addDays(nextMon, 6), "d")} is drafted from this week:{" "}
                <B>
                  {next.count} blocks, {dur(next.minutes)}
                </B>
                .{weekend && tips.length ? " It's ready to review." : " Review it on Sunday."}
              </Text>
              {weekend && tips.length ? (
                <Row style={{ marginTop: 10 }}>
                  <PillBtn primary title="Review" onPress={() => { setPicked(tips.map((t) => t.id)); setReview(true); }} />
                </Row>
              ) : null}
            </View>
          </Card>
        ) : null}
      </Screen>

      <Press
        testID="add-block"
        accessibilityLabel="Add a block"
        onPress={addBlock}
        style={{
          position: "absolute",
          right: 20,
          bottom: insets.bottom + 84,
          width: 56,
          height: 56,
          borderRadius: 18,
          backgroundColor: c.accent,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: c.accent,
          shadowOpacity: 0.4,
          shadowRadius: 15,
          shadowOffset: { width: 0, height: 10 },
          elevation: 6,
        }}
      >
        <Icon name="plus" size={26} color={c.onAccent} />
      </Press>

      <BlockDetailSheet
        s={selected}
        isToday={isToday}
        dayName={FULL_DAY[day.getDay()]}
        nowMin={isToday ? nowMin : isPast ? 24 * 60 : -1}
        onClose={() => setDetail(null)}
        onEdit={(s) => router.push({ pathname: "/add-block", params: { id: s.block.id } })}
        onOpenTimer={() => router.push("/focus")}
        onDelete={remove}
      />

      <Sheet visible={review} onClose={() => setReview(false)}>
        <SheetTitle title="Next week, a little better" sub="Based on what you finished, skipped and moved this week. Untick anything you'd rather keep." />
        <View style={{ gap: 8, marginBottom: 14 }}>
          {tips.map((t) => {
            const on = picked.includes(t.id);
            return (
              <Press
                key={t.id}
                onPress={() => setPicked((p) => (on ? p.filter((x) => x !== t.id) : [...p, t.id]))}
                style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: c.surface2, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: on ? c.accent : c.line }}
              >
                <View style={{ flex: 1 }}>
                  <T v="bodyStrong">Move {t.block.title} to {fmt(t.to)}</T>
                  <T v="small">
                    {t.rateFrom}% done at {fmt(t.from)}, {t.rateTo}% around {fmt(t.to)}
                  </T>
                </View>
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: c.accent, backgroundColor: on ? c.accent : "transparent", alignItems: "center", justifyContent: "center" }}>
                  {on ? <Icon name="check" size={14} color={c.onAccent} /> : null}
                </View>
              </Press>
            );
          })}
        </View>
        <Row gap={8}>
          <Btn kind="secondary" flex title="Not now" onPress={() => setReview(false)} />
          <Btn
            kind="pri"
            flex
            title="Use this plan"
            onPress={() => {
              tips.filter((t) => picked.includes(t.id)).forEach(moveBlock);
              dismiss(tips.map((t) => t.id));
              setReview(false);
            }}
          />
        </Row>
      </Sheet>
    </View>
  );
}
