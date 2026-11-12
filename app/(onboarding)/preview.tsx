import React, { useState } from "react";
import { Text, View } from "react-native";
import { Redirect } from "expo-router";
import { CATEGORIES, FONTS, FS } from "@/constants/theme";
import { useToast } from "@/components/z/toast";
import { Btn, Card, LinkBtn, Screen, T } from "@/components/z/ui";
import { useFocusActions } from "@/hooks/useFocusData";
import { useAuth } from "@/lib/auth-context";
import { DAY_SHORT, MON_FIRST, blockMinutes, dur, fmtShort, toMin } from "@/lib/focus";
import { getDraft } from "@/lib/onboarding-draft";
import { useZ } from "@/lib/prefs-context";

export default function Preview() {
  const { c } = useZ();
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
  const minutes = plan.reduce((a, b) => a + b.days_of_week.length * blockMinutes(b), 0);

  // "Just one block": the next block in the plan, on that one weekday only.
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
        <T v="caps" style={{ fontSize: FS.caps }}>Plan preview</T>
        <T v="page">Here&apos;s your week</T>
      </View>
      <T v="body" color="text2" style={{ fontSize: FS.body, lineHeight: 22 }}>
        {total} focus blocks, {dur(minutes)} in all, inside the times you picked. You can change anything later.
      </T>
      <View style={{ gap: 8 }}>
        {byDay.map((list, i) => (
          <Card key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 }}>
            <Text style={{ width: 36, fontFamily: FONTS.bold, fontSize: FS.sm, color: c.text2 }}>{DAY_SHORT[i]}</Text>
            <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {list.length ? (
                list.map((b) => (
                  <View key={b.title + b.start} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: c.surface2, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10 }}>
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: CATEGORIES[b.category].color }} />
                    <Text style={{ fontFamily: FONTS.bold, fontSize: FS.caption, color: c.text }}>
                      {fmtShort(b.start)} {b.title}
                    </Text>
                  </View>
                ))
              ) : (
                <T v="small">Rest day</T>
              )}
            </View>
          </Card>
        ))}
      </View>
      <Btn title="Looks good" loading={busy === "plan"} disabled={!!busy} onPress={() => finish(true)} testID="accept-plan" />
      <LinkBtn title={one ? `Start with just ${one.title}` : "Start with an empty week"} onPress={() => !busy && finish(false)} testID="one-block" />
    </Screen>
  );
}
