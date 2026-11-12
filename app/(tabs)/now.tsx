import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { format } from "date-fns";
import * as Haptics from "expo-haptics";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { FIXED, FOCUS_TYPES, GOOD_DAY_SCORE } from "@/constants/focusd";
import { Btn, Card, Screen, T } from "@/components/fd/ui";
import { Dot, type DotHandle, type DotMood } from "@/components/fd/DotCharacter";
import { Particles, type Pt } from "@/components/fd/Particles";
import { MoodFace, MOOD_LIST } from "@/components/fd/MoodFace";
import {
  Bubble,
  LateSheet,
  MoodRow,
  ReflectSheet,
  ScoreCard,
  ScoreInfoSheet,
  StreakCelebration,
  freeFor,
  useBuddyName,
  useStartFocus,
} from "@/components/fd/shared";
import { useFocusOverview, useFocusActions } from "@/hooks/useFocusData";
import { useFocusSession } from "@/lib/focus-session";
import { useFd, usePrefs } from "@/lib/prefs-context";
import { useToast } from "@/components/fd/toast";
import { dateKey, dur, fmt, isGood, nowState, rangeLabel, STREAK_MILESTONES, dotGrowth } from "@/lib/focus";
import type { Mood } from "@/lib/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/lib/auth-context";

const SAVE_LATER_KEY = "focusd_save_later_v1";

