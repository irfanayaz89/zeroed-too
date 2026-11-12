import React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import { FIXED } from "@/constants/focusd";
import type { Mood } from "@/lib/types";

export const MOOD_LIST: { id: Mood; label: string; color: string }[] = [
  { id: "rough", label: "Rough", color: "#C9A6FF" },
  { id: "meh", label: "Meh", color: "#9FC8F5" },
  { id: "okay", label: "Okay", color: "#F7D154" },
  { id: "good", label: "Good", color: "#B6EE4E" },
  { id: "great", label: "Great", color: "#FF8FC0" },
];

export function MoodFace({ mood, size = 36 }: { mood: Mood; size?: number }) {
  const i = Math.max(0, MOOD_LIST.findIndex((m) => m.id === mood));
  const c = (i - 2) * 3.2;
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36">
      <Circle cx={18} cy={18} r={16} fill={MOOD_LIST[i].color} />
      <Circle cx={12.5} cy={15} r={2.2} fill={FIXED.dotInk} />
      <Circle cx={23.5} cy={15} r={2.2} fill={FIXED.dotInk} />
      <Path d={`M11.5 ${23 - c / 2} q6.5 ${c} 13 0`} stroke={FIXED.dotInk} strokeWidth={2.4} fill="none" strokeLinecap="round" />
    </Svg>
  );
}
