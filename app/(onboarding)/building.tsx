import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { Screen, T } from "@/components/fd/ui";
import { Balloon } from "@/components/fd/Balloon";
import { FREE_WINDOWS, generatePlan } from "@/lib/focus";
import { getDraft, setDraft } from "@/lib/onboarding-draft";

export default function Building() {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [msgs] = useState(() => {
    const d = getDraft();
    if (!d) return ["Building your plan"];
    const windows = FREE_WINDOWS.filter((w) => d.free.includes(w.id));
    const where = windows.length ? `${windows[0].label.toLowerCase()}${windows.length > 1 ? ` and ${windows.length - 1} more` : ""}` : "your free time";
    const n = d.plan?.reduce((a, b) => a + b.days_of_week.length, 0) ?? 0;
    return [
      `Fitting ${d.focus.slice(0, 2).join(" and ")} into ${where}`,
      `Making sessions ${d.len} minutes long`,
      `Keeping it to ${d.perDay} a day, with room to breathe`,
      `Blowing up ${n} balloons for ${d.buddy || "Dot"}`,
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

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1 }} />
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 4, height: 220 }}>
        <Balloon progress={0.3 + i * 0.15} type="study" face="calm" width={110} />
        <View style={{ marginBottom: 24 }}>
          <Balloon progress={0.4 + i * 0.15} type="hobby" face="happy" width={130} />
        </View>
        <Balloon progress={0.2 + i * 0.15} type="reading" face="start" width={110} />
      </View>
      <View style={{ alignItems: "center", gap: 8 }}>
        <T v="title">Building your plan…</T>
        <Animated.View key={i} entering={FadeIn.duration(250)}>
          <T color="sub">{msgs[i]}</T>
        </Animated.View>
      </View>
      <View style={{ flex: 1 }} />
    </Screen>
  );
}
