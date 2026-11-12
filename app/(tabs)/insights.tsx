import React, { useEffect, useMemo, useState } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import Svg, { Defs, Line, Pattern, Rect, Text as SvgText } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format, parseISO } from "date-fns";
import { FONTS, FS, GOOD_DAY_SCORE, mix } from "@/constants/theme";
import { RingNumber, ScoreRing } from "@/components/z/ScoreRing";
import { useToast } from "@/components/z/toast";
import { Card, Chip, Chips, Row, Screen, T } from "@/components/z/ui";
import { useFocusActions, useFocusOverview } from "@/hooks/useFocusData";
import { useAuth } from "@/lib/auth-context";
import { avgBlockMinutes, bestWindow, dateKey, isGood, slipRows, weekDates, type DayStat } from "@/lib/focus";
import { useZ } from "@/lib/prefs-context";

const CHECKIN_KEY = "zeroed_weekly_checkin_v1";
type Feel = "over" | "right" | "easy";

function Stat({ k, v }: { k: string; v: string }) {
  const { c } = useZ();
  return (
    <Row style={{ justifyContent: "space-between", alignItems: "baseline" }}>
      <Text style={{ fontFamily: FONTS.semibold, fontSize: FS.sm, color: c.text2 }}>{k}</Text>
      <Text style={{ fontFamily: FONTS.displaySemi, fontSize: FS.lg, color: c.text, fontVariant: ["tabular-nums"] }}>{v}</Text>
    </Row>
  );
}

function Tile({ k, v, unit, sub }: { k: string; v: string; unit?: string; sub: string }) {
  const { c } = useZ();
  return (
    <View style={{ flex: 1, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16, padding: 14 }}>
      <T v="caps">{k}</T>
      <Text style={{ marginTop: 6, fontFamily: FONTS.displaySemi, fontSize: FS.tile, color: c.text, fontVariant: ["tabular-nums"], letterSpacing: -0.2 }}>
        {v}
        {unit ? <Text style={{ fontFamily: FONTS.medium, fontSize: FS.sm, color: c.text2 }}> {unit}</Text> : null}
      </Text>
      <Text style={{ fontFamily: FONTS.semibold, fontSize: FS.caption, color: c.text2, marginTop: 2 }}>{sub}</Text>
    </View>
  );
}

