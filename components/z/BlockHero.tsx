/** The arc with its overlay (badge, title, status) and the start / end times under it. */
import React from "react";
import { Text, View } from "react-native";
import { arcColor, FONTS, FS, statusColor, statusText } from "@/constants/theme";
import { fmt } from "@/lib/focus";
import { useZ } from "@/lib/prefs-context";
import { FocusArc } from "./FocusArc";

export function BlockHero({
  width,
  mode,
  title,
  from,
  to,
  progress,
  big = false,
}: {
  width: number;
  /** "block": a block is running. "gap": counting down to the next one. */
  mode: "block" | "gap";
  title: string;
  /** Minutes of the day at either end of the arc. */
  from: number;
  to: number;
  progress: number;
  big?: boolean;
}) {
  const { c } = useZ();
  const p = Math.min(1, Math.max(0, progress));
  const inBlock = mode === "block";
  const col = inBlock ? arcColor(p, c) : c.text3;
  const badgeBg = inBlock ? col : c.accent;
  return (
    <View style={{ alignSelf: "center", width }}>
      <FocusArc width={width} progress={p} color={col} split={inBlock} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 18, marginTop: -6 }}>
        <Text style={{ fontFamily: FONTS.bold, fontSize: FS.tiny, letterSpacing: 0.5, color: c.text3, fontVariant: ["tabular-nums"] }}>{fmt(from)}</Text>
        <Text style={{ fontFamily: FONTS.bold, fontSize: FS.tiny, letterSpacing: 0.5, color: c.text3, fontVariant: ["tabular-nums"] }}>{fmt(to)}</Text>
      </View>
      <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: big ? 58 : 50, alignItems: "center", gap: 8, paddingHorizontal: 46 }}>
        <View style={{ backgroundColor: badgeBg, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 }}>
          <Text style={{ fontFamily: FONTS.heavy, fontSize: FS.caps, letterSpacing: 1.8, color: c.onAccent }}>{inBlock ? "NOW" : "NEXT"}</Text>
        </View>
        <Text numberOfLines={2} style={{ fontFamily: FONTS.displaySemi, fontSize: big ? FS.title : FS.h2, lineHeight: big ? 28 : 24, letterSpacing: -0.3, color: c.text, textAlign: "center" }}>
          {title}
        </Text>
        <Text style={{ fontFamily: FONTS.bold, fontSize: FS.smPlus, color: inBlock ? statusColor(p, c) : c.text2 }}>{inBlock ? statusText(p) : "Free time"}</Text>
      </View>
    </View>
  );
}
