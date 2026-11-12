import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { FIXED, FOCUS_TYPES, type FocusType } from "@/constants/focusd";

export type BalloonFace = "start" | "calm" | "happy" | "excited" | "full" | "boop";

let gid = 0;

/** The session balloon: face changes as it fills; accessory depends on the focus type. */
export function BalloonArt({
  face,
  type,
  width = 300,
  stringColor = "#E9AFCF",
}: {
  face: BalloonFace;
  type: FocusType;
  width?: number;
  stringColor?: string;
}) {
  const [id] = useState(() => `bg${gid++}`);
  const T = FOCUS_TYPES[type] ?? FOCUS_TYPES.study;
  const ink = FIXED.dotInk;
  const pink = FIXED.blush;
  const cx = 150, cy = 170, r = 120, ey = cy - 8, ex = 34, my = ey + 46;
  return (
    <Svg width={width} height={(width * 420) / 300} viewBox="0 0 300 420" style={{ overflow: "visible" }}>
      <Defs>
        <RadialGradient id={id} cx="34%" cy="28%" r="80%">
          <Stop offset="0" stopColor="#FDFFF2" />
          <Stop offset="0.22" stopColor={T.color} />
          <Stop offset="1" stopColor={T.deep} />
        </RadialGradient>
      </Defs>
      <Path d={`M${cx},${cy + r * 1.15 + 12} C${cx - 14},${cy + r * 1.15 + 50} ${cx + 16},${cy + r * 1.15 + 80} ${cx},414`} stroke={stringColor} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      {type === "project" && (
        <G rotation={-38} origin={`${cx + 92}, ${cy - 70}`}>
          <Rect x={cx + 60} y={cy - 78} width={78} height={16} rx={3} fill="#F2C23C" />
          <Rect x={cx + 60} y={cy - 78} width={14} height={16} fill="#FF8FC0" />
          <Path d={`M${cx + 138},${cy - 78} l16,8 l-16,8z`} fill="#F4D9B0" />
          <Path d={`M${cx + 148},${cy - 73} l6,3 l-6,3z`} fill={ink} />
        </G>
      )}
      <Ellipse cx={cx} cy={cy} rx={r} ry={r * 1.15} fill={`url(#${id})`} />
      <Path d={`M${cx - 11},${cy + r * 1.15 + 13} l11,-15 l11,15z`} fill={T.deep} />
      <Ellipse cx={cx - 48} cy={cy - 70} rx={20} ry={32} fill="#fff" opacity={0.45} rotation={25} origin={`${cx - 48}, ${cy - 70}`} />
      {face === "full" || face === "excited" ? (
        [-1, 1].map((k) => (
          <Path key={k} d={`M${cx + k * ex},${ey - 16} l4,10 l11,1 l-9,7 l3,11 l-9,-6 l-9,6 l3,-11 l-9,-7 l11,-1z`} fill={ink} />
        ))
      ) : face === "happy" ? (
        [-1, 1].map((k) => (
          <Path key={k} d={`M${cx + k * ex - 13},${ey + 4} q13,-18 26,0`} stroke={ink} strokeWidth={7} fill="none" strokeLinecap="round" />
        ))
      ) : face === "boop" ? (
        <Path d={`M${cx - ex - 12},${ey - 10} l16,10 l-16,10 M${cx + ex + 12},${ey - 10} l-16,10 l16,10`} stroke={ink} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        [-1, 1].map((k) => (
          <G key={k}>
            <Ellipse cx={cx + k * ex} cy={ey} rx={12} ry={15} fill={ink} />
            <Circle cx={cx + k * ex + 4} cy={ey - 6} r={4.5} fill="#fff" />
          </G>
        ))
      )}
      {type === "study" && (
        <G fill="none" stroke={ink} strokeWidth={5}>
          <Circle cx={cx - ex} cy={ey} r={25} />
          <Circle cx={cx + ex} cy={ey} r={25} />
          <Path d={`M${cx - 9},${ey - 2} q9,-8 18,0`} />
          <Path d={`M${cx - ex - 25},${ey - 4} l-18,-8 M${cx + ex + 25},${ey - 4} l18,-8`} />
        </G>
      )}
      {type === "hobby" && (
        <G>
          <Path d={`M${cx - r + 6},${cy - 10} C${cx - r + 10},${cy - r * 1.25} ${cx + r - 10},${cy - r * 1.25} ${cx + r - 6},${cy - 10}`} stroke={ink} strokeWidth={9} fill="none" strokeLinecap="round" />
          <Rect x={cx - (r - 6) - 14} y={cy - 30} width={28} height={46} rx={12} fill={pink} />
          <Rect x={cx + (r - 6) - 14} y={cy - 30} width={28} height={46} rx={12} fill={pink} />
        </G>
      )}
      {type === "reading" && (
        <G>
          <Path d={`M${cx - 70},${cy - r * 0.92} C${cx - 60},${cy - r * 1.45} ${cx + 60},${cy - r * 1.45} ${cx + 70},${cy - r * 0.92} Z`} fill={pink} />
          <Rect x={cx - 76} y={cy - r * 0.98} width={152} height={16} rx={8} fill={ink} />
          <Circle cx={cx} cy={cy - r * 1.36} r={13} fill="#fff" />
        </G>
      )}
      {[-1, 1].map((k) => (
        <Ellipse key={"bl" + k} cx={cx + k * 72} cy={ey + 30} rx={16} ry={9} fill={pink} opacity={0.4} />
      ))}
      {face === "start" || face === "boop" ? (
        <Ellipse cx={cx} cy={my} rx={9} ry={11} fill={ink} />
      ) : face === "calm" ? (
        <Path d={`M${cx - 14},${my - 3} q14,14 28,0`} stroke={ink} strokeWidth={6} fill="none" strokeLinecap="round" />
      ) : face === "happy" ? (
        <Path d={`M${cx - 20},${my - 6} q20,30 40,0z`} fill={ink} />
      ) : (
        <G>
          <Path d={`M${cx - 24},${my - 8} q24,36 48,0z`} fill={ink} />
          <Path d={`M${cx - 10},${my + 6} q10,8 20,0`} fill={pink} />
        </G>
      )}
    </Svg>
  );
}