function Chart({ days, width }: { days: DayStat[]; width: number }) {
  const { c } = useZ();
  const W = width;
  const H = 164;
  const pl = 26;
  const pb = 22;
  const pt = 22;
  const bw = Math.min(26, (W - pl) / 7 - 8);
  const gap = (W - pl - bw * 7) / 7;
  const y = (v: number) => pt + (H - pt - pb) * (1 - v / 100);
  const last = days.length - 1;
  return (
    <Svg width={W} height={H} accessibilityLabel="Daily Focus Score for the last 7 days">
      <Defs>
        <Pattern id="rest" width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <Rect width={6} height={6} fill={c.surface2} />
          <Rect width={3} height={6} fill={c.line} />
        </Pattern>
      </Defs>
      {[0, 50, 100].map((v) => (
        <React.Fragment key={v}>
          <Line x1={pl} x2={W} y1={y(v)} y2={y(v)} stroke={c.line} strokeDasharray={v === 50 ? "3 4" : undefined} />
          <SvgText x={pl - 6} y={y(v) + 4} textAnchor="end" fontSize={10} fill={c.text3} fontFamily={FONTS.bold}>
            {v}
          </SvgText>
        </React.Fragment>
      ))}
      {days.map((d, i) => {
        const X = pl + gap / 2 + i * (bw + gap);
        const today = i === last;
        const label = today ? "Today" : format(parseISO(d.date), "EEE");
        return (
          <React.Fragment key={d.date}>
            {d.score === null ? (
              <>
                <Rect x={X} y={y(100)} width={bw} height={y(0) - y(100)} rx={7} fill="url(#rest)" opacity={0.6} />
                <SvgText x={X + bw / 2} y={y(50) + 4} textAnchor="middle" fontSize={9.5} fill={c.text3} fontFamily={FONTS.bold}>
                  REST
                </SvgText>
              </>
            ) : (
              <>
                <Rect
                  x={X}
                  y={y(Math.max(4, d.score))}
                  width={bw}
                  height={Math.max(4, y(0) - y(d.score))}
                  rx={7}
                  fill={today ? c.accent : isGood(d.score) ? mix(c.accent, c.surface2, 0.55) : c.warn}
                />
                <SvgText x={X + bw / 2} y={y(Math.max(4, d.score)) - 6} textAnchor="middle" fontSize={10.5} fill={today ? c.text : c.text2} fontFamily={FONTS.displaySemi}>
                  {d.score}
                </SvgText>
              </>
            )}
            <SvgText x={X + bw / 2} y={H - 4} textAnchor="middle" fontSize={10.5} fill={today ? c.text : c.text3} fontFamily={FONTS.bold}>
              {label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

export default function InsightsScreen() {
  const o = useFocusOverview();
  const { c } = useZ();
  const toast = useToast();
  const { profile } = useAuth();
  const { updateProfile } = useFocusActions();
  const { width } = useWindowDimensions();
  const [feel, setFeel] = useState<Feel | null>(null);
  const weekKey = dateKey(weekDates(o.now)[0]);

  useEffect(() => {
    AsyncStorage.getItem(CHECKIN_KEY)
      .then((r) => {
        const v = r ? (JSON.parse(r) as { week: string; feel: Feel }) : null;
        setFeel(v?.week === weekKey ? v.feel : null);
      })
      .catch(() => {});
  }, [weekKey]);

  const learn = useMemo(
    () => ({
      slips: slipRows(o.blocks, o.logs, o.now, o.firstDay),
      window: bestWindow(o.blocks, o.logs, o.now, o.firstDay),
      avg: avgBlockMinutes(o.blocks, o.logs, o.now, o.firstDay),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [o.blocks, o.logs, dateKey(o.now), o.firstDay]
  );

  // This week, Monday to today.
  const weekStart = weekKey;
  const thisWeek = o.stats.filter((d) => d.date >= weekStart);
  const focusedH = thisWeek.reduce((a, d) => a + d.minutes, 0) / 60;
  const doneN = thisWeek.reduce((a, d) => a + d.sessions.filter((s) => s.status === "done").length, 0);
  const plannedN = thisWeek.reduce((a, d) => a + d.sessions.length, 0);
  const restInWindow = o.last7.slice(0, -1).find((d) => d.score === null && (!o.firstDay || d.date >= o.firstDay));

  const pick = (f: Feel) => {
    setFeel(f);
    AsyncStorage.setItem(CHECKIN_KEY, JSON.stringify({ week: weekKey, feel: f })).catch(() => {});
    const n = profile?.sessions_per_day ?? 3;
    const nextN = f === "over" ? Math.max(2, n - 1) : f === "easy" ? Math.min(4, n + 1) : n;
    if (nextN !== n) updateProfile.mutate({ sessions_per_day: nextN });
    toast(f === "over" ? `Next week drops to ${nextN} blocks a day` : f === "easy" ? `Next week goes up to ${nextN} blocks a day` : "Next week keeps the same shape");
  };

  const chartW = width - 40 - 34;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Screen tabs>
        <View>
          <T v="caps" style={{ fontSize: FS.caps }}>Last 7 days</T>
          <T v="page">Insights</T>
        </View>

        <Card style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
          <ScoreRing value={o.overall} size={112} stroke={9}>
            <RingNumber value={o.overall} size={FS.big} />
            <T v="caps" style={{ marginTop: 4, letterSpacing: 1.2 }}>7-day</T>
          </ScoreRing>
          <View style={{ flex: 1, gap: 10 }}>
            <Stat k="Today" v={o.restDay ? "Rest" : String(o.todayScore)} />
            <Stat k="Best day" v={String(o.best7)} />
            <Stat k="Good days" v={`${o.good7} / ${Math.max(o.planned7, o.good7)}`} />
          </View>
        </Card>

        <Card>
          <T v="caps" style={{ marginBottom: 10 }}>Daily Focus Score</T>
          <Chart days={o.last7} width={chartW} />
          <Text style={{ fontFamily: FONTS.semibold, fontSize: FS.caption, color: c.text3, marginTop: 8 }}>
            Dashed line is a good day ({GOOD_DAY_SCORE}). Rest days don&apos;t count against you.
          </Text>
        </Card>

        <Card>
          <Row style={{ justifyContent: "space-between", alignItems: "baseline" }}>
            <T v="caps">Streak</T>
            <Text style={{ fontFamily: FONTS.displaySemi, fontSize: FS.stat, color: c.text }}>
              {o.streak} good day{o.streak === 1 ? "" : "s"}
            </Text>
          </Row>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 10 }}>
            {o.last7.map((d, i) => {
              const today = i === o.last7.length - 1;
              const good = isGood(d.score);
              return (
                <View
                  key={d.date}
                  style={{
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: good ? c.good : d.score === null && !today ? c.line : c.surface2,
                    opacity: d.score === null && !today ? 0.6 : 1,
                  }}
                />
              );
            })}
          </View>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: FS.caption, color: c.text3, marginTop: 8 }}>
            {restInWindow ? `${format(parseISO(restInWindow.date), "EEEE")} was a rest day, so the streak holds.` : "Planned rest days never break a streak."}
          </Text>
        </Card>

        <View style={{ gap: 10 }}>
          <Row gap={10}>
            <Tile k="Focused" v={focusedH.toFixed(1)} unit="h" sub="this week" />
            <Tile k="Blocks done" v={String(doneN)} unit={`/ ${plannedN}`} sub="this week" />
          </Row>
          <Row gap={10}>
            <Tile k="Best window" v={learn.window ? learn.window.label : "–"} sub={learn.window ? `${Math.round(learn.window.rate * 100)}% finished` : "needs a few weeks"} />
            <Tile k="Avg block" v={learn.avg ? String(learn.avg) : "–"} unit={learn.avg ? "min" : undefined} sub="sweet spot 45–60" />
          </Row>
        </View>

        {learn.slips.length ? (
          <Card style={{ gap: 12 }}>
            <T v="caps">What slips</T>
            {learn.slips.map((r) => (
              <View key={r.label} style={{ gap: 6 }}>
                <Row style={{ justifyContent: "space-between" }}>
                  <Text style={{ fontFamily: FONTS.semibold, fontSize: FS.sm, color: c.text, flex: 1 }}>{r.label}</Text>
                  <Text style={{ fontFamily: FONTS.semibold, fontSize: FS.sm, color: c.text2, fontVariant: ["tabular-nums"] }}>{r.detail}</Text>
                </Row>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: c.surface2 }}>
                  <View style={{ height: 6, borderRadius: 3, width: `${Math.round(r.rate * 100)}%`, backgroundColor: r.rate >= 0.6 ? c.good : c.warn }} />
                </View>
              </View>
            ))}
          </Card>
        ) : null}

        <Card>
          <T v="caps">Weekly check-in</T>
          <T v="bodyStrong" style={{ marginTop: 8, marginBottom: 12, fontSize: FS.md }}>How did this week feel?</T>
          <Chips>
            <Chip label="Overloaded" on={feel === "over"} onPress={() => pick("over")} testID="feel-over" />
            <Chip label="About right" on={feel === "right"} onPress={() => pick("right")} testID="feel-right" />
            <Chip label="Too easy" on={feel === "easy"} onPress={() => pick("easy")} testID="feel-easy" />
          </Chips>
        </Card>
      </Screen>
    </View>
  );
}
