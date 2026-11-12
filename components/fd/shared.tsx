/**
 * Pieces shared by the tabs: the Focus Score card, Dot's speech bubble,
 * session sheets (detail, running late, check-in) and the streak celebration.
 */
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";
import { FIXED, FOCUS_TYPES, GOOD_DAY_SCORE } from "@/constants/focusd";
import { useAuth } from "@/lib/auth-context";
import { useFd, usePrefs } from "@/lib/prefs-context";
import { useFocusSession } from "@/lib/focus-session";
import { dateKey, dur, fmt, rangeLabel, reshuffle, toHHMM, type Session } from "@/lib/focus";
import { useFocusActions, type Overview } from "@/hooks/useFocusData";
import type { Mood } from "@/lib/types";
import { Btn, Card, Chip, Chips, Field, Label, Row, Sheet, T } from "./ui";
import { ScoreRing } from "./ScoreRing";
import { MiniBalloon, PoppedIcon } from "./Balloon";
import { MOOD_LIST, MoodFace } from "./MoodFace";
import { DotArt } from "./DotCharacter";
import { Particles } from "./Particles";
import { useToast } from "./toast";

export function useBuddyName() {
  const { profile } = useAuth();
  return profile?.buddy_name?.trim() || "Dot";
}

export function trendText(overall: number, lastWeek: number | null) {
  if (lastWeek === null) return "Your first week";
  const d = overall - lastWeek;
  return d > 0 ? `↑ ${d} on last week` : d < 0 ? `↓ ${-d} on last week` : "Same as last week";
}

/* ---------- Focus Score card ---------- */
export function ScoreCard({
  o,
  todayFrom,
  overallShown,
  hint,
  onPress,
}: {
  o: Overview;
  /** Animate the ring up from here (after a pop). */
  todayFrom?: number;
  overallShown?: number;
  hint?: string;
  onPress: () => void;
}) {
  const { c } = useFd();
  const score = o.todayScore;
  const line =
    hint ?? (o.restDay ? "Rest day. Overall is unaffected." : score >= GOOD_DAY_SCORE ? "Good day ✓" : `${GOOD_DAY_SCORE - score} more for a good day`);
  return (
    <Card testID="score-card" onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12 }}>
      <ScoreRing value={score} from={todayFrom} size={86} />
      <View style={{ flex: 1 }}>
        <T v="bodyStrong">Focus Score today</T>
        <T v="small" style={{ marginTop: 2 }}>{line}</T>
        <Row gap={8} style={{ marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: c.line, alignItems: "baseline" }}>
          <T v="bodyStrong">Overall</T>
          <T v="title" style={{ fontSize: 24, lineHeight: 28 }}>{overallShown ?? o.overall}</T>
          <T v="small" style={{ fontSize: 12 }}>{trendText(o.overall, o.lastWeek)}</T>
        </Row>
      </View>
    </Card>
  );
}

export function ScoreInfoSheet({ visible, onClose, o }: { visible: boolean; onClose: () => void; o: Overview }) {
  const { c } = useFd();
  const buddy = useBuddyName();
  return (
    <Sheet visible={visible} onClose={onClose}>
      <T v="title">How Focus Score works</T>
      <Card style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
        <ScoreRing value={o.todayScore} size={70} />
        <View style={{ flex: 1 }}>
          <T v="bodyStrong">Today · 0 to 100</T>
          <T v="small">
            Minutes you popped ÷ minutes you planned today. Starts at 0 each morning and fills as you pop. Popping early still counts
            what you did, and Running late costs nothing.
          </T>
        </View>
      </Card>
      <Card style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
        <ScoreRing value={o.overall} size={70} color={c.sub} />
        <View style={{ flex: 1 }}>
          <T v="bodyStrong">Overall · 0 to 100</T>
          <T v="small">
            Your average day over the last 7 days. Rest days with nothing planned are left out. Today only joins mid-day if it raises
            the number. Otherwise it joins at midnight, so a slow morning never drags it down.
          </T>
        </View>
      </Card>
      <Card>
        <T v="bodyStrong">Good days</T>
        <T v="small">
          Any day you reach {GOOD_DAY_SCORE} or more today. Good days grow {buddy} and keep your streak going, and they never reset.
        </T>
      </Card>
      <Btn title="Got it" onPress={onClose} />
    </Sheet>
  );
}

