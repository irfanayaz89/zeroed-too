/**
 * The polished semicircle arc. Layers, back to front: horizon line, track
 * glow, dashed track, elapsed glow, elapsed line, comet tail, ticks, a
 * breathing orb halo and the orb core. Spec: ADULT-APP-CONTEXT.md §4.
 */
import React, { useEffect, useId } from "react";
import Svg, { Circle, Defs, FeGaussianBlur, Filter, Line, LinearGradient, Path, RadialGradient, Stop } from "react-native-svg";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { mix, STATUS } from "@/constants/theme";
import { useZ } from "@/lib/prefs-context";

const APath = Animated.createAnimatedComponent(Path);
const ACircle = Animated.createAnimatedComponent(Circle);

const TAIL = 18;
const TAIL_SHARE = 0.16;
const PAD = 26;

export function arcGeometry(width: number) {
  const r = width * 0.42;
  return { r, cx: width / 2, cy: r + PAD, height: r + PAD + 14 };
}

function pt(s: number, cx: number, cy: number, r: number) {
  "worklet";
  const th = Math.PI * (1 - Math.min(1, Math.max(0, s)));
  return { x: cx + r * Math.cos(th), y: cy - r * Math.sin(th) };
}

function seg(a: number, b: number, cx: number, cy: number, r: number) {
  "worklet";
  if (b <= a + 0.0001) return "M 0 0";
  const p0 = pt(a, cx, cy, r);
  const p1 = pt(b, cx, cy, r);
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 0 1 ${p1.x} ${p1.y}`;
}

function TailSegment({ i, shown, cx, cy, r, color }: { i: number; shown: SharedValue<number>; cx: number; cy: number; r: number; color: string }) {
  const k = (i + 1) / TAIL;
  const props = useAnimatedProps(() => {
    const p = shown.value;
    const L = Math.min(TAIL_SHARE, p);
    if (L <= 0) return { d: "M 0 0", strokeOpacity: 0 };
    const a = p - L + (L * i) / TAIL;
    const b = p - L + (L * (i + 1)) / TAIL + 0.002;
    return { d: seg(Math.max(0, a), Math.min(p, b), cx, cy, r), strokeOpacity: 0.15 + 0.85 * k * k };
  });
  return <APath animatedProps={props} stroke={color} strokeWidth={2.5 + k * 1.5} strokeLinecap="round" fill="none" />;
}

export function FocusArc({
  width,
  progress,
  color,
  split = true,
}: {
  width: number;
  /** 0–1. */
  progress: number;
  /** The state colour (see arcColor). */
  color: string;
  /** false between blocks: only the dashed track and a grey orb. */
  split?: boolean;
}) {
  const { c, reduceMotion } = useZ();
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const { r, cx, cy, height } = arcGeometry(width);
  const target = Math.min(1, Math.max(0, progress));
  const shown = useSharedValue(target);
  const breath = useSharedValue(1);

  useEffect(() => {
    shown.value = reduceMotion ? target : withTiming(target, { duration: 400, easing: Easing.out(Easing.cubic) });
  }, [target, reduceMotion, shown]);

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(breath);
      breath.value = 1;
      return;
    }
    breath.value = 0.85;
    breath.value = withRepeat(
      withSequence(withTiming(1.12, { duration: 1000, easing: Easing.inOut(Easing.ease) }), withTiming(0.85, { duration: 1000, easing: Easing.inOut(Easing.ease) })),
      -1
    );
    return () => cancelAnimation(breath);
  }, [reduceMotion, breath]);

  const elapsed = useAnimatedProps(() => ({ d: split ? seg(0, shown.value, cx, cy, r) : "M 0 0" }));
  const elapsedGlow = useAnimatedProps(() => ({ d: split ? seg(0, shown.value, cx, cy, r) : "M 0 0" }));
  const halo = useAnimatedProps(() => {
    const o = pt(shown.value, cx, cy, r);
    return { cx: o.x, cy: o.y, r: 30 * breath.value, opacity: 0.85 + ((breath.value - 0.85) / 0.27) * 0.15 };
  });
  const core = useAnimatedProps(() => {
    const o = pt(shown.value, cx, cy, r);
    return { cx: o.x, cy: o.y };
  });

  const full = seg(0, 1, cx, cy, r);
  const top = pt(0.5, cx, cy, r);
  const left = pt(0, cx, cy, r);
  const right = pt(1, cx, cy, r);
  const coreColor = mix(color.startsWith("#") ? color : STATUS.white, STATUS.white, 0.75);

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      <Defs>
        <Filter id={`${id}g`} x="-50%" y="-50%" width="200%" height="200%">
          <FeGaussianBlur stdDeviation={4} />
        </Filter>
        <RadialGradient id={`${id}o`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={STATUS.white} stopOpacity={1} />
          <Stop offset="0.28" stopColor={color} stopOpacity={0.9} />
          <Stop offset="0.6" stopColor={color} stopOpacity={0.25} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={`${id}h`} x1="0" x2="1" y1="0" y2="0">
          <Stop offset="0" stopColor={c.text3} stopOpacity={0} />
          <Stop offset="0.2" stopColor={c.text3} stopOpacity={0.22} />
          <Stop offset="0.8" stopColor={c.text3} stopOpacity={0.22} />
          <Stop offset="1" stopColor={c.text3} stopOpacity={0} />
        </LinearGradient>
      </Defs>

      <Line x1={0} x2={width} y1={cy} y2={cy} stroke={`url(#${id}h)`} strokeWidth={1} />
      <Path d={full} stroke={color} strokeWidth={6} fill="none" filter={`url(#${id}g)`} opacity={0.18} />
      <Path d={full} stroke={color} strokeWidth={2} strokeDasharray="5 5" strokeLinecap="round" fill="none" opacity={split ? 0.38 : 0.55} />
      {split ? (
        <>
          <APath animatedProps={elapsedGlow} stroke={color} strokeWidth={7} strokeLinecap="round" fill="none" filter={`url(#${id}g)`} opacity={0.45} />
          <APath animatedProps={elapsed} stroke={color} strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.55} />
          {Array.from({ length: TAIL }, (_, i) => (
            <TailSegment key={i} i={i} shown={shown} cx={cx} cy={cy} r={r} color={color} />
          ))}
        </>
      ) : null}
      <Circle cx={top.x} cy={top.y} r={2.5} fill={color} opacity={0.7} />
      <Circle cx={left.x} cy={left.y} r={2} fill={color} opacity={0.6} />
      <Circle cx={right.x} cy={right.y} r={2} fill={color} opacity={0.6} />
      <ACircle animatedProps={halo} fill={`url(#${id}o)`} />
      <ACircle animatedProps={core} r={6} fill={coreColor} />
    </Svg>
  );
}
