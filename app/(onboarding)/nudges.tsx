import React, { useMemo, useState } from "react";
import { Platform, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { FONTS, FS } from "@/constants/theme";
import { Icon } from "@/components/z/icons";
import { ONBOARDING_STEPS, StepHead, StepTop } from "@/components/z/onboarding";
import { Btn, LinkBtn, Screen, T } from "@/components/z/ui";
import { FULL_DAY, fmt, toMin } from "@/lib/focus";
import { getDraft } from "@/lib/onboarding-draft";
import { usePrefs, useZ } from "@/lib/prefs-context";

/** Asks for notifications with a concrete example instead of a cold system prompt. */
export default function Nudges() {
  const { c } = useZ();
  const router = useRouter();
  const { setPrefs } = usePrefs();
  const [busy, setBusy] = useState(false);
  const d = getDraft();

  // The first block in the new plan from now on.
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
      if (todays.length) return { ...todays[0], when: i === 0 ? "today" : i === 1 ? "tomorrow" : `on ${FULL_DAY[dow]}` };
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
    setPrefs({ nudge: granted, notStarted: granted });
    setBusy(false);
    done();
  };

  return (
    <Screen>
      <StepTop step={5} of={ONBOARDING_STEPS} />
      <StepHead title="A heads-up before each block?" lead="One quiet reminder 5 minutes before, and nothing during quiet hours (10 pm to 7 am)." />
      <View style={{ flex: 1, justifyContent: "center", minHeight: 200 }}>
        <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 20, padding: 14, flexDirection: "row", gap: 12, alignItems: "center" }}>
          <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: c.accentSoft, alignItems: "center", justifyContent: "center" }}>
            <Icon name="bell" size={20} color={c.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <T v="caps">Zeroed · now</T>
            <Text style={{ fontFamily: FONTS.bold, fontSize: FS.body, color: c.text, marginTop: 2 }}>{first ? `${first.b.title} at ${fmt(first.start)}` : "Your next block"}</Text>
            <T v="small">Starts in 5 minutes.</T>
          </View>
        </View>
        {first ? (
          <T v="small" style={{ textAlign: "center", marginTop: 12 }}>
            Your first one would come {first.when} at {fmt(first.start - 5)}.
          </T>
        ) : null}
      </View>
      <Btn title="Turn on heads-ups" loading={busy} onPress={turnOn} testID="nudges-on" />
      <LinkBtn
        title="Not now"
        testID="nudges-off"
        onPress={() => {
          setPrefs({ nudge: false, notStarted: false });
          done();
        }}
      />
    </Screen>
  );
}