/* ---------- speech bubble ---------- */
export function Bubble({ name, text, hidden }: { name: string; text: string; hidden?: boolean }) {
  const { c } = useFd();
  if (hidden) return <View style={{ height: 52 }} />;
  return (
    <Animated.View
      key={text}
      entering={FadeIn.duration(220)}
      style={{
        alignSelf: "center",
        backgroundColor: c.card,
        borderRadius: 20,
        paddingVertical: 9,
        paddingHorizontal: 15,
        maxWidth: 290,
        minHeight: 52,
        justifyContent: "center",
      }}
    >
      <T v="label" color="accent" style={{ fontSize: 10 }}>{name}</T>
      <T v="bodyStrong" style={{ fontSize: 15 }}>{text}</T>
      <View
        style={{
          position: "absolute",
          bottom: -7,
          left: "50%",
          marginLeft: -8,
          width: 16,
          height: 16,
          backgroundColor: c.card,
          transform: [{ rotate: "45deg" }],
          borderRadius: 3,
        }}
      />
    </Animated.View>
  );
}

/* ---------- starting focus ---------- */
export function useStartFocus() {
  const { start, active } = useFocusSession();
  const router = useRouter();
  const toast = useToast();
  return (s: Session, all: Session[]) => {
    if (active && active.key !== s.key) {
      toast(`Pop ${active.title} first.`, { label: "Open", onPress: () => router.push("/focus") });
      return;
    }
    if (!active) {
      start({
        key: s.key,
        blockId: s.block.id,
        date: s.date,
        title: s.block.title,
        type: s.type,
        start: s.start,
        end: s.end,
        index: all.findIndex((x) => x.key === s.key) + 1,
        count: all.length,
        plannedMins: s.mins,
      });
    }
    router.push("/focus");
  };
}

/* ---------- session detail ---------- */
export function SessionSheet({
  s,
  all,
  onClose,
  dayLabel,
}: {
  s: Session | null;
  all: Session[];
  onClose: () => void;
  dayLabel: string;
}) {
  const router = useRouter();
  const { patchLog } = useFocusActions();
  const startFocus = useStartFocus();
  const toast = useToast();
  const [note, setNote] = useState("");
  useEffect(() => setNote(s?.log?.block_note ?? ""), [s?.key, s?.log?.block_note]);
  if (!s) return <Sheet visible={false} onClose={onClose}>{null}</Sheet>;
  const isToday = s.date === dateKey(new Date());
  const status =
    s.status === "done" ? `Popped${s.actual < s.mins ? ` early · ${s.actual} min` : ""}` : s.status === "skip" ? "Skipped" : "Planned";
  const set = (patch: Parameters<typeof patchLog.mutate>[0]["patch"], msg: string) => {
    patchLog.mutate({ s, patch: { ...patch, block_note: note || null } });
    toast(msg);
    onClose();
  };
  return (
    <Sheet visible onClose={onClose}>
      <Row gap={14}>
        {s.status === "done" ? <PoppedIcon size={44} /> : <MiniBalloon type={s.type} size={40} />}
        <View style={{ flex: 1 }}>
          <T v="eyebrow">{FOCUS_TYPES[s.type].label} · {dayLabel}</T>
          <T v="title" style={{ fontSize: 24 }}>{s.block.title}</T>
          <T v="small">{rangeLabel(s.start, s.end)} · {s.mins} min · {status}</T>
        </View>
      </Row>
      <Label>Note</Label>
      <Field value={note} onChangeText={setNote} placeholder="What do you want to get done?" multiline testID="note-input" />
      {isToday && s.status === "todo" ? (
        <Btn title="Start focus" onPress={() => { onClose(); startFocus(s, all); }} />
      ) : null}
      <Row>
        {s.status === "todo" ? (
          <>
            <Btn kind="secondary" flex title="Mark done" onPress={() => set({ completed: true, skipped: false, completed_at: new Date().toISOString(), focused_minutes: s.mins }, "Marked done")} />
            <Btn kind="secondary" flex title="Skip" onPress={() => set({ skipped: true, completed: false }, `Skipped ${s.block.title}`)} />
          </>
        ) : (
          <Btn kind="secondary" flex title="Mark as not done" onPress={() => set({ completed: false, skipped: false, completed_at: null, focused_minutes: null }, "Back on the plan")} />
        )}
      </Row>
      <Row>
        <Btn kind="secondary" flex title="Edit" onPress={() => { onClose(); router.push({ pathname: "/add-block", params: { id: s.block.id } }); }} />
        <Btn kind="secondary" flex title="Save note" onPress={() => { patchLog.mutate({ s, patch: { block_note: note || null } }); toast("Note saved"); onClose(); }} />
      </Row>
    </Sheet>
  );
}

