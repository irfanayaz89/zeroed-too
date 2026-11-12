import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import { FONTS, FOCUS_TYPES, FS, FIXED } from "@/constants/focusd";
import { Balloon, type BalloonFace } from "@/components/fd/Balloon";
import { Particles, type Pt } from "@/components/fd/Particles";
import { useFd } from "@/lib/prefs-context";
import { useFocusSession } from "@/lib/focus-session";
import { useFocusActions, useFocusOverview } from "@/hooks/useFocusData";
import { challengeOf, rangeLabel } from "@/lib/focus";
import { useAuth } from "@/lib/auth-context";

const HOLD_MS = 800;

function Pill({ label, onPress, testID }: { label: string; onPress: () => void; testID?: string }) {
  const { c } = useFd();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: "rgba(255,255,255,0.12)",
        borderRadius: 999,
        paddingVertical: 9,
        paddingHorizontal: 16,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ color: c.fInk, fontFamily: FONTS.heavy, fontSize: FS.md }}>{label}</Text>
    </Pressable>
  );
}

export default function FocusScreen() {
  const { c } = useFd();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { active, totalSec, elapsedSec, togglePause, addFive, finish, setCelebration } = useFocusSession();
  const o = useFocusOverview();
  const ifThen = challengeOf(useAuth().profile?.focus_struggle)?.plan ?? null;
  const { patchLog } = useFocusActions();
  const [, setTick] = useState(0);
  const [popped, setPopped] = useState<Pt | null>(null);
  const [boopLine, setBoopLine] = useState<string | null>(null);
  const [holding, setHolding] = useState(false);
  const [stage, setStage] = useState({ w: 390, h: 400, y: 0 });
  const hold = useSharedValue(0);
  const timerPulse = useSharedValue(1);
  const boopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const poppingRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 500);
    activateKeepAwakeAsync("focus").catch(() => {});
    return () => {
      clearInterval(id);
      deactivateKeepAwake("focus").catch(() => {});
    };
  }, []);

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/now");
  }, [router]);

  // Nothing to focus on (e.g. opened from a stale link).
  useEffect(() => {
    if (!active && !popped) close();
  }, [active, popped, close]);

  const el = elapsedSec();
  const left = Math.max(0, totalSec - el);
  const p = totalSec ? Math.min(1, el / totalSec) : 0;
  const mins = Math.ceil(left / 60);
  const paused = !!active?.pausedAt;
  const full = left <= 0;

  let face: BalloonFace = "start";
  let say = "Let's go. Small breaths first.";
  if (full) {
    face = "full";
    say = "Full! Hold to pop me.";
  } else if (left <= 300) {
    face = "excited";
    say = "5 minutes. Almost full!";
  } else if (p >= 0.5) {
    face = "happy";
    say = "Halfway. One thing at a time.";
  } else if (p >= 0.06) {
    face = "calm";
    say = "You've got this.";
  }
  if (paused) say = "Paused. Take a breath.";

  const lastFace = useRef<BalloonFace>(face);
  useEffect(() => {
    if (face === "full" && lastFace.current !== "full") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    lastFace.current = face;
  }, [face]);

  const doPop = useCallback(() => {
    if (!active || poppingRef.current) return;
    poppingRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    const early = elapsedSec() < totalSec - 1;
    const scoreBefore = o.todayScore;
    const overallBefore = o.overall;
    const minutes = finish();
    const block = o.blocks.find((b) => b.id === active.blockId);
    if (block) {
      const log = o.logs.find((l) => l.block_id === block.id && l.date === active.date) ?? null;
      patchLog.mutate({
        s: { block, date: active.date, log },
        patch: {
          completed: true,
          skipped: false,
          completed_at: new Date().toISOString(),
          started_at: new Date(active.startedAt).toISOString(),
          focused_minutes: Math.min(active.plannedMins + active.extraMins, minutes),
        },
      });
    }
    setPopped({ x: stage.w / 2, y: stage.y + stage.h * 0.36 });
    setTimeout(() => {
      setCelebration({ mins: minutes, early, scoreBefore, overallBefore, at: Date.now() });
      close();
    }, 950);
  }, [active, elapsedSec, totalSec, o.todayScore, o.overall, o.blocks, o.logs, finish, patchLog, stage, setCelebration, close]);

  const startHold = () => {
    if (!active || popped) return;
    setHolding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    hold.value = withTiming(1, { duration: HOLD_MS, easing: Easing.linear }, (done) => {
      if (done) runOnJS(doPop)();
    });
  };
  const endHold = () => {
    setHolding(false);
    if (poppingRef.current) return;
    cancelAnimation(hold);
    hold.value = withTiming(0, { duration: 150 });
  };

  const fillStyle = useAnimatedStyle(() => ({ width: `${hold.value * 100}%` }));
  const grow = useAnimatedStyle(() => ({ transform: [{ scale: 1 + hold.value * 0.08 }] }));
  const timerStyle = useAnimatedStyle(() => ({ transform: [{ scale: timerPulse.value }] }));

  const onBoop = (line: string) => {
    setBoopLine(line);
    if (boopTimer.current) clearTimeout(boopTimer.current);
    boopTimer.current = setTimeout(() => setBoopLine(null), 1600);
  };

  if (!active && !popped) return <View style={{ flex: 1, backgroundColor: c.night }} />;
  const type = active?.type ?? "study";

  return (
    <View style={{ flex: 1, backgroundColor: c.night, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 18 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20 }}>
        <Pill label="⌄ Minimise" onPress={close} testID="focus-minimise" />
        {!popped ? <Pill label={paused ? "Resume" : "Pause"} onPress={togglePause} testID="focus-pause" /> : null}
      </View>

      {active ? (
        <View style={{ alignItems: "center", marginTop: 14, paddingHorizontal: 24 }}>
          <Text style={{ color: c.fSub, fontFamily: FONTS.heavy, fontSize: FS.caption, letterSpacing: 1, textTransform: "uppercase" }}>
            {FOCUS_TYPES[type].label} · Session {active.index} of {active.count}
          </Text>
          <Text style={{ color: c.fInk, fontFamily: FONTS.heavy, fontSize: FS.h3, marginTop: 2, textAlign: "center" }}>{active.title}</Text>
          <Text style={{ color: c.fSub, fontFamily: FONTS.semibold, fontSize: FS.md }}>{rangeLabel(active.start, active.end + active.extraMins)}</Text>
          {ifThen && p < 0.15 ? (
            <Animated.View entering={FadeIn.duration(300)} style={{ marginTop: 10, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 16, paddingVertical: 8, paddingHorizontal: 14 }}>
              <Text style={{ color: c.fInk, fontFamily: FONTS.bold, fontSize: FS.sm, textAlign: "center" }}>Your plan: {ifThen}</Text>
            </Animated.View>
          ) : null}
        </View>
      ) : null}

      <View style={{ height: 30, alignItems: "center", justifyContent: "center", marginTop: 8 }}>
        {!popped ? (
          <Animated.Text key={boopLine ?? say} entering={FadeIn.duration(250)} style={{ color: c.fInk, fontFamily: FONTS.bold, fontSize: FS.lg }}>
            {boopLine ?? say}
          </Animated.Text>
        ) : null}
      </View>

      <View
        style={{ flex: 1, alignItems: "center", justifyContent: "center", opacity: paused ? 0.6 : 1 }}
        onLayout={(e) => setStage({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height, y: e.nativeEvent.layout.y })}
      >
        <Animated.View style={grow}>
          <Balloon progress={p} type={type} face={face} width={Math.min(300, stage.h * 0.68)} wobble={full} onBoop={onBoop} hidden={!!popped} />
        </Animated.View>
        {popped ? (
          <Animated.Text
            entering={ZoomIn.springify().damping(8)}
            style={{ position: "absolute", top: "38%", fontFamily: FONTS.display, fontSize: FS.pop, color: FIXED.white }}
          >
            Pop!
          </Animated.Text>
        ) : null}
      </View>

      {!popped ? (
        <>
          <Animated.View style={[{ alignItems: "center", marginVertical: 10 }, timerStyle]}>
            <Text style={{ fontFamily: FONTS.display, fontSize: FS.timer, color: c.fInk }} testID="focus-timer">
              {full ? "Full!" : mins}
              <Text style={{ fontFamily: FONTS.heavy, fontSize: FS.xl, color: c.fSub }}>{full ? " pop me" : " min left"}</Text>
            </Text>
          </Animated.View>
          <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 20 }}>
            <Pressable
              testID="pop-button"
              onPressIn={startHold}
              onPressOut={endHold}
              style={{
                flex: 1,
                minHeight: 58,
                borderRadius: 999,
                overflow: "hidden",
                backgroundColor: full ? FIXED.lime : FIXED.white,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Animated.View style={[{ position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: c.accentLight }, fillStyle]} />
              <Text style={{ fontFamily: FONTS.heavy, fontSize: FS.btn, color: FIXED.dotInk }}>
                {holding ? (full ? "Keep holding…" : "Keep holding to pop early…") : "Done? Hold to pop"}
              </Text>
            </Pressable>
            <Pressable
              testID="plus-five"
              onPress={() => {
                addFive();
                Haptics.selectionAsync().catch(() => {});
                timerPulse.value = withSequence(withTiming(1.15, { duration: 120 }), withSpring(1));
              }}
              style={{ minHeight: 58, paddingHorizontal: 20, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ fontFamily: FONTS.heavy, fontSize: FS.lg, color: c.fInk }}>+5 min</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View style={{ height: 120 }} />
      )}

      {popped ? <Particles origin={popped} count={Math.round(22 + 30 * p)} power={0.5 + p} /> : null}
    </View>
  );
}
