import React, { useMemo, useState } from "react";
import { Platform, View } from "react-native";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { FIXED } from "@/constants/focusd";
import { Btn, Screen, T } from "@/components/fd/ui";
import { StepTop } from "@/components/fd/onboarding";
import { MiniBalloon } from "@/components/fd/Balloon";
import { usePrefs, useFd } from "@/lib/prefs-context";
import { fmt, toMin } from "@/lib/focus";
import { getDraft } from "@/lib/onboarding-draft";

const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Asks for notifications with a concrete, personal example instead of a cold system prompt. */
export default function Nudges() {
  const { c } = useFd();
  const router = useRouter();
  const { setPrefs } = usePrefs();
  const [busy, setBusy] = useState(false);
  const d = getDraft();
  const buddy = d?.buddy || "Dot";

  // The first session in the new plan from now on.
  const first = useMemo(() => {
    const plan = d?.plan ?? [];
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    for (let i = 0; i < 7; i++) {
      const dow = (now.getDay() + i) % 7;
      const todays = plan
        .filter((b) => b.days_of_week.includes(dow))
        .map((b) => ({ b, start: toMin(b.start_time) }))
        .filter((x) => i > 0 || x.start - 5 > nowMin)
        .sort((a, b) => a.start - b.start);
      if (todays.length) return { ...todays[0], when: i === 0 ? "today" : i === 1 ? "tomorrow" : `on ${DAY[dow]}` };
    }
    return null;
  }, [d?.plan]);

  const done = () => router.push("/(onboarding)/building");

  const turnOn = async () => {
    setBusy(true);
    let granted = Platform.OS === "web";
    if (Platform.OS !== "web") {
      try {
        granted = (await Notifications.requestPermissionsAsync()).granted;
      } catch {
        granted = false;
      }
    }
    setPrefs({ nudge: granted });
    setBusy(false);
    done();
  };

  return (
    <Screen>
      <StepTop step={5} of={6} />
      <View style={{ gap: 6, marginTop: 8 }}>
        <T v="title">Want a nudge before each session?</T>
        <T color="sub">One quiet reminder 5 minutes before, and nothing during your quiet hours. That&apos;s the only notification {buddy} sends.</T>
      </View>
      <View style={{ flex: 1, justifyContent: "center", minHeight: 200 }}>
        <View style={{ backgroundColor: c.night, borderRadius: 22, padding: 14, flexDirection: "row", gap: 12, alignItems: "center" }}>
          <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: c.night2, alignItems: "center", justifyContent: "center" }}>
            <MiniBalloon type={first?.b.category ?? "study"} size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <T v="label" color={c.fSub}>Focus&apos;d · now</T>
            <T v="bodyStrong" color={FIXED.white}>
              {first ? `${first.b.title} at ${fmt(first.start)}` : "Your next session"}
            </T>
            <T v="small" color={c.fInk}>Starts in 5 minutes. {buddy}&apos;s ready when you are.</T>
          </View>
        </View>
        {first ? (
          <T v="small" style={{ textAlign: "center", marginTop: 12 }}>
            Your first one would come {first.when} at {fmt(first.start - 5)}.
          </T>
        ) : null}
      </View>
      <Btn title="Turn on nudges" loading={busy} onPress={turnOn} testID="nudges-on" />
      <Btn
        kind="link"
        title="Not now"
        testID="nudges-off"
        onPress={() => {
          setPrefs({ nudge: false });
          done();
        }}
      />
    </Screen>
  );
}
