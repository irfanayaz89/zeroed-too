import React, { useEffect, useRef, useState } from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import { FONTS } from "@/constants/focusd";
import { useFd } from "@/lib/prefs-context";

const ACircle = Animated.createAnimatedComponent(Circle);

/** Ring with a number in the middle. Animates (ring + count) when `value` changes. */
export function ScoreRing({ value, size = 96, color, from }: { value: number; size?: number; color?: string; from?: number }) {
  const { c } = useFd();
  const R = size / 2 - 8;
  const L = 2 * Math.PI * R;
  const p = useSharedValue((from ?? value) / 100);
  const [shown, setShown] = useState(from ?? value);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    p.value = withTiming(value / 100, { duration: 1100, easing: Easing.out(Easing.cubic) });
    const start = shown;
    const t0 = Date.now();
    const step = () => {
      const k = Math.min(1, (Date.now() - t0) / 1100);
      setShown(Math.round(start + (value - start) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    if (start !== value) raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const props = useAnimatedProps(() => ({ strokeDashoffset: L * (1 - p.value) }));

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={R} stroke={c.bar} strokeWidth={10} fill="none" />
        <ACircle
          cx={size / 2}
          cy={size / 2}
          r={R}
          stroke={color ?? c.accent}
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${L} ${L}`}
          animatedProps={props}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={{ fontFamily: FONTS.display, fontSize: size * 0.3, color: c.ink }}>{shown}</Text>
    </View>
  );
}
