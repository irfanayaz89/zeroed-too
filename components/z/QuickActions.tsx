/** Done · Note · Skip under the countdown. Done bursts confetti and bounces. */
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { FONTS, FS, mix, STATUS } from "@/constants/theme";
import { haptic } from "@/lib/haptics";
import { useZ } from "@/lib/prefs-context";
import { Icon, type IconName } from "./icons";
import { EASE_OUT, Press } from "./ui";

function Particle({ i, color }: { i: number; color: string }) {
  const k = useSharedValue(0);
  useEffect(() => {
    k.value = withTiming(1, { duration: 420, easing: EASE_OUT });
  }, [k]);
  const a = (Math.PI * 2 * i) / 8 + (i % 2) * 0.2;
  const dist = 30 + i * 5;
  const style = useAnimatedStyle(() => {
    const t = k.value;
    const d = t < 0.25 ? (t / 0.25) * 0.4 : 0.4 + ((t - 0.25) / 0.75) * 0.6;
    const scale = t < 0.25 ? (t / 0.25) * 1.1 : 1.1 - ((t - 0.25) / 0.75) * 0.75;
    return {
      opacity: t < 0.25 ? 1 : 1 - (t - 0.25) / 0.75,
      transform: [{ translateX: Math.cos(a) * dist * d }, { translateY: Math.sin(a) * dist * d }, { scale }],
    };
  });
  return <Animated.View style={[{ position: "absolute", width: 7, height: 7, borderRadius: 3.5, backgroundColor: color }, style]} />;
}

/** 8 particles bursting from the middle of a button. Remount (change `burst`) to replay. */
export function Confetti({ burst }: { burst: number }) {
  const { c, reduceMotion } = useZ();
  if (!burst || reduceMotion) return null;
  const cols = [c.accent, c.good, STATUS.confettiGold, c.text, mix(c.accent, STATUS.white, 0.4)];
  return (
    <View key={burst} pointerEvents="none" style={{ position: "absolute", left: "50%", top: "40%", width: 0, height: 0, alignItems: "center", justifyContent: "center" }}>
      {Array.from({ length: 8 }, (_, i) => (
        <Particle key={i} i={i} color={cols[i % cols.length]} />
      ))}
    </View>
  );
}

function Action({ icon, label, color, onPress, children, a11y, testID }: { icon: IconName; label: string; color: string; onPress: () => void; children?: React.ReactNode; a11y: string; testID?: string }) {
  const { c } = useZ();
  return (
    <Press
      testID={testID}
      accessibilityLabel={a11y}
      onPress={onPress}
      style={{ flex: 1, height: 64, borderRadius: 18, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, alignItems: "center", justifyContent: "center", gap: 5 }}
    >
      <Icon name={icon} size={22} color={color} />
      <Text style={{ fontFamily: FONTS.bold, fontSize: FS.caption, color: c.text }}>{label}</Text>
      {children}
    </Press>
  );
}

export function QuickActions({ onDone, onNote, onSkip }: { onDone: () => void; onNote: () => void; onSkip: () => void }) {
  const { c, reduceMotion } = useZ();
  const [burst, setBurst] = useState(0);
  const bounce = useSharedValue(1);
  const bounceStyle = useAnimatedStyle(() => ({ flex: 1, transform: [{ scale: bounce.value }] }));
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <Animated.View style={bounceStyle}>
        <Action
          testID="qa-done"
          icon="check"
          label="Done"
          color={c.good}
          a11y="Mark block as done"
          onPress={() => {
            haptic.medium();
            if (!reduceMotion) bounce.value = withSequence(withTiming(1.1, { duration: 75 }), withTiming(1, { duration: 75 }));
            setBurst((b) => b + 1);
            // Let the burst play before the screen changes under it.
            setTimeout(onDone, reduceMotion ? 0 : 380);
          }}
        >
          <Confetti burst={burst} />
        </Action>
      </Animated.View>
      <Action testID="qa-note" icon="note" label="Note" color={c.text2} a11y="Add a note" onPress={onNote} />
      <Action testID="qa-skip" icon="skip" label="Skip" color={c.text2} a11y="Skip or move this block" onPress={onSkip} />
    </View>
  );
}
