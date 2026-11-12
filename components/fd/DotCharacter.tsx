import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { View } from "react-native";
import Svg, { Ellipse, G, Path, Circle, Text as SvgText } from "react-native-svg";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { FIXED, type DotBody } from "@/constants/focusd";
import { usePrefs } from "@/lib/prefs-context";

export type DotMood = "calm" | "happy" | "sleep" | "boop" | "wee";

function fluffPath(cx: number, cy: number, r: number, n: number, amp: number, sq = 1) {
  let d = "";
  for (let i = 0; i <= n; i++) {
    const a0 = ((i - 1) / n) * 2 * Math.PI - Math.PI / 2;
    const a1 = (i / n) * 2 * Math.PI - Math.PI / 2;
    const am = (a0 + a1) / 2;
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1) * sq;
    const xm = cx + r * (1 + amp * 2) * Math.cos(am);
    const ym = cy + r * (1 + amp * 2) * Math.sin(am) * sq;
    d += i ? `Q${xm},${ym} ${x1},${y1}` : `M${x1},${y1}`;
  }
  return d + "Z";
}

/** Dot drawn as SVG. Pure: no gestures or animation. */
export function DotArt({ mood = "calm", size = 200, body, blink = false }: { mood?: DotMood; size?: number; body: DotBody; blink?: boolean }) {
  const w = size;
  const sleepy = mood === "sleep";
  const sq = sleepy ? 0.72 : 1;
  const H = w * 0.95;
  const cx = w / 2;
  const r = w * 0.34;
  const cy = H - r * sq - w * 0.08;
  const e = r * 0.2;
  const fy = cy - r * sq * 0.05;
  const ink = FIXED.dotInk;
  const happyArms = mood === "happy" || mood === "wee";
  return (
    <Svg width={w} height={H} viewBox={`0 0 ${w} ${H}`} style={{ overflow: "visible" }}>
      <Ellipse cx={cx} cy={H - w * 0.03} rx={r * 1.1} ry={w * 0.03} fill={ink} opacity={0.1} />
      {[-1, 1].map((k) => (
        <Ellipse key={k} cx={cx + k * r * 0.38} cy={cy + r * sq * 0.97} rx={r * 0.2} ry={r * 0.1} fill={body.deep} />
      ))}
      <Path d={fluffPath(cx, cy, r, 9, 0.06, sq)} fill={sleepy ? body.sleepy : body.body} />
      <Ellipse cx={cx - r * 0.28} cy={cy - r * sq * 0.45} rx={r * 0.3} ry={r * 0.15 * sq} fill="#fff" opacity={0.35} />
      {!sleepy && (
        <>
          <Path
            d={`M${cx - r * 0.1},${cy - r * 1.02}q${r * 0.05},-${r * 0.38} ${r * 0.25},-${r * 0.3}q-${r * 0.14},${r * 0.12} -${r * 0.05},${r * 0.28}`}
            fill={body.body}
          />
          <Ellipse cx={cx - r} cy={happyArms ? cy - r * 0.35 : cy + r * 0.2} rx={r * 0.13} ry={happyArms ? r * 0.22 : r * 0.2} fill={body.deep}
            rotation={happyArms ? 35 : 25} origin={`${cx - r}, ${happyArms ? cy - r * 0.35 : cy + r * 0.2}`} />
          <Ellipse cx={cx + r} cy={happyArms ? cy - r * 0.35 : cy + r * 0.2} rx={r * 0.13} ry={happyArms ? r * 0.22 : r * 0.2} fill={body.deep}
            rotation={happyArms ? -35 : -25} origin={`${cx + r}, ${happyArms ? cy - r * 0.35 : cy + r * 0.2}`} />
        </>
      )}
      {sleepy ? (
        <G>
          <Path d={`M${cx - e * 1.1},${fy}q${e * 0.45},${e * 0.35} ${e * 0.9},0M${cx + e * 0.2},${fy}q${e * 0.45},${e * 0.35} ${e * 0.9},0`} stroke={ink} strokeWidth={e * 0.22} fill="none" strokeLinecap="round" />
          <SvgText x={cx + r * 0.9} y={cy - r * 0.55} fontSize={w * 0.12} fontWeight="900" fill={ink} opacity={0.4}>z</SvgText>
          <SvgText x={cx + r * 1.25} y={cy - r * 0.95} fontSize={w * 0.08} fontWeight="900" fill={ink} opacity={0.3}>z</SvgText>
        </G>
      ) : mood === "happy" ? (
        <G>
          <Path d={`M${cx - e * 1.1},${fy + e * 0.15}q${e * 0.45},-${e * 0.55} ${e * 0.9},0M${cx + e * 0.2},${fy + e * 0.15}q${e * 0.45},-${e * 0.55} ${e * 0.9},0`} stroke={ink} strokeWidth={e * 0.24} fill="none" strokeLinecap="round" />
          <Path d={`M${cx - e * 0.4},${fy + e * 0.75}q${e * 0.4},${e * 0.6} ${e * 0.8},0z`} fill={ink} />
        </G>
      ) : mood === "boop" ? (
        <G>
          <Path d={`M${cx - e * 1.05},${fy - e * 0.3}l${e * 0.55},${e * 0.3}l-${e * 0.55},${e * 0.3}M${cx + e * 1.05},${fy - e * 0.3}l-${e * 0.55},${e * 0.3}l${e * 0.55},${e * 0.3}`} stroke={ink} strokeWidth={e * 0.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Ellipse cx={cx} cy={fy + e * 0.95} rx={e * 0.22} ry={e * 0.28} fill={ink} />
        </G>
      ) : mood === "wee" ? (
        <G>
          {[-1, 1].map((k) => (
            <Circle key={k} cx={cx + k * e * 0.65} cy={fy} r={e * 0.4} fill={ink} />
          ))}
          {[-1, 1].map((k) => (
            <Circle key={"h" + k} cx={cx + k * e * 0.65 + e * 0.12} cy={fy - e * 0.17} r={e * 0.13} fill="#fff" />
          ))}
          <Ellipse cx={cx} cy={fy + e * 0.95} rx={e * 0.35} ry={e * 0.4} fill={ink} />
        </G>
      ) : (
        <G>
          {blink ? (
            <Path d={`M${cx - e},${fy}h${e * 0.7}M${cx + e * 0.3},${fy}h${e * 0.7}`} stroke={ink} strokeWidth={e * 0.2} strokeLinecap="round" />
          ) : (
            [-1, 1].map((k) => (
              <G key={k}>
                <Ellipse cx={cx + k * e * 0.65} cy={fy} rx={e * 0.36} ry={e * 0.46} fill={ink} />
                <Circle cx={cx + k * e * 0.65 + e * 0.12} cy={fy - e * 0.17} r={e * 0.12} fill="#fff" />
              </G>
            ))
          )}
          <Path d={`M${cx - e * 0.28},${fy + e * 0.85}q${e * 0.28},${e * 0.32} ${e * 0.56},0`} stroke={ink} strokeWidth={e * 0.16} fill="none" strokeLinecap="round" />
        </G>
      )}
      {[-1, 1].map((k) => (
        <Ellipse key={"b" + k} cx={cx + k * e * 1.55} cy={fy + e * 0.7} rx={e * 0.48} ry={e * 0.28} fill={FIXED.blush} opacity={0.45} />
      ))}
    </Svg>
  );
}

export interface DotHandle {
  /** Little squish, e.g. when confetti lands. */
  squash: () => void;
  /** Happy hop. */
  hop: () => void;
}

const BOOPS = ["Hey!", "That tickles!", "Boop.", "Personal space!", "Hee hee.", "Again? Okay!"];

/**
 * Dot, interactive: breathes and blinks, can be dragged around and flung
 * (springs back home), and reacts to a tap with a boop.
 */
export const Dot = forwardRef<
  DotHandle,
  {
    mood?: DotMood;
    size?: number;
    interactive?: boolean;
    /** How grown Dot is, 0.6 (new Wisp) to 1 (Cloudling). `size` is the fully grown size. */
    grow?: number;
    onBoop?: (line: string) => void;
    testID?: string;
  }
>(function Dot({ mood = "calm", size: fullSize = 210, interactive = true, grow = 1, onBoop, testID }, ref) {
  const size = Math.round(fullSize * grow);
  const { dot } = usePrefs();
  const [override, setOverride] = useState<DotMood | null>(null);
  const [blink, setBlink] = useState(false);
  const boopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const rot = useSharedValue(0);
  const sx = useSharedValue(1);
  const sy = useSharedValue(1);
  const breath = useSharedValue(0);
  const hopY = useSharedValue(0);

  useEffect(() => {
    breath.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [breath]);

  useEffect(() => {
    if (mood === "sleep") return;
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    }, 4200 + Math.random() * 1200);
    return () => clearInterval(id);
  }, [mood]);

  useEffect(() => () => {
    if (boopTimer.current) clearTimeout(boopTimer.current);
  }, []);

  const tempMood = useCallback((m: DotMood | null, ms = 900) => {
    setOverride(m);
    if (boopTimer.current) clearTimeout(boopTimer.current);
    if (m) boopTimer.current = setTimeout(() => setOverride(null), ms);
  }, []);

  const doBoop = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    tempMood("boop");
    onBoop?.(BOOPS[Math.floor(Math.random() * BOOPS.length)]);
  }, [onBoop, tempMood]);

  const grabbed = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    setOverride("wee");
  }, []);
  const released = useCallback((hard: boolean) => {
    Haptics.impactAsync(hard ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    tempMood("happy", 1100);
  }, [tempMood]);

  useImperativeHandle(ref, () => ({
    squash: () => {
      sx.value = withSequence(withTiming(1.12, { duration: 90 }), withSpring(1, { damping: 6 }));
      sy.value = withSequence(withTiming(0.88, { duration: 90 }), withSpring(1, { damping: 6 }));
    },
    hop: () => {
      hopY.value = withSequence(withTiming(-40, { duration: 220, easing: Easing.out(Easing.quad) }), withSpring(0, { damping: 7 }));
      tempMood("happy", 2200);
    },
  }), [hopY, sx, sy, tempMood]);

  const pan = Gesture.Pan()
    .enabled(interactive)
    .minDistance(6)
    .onStart(() => {
      runOnJS(grabbed)();
    })
    .onUpdate((e) => {
      tx.value = Math.max(-140, Math.min(140, e.translationX));
      ty.value = Math.max(-170, Math.min(40, e.translationY));
      rot.value = Math.max(-0.5, Math.min(0.5, e.velocityX / 3000));
      const stretch = Math.min(0.18, Math.abs(e.velocityY) / 6000);
      sy.value = 1 + stretch;
      sx.value = 1 - stretch * 0.7;
    })
    .onEnd((e) => {
      const hard = Math.abs(e.velocityX) + Math.abs(e.velocityY) > 1200;
      tx.value = withSpring(0, { velocity: e.velocityX, damping: 9, stiffness: 120 });
      ty.value = withSpring(0, { velocity: e.velocityY, damping: 8, stiffness: 140 });
      rot.value = withSpring(0, { damping: 6 });
      sx.value = withSequence(withTiming(1.1, { duration: 120 }), withSpring(1, { damping: 5 }));
      sy.value = withSequence(withTiming(0.9, { duration: 120 }), withSpring(1, { damping: 5 }));
      runOnJS(released)(hard);
    });

  const tap = Gesture.Tap()
    .enabled(interactive)
    .maxDistance(8)
    .onEnd((_e, ok) => {
      if (!ok) return;
      sx.value = withSequence(withTiming(1.08, { duration: 80 }), withSpring(1, { damping: 5 }));
      sy.value = withSequence(withTiming(0.86, { duration: 80 }), withSpring(1, { damping: 5 }));
      rot.value = withSequence(withTiming(0.12, { duration: 90 }), withSpring(0, { damping: 4 }));
      runOnJS(doBoop)();
    });

  const style = useAnimatedStyle(() => {
    const b = 1 + breath.value * 0.03;
    return {
      transform: [
        { translateX: tx.value },
        { translateY: ty.value + hopY.value },
        { rotate: `${rot.value}rad` },
        { scaleX: sx.value * (2 - b) },
        { scaleY: sy.value * b },
      ],
    };
  });

  const shown = override ?? mood;
  return (
    <GestureDetector gesture={Gesture.Race(pan, tap)}>
      <Animated.View testID={testID} style={[{ alignItems: "center", justifyContent: "flex-end" }, style]}>
        <View pointerEvents="none">
          <DotArt mood={shown} size={size} body={dot} blink={blink && shown === "calm"} />
        </View>
      </Animated.View>
    </GestureDetector>
  );
});
