import React, { useEffect, useRef, useState } from "react";
import { Text, View, type TextStyle, type StyleProp } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, { useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import { FONTS } from "@/constants/theme";
import { useZ } from "@/lib/prefs-context";
import { EASE_OUT } from "./ui";

const ACircle = Animated.createAnimatedComponent(Circle);

/** A number that counts up (650ms, ease-out cubic) when it changes. */
export function useCountUp(value: number, ms = 650) {
  const { reduceMotion } = useZ();
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (reduceMotion || from.current === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = from.current;
    const t0 = Date.now();
    let raf = 0;
    const step = () => {
      const k = Math.min(1, (Date.now() - t0) / ms);
      setShown(Math.round(start + (value - start) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      from.current = value;
    };
  }, [value, ms, reduceMotion]);
  return shown;
}

export function CountUp({ value, style, prefix = "", ms }: { value: number; style?: StyleProp<TextStyle>; prefix?: string; ms?: number }) {
  const n = useCountUp(value, ms);
  return <Text style={style}>{`${prefix}${n}`}</Text>;
}

/** Score ring. The ring animates over 700ms when `value` changes. */
export function ScoreRing({ value, size, stroke, color, children }: { value: number; size: number; stroke: number; color?: string; children?: React.ReactNode }) {
  const { c, reduceMotion } = useZ();
  const r = (size - stroke) / 2;
  const L = 2 * Math.PI * r;
  const p = useSharedValue(value / 100);
  useEffect(() => {
    p.value = reduceMotion ? value / 100 : withTiming(value / 100, { duration: 700, easing: EASE_OUT });
  }, [value, reduceMotion, p]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: L * (1 - Math.min(1, Math.max(0, p.value))) }));
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.surface2} strokeWidth={stroke} fill="none" />
        <ACircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color ?? c.accent}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${L} ${L}`}
          animatedProps={props}
        />
      </Svg>
      {children}
    </View>
  );
}

export function RingNumber({ value, size }: { value: number; size: number }) {
  const { c } = useZ();
  return <CountUp value={value} style={{ fontFamily: FONTS.displaySemi, fontSize: size, color: c.text, fontVariant: ["tabular-nums"] }} />;
}