/* ---------- running late ---------- */
export function LateSheet({ visible, onClose, o }: { visible: boolean; onClose: () => void; o: Overview }) {
  const { c } = useFd();
  const { prefs } = usePrefs();
  const buddy = useBuddyName();
  const { patchLog } = useFocusActions();
  const toast = useToast();
  const [late, setLate] = useState(15);
  const plan = useMemo(() => reshuffle(o.today, o.nowMin, late, prefs.quietStart), [o.today, o.nowMin, late, prefs.quietStart]);
  if (!plan.length) return <Sheet visible={visible} onClose={onClose}><T v="h2">Nothing left to move today.</T><Btn title="OK" onPress={onClose} /></Sheet>;
  const apply = () => {
    for (const { s, to } of plan) {
      if (to === null) patchLog.mutate({ s, patch: { skipped: true, snoozed_count: (s.log?.snoozed_count ?? 0) + 1 } });
      else patchLog.mutate({ s, patch: { planned_start: toHHMM(to), snoozed_count: (s.log?.snoozed_count ?? 0) + 1 } });
    }
    toast(`Reshuffled. ${plan[0].s.block.title} is now at ${plan[0].to !== null ? fmt(plan[0].to) : "tomorrow"}.`);
    onClose();
  };
  return (
    <Sheet visible={visible} onClose={onClose}>
      <T v="title">Running late?</T>
      <T color="sub">No stress. Pick how late and {buddy} will reshuffle the rest of today.</T>
      <Chips>
        {[10, 15, 30, 60].map((m) => (
          <Chip key={m} label={`${m} min`} on={late === m} onPress={() => setLate(m)} testID={`late-${m}`} />
        ))}
      </Chips>
      <Label>New plan</Label>
      {plan.map(({ s, to }) => (
        <Row key={s.key} style={{ backgroundColor: c.card, borderRadius: 18, padding: 12 }}>
          <MiniBalloon type={s.type} size={24} />
          <View style={{ flex: 1 }}>
            <T v="bodyStrong">{s.block.title}</T>
            <T v="small" style={{ textDecorationLine: "line-through" }}>{fmt(s.start)}</T>
          </View>
          <T v="bodyStrong" color="accent">{to === null ? "Skip today" : fmt(to)}</T>
        </Row>
      ))}
      {plan.some((p) => p.to === null) ? (
        <T v="small">Anything that would run into quiet hours ({fmt(prefs.quietStart)}) is skipped today. It stays on your plan for next time.</T>
      ) : null}
      <Btn title="Reshuffle my day" onPress={apply} testID="late-apply" />
      <Btn
        kind="link"
        title={`Skip ${plan[0].s.block.title} instead`}
        onPress={() => {
          patchLog.mutate({ s: plan[0].s, patch: { skipped: true } });
          toast(`Skipped ${plan[0].s.block.title}`);
          onClose();
        }}
      />
    </Sheet>
  );
}

