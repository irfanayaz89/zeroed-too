/**
 * Rolling-digit countdown (port of the teen app's CountdownTimer). H : M : S,
 * hours only when there is at least one. Only digits that change roll.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import Animated, { Easing, Keyframe } from "react-native-reanimated";
import { FONTS, FS } from "@/constants/theme";
import { useZ } from "@/lib/prefs-context";

const digitEnter = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 20 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }], easing: Easing.out(Easing.cubic) },
}).duration(200);

const digitExit = new Keyframe({
  0: { opacity: 1, transform: [{ translateY: 0 }] },
  100: { opacity: 0, transform: [{ translateY: -20 }], easing: Easing.in(Easing.cubic) },
}).duration(200);

function Digit({ value, color, size, w, h, still }: { value: string; color: string; size: number; w: number; h: number; still: boolean }) {
  const changed = useRef(false);
  const entering = changed.current && !still ? digitEnter : undefined;
  changed.current = true;
  return (
    <View style={{ width: w, height: h, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
      <Animated.View key={value} entering={entering} exiting={still ? undefined : digitExit} style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontFamily: FONTS.light, fontSize: size, lineHeight: h, color, fontVariant: ["tabular-nums"], textAlign: "center" }}>{value}</Text>
      </Animated.View>
    </View>
  );
}

function spoken(seconds: number, title: string) {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h} hour${h === 1 ? "" : "s"}`);
  parts.push(`${m} minute${m === 1 ? "" : "s"}`);
  parts.push(`${sec} second${sec === 1 ? "" : "s"}`);
  return `${parts.join(" ")} remaining in ${title}`;
}

/** Seconds left until `targetMs`, ticking on the second. */
export function useSecondsLeft(targetMs: number) {
  const calc = () => Math.max(0, Math.ceil((targetMs - Date.now()) / 1000));
  const [left, setLeft] = useState(calc);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      setLeft(Math.max(0, Math.ceil((targetMs - Date.now()) / 1000)));
      t = setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };
    tick();
    return () => clearTimeout(t);
  }, [targetMs]);
  return left;
}

export function Countdown({
  targetMs,
  label,
  title,
  big = false,
  testID,
}: {
  targetMs: number;
  label: string;
  title: string;
  /** Focus mode (about 80pt digits) instead of Now (about 66pt). */
  big?: boolean;
  testID?: string;
}) {
  const { c, reduceMotion } = useZ();
  const { height } = useWindowDimensions();
  const left = useSecondsLeft(targetMs);
  const scale = Math.max(0.68, Math.min(1, height / 812));
  const size = Math.round((big ? 80 : 66) * (big ? Math.max(0.8, scale) : scale));
  const dh = Math.round(size * 1.06);
  const dw = Math.round(size * 0.62);
  const sep = Math.round(size * 0.58);

  const H = Math.floor(left / 3600);
  const M = Math.floor((left % 3600) / 60);
  const S = left % 60;
  const bucket = Math.floor(left / 30);
  // Screen readers hear it every 30 seconds, not every tick.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const a11y = useMemo(() => spoken(left, title), [bucket, title]);

  const unit = (u: "H" | "M" | "S", n: number, withSep: boolean) => {
    const s = String(n).padStart(2, "0");
    return (
      <View key={u} style={{ alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Digit value={s[0]} color={c.text} size={size} w={dw} h={dh} still={reduceMotion} />
          <Digit value={s[1]} color={c.text} size={size} w={dw} h={dh} still={reduceMotion} />
          {withSep ? (
            <Text style={{ fontFamily: FONTS.displaySemi, fontSize: sep, lineHeight: dh, color: c.text2, marginHorizontal: 2 }}>:</Text>
          ) : null}
        </View>
        <Text style={{ fontFamily: FONTS.bold, fontSize: FS.unit, color: c.text3, letterSpacing: 1, marginTop: 2 }}>{u}</Text>
      </View>
    );
  };

  return (
    <View testID={testID} accessible accessibilityRole="timer" accessibilityLabel={a11y} style={{ alignItems: "center" }}>
      <Text style={{ fontFamily: FONTS.bold, fontSize: FS.caps, letterSpacing: 2.2, color: c.text2, marginBottom: 4 }}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        {H > 0 ? unit("H", H, true) : null}
        {unit("M", M, true)}
        {unit("S", S, false)}
      </View>
    </View>
  );
}
