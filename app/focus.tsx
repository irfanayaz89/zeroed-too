/** Full-screen focus mode: the big arc and countdown, +5 min and Done, then a completion screen. */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import Animated, {
  Easing,
  FadeIn,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { FONTS, FS, GOOD_DAY_SCORE } from "@/constants/theme";
import { BlockHero } from "@/components/z/BlockHero";
import { Countdown } from "@/components/z/Countdown";
import { Icon } from "@/components/z/icons";
import { CountUp } from "@/components/z/ScoreRing";
import { useToast } from "@/components/z/toast";
import { Btn, EASE_OUT, Press, RoundBtn, T } from "@/components/z/ui";
import { msAt, useBlockActions } from "@/hooks/useBlockActions";
import { useFocusOverview, useNow } from "@/hooks/useFocusData";
import { challengeOf, extendBlocker, fmt, nowMinutes, nowState } from "@/lib/focus";
import { useAuth } from "@/lib/auth-context";
import { haptic } from "@/lib/haptics";
import { usePrefs, useZ } from "@/lib/prefs-context";

/** Faint star dust: fixed positions (x %, y %, radius, brighter?). */
const STARS: [number, number, number, boolean][] = [
  [12, 18, 0.5, true], [78, 9, 0.5, false], [88, 34, 0.75, true], [22, 52, 0.5, false], [64, 61, 0.5, true],
  [8, 74, 0.75, false], [47, 14, 0.5, true], [92, 70, 0.5, false], [34, 83, 0.5, true], [70, 88, 0.5, false],
];

function Backdrop({ glowTop }: { glowTop: number }) {
  const { c, reduceMotion } = useZ();
  const { width, height } = useWindowDimensions();
  const k = useSharedValue(1);
  useEffect(() => {
    if (reduceMotion) return;
    k.value = 0;
    k.value = withRepeat(withSequence(withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })), -1);
    return () => cancelAnimation(k);
  }, [reduceMotion, k]);
  const glow = useAnimatedStyle(() => ({ opacity: 0.7 + 0.3 * k.value, transform: [{ scale: 0.85 + 0.25 * k.value }] }));
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height} style={{ position: "absolute", opacity: 0.5 }}>
        {STARS.map(([x, y, r, bright], i) => (
          <Circle key={i} cx={(x / 100) * width} cy={(y / 100) * height} r={r} fill={bright ? c.text2 : c.text3} />
        ))}
      </Svg>
      <Animated.View style={[{ position: "absolute", left: width / 2 - 210, top: glowTop, width: 420, height: 420 }, glow]}>
        <Svg width={420} height={420}>
          <Defs>
            <RadialGradient id="fglow" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={c.accent} stopOpacity={0.18} />
              <Stop offset="0.65" stopColor={c.accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={210} cy={210} r={210} fill="url(#fglow)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

interface Finished {
  byTap: boolean;
  title: string;
  before: number;
  after: number;
}

function Completion({ f, onBack }: { f: Finished; onBack: () => void }) {
  const { c, reduceMotion } = useZ();
  const ring = useSharedValue(0);
  useEffect(() => {
    if (!reduceMotion) ring.value = withTiming(1, { duration: 1100, easing: EASE_OUT });
  }, [ring, reduceMotion]);
  const burst = useAnimatedStyle(() => ({ opacity: 0.9 * (1 - ring.value), transform: [{ scale: 0.3 + 1.3 * ring.value }] }));
  const gain = Math.max(0, f.after - f.before);
  const crossed = f.before < GOOD_DAY_SCORE && f.after >= GOOD_DAY_SCORE;
  return (
    <Animated.View entering={FadeIn.duration(350)} style={[StyleSheet.absoluteFill, { backgroundColor: c.bg, alignItems: "center", justifyContent: "center", gap: 14, padding: 40 }]} testID="focus-complete">
      <Animated.View pointerEvents="none" style={[{ position: "absolute", width: 260, height: 260, borderRadius: 130, borderWidth: 2, borderColor: c.accent }, burst]} />
      <T v="caps">{f.byTap ? "BLOCK COMPLETE" : "TIME'S UP"}</T>
      <CountUp value={gain} prefix="+" ms={700} style={{ fontFamily: FONTS.displaySemi, fontSize: FS.gain, color: c.accent, fontVariant: ["tabular-nums"] }} />
      <T v="page">{f.byTap ? "Nice work" : "Block finished"}</T>
      <T v="body" color="text2" style={{ textAlign: "center", fontSize: FS.body, lineHeight: 22 }}>
        {f.title} is logged. Focus Score today is now {f.after}
        {crossed ? ", which makes it a good day" : ""}.
      </T>
      <Btn kind="pri" title="Back to today" testID="focus-back" onPress={onBack} style={{ alignSelf: "stretch", height: 52, marginTop: 10 }} />
    </Animated.View>
  );
}

export default function FocusScreen() {
  const { c, reduceMotion } = useZ();
  const { prefs } = usePrefs();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const o = useFocusOverview();
  const act = useBlockActions(o);
  const now = useNow(1000);
  const nowMin = nowMinutes(now);
  const ifThen = challengeOf(useAuth().profile?.focus_struggle)?.plan ?? null;
  const [finished, setFinished] = useState<Finished | null>(null);
  const [key, setKey] = useState<string | null>(null);
  const finishing = useRef(false);

  // Enter: fade in from scale 1.04 over 350ms.
  const enter = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    enter.value = withTiming(1, { duration: 350, easing: EASE_OUT });
  }, [enter]);
  const enterStyle = useAnimatedStyle(() => ({ opacity: enter.value, transform: [{ scale: 1.04 - 0.04 * enter.value }] }));

  useEffect(() => {
    activateKeepAwakeAsync("focus").catch(() => {});
    return () => {
      deactivateKeepAwake("focus").catch(() => {});
    };
  }, []);

  const close = useCallback(() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/now")), [router]);

  // Focus mode stays on the block it was opened for.
  const st = nowState(o.today, nowMin);
  const runningKey = st.kind === "block" ? st.s.key : null;
  useEffect(() => {
    if (!key && runningKey) setKey(runningKey);
  }, [key, runningKey]);
  const s = key ? (o.today.find((x) => x.key === key) ?? null) : null;

  const finish = useCallback(
    (byTap: boolean) => {
      if (!s || finishing.current) return;
      finishing.current = true;
      haptic.success();
      const { before, after } = act.done(s, { quiet: true });
      setFinished({ byTap, title: s.block.title, before, after });
    },
    [s, act]
  );

  useEffect(() => {
    if (o.loading || finished || finishing.current) return;
    // Nothing running (e.g. opened from a stale link), or the block was ended elsewhere.
    if ((!key && !runningKey) || (s && s.status !== "todo")) {
      close();
      return;
    }
    if (s && nowMin >= s.end) finish(false);
  }, [o.loading, key, runningKey, s, nowMin, finished, finish, close]);

  const plusFive = () => {
    if (!s) return;
    const blocker = extendBlocker(o.today, s, 5);
    if (blocker) {
      haptic.warn();
      toast(`Can't extend: ${blocker.block.title} starts at ${fmt(blocker.start)}`);
      return;
    }
    haptic.select();
    act.extend(s, 5);
    toast("Added 5 minutes");
  };

  const compact = height < 760;
  const heroTop = compact ? 36 : 70;
  const arcW = Math.min(340, width - 44);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Animated.View style={[{ flex: 1, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, paddingHorizontal: 22, alignItems: "center" }, enterStyle]}>
        <Backdrop glowTop={insets.top + 16 + 40 + heroTop - 40} />
        <View style={{ width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <RoundBtn icon="down" label="Leave focus mode" onPress={close} testID="focus-leave" />
          <T v="caps" style={{ fontFamily: FONTS.heavy, fontSize: FS.caps, letterSpacing: 2.2 }}>FOCUS MODE</T>
          <View style={{ width: 40 }} />
        </View>
        {s ? (
          <>
            <View style={{ marginTop: heroTop }}>
              <BlockHero big width={arcW} mode="block" title={s.block.title} from={s.start} to={s.end} progress={(nowMin - s.start) / Math.max(1, s.mins)} />
            </View>
            <View style={{ marginTop: 28 }}>
              <Countdown big testID="focus-countdown" targetMs={msAt(s.date, s.end)} label="ENDS IN" title={s.block.title} />
            </View>
            {ifThen && (nowMin - s.start) / s.mins < 0.15 ? (
              <Animated.View entering={FadeIn.duration(300)} style={{ marginTop: 18, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 14 }}>
                <Text style={{ fontFamily: FONTS.semibold, fontSize: FS.sm, color: c.text2, textAlign: "center" }}>Your plan: {ifThen}</Text>
              </Animated.View>
            ) : null}
            {prefs.liveActivity && Platform.OS === "ios" ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 18 }}>
                <Icon name="phone" size={14} color={c.text3} />
                <Text style={{ fontFamily: FONTS.semibold, fontSize: FS.caption, color: c.text3 }}>Also on your Lock Screen as a Live Activity</Text>
              </View>
            ) : null}
            <View style={{ flex: 1 }} />
            <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
              <Press
                testID="focus-plus5"
                accessibilityLabel="Add 5 minutes"
                onPress={plusFive}
                style={{ flex: 1, height: 56, borderRadius: 18, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <Icon name="plus" size={20} color={c.text} strokeWidth={2.2} />
                <Text style={{ fontFamily: FONTS.heavy, fontSize: FS.md, color: c.text }}>5 min</Text>
              </Press>
              <Press
                testID="focus-done"
                accessibilityLabel="Mark block as done"
                onPress={() => finish(true)}
                style={{ flex: 1.4, height: 56, borderRadius: 18, backgroundColor: c.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <Icon name="check" size={20} color={c.onAccent} />
                <Text style={{ fontFamily: FONTS.heavy, fontSize: FS.md, color: c.onAccent }}>Done</Text>
              </Press>
            </View>
          </>
        ) : null}
      </Animated.View>
      {finished ? <Completion f={finished} onBack={close} /> : null}
    </View>
  );
}
