import React, { useState } from "react";
import { View } from "react-native";
import { Redirect } from "expo-router";
import { FIXED, FOCUS_TYPES, FS } from "@/constants/focusd";
import { Btn, Card, Row, Screen, T } from "@/components/fd/ui";
import { useToast } from "@/components/fd/toast";
import { useFocusActions } from "@/hooks/useFocusData";
import { useAuth } from "@/lib/auth-context";
import { DAY_SHORT, MON_FIRST, fmt, toMin } from "@/lib/focus";
import { getDraft } from "@/lib/onboarding-draft";

export default function Preview() {
  const d = getDraft();
  const toast = useToast();
  const { refreshProfile } = useAuth();
  const { insertBlocks, updateProfile } = useFocusActions();
  const [busy, setBusy] = useState<null | "plan" | "one">(null);
  if (!d?.plan) return <Redirect href="/(onboarding)/setup" />;
  const plan = d.plan;

  const byDay = MON_FIRST.map((dow) =>
    plan
      .filter((b) => b.days_of_week.includes(dow))
      .map((b) => ({ ...b, start: toMin(b.start_time) }))
      .sort((a, b) => a.start - b.start)
  );
  const total = byDay.reduce((a, l) => a + l.length, 0);

  // "Just one session": the next session in the plan, on that one weekday only.
  const one = (() => {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    for (let i = 0; i < 7; i++) {
      const dow = (now.getDay() + i) % 7;
      const b = plan
        .filter((x) => x.days_of_week.includes(dow) && (i > 0 || toMin(x.start_time) > nowMin))
        .sort((a, b2) => toMin(a.start_time) - toMin(b2.start_time))[0];
      if (b) return { ...b, days_of_week: [dow] };
    }
    return plan[0] ?? null;
  })();

  const finish = async (withPlan: boolean) => {
    setBusy(withPlan ? "plan" : "one");
    try {
      await insertBlocks.mutateAsync(withPlan ? plan : one ? [one] : []);
      await updateProfile.mutateAsync({
        name: d.name || null,
        focus_areas: d.focus,
        free_times: d.free,
        sessions_per_day: d.perDay,
        session_length: d.len,
        focus_struggle: d.challenge,
        buddy_name: d.buddy,
        onboarding_complete: true,
      });
      await refreshProfile();
    } catch {
      setBusy(null);
      toast("Couldn't save your plan. Check your connection and try again.");
    }
  };

  return (
    <Screen>
      <View>
        <T v="eyebrow">Plan preview</T>
        <T v="display">Here&apos;s your week</T>
      </View>
      <T color="sub">{total} focus sessions, all in the times you picked. You can change anything later.</T>
      {byDay.map((list, i) => (
        <Card key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 }}>
          <T v="bodyStrong" style={{ width: 40 }}>{DAY_SHORT[i]}</T>
          <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {list.length ? (
              list.map((b) => (
                <View key={b.title + b.start} style={{ backgroundColor: FOCUS_TYPES[b.category].color, borderRadius: 99, paddingVertical: 5, paddingHorizontal: 10 }}>
                  <T v="small" color={FIXED.dotInk} style={{ fontFamily: "Gabarito_800ExtraBold", fontSize: FS.chip }}>
                    {fmt(b.start, false)} {b.title}
                  </T>
                </View>
              ))
            ) : (
              <T v="small">Rest day</T>
            )}
          </View>
        </Card>
      ))}
      <Row>
        <Btn flex title="Looks good" loading={busy === "plan"} disabled={!!busy} onPress={() => finish(true)} testID="accept-plan" />
      </Row>
      <Btn kind="link" title={one ? `Start with just ${one.title}` : "Start with an empty week"} disabled={!!busy} loading={busy === "one"} onPress={() => finish(false)} testID="one-session" />
    </Screen>
  );
}
