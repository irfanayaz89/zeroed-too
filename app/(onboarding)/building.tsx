import React, { useEffect, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { FocusArc } from "@/components/z/FocusArc";
import { Screen, T } from "@/components/z/ui";
import { arcColor } from "@/constants/theme";
import { FREE_WINDOWS, generatePlan } from "@/lib/focus";
import { getDraft, setDraft } from "@/lib/onboarding-draft";
import { useZ } from "@/lib/prefs-context";

export default function Building() {
  const router = useRouter();
  const { c } = useZ();
  const { width } = useWindowDimensions();
  const [i, setI] = useState(0);
  const [msgs] = useState(() => {
    const d = getDraft();
    if (!d) return ["Building your plan"];
    const windows = FREE_WINDOWS.filter((w) => d.free.includes(w.id));
    const where = windows.length ? `${windows[0].label.toLowerCase()}${windows.length > 1 ? ` and ${windows.length - 1} more` : ""}` : "your free time";
    const n = d.plan?.reduce((a, b) => a + b.days_of_week.length, 0) ?? 0;
    return [
      `Fitting ${d.focus.slice(0, 2).join(" and ")} into ${where}`,
      `Making blocks ${d.len} minutes long`,
      `Keeping it to ${d.perDay} a day, with room to breathe`,
      `${n} blocks for your first week`,
    ];
  });

  useEffect(() => {
    const d = getDraft();
    if (!d) {
      router.replace("/(onboarding)/setup");
      return;
    }
    if (!d.plan) setDraft({ ...d, plan: generatePlan({ focus: d.focus, free: d.free, perDay: d.perDay, len: d.len }) });
    const id = setInterval(() => setI((x) => Math.min(msgs.length - 1, x + 1)), 800);
    const done = setTimeout(() => router.replace("/(onboarding)/preview"), 3300);
    return () => {
      clearInterval(id);
      clearTimeout(done);
    };
  }, [router, msgs.length]);

  const p = 0.2 + (i / Math.max(1, msgs.length - 1)) * 0.8;
  return (
    <Screen scroll={false}>
      <View style={{ flex: 1 }} />
      <View style={{ alignItems: "center" }}>
        <FocusArc width={Math.min(280, width - 80)} progress={p} color={arcColor(p, c)} />
      </View>
      <View style={{ alignItems: "center", gap: 8, marginTop: 10 }}>
        <T v="page">Building your plan</T>
        <Animated.View key={i} entering={FadeIn.duration(250)}>
          <T v="body" color="text2" style={{ textAlign: "center" }}>
            {msgs[i]}
          </T>
        </Animated.View>
      </View>
      <View style={{ flex: 1 }} />
    </Screen>
  );
}