/* ---------- daily check-in ---------- */
export function MoodRow({ value, onPick, size = 40 }: { value: Mood | null; onPick: (m: Mood) => void; size?: number }) {
  const { c } = useFd();
  return (
    <Row style={{ justifyContent: "space-between" }} gap={4}>
      {MOOD_LIST.map((m) => (
        <Pressable
          key={m.id}
          testID={`mood-${m.id}`}
          onPress={() => onPick(m.id)}
          style={{
            alignItems: "center",
            gap: 4,
            padding: 6,
            borderRadius: 16,
            backgroundColor: value === m.id ? c.bar : "transparent",
            flex: 1,
          }}
        >
          <MoodFace mood={m.id} size={size} />
          <T v="small" style={{ fontSize: 12 }}>{m.label}</T>
        </Pressable>
      ))}
    </Row>
  );
}

export function ReflectSheet({ visible, initial, onClose, date }: { visible: boolean; initial: { mood: Mood | null; note: string }; onClose: () => void; date?: string }) {
  const { saveReflection } = useFocusActions();
  const toast = useToast();
  const [mood, setMood] = useState<Mood | null>(initial.mood);
  const [note, setNote] = useState(initial.note);
  useEffect(() => {
    if (visible) {
      setMood(initial.mood);
      setNote(initial.note);
    }
  }, [visible, initial.mood, initial.note]);
  return (
    <Sheet visible={visible} onClose={onClose}>
      <T v="title">How did today feel?</T>
      <MoodRow value={mood} onPick={setMood} size={44} />
      <Label>Anything on your mind? (optional)</Label>
      <Field value={note} onChangeText={setNote} placeholder="e.g. Maths was hard but I did it" multiline />
      <Btn
        title="Save check-in"
        disabled={!mood}
        loading={saveReflection.isPending}
        onPress={() =>
          mood &&
          saveReflection.mutate(
            { date: date ?? dateKey(new Date()), mood, note },
            {
              onSuccess: () => {
                toast("Check-in saved");
                onClose();
              },
              onError: () => toast("Couldn't save. Try again."),
            }
          )
        }
      />
    </Sheet>
  );
}

/* ---------- streak celebration ---------- */
export function StreakCelebration({ streak, onClose }: { streak: number | null; onClose: () => void }) {
  const { c } = useFd();
  const buddy = useBuddyName();
  const [size, setSize] = useState({ w: 390, h: 800 });
  return (
    <Modal visible={streak !== null} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: c.accent, alignItems: "center", justifyContent: "center", padding: 30 }]}
        onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        {streak !== null ? <Particles key={streak} origin={{ x: size.w / 2, y: size.h * 0.32 }} count={60} power={1.4} /> : null}
        <Animated.View entering={ZoomIn.springify().damping(9)} exiting={FadeOut}>
          <DotArt mood="happy" size={170} body={usePrefs().dot} />
        </Animated.View>
        <T v="display" color="#fff" style={{ fontSize: 96, lineHeight: 100 }}>{streak}</T>
        <T v="display" color="#fff">day streak!</T>
        <T v="body" color="#fff" style={{ textAlign: "center", marginVertical: 14, fontSize: 16, opacity: 0.95 }}>
          {streak && streak >= 7 ? `${streak} good days in a row. ${buddy} grew a new layer of fluff.` : `${streak} good days in a row. ${buddy} is proud of you.`}
        </T>
        <Pressable
          onPress={onClose}
          style={{ backgroundColor: "#fff", borderRadius: 999, minHeight: 56, alignSelf: "stretch", alignItems: "center", justifyContent: "center" }}
        >
          <T v="bodyStrong" color={FIXED.dotInk}>Keep it going</T>
        </Pressable>
      </View>
    </Modal>
  );
}

export const freeFor = (min: number) => dur(Math.max(1, Math.round(min)));