export default function NowScreen() {
  const o = useFocusOverview();
  const { c } = useFd();
  const router = useRouter();
  const toast = useToast();
  const buddy = useBuddyName();
  const { active, celebration, setCelebration, elapsedSec, totalSec } = useFocusSession();
  const { patchLog } = useFocusActions();
  const { isAnonymous } = useAuth();
  const { prefs } = usePrefs();
  const [saveLater, setSaveLater] = useState<string | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(SAVE_LATER_KEY).then(setSaveLater).catch(() => {});
  }, []);
  const startFocus = useStartFocus();
  const dotRef = useRef<DotHandle>(null);
  const dotBox = useRef<View>(null);
  const rootRef = useRef<View>(null);

  const [sheet, setSheet] = useState<null | "score" | "late" | "reflect">(null);
  const [reflectMood, setReflectMood] = useState<Mood | null>(null);
  const [boopLine, setBoopLine] = useState<string | null>(null);
  const [burst, setBurst] = useState<{ origin: Pt; target: Pt; id: number } | null>(null);
  const [ringFrom, setRingFrom] = useState<number | undefined>(undefined);
  const [hint, setHint] = useState<string | undefined>(undefined);
  const [overallShown, setOverallShown] = useState<number | undefined>(undefined);
  const [streakShow, setStreakShow] = useState<number | null>(null);
  const [justPopped, setJustPopped] = useState(false);
  const glow = useSharedValue(0);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value, transform: [{ scale: 0.8 + glow.value * 0.4 }] }));
  const boopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const st = nowState(o.today, o.nowMin, active?.key ?? null);
  const s = "s" in st ? st.s : null;
  const idx = s ? o.today.findIndex((x) => x.key === s.key) + 1 : 0;
  const doneN = o.today.filter((x) => x.status === "done").length;
  const doneMins = o.today.reduce((a, x) => a + x.actual, 0);

  /* ---------- after a pop: confetti flies into Dot ---------- */
  const scoreRef = useRef(o.todayScore);
  scoreRef.current = o.todayScore;
  const overallRef = useRef(o.overall);
  overallRef.current = o.overall;
  const streakRef = useRef(o.streak);
  streakRef.current = o.streak;

  useEffect(() => {
    if (!celebration || Date.now() - celebration.at > 15000) return;
    setJustPopped(true);
    setRingFrom(celebration.scoreBefore);
    setOverallShown(celebration.overallBefore);
    const t = setTimeout(() => {
      Promise.all([
        new Promise<{ x: number; y: number; w: number; h: number }>((res) =>
          dotBox.current?.measureInWindow((x, y, w, h) => res({ x, y, w, h })) ?? res({ x: 0, y: 0, w: 0, h: 0 })
        ),
        new Promise<{ x: number; y: number; w: number; h: number }>((res) =>
          rootRef.current?.measureInWindow((x, y, w, h) => res({ x, y, w, h })) ?? res({ x: 0, y: 0, w: 0, h: 0 })
        ),
      ]).then(([d, r]) => {
        const target = { x: d.x - r.x + d.w / 2, y: d.y - r.y + d.h * 0.6 };
        setBurst({ origin: { x: r.w / 2, y: r.h * 0.38 }, target, id: celebration.at });
        glow.value = withTiming(1, { duration: 400 });
      });
    }, 350);
    return () => clearTimeout(t);
  }, [celebration, glow]);

  const landed = useRef(0);
  const onLand = useCallback(
    (last: boolean) => {
      landed.current++;
      if (landed.current % 5 === 0) dotRef.current?.squash();
      if (!last || !celebration) return;
      landed.current = 0;
      setBurst(null);
      dotRef.current?.hop();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const after = scoreRef.current;
      const crossed = celebration.scoreBefore < GOOD_DAY_SCORE && after >= GOOD_DAY_SCORE;
      setRingFrom(undefined);
      setOverallShown(undefined);
      setHint(crossed ? `Good day! ${buddy} grew a little` : undefined);
      glow.value = withSequence(withTiming(1, { duration: 200 }), withTiming(0, { duration: 1800 }));
      setTimeout(() => {
        setJustPopped(false);
        setHint(undefined);
        setCelebration(null);
        if (crossed && STREAK_MILESTONES.includes(streakRef.current)) setStreakShow(streakRef.current);
      }, 2600);
    },
    [celebration, buddy, glow, setCelebration]
  );

  /* ---------- copy for each state ---------- */
  let title = "Ready when you are";
  let bub = "";
  let mood: DotMood = "calm";
  let card: React.ReactNode = null;
  let btns: React.ReactNode = null;
  const meta = s ? `${FOCUS_TYPES[s.type].label} · ${rangeLabel(s.start, s.end)} · ${idx} of ${o.today.length} today` : "";

  const leftMin = active ? Math.max(0, Math.ceil((totalSec - elapsedSec()) / 60)) : 0;

  if (st.kind === "ready" && s) {
    title = "Ready when you are";
    bub = active ? "I'll be here when you pop it." : `${s.block.title.split(" ")[0]} now? I'll wait right here.`;
    card = (
      <Card style={{ alignItems: "center" }}>
        <T v="eyebrow" color="accent">{active ? "Focusing now" : "Next session · now"}</T>
        <T v="h2" style={{ textAlign: "center", marginTop: 2 }}>{s.block.title}</T>
        <T v="small" style={{ textAlign: "center" }}>{meta}</T>
      </Card>
    );
    btns = active ? (
      <Btn title="Back to focus" onPress={() => router.push("/focus")} testID="back-to-focus" />
    ) : (
      <>
        <Btn title="Start focus" onPress={() => startFocus(s, o.today)} testID="start-focus" />
        <Btn kind="secondary" title="Running late" onPress={() => setSheet("late")} testID="running-late" />
      </>
    );
  } else if (st.kind === "between" && s) {
    title = "Free for a bit";
    bub = prefs.nudge ? `Rest up. I'll nudge you at ${fmt(s.start - 5)}.` : `Rest up. See you at ${fmt(s.start)}.`;
    card = (
      <Card style={{ alignItems: "center" }}>
        <T v="eyebrow" color="accent">Next session · {fmt(s.start)}</T>
        <T v="h2" style={{ textAlign: "center", marginTop: 2 }}>{s.block.title}</T>
        <T v="small" style={{ textAlign: "center" }}>{meta}</T>
        <T v="small" style={{ marginTop: 4 }}>Free for {freeFor(s.start - o.nowMin)}</T>
      </Card>
    );
    btns = (
      <>
        <Btn title="Start early" onPress={() => startFocus(s, o.today)} testID="start-focus" />
        <Btn kind="secondary" title="Running late" onPress={() => setSheet("late")} testID="running-late" />
      </>
    );
  } else if (st.kind === "missed" && s) {
    title = "That one slipped by";
    bub = "No harm done. Want to fit it in?";
    card = (
      <Card style={{ alignItems: "center" }}>
        <T v="eyebrow" color="accent">Planned for {fmt(s.start)}</T>
        <T v="h2" style={{ textAlign: "center", marginTop: 2 }}>{s.block.title}</T>
        <T v="small" style={{ textAlign: "center" }}>{meta}</T>
      </Card>
    );
    btns = (
      <>
        <Btn title="Do it now" onPress={() => startFocus(s, o.today)} testID="start-focus" />
        <Btn
          kind="secondary"
          title="Skip it"
          onPress={() => {
            patchLog.mutate({ s, patch: { skipped: true } });
            toast(`Skipped ${s.block.title}`, { label: "Undo", onPress: () => patchLog.mutate({ s, patch: { skipped: false } }) });
          }}
        />
      </>
    );
  } else if (st.kind === "done") {
    title = "All popped!";
    mood = "happy";
    bub = doneN === o.today.length ? `${doneN} for ${o.today.length}. Sleep well, I'm stuffed.` : `${doneN} of ${o.today.length} popped. Tomorrow's a fresh balloon.`;
    const r = o.todayReflection;
    card = (
      <>
        <Card>
          <T v="eyebrow" color="accent">Today</T>
          <T v="h2">{dur(doneMins)} focused</T>
          <T v="small">{doneN} of {o.today.length} sessions popped</T>
        </Card>
        {r?.mood ? (
          <Card onPress={() => { setReflectMood(r.mood); setSheet("reflect"); }} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <MoodFace mood={r.mood} size={40} />
            <View style={{ flex: 1 }}>
              <T v="bodyStrong">Today felt {MOOD_LIST.find((m) => m.id === r.mood)?.label.toLowerCase()}</T>
              <T v="small">{r.note ? `"${r.note}"` : "Saved to your week"}</T>
            </View>
          </Card>
        ) : (
          <Card style={{ gap: 8 }}>
            <T v="bodyStrong">How did today feel?</T>
            <MoodRow value={null} onPick={(m) => { setReflectMood(m); setSheet("reflect"); }} />
          </Card>
        )}
      </>
    );
    btns = <Btn title="See tomorrow" onPress={() => router.push({ pathname: "/plan", params: { day: "tomorrow" } })} />;
  } else {
    title = "Nothing planned";
    mood = "sleep";
    bub = "A rest day. I'm napping.";
    card = (
      <Card style={{ alignItems: "center" }}>
        <T v="h2">No focus sessions today</T>
        <T v="small">Rest counts too. Your streak won&apos;t mind.</T>
      </Card>
    );
    btns = <Btn title="Add a session" onPress={() => router.push("/add-block")} />;
  }

  if (justPopped && celebration) {
    title = "Nice one!";
    bub = celebration.early ? `Popped early. ${celebration.mins} minutes still counts!` : "That one felt good!";
    mood = "calm";
  }

  const say = (line: string) => {
    setBoopLine(line);
    if (boopTimer.current) clearTimeout(boopTimer.current);
    boopTimer.current = setTimeout(() => setBoopLine(null), 1800);
  };

  if (o.loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  return (
    <View ref={rootRef} style={{ flex: 1, backgroundColor: c.bg }} collapsable={false}>
      <Screen tabs>
        <View>
          <T v="eyebrow">{format(o.now, "EEE d MMM")} · {fmt(o.nowMin)}</T>
          <T v="display" testID="now-title">{title}</T>
        </View>

        {active ? (
          <Pressable
            onPress={() => router.push("/focus")}
            style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: c.night, borderRadius: 18, padding: 12 }}
          >
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: FIXED.lime }} />
            <T v="bodyStrong" color={c.fInk} style={{ flex: 1 }}>
              {leftMin <= 0 ? "Balloon is full · pop it" : `Focusing · ${active.title} · ${leftMin} min left`}
            </T>
            <T v="bodyStrong" color={c.fSub}>Open ⌃</T>
          </Pressable>
        ) : null}

        <ScoreCard o={o} todayFrom={ringFrom} overallShown={overallShown} hint={hint} onPress={() => setSheet("score")} />

        <View style={{ height: 250, alignItems: "center", justifyContent: "flex-end", zIndex: 10 }}>
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, alignItems: "center", zIndex: 2 }} pointerEvents="none">
            <Bubble name={buddy.toUpperCase()} text={boopLine ?? bub} hidden={!!burst} />
          </View>
          <Animated.View
            pointerEvents="none"
            style={[
              { position: "absolute", bottom: 10, width: 220, height: 160, borderRadius: 110, backgroundColor: FIXED.glow },
              glowStyle,
            ]}
          />
          <View ref={dotBox} collapsable={false}>
            <Dot ref={dotRef} mood={mood} size={210} grow={dotGrowth(o.goodDays)} onBoop={say} testID="dot" />
          </View>
        </View>

        {card}
        <View style={{ gap: 10 }}>{btns}</View>
        {isAnonymous && !justPopped && saveLater !== dateKey(o.now) && o.logs.some((l) => l.completed) ? (
          <Card style={{ gap: 6 }} testID="save-dot-card">
            <T v="eyebrow" color="accent">You popped your first balloon</T>
            <T v="bodyStrong">Save {buddy} so you don&apos;t lose it</T>
            <T v="small">Your plan and {buddy} only live on this phone for now. Add an email to keep them safe.</T>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
              <Btn small title={`Save ${buddy}`} onPress={() => router.push("/save-account")} />
              <Btn
                small
                kind="link"
                title="Later"
                onPress={() => {
                  const k = dateKey(o.now);
                  setSaveLater(k);
                  AsyncStorage.setItem(SAVE_LATER_KEY, k).catch(() => {});
                }}
              />
            </View>
          </Card>
        ) : null}
        {!isGood(o.todayScore) && o.streak > 0 && st.kind !== "empty" ? (
          <T v="small" style={{ textAlign: "center" }}>
            {o.streak}-day streak. Reach {GOOD_DAY_SCORE} today to keep it growing.
          </T>
        ) : null}
      </Screen>

      {burst ? <Particles key={burst.id} origin={burst.origin} target={burst.target} count={40} onLand={onLand} /> : null}

      <ScoreInfoSheet visible={sheet === "score"} onClose={() => setSheet(null)} o={o} />
      <LateSheet visible={sheet === "late"} onClose={() => setSheet(null)} o={o} />
      <ReflectSheet
        visible={sheet === "reflect"}
        initial={{ mood: reflectMood ?? o.todayReflection?.mood ?? null, note: o.todayReflection?.note ?? "" }}
        onClose={() => setSheet(null)}
      />
      <StreakCelebration streak={streakShow} onClose={() => setStreakShow(null)} />
    </View>
  );
}
