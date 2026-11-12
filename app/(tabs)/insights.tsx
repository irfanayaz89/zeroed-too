import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { FIXED, DOT_STAGES, GOOD_DAY_SCORE, FS } from "@/constants/focusd";
import { Btn, Card, ProgressBar, Row, Screen, T } from "@/components/fd/ui";
import { ScoreRing } from "@/components/fd/ScoreRing";
import { Dot } from "@/components/fd/DotCharacter";
import { MoodFace } from "@/components/fd/MoodFace";
import { Bubble, ReflectSheet, ScoreInfoSheet, trendText, useBuddyName } from "@/components/fd/shared";
import { useFocusOverview } from "@/hooks/useFocusData";
import { useFd } from "@/lib/prefs-context";
import { DAY_SHORT, STREAK_MILESTONES, dateKey, dur, sessionsOn, slipReport, weekDates, dotGrowth } from "@/lib/focus";

export default function InsightsScreen() {
  const o = useFocusOverview();
  const { c } = useFd();
  const router = useRouter();
  const buddy = useBuddyName();
  const [sheet, setSheet] = useState<null | "score" | "reflect">(null);
  const [boop, setBoop] = useState<string | null>(null);

  const todayKey = dateKey(o.now);
  const week = weekDates(o.now);
  const bars = useMemo(
    () =>
      week.map((d) => {
        const key = dateKey(d);
        const ss = sessionsOn(d, o.blocks, o.logs);
        const future = key > todayKey;
        const value = future ? ss.reduce((a, s) => a + s.mins, 0) : ss.reduce((a, s) => a + s.actual, 0);
        return { key, future, value, today: key === todayKey, mood: o.reflections.find((r) => r.date === key)?.mood ?? null };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [o.blocks, o.logs, o.reflections, todayKey]
  );
  const max = Math.max(60, ...bars.map((b) => b.value));
  const weekMins = bars.filter((b) => !b.future).reduce((a, b) => a + b.value, 0);
  const allMins = o.logs.reduce((a, l) => a + (l.completed ? l.focused_minutes ?? 0 : 0), 0);
  const todayMins = o.today.reduce((a, s) => a + s.actual, 0);
  const nextMilestone = STREAK_MILESTONES.find((m) => m > o.streak) ?? o.streak + 30;
  const slips = useMemo(() => slipReport(o.blocks, o.logs, o.now), [o.blocks, o.logs, o.now]);
  const stage = o.stage;
  const goodNeed = stage.next?.goodDays ?? o.goodDays;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Screen tabs>
        <Row style={{ justifyContent: "space-between" }}>
          <View>
            <T v="eyebrow">Your focus</T>
            <T v="display">Insights</T>
          </View>
          <View style={{ backgroundColor: c.card, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 }}>
            <T v="bodyStrong" style={{ fontSize: FS.md }}>{o.streak}-day streak</T>
          </View>
        </Row>

        <Card onPress={() => setSheet("score")} testID="insights-score">
          <Row style={{ justifyContent: "space-around" }}>
            <View style={{ alignItems: "center" }}>
              <ScoreRing value={o.todayScore} size={118} />
              <T v="bodyStrong" style={{ marginTop: 4 }}>Today</T>
              <T v="small" style={{ fontSize: FS.caption }}>
                {o.restDay ? "Rest day" : o.todayScore >= GOOD_DAY_SCORE ? "Good day ✓" : `${GOOD_DAY_SCORE - o.todayScore} more for a good day`}
              </T>
            </View>
            <View style={{ alignItems: "center" }}>
              <ScoreRing value={o.overall} size={118} color={c.sub} />
              <T v="bodyStrong" style={{ marginTop: 4 }}>Overall</T>
              <T v="small" style={{ fontSize: FS.caption }}>{trendText(o.overall, o.lastWeek)}</T>
            </View>
          </Row>
          <T v="small" style={{ textAlign: "center", marginTop: 10, borderTopWidth: 1, borderTopColor: c.line, paddingTop: 8 }}>
            Best day {o.best} · Last 7 days · <T v="small" color="accent">How it works</T>
          </T>
        </Card>

        <T v="label" style={{ marginLeft: 4, marginTop: 4 }}>
          {buddy} · stage {stage.index + 1} of {DOT_STAGES.length}
        </T>
        <View style={{ height: 230, alignItems: "center", justifyContent: "flex-end", zIndex: 10 }}>
          <View style={{ position: "absolute", top: 0, zIndex: 2 }} pointerEvents="none">
            {boop ? <Bubble name={buddy.toUpperCase()} text={boop} /> : null}
          </View>
          <View style={{ position: "absolute", bottom: 0, width: 200, height: 160, borderRadius: 100, backgroundColor: FIXED.glow, opacity: 0.35 }} />
          <Dot
            mood={o.todayScore >= GOOD_DAY_SCORE ? "happy" : "calm"}
            size={200}
            grow={dotGrowth(o.goodDays)}
            onBoop={(l) => {
              setBoop(l);
              setTimeout(() => setBoop(null), 1600);
            }}
          />
        </View>
        <Row gap={6}>
          {DOT_STAGES.map((s, i) => {
            const done = i < stage.index;
            const cur = i === stage.index;
            return (
              <View key={s.name} style={{ flex: 1, alignItems: "center", gap: 4 }}>
                <View style={{ height: 6, alignSelf: "stretch", borderRadius: 3, backgroundColor: done || cur ? c.accent : c.bar, opacity: cur ? 0.6 : 1 }} />
                <T v="small" color={cur ? "accent" : done ? "ink" : "sub"} style={{ fontSize: FS.caption }}>{s.name}</T>
              </View>
            );
          })}
        </Row>

        <Card>
          <Row>
            <T v="bodyStrong" style={{ fontSize: FS.md }}>Good days</T>
            <ProgressBar value={stage.next ? o.goodDays / goodNeed : 1} />
            <T v="bodyStrong" style={{ fontSize: FS.md }}>{o.goodDays}{stage.next ? ` / ${goodNeed}` : ""}</T>
          </Row>
          <T v="small" style={{ marginTop: 6 }}>
            A good day is a Focus Score of {GOOD_DAY_SCORE} or more.{" "}
            {stage.next ? `${stage.toNext} more until ${buddy} becomes a ${stage.next.name}. ` : ""}They never reset, so {buddy} never shrinks.
          </T>
        </Card>

        <Row gap={12} style={{ alignItems: "stretch" }}>
          <Card style={{ flex: 1 }}>
            <T v="label">Streak</T>
            <T v="title" style={{ fontSize: FS.num }}>{o.streak} days</T>
            <T v="small">Next milestone: {nextMilestone} days</T>
          </Card>
          <Card style={{ flex: 1 }}>
            <T v="label">Focus time</T>
            <T v="title" style={{ fontSize: FS.num }}>{dur(todayMins)}</T>
            <T v="small">today · {dur(weekMins)} this week · {dur(allMins)} all time</T>
          </Card>
        </Row>

        <Card>
          <Row style={{ justifyContent: "space-between" }}>
            <T v="bodyStrong">This week</T>
            <T v="small">minutes focused</T>
          </Row>
          <Row style={{ alignItems: "flex-end", height: 110, marginTop: 10, justifyContent: "space-between" }}>
            {bars.map((b, i) => (
              <View key={b.key} style={{ alignItems: "center", gap: 4, width: 30 }}>
                <View
                  style={{
                    width: 22,
                    height: Math.max(4, (b.value / max) * 80),
                    borderRadius: 8,
                    backgroundColor: b.future ? "transparent" : b.today ? c.accent : c.accentLight,
                    borderWidth: b.future ? 2 : 0,
                    borderStyle: "dashed",
                    borderColor: c.dash,
                  }}
                />
                <T v="small" color={b.today ? "accent" : "sub"} style={{ fontSize: FS.caption }}>{DAY_SHORT[i][0]}</T>
              </View>
            ))}
          </Row>
          <Row style={{ justifyContent: "space-between", marginTop: 6 }}>
            {bars.map((b) => (
              <View key={b.key} style={{ width: 30, alignItems: "center" }}>
                {b.mood ? (
                  <MoodFace mood={b.mood} size={24} />
                ) : (
                  <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderStyle: "dashed", borderColor: c.line }} />
                )}
              </View>
            ))}
          </Row>
          <T v="small" style={{ marginTop: 6 }}>Faces are how each day felt. Dashed bars are what&apos;s planned.</T>
        </Card>

        {!o.todayReflection ? (
          <Card onPress={() => setSheet("reflect")} style={{ flexDirection: "row", alignItems: "center", gap: 12 }} testID="checkin-card">
            <View style={{ flex: 1 }}>
              <T v="bodyStrong">How did today feel?</T>
              <T v="small">A 10-second check-in</T>
            </View>
            <T v="bodyStrong" color="accent">Check in</T>
          </Card>
        ) : null}

        <Card>
          <T v="bodyStrong">What slips</T>
          <T v="small" style={{ marginTop: 4 }}>
            {slips.lines.length ? slips.lines.join(" ") : "Nothing yet. After a week or so of sessions, this shows what tends to get skipped and when you focus best."}
          </T>
          {slips.lines.length ? (
            <Btn small kind="secondary" title="See suggestions" style={{ marginTop: 10, alignSelf: "flex-start" }} onPress={() => router.push("/plan")} />
          ) : null}
        </Card>
      </Screen>

      <ScoreInfoSheet visible={sheet === "score"} onClose={() => setSheet(null)} o={o} />
      <ReflectSheet
        visible={sheet === "reflect"}
        initial={{ mood: o.todayReflection?.mood ?? null, note: o.todayReflection?.note ?? "" }}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}
