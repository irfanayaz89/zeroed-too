import React from "react";
import { Text, View } from "react-native";
import { FONTS, FS, GOOD_DAY_SCORE } from "@/constants/theme";
import { useZ } from "@/lib/prefs-context";
import { RingNumber, ScoreRing, CountUp } from "./ScoreRing";
import { Card, Row, T } from "./ui";

/** Focus Score card at the top of Now. Tapping it opens Insights. */
export function ScoreCard({ today, avg7, restDay, onPress }: { today: number; avg7: number; restDay: boolean; onPress: () => void }) {
  const { c } = useZ();
  const hint = restDay
    ? "Rest day. Your 7-day score is unaffected."
    : today >= GOOD_DAY_SCORE
      ? "Good day banked. Everything else is extra."
      : `${GOOD_DAY_SCORE - today} points to a good day`;
  return (
    <Card
      testID="score-card"
      onPress={onPress}
      accessibilityLabel={`Focus Score today ${today}, 7-day average ${avg7}. Open Insights.`}
      style={{ flexDirection: "row", alignItems: "center", gap: 16, borderRadius: 20 }}
    >
      <ScoreRing value={today} size={62} stroke={6}>
        <RingNumber value={today} size={FS.ring} />
      </ScoreRing>
      <View style={{ flex: 1, gap: 6 }}>
        <Row style={{ justifyContent: "space-between", alignItems: "baseline" }}>
          <T v="caps">Focus Score · today</T>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: FS.chip, color: c.text2 }}>
            7-day <CountUp value={avg7} style={{ fontFamily: FONTS.displaySemi, color: c.text }} />
          </Text>
        </Row>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: c.surface2 }}>
          <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.min(100, today)}%`, borderRadius: 3, backgroundColor: c.accent }} />
          <View style={{ position: "absolute", left: `${GOOD_DAY_SCORE}%`, top: -3, bottom: -3, width: 2, borderRadius: 1, backgroundColor: c.text3 }} />
        </View>
        <Text style={{ fontFamily: FONTS.semibold, fontSize: FS.tiny, color: c.text3 }}>{hint}</Text>
      </View>
    </Card>
  );
}
