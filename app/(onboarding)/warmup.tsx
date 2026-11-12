import React, { useEffect, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { FS } from "@/constants/theme";
import { BlockHero } from "@/components/z/BlockHero";
import { Countdown } from "@/components/z/Countdown";
import { ONBOARDING_STEPS, StepHead, StepTop } from "@/components/z/onboarding";
import { Btn, LinkBtn, Screen, T } from "@/components/z/ui";
import { useNow } from "@/hooks/useFocusData";
import { challengeOf, nowMinutes } from "@/lib/focus";
import { haptic } from "@/lib/haptics";
import { getDraft } from "@/lib/onboarding-draft";

const WARMUP_MS = 2 * 60 * 1000;

/** A 2-minute practice block on the real timer before the plan is built. Skippable. */
export default function Warmup() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const now = useNow(startedAt && !done ? 1000 : 60000);
  const plan = challengeOf(getDraft()?.challenge)?.plan;
  const next = () => router.push("/(onboarding)/nudges");

  const elapsed = startedAt ? now.getTime() - startedAt : 0;
  useEffect(() => {
    if (startedAt && !done && elapsed >= WARMUP_MS) {
      haptic.success();
      setDone(true);
    }
  }, [startedAt, done, elapsed]);

  if (done) {
    return (
      <Screen>
        <StepTop step={4} of={ONBOARDING_STEPS} hideBack />
        <View style={{ flex: 1 }} />
        <Animated.View entering={FadeIn.duration(350)} style={{ alignItems: "center", gap: 10 }}>
          <T v="caps">Warm-up complete</T>
          <T v="page" style={{ textAlign: "center" }}>Nice work</T>
          <T v="body" color="text2" style={{ textAlign: "center", fontSize: FS.body, lineHeight: 22, maxWidth: 300 }}>
            That&apos;s how every block works. It starts on time, counts down, and finished minutes add up to your Focus Score.
          </T>
        </Animated.View>
        <View style={{ flex: 1 }} />
        <Btn title="Continue" onPress={next} testID="warmup-continue" />
      </Screen>
    );
  }

  if (!startedAt) {
    return (
      <Screen>
        <StepTop step={4} of={ONBOARDING_STEPS} />
        <StepHead
          title="Try a 2-minute block"
          lead="Pick one tiny thing: clear your desk, open the doc you've been avoiding, or just breathe. The timer counts you down."
        />
        <View style={{ flex: 1, justifyContent: "center", minHeight: 240 }}>
          <BlockHero width={Math.min(300, width - 70)} mode="block" title="Warm-up" from={nowMinutes(now)} to={nowMinutes(now) + 2} progress={0.35} />
        </View>
        <Btn title="Start the warm-up" testID="warmup-start" onPress={() => { haptic.medium(); setStartedAt(Date.now()); }} />
        <LinkBtn title="Skip for now" onPress={next} testID="warmup-skip" />
      </Screen>
    );
  }

  const fromMin = nowMinutes(new Date(startedAt));
  return (
    <Screen>
      <StepTop step={4} of={ONBOARDING_STEPS} hideBack />
      <View style={{ marginTop: 30 }}>
        <BlockHero width={Math.min(320, width - 60)} mode="block" title="Warm-up" from={fromMin} to={fromMin + 2} progress={elapsed / WARMUP_MS} />
      </View>
      <Countdown targetMs={startedAt + WARMUP_MS} label="ENDS IN" title="Warm-up" />
      {plan ? (
        <T v="small" style={{ textAlign: "center", fontSize: FS.sm, marginTop: 8 }}>
          Your plan: {plan}
        </T>
      ) : null}
      <View style={{ flex: 1 }} />
      <Btn icon="check" title="Done" testID="warmup-done" onPress={() => { haptic.success(); setDone(true); }} />
      <LinkBtn title="Skip" onPress={next} />
    </Screen>
  );
}
