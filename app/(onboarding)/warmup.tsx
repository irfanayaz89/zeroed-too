import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { cancelAnimation, Easing, FadeIn, runOnJS, useAnimatedStyle, useSharedValue, withTiming, ZoomIn } from "react-native-reanimated";
import { FIXED, FONTS, FS, DOT_START } from "@/constants/focusd";
import { Balloon, type BalloonFace } from "@/components/fd/Balloon";
import { Dot, type DotHandle } from "@/components/fd/DotCharacter";
import { Particles, type Pt } from "@/components/fd/Particles";
import { Btn, Screen, T } from "@/components/fd/ui";
import { StepTop } from "@/components/fd/onboarding";
import { useFd } from "@/lib/prefs-context";
import { getDraft } from "@/lib/onboarding-draft";

const WARMUP_SEC = 120;
const HOLD_MS = 800;

/**
 * A 2-minute practice balloon before the real plan: fill it, pop it, and
 * watch the confetti fly into Dot. Skippable.
 */
export default function Warmup() {
  const { c } = useFd();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const buddy = getDraft()?.buddy || "Dot";
  const [phase, setPhase] = useState<"intro" | "filling" | "popped" | "absorb">("intro");
  const [startedAt, setStartedAt] = useState(0);
  const [, setTick] = useState(0);
  const [holding, setHolding] = useState(false);
  const [stage, setStage] = useState({ w: 390, h: 400, y: 0 });
  const [burst, setBurst] = useState<{ origin: Pt; target: Pt | null } | null>(null);
  const [landed, setLanded] = useState(false);
  const hold = useSharedValue(0);
  const dotRef = useRef<DotHandle>(null);
  const dotBox = useRef<View>(null);
  const rootRef = useRef<View>(null);
  const hits = useRef(0);

  useEffect(() => {
    if (phase !== "filling") return;
    const id = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, [phase]);

  const el = phase === "filling" ? Math.min(WARMUP_SEC, (Date.now() - startedAt) / 1000) : 0;
  const p = el / WARMUP_SEC;
  const full = p >= 1;
  const left = Math.max(0, Math.ceil(WARMUP_SEC - el));
  let face: BalloonFace = "start";
  let say = "Breathe in. Pick one tiny thing to do.";
  if (full) {
    face = "full";
    say = "Full! Hold the button to pop me.";
  } else if (p >= 0.75) {
    face = "excited";
    say = "Nearly full!";
  } else if (p >= 0.4) {
    face = "happy";
    say = "Halfway. Nice and steady.";
  } else if (p >= 0.05) {
    face = "calm";
    say = "You've got this.";
  }

  const lastFull = useRef(false);
  useEffect(() => {
    if (full && !lastFull.current) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    lastFull.current = full;
  }, [full]);

  const next = useCallback(() => router.push("/(onboarding)/nudges"), [router]);

  const doPop = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    setBurst({ origin: { x: stage.w / 2, y: stage.y + stage.h * 0.45 }, target: null });
    setPhase("popped");
    // Then switch to Dot and let the confetti fly into it.
    setTimeout(() => {
      setBurst(null);
      setPhase("absorb");
      setTimeout(() => {
        dotBox.current?.measureInWindow((x, y, w, h) => {
          rootRef.current?.measureInWindow((rx, ry, rw, rh) => {
            setBurst({ origin: { x: rw / 2, y: rh * 0.25 }, target: { x: x - rx + w / 2, y: y - ry + h * 0.6 } });
          });
        });
      }, 250);
    }, 900);
  }, [stage]);

  const onLand = useCallback((last: boolean) => {
    hits.current++;
    if (hits.current % 5 === 0) dotRef.current?.squash();
    if (!last) return;
    setBurst(null);
    setLanded(true);
    dotRef.current?.hop();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  const startHold = () => {
    setHolding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    hold.value = withTiming(1, { duration: HOLD_MS, easing: Easing.linear }, (done) => {
      if (done) runOnJS(doPop)();
    });
  };
  const endHold = () => {
    setHolding(false);
    cancelAnimation(hold);
    hold.value = withTiming(0, { duration: 150 });
  };
  const fillStyle = useAnimatedStyle(() => ({ width: `${hold.value * 100}%` }));
  const grow = useAnimatedStyle(() => ({ transform: [{ scale: 1 + hold.value * 0.08 }] }));

  if (phase === "intro") {
    return (
      <Screen>
        <StepTop step={5} of={6} />
        <View style={{ gap: 6, marginTop: 8 }}>
          <T v="title">Let&apos;s try one</T>
          <T color="sub">
            A 2-minute warm-up balloon. It fills while you focus on one tiny thing: tidy your desk, open your notes, or just breathe. When
            it&apos;s full, hold to pop it.
          </T>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", minHeight: 260 }}>
          <Balloon progress={0.15} type="study" face="calm" width={200} />
        </View>
        <T v="small" style={{ textAlign: "center" }}>In real sessions the balloon also shows on your Lock Screen, so you can see it without opening the app.</T>
        <Btn title="Start the warm-up" testID="warmup-start" onPress={() => { setStartedAt(Date.now()); setPhase("filling"); }} />
        <Btn kind="link" title="Skip for now" testID="warmup-skip" onPress={next} />
      </Screen>
    );
  }

  if (phase === "absorb") {
    return (
      <View ref={rootRef} collapsable={false} style={{ flex: 1, backgroundColor: c.bg }}>
        <Screen scroll={false}>
          <View style={{ flex: 1 }} />
          <View style={{ height: 260, alignItems: "center", justifyContent: "flex-end", zIndex: 10 }}>
            <View style={{ position: "absolute", bottom: 0, width: 220, height: 170, borderRadius: 110, backgroundColor: FIXED.glow, opacity: landed ? 0.6 : 0.2 }} />
            <View ref={dotBox} collapsable={false}>
              <Dot ref={dotRef} mood={landed ? "happy" : "wee"} size={260} grow={DOT_START} />
            </View>
          </View>
          {landed ? (
            <Animated.View entering={FadeIn.duration(300)} style={{ alignItems: "center", gap: 8, marginTop: 16 }}>
              <T v="title" style={{ textAlign: "center" }}>{buddy} soaked it up!</T>
              <T color="sub" style={{ textAlign: "center" }}>
                That&apos;s how every session works. Each balloon you pop feeds {buddy}, and good days help it grow.
              </T>
            </Animated.View>
          ) : (
            <View style={{ height: 90 }} />
          )}
          <View style={{ flex: 1 }} />
          {landed ? <Btn title="Continue" onPress={next} testID="warmup-continue" /> : null}
        </Screen>
        {burst ? <Particles origin={burst.origin} target={burst.target} count={40} onLand={onLand} /> : null}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.night, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 18 }}>
      <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 20, height: 40 }}>
        {phase === "filling" ? (
          <Pressable onPress={next} style={{ backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 999, paddingVertical: 9, paddingHorizontal: 16 }}>
            <Text style={{ color: c.fInk, fontFamily: FONTS.heavy, fontSize: FS.md }}>Skip</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={{ alignItems: "center", marginTop: 10 }}>
        <Text style={{ color: c.fSub, fontFamily: FONTS.heavy, fontSize: FS.caption, letterSpacing: 1, textTransform: "uppercase" }}>Warm-up · 2 min</Text>
        {phase === "filling" ? (
          <Animated.Text key={say} entering={FadeIn.duration(250)} style={{ color: c.fInk, fontFamily: FONTS.bold, fontSize: FS.lg, marginTop: 8 }}>
            {say}
          </Animated.Text>
        ) : null}
      </View>
      <View
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        onLayout={(e) => setStage({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height, y: e.nativeEvent.layout.y })}
      >
        <Animated.View style={grow}>
          <Balloon progress={p} type="study" face={face} width={Math.min(280, stage.h * 0.66)} wobble={full} hidden={phase === "popped"} />
        </Animated.View>
        {phase === "popped" ? (
          <Animated.Text entering={ZoomIn.springify().damping(8)} style={{ position: "absolute", top: "40%", fontFamily: FONTS.display, fontSize: FS.pop, color: FIXED.white }}>
            Pop!
          </Animated.Text>
        ) : null}
      </View>
      {phase === "filling" ? (
        <>
          <Text style={{ textAlign: "center", fontFamily: FONTS.display, fontSize: FS.timer, color: c.fInk, marginBottom: 10 }}>
            {full ? "Full!" : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`}
          </Text>
          <View style={{ paddingHorizontal: 20 }}>
            <Pressable
              testID="warmup-pop"
              onPressIn={startHold}
              onPressOut={endHold}
              style={{ minHeight: 58, borderRadius: 999, overflow: "hidden", backgroundColor: full ? FIXED.lime : FIXED.white, alignItems: "center", justifyContent: "center" }}
            >
              <Animated.View style={[{ position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: c.accentLight }, fillStyle]} />
              <Text style={{ fontFamily: FONTS.heavy, fontSize: FS.btn, color: FIXED.dotInk }}>
                {holding ? "Keep holding…" : full ? "Hold to pop" : "Done early? Hold to pop"}
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View style={{ height: 120 }} />
      )}
      {burst && phase === "popped" ? <Particles origin={burst.origin} count={Math.round(22 + 30 * p)} power={0.5 + p} /> : null}
    </View>
  );
}