const BOOPS = ["Hey, focus!", "Eyes on the work.", "Hee hee.", "Still filling up!", "Boop. Back to it."];

/**
 * Interactive session balloon: sways on its string, can be grabbed and flung
 * (it swings back), and reacts to a tap. `progress` (0–1) sets how inflated it is.
 */
export function Balloon({
  progress,
  type,
  face,
  width = 300,
  wobble,
  onBoop,
  hidden,
}: {
  progress: number;
  type: FocusType;
  face: BalloonFace;
  width?: number;
  /** Shake when full. */
  wobble?: boolean;
  onBoop?: (line: string) => void;
  hidden?: boolean;
}) {
  const H = (width * 420) / 300;
  const [boop, setBoop] = useState(false);
  const scale = useSharedValue(0.28 + 0.72 * progress);
  const swing = useSharedValue(0);
  const drag = useSharedValue(0);
  const lift = useSharedValue(0);
  const squish = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(0.28 + 0.72 * Math.min(1, progress), { damping: 12, stiffness: 80 });
  }, [progress, scale]);

  useEffect(() => {
    swing.value = withRepeat(
      withTiming(1, { duration: wobble ? 250 : 1700, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [wobble, swing]);

  const doBoop = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setBoop(true);
    setTimeout(() => setBoop(false), 900);
    onBoop?.(BOOPS[Math.floor(Math.random() * BOOPS.length)]);
  }, [onBoop]);
  const grabbed = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
  }, []);

  const pan = Gesture.Pan()
    .minDistance(6)
    .onStart(() => runOnJS(grabbed)())
    .onUpdate((e) => {
      drag.value = Math.max(-1.05, Math.min(1.05, e.translationX / 160));
      lift.value = Math.max(-40, Math.min(50, e.translationY * 0.4));
    })
    .onEnd((e) => {
      drag.value = withSpring(0, { velocity: e.velocityX / 160, damping: 4, stiffness: 60 });
      lift.value = withSpring(0, { damping: 6 });
    });
  const tap = Gesture.Tap()
    .maxDistance(8)
    .onEnd((_e, ok) => {
      if (!ok) return;
      drag.value = withSequence(withTiming(0.25, { duration: 120 }), withSpring(0, { damping: 4, stiffness: 60 }));
      squish.value = withSequence(withTiming(1, { duration: 90 }), withSpring(0, { damping: 5 }));
      runOnJS(doBoop)();
    });

  const style = useAnimatedStyle(() => {
    const idle = (swing.value - 0.5) * (wobble ? 0.14 : 0.1);
    const q = squish.value * 0.12;
    return {
      transform: [
        { translateY: lift.value },
        { translateY: H / 2 },
        { rotate: `${drag.value + idle}rad` },
        { translateY: -H / 2 },
        { translateY: (1 - scale.value) * H * 0.42 },
        { scaleX: scale.value * (1 + q) },
        { scaleY: scale.value * (1 - q) },
      ],
    };
  });

  return (
    <GestureDetector gesture={Gesture.Race(pan, tap)}>
      <Animated.View style={[{ width, height: H, opacity: hidden ? 0 : 1 }, style]}>
        <View pointerEvents="none">
          <BalloonArt face={boop ? "boop" : face} type={type} width={width} />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

export function MiniBalloon({ type, size = 30 }: { type: FocusType; size?: number }) {
  const T = FOCUS_TYPES[type] ?? FOCUS_TYPES.study;
  const ink = FIXED.dotInk;
  return (
    <Svg width={size} height={size * 1.25} viewBox="0 0 32 40">
      <Ellipse cx={16} cy={15} rx={12} ry={14} fill={T.color} />
      <Ellipse cx={11} cy={9} rx={3} ry={4.5} fill="#fff" opacity={0.5} rotation={25} origin="11, 9" />
      <Path d="M14 30 l2 -3 l2 3z" fill={T.deep} />
      <Path d="M16 30 q-2 4 0 9" stroke="#C98AAE" strokeWidth={1.5} fill="none" />
      <Circle cx={12} cy={15} r={1.6} fill={ink} />
      <Circle cx={20} cy={15} r={1.6} fill={ink} />
      <Path d="M13.5 19 q2.5 2 5 0" stroke={ink} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function PoppedIcon({ size = 34 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 34 34">
      {[0, 60, 120, 180, 240, 300].map((a) => {
        const rad = (a * Math.PI) / 180;
        return (
          <Path
            key={a}
            d={`M${17 + 9 * Math.cos(rad)},${17 + 9 * Math.sin(rad)} l${5 * Math.cos(rad)},${5 * Math.sin(rad)}`}
            stroke={FIXED.limeDeep}
            strokeWidth={3}
            strokeLinecap="round"
          />
        );
      })}
      <Circle cx={17} cy={17} r={4} fill={FIXED.blush} />
    </Svg>
  );
}
