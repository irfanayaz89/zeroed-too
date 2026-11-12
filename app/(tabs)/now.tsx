import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { format } from "date-fns";
import { CATEGORIES, FONTS, FS, rgba } from "@/constants/theme";
import { BlockHero } from "@/components/z/BlockHero";
import { Countdown } from "@/components/z/Countdown";
import { QuickActions } from "@/components/z/QuickActions";
import { ScoreCard } from "@/components/z/ScoreCard";
import { Icon } from "@/components/z/icons";
import { NoteSheet, SkipSheet } from "@/components/z/sheets";
import { Btn, Card, LinkBtn, Row, Screen, T } from "@/components/z/ui";
import { msAt, useBlockActions } from "@/hooks/useBlockActions";
import { useFocusOverview, useNow } from "@/hooks/useFocusData";
import { useAuth } from "@/lib/auth-context";
import { dur, fmt, greeting, nowMinutes, nowState, rangeLabel, untilText, type Session } from "@/lib/focus";
import { useZ } from "@/lib/prefs-context";

function UpNext({ s, nowMin }: { s: Session; nowMin: number }) {
  const { c } = useZ();
  return (
    <Card testID="up-next">
      <T v="caps" style={{ marginBottom: 10 }}>Up next</T>
      <Row gap={12}>
        <View style={{ width: 4, alignSelf: "stretch", borderRadius: 2, backgroundColor: CATEGORIES[s.cat].color }} />
        <View style={{ flex: 1 }}>
          <T v="bodyStrong">{s.block.title}</T>
          <T v="small" style={{ marginTop: 2, fontVariant: ["tabular-nums"] }}>
            {rangeLabel(s.start, s.end)} · {dur(s.mins)}
          </T>
        </View>
        <View style={{ backgroundColor: c.accentSoft, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 9 }}>
          <Text style={{ fontFamily: FONTS.heavy, fontSize: FS.tiny, color: c.accent }}>{untilText(s.start - nowMin)}</Text>
        </View>
      </Row>
    </Card>
  );
}

export default function NowScreen() {
  const o = useFocusOverview();
  const { c } = useZ();
  const router = useRouter();
  const { profile } = useAuth();
  const { width } = useWindowDimensions();
  const now = useNow(1000);
  const nowMin = nowMinutes(now);
  const act = useBlockActions(o);
  const [noteFor, setNoteFor] = useState<Session | null>(null);
  const [skipFor, setSkipFor] = useState<Session | null>(null);

  // Seeing a running block counts as starting it (no "haven't started" nudge).
  const st0 = nowState(o.today, nowMin);
  const running = st0.kind === "block" && !st0.s.log?.started_at ? st0.s : null;
  const { patch } = act;
  useEffect(() => {
    if (running) patch(running, { started_at: new Date().toISOString() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running?.key]);

  if (o.loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  const st = st0;
  const arcW = Math.min(320, width - 70);
  const name = profile?.name?.trim();
  const doneList = o.today.filter((s) => s.status === "done");
  const goPlan = () => router.push("/plan");

  let body: React.ReactNode;
  if (st.kind === "empty") {
    body = (
      <>
        <View style={{ alignItems: "center", gap: 10, paddingTop: 26, paddingHorizontal: 6 }}>
          <T v="display" style={{ textAlign: "center" }}>Nothing planned yet</T>
          <T v="body" color="text2" style={{ textAlign: "center", maxWidth: 280, lineHeight: 21 }}>
            Add two to four focus blocks and Zeroed will count you down through each one.
          </T>
        </View>
        <Btn icon="plus" title="Plan today" testID="plan-today" onPress={() => router.push("/add-block")} />
      </>
    );
  } else if (st.kind === "done") {
    body = (
      <>
        <View style={{ alignItems: "center", gap: 10, paddingTop: 26, paddingHorizontal: 6 }} testID="day-done">
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: rgba(c.good, 0.16), alignItems: "center", justifyContent: "center" }}>
            <Icon name="check" size={32} color={c.good} />
          </View>
          <T v="display" style={{ marginTop: 6 }}>That&apos;s the day</T>
          <T v="body" color="text2" style={{ textAlign: "center", maxWidth: 290, lineHeight: 21 }}>
            {doneList.length} of {o.today.length} blocks done, {dur(doneList.reduce((a, s) => a + s.actual, 0))} of focus. Tomorrow&apos;s plan is ready when you are.
          </T>
        </View>
        <Btn kind="ghost" icon="plan" title="Look at tomorrow" onPress={() => router.push({ pathname: "/plan", params: { day: "tomorrow" } })} />
      </>
    );
  } else {
    const inBlock = st.kind === "block";
    const s = st.s;
    const from = inBlock && s ? s.start : st.kind === "gap" ? st.gapStart : 0;
    const to = s ? (inBlock ? s.end : s.start) : 0;
    const progress = s ? (nowMin - from) / Math.max(1, to - from) : 0;
    body = (
      <>
        {st.ended ? (
          <Card testID="wrap-up" style={{ gap: 10, borderColor: c.accent + "66" }}>
            <T v="caps">Wrap up</T>
            <T v="bodyStrong" style={{ fontSize: FS.mdPlus, lineHeight: 20 }}>
              {st.ended.block.title} ended at {fmt(st.ended.end)}. Did it get done?
            </T>
            <Row gap={8}>
              <Btn kind="pri" flex title="Yes, done" testID="wrap-yes" onPress={() => st.ended && act.done(st.ended)} />
              <Btn kind="secondary" flex title="Not this time" testID="wrap-no" onPress={() => st.ended && act.skip(st.ended, "Logged as skipped. No harm done.")} />
            </Row>
          </Card>
        ) : null}
        {s ? (
          <>
            <View style={{ marginTop: 4 }}>
              <BlockHero width={arcW} mode={inBlock ? "block" : "gap"} title={s.block.title} from={from} to={to} progress={progress} />
            </View>
            <View style={{ marginTop: 2 }}>
              <Countdown testID="now-countdown" targetMs={msAt(s.date, to)} label={inBlock ? "ENDS IN" : "STARTS IN"} title={s.block.title} />
            </View>
            {inBlock ? (
              <>
                <QuickActions onDone={() => act.done(s)} onNote={() => setNoteFor(s)} onSkip={() => setSkipFor(s)} />
                <Btn icon="focus" title="Go full screen" testID="go-full-screen" onPress={() => router.push("/focus")} />
              </>
            ) : null}
          </>
        ) : null}
        {st.next ? <UpNext s={st.next} nowMin={nowMin} /> : null}
        <LinkBtn title="View the full day" chevron onPress={goPlan} testID="view-full-day" />
      </>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Screen tabs>
        <View>
          <T v="caps" style={{ fontSize: FS.caps }}>{format(now, "EEEE · MMM d")}</T>
          <T v="display" style={{ marginTop: 2 }} testID="now-greeting">
            {greeting(now)}
            {name ? `, ${name}` : ""}
          </T>
        </View>
        <ScoreCard today={o.todayScore} avg7={o.overall} restDay={o.restDay} onPress={() => router.push("/insights")} />
        {body}
      </Screen>
      <NoteSheet s={noteFor} onClose={() => setNoteFor(null)} onSave={act.note} />
      <SkipSheet s={skipFor} today={o.today} nowMin={nowMin} onClose={() => setSkipFor(null)} onMove={act.moveTo} onSkip={(x) => act.skip(x)} />
    </View>
  );
}
