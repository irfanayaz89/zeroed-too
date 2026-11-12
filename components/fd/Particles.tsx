import React, { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { FIXED } from "@/constants/focusd";

export interface Pt {
  x: number;
  y: number;
}

interface PieceSpec {
  dx: number;
  dy: number;
  size: number;
  round: boolean;
  color: string;
  spin: number;
  delay: number;
  fly: number;
}

function Piece({ spec, origin, target, onLand, last }: { spec: PieceSpec; origin: Pt; target: Pt | null; onLand?: (last: boolean) => void; last: boolean }) {
  const k = useSharedValue(0);
  const f = useSharedValue(0);
  useEffect(() => {
    k.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
    if (target) {
      f.value = withDelay(
        700 + spec.delay,
        withTiming(1, { duration: spec.fly, easing: Easing.in(Easing.quad) }, (done) => {
          if (done && onLand) runOnJS(onLand)(last);
        })
      );
    }
  }, [k, f, target, spec, onLand, last]);

  const style = useAnimatedStyle(() => {
    const ex = origin.x + spec.dx * k.value;
    const ey = origin.y + spec.dy * k.value;
    const x = target ? ex + (target.x - ex) * f.value : ex;
    const y = target ? ey + (target.y - ey) * f.value - Math.sin(f.value * Math.PI) * 60 : ey + k.value * k.value * 30;
    return {
      opacity: target ? 1 - f.value * 0.7 : 1 - Math.max(0, k.value - 0.6) * 2.5,
      transform: [
        { translateX: x - spec.size / 2 },
        { translateY: y - spec.size / 2 },
        { rotate: `${spec.spin * k.value}deg` },
        { scale: target ? 1 - f.value * 0.7 : 1 },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: 0,
          top: 0,
          width: spec.size,
          height: spec.round ? spec.size : spec.size * 0.5,
          borderRadius: spec.round ? spec.size / 2 : 2,
          backgroundColor: spec.color,
        },
        style,
      ]}
    />
  );
}

/**
 * Confetti burst at `origin`. With a `target`, the pieces then fly into it
 * (calls onLand for each piece, with last=true for the final one).
 */
export function Particles({
  origin,
  target = null,
  count = 44,
  power = 1,
  onLand,
}: {
  origin: Pt;
  target?: Pt | null;
  count?: number;
  power?: number;
  onLand?: (last: boolean) => void;
}) {
  const specs = useMemo<PieceSpec[]>(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = Math.random() * Math.PI * 2;
        const dist = (70 + Math.random() * 120) * (0.5 + power * 0.5);
        return {
          dx: Math.cos(a) * dist,
          dy: Math.sin(a) * dist,
          size: 6 + Math.random() * 9,
          round: i % 3 === 0,
          color: FIXED.confetti[i % FIXED.confetti.length],
          spin: Math.random() * 540,
          delay: i * 26,
          fly: 650 + Math.random() * 300,
        };
      }),
    [count, power]
  );
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {specs.map((s, i) => (
        <Piece key={i} spec={s} origin={origin} target={target} onLand={onLand} last={i === specs.length - 1} />
      ))}
    </View>
  );
}
