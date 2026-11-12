/** Line icons, drawn on a 24×24 grid. Ported from the prototype. */
import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

export type IconName =
  | "check"
  | "note"
  | "skip"
  | "focus"
  | "plus"
  | "chev"
  | "down"
  | "back"
  | "close"
  | "now"
  | "plan"
  | "insights"
  | "me"
  | "bulb"
  | "warn"
  | "late"
  | "later"
  | "cloud"
  | "trash"
  | "phone"
  | "bell";

export function Icon({ name, size = 22, color, strokeWidth }: { name: IconName; size?: number; color: string; strokeWidth?: number }) {
  const p = { stroke: color, strokeWidth: strokeWidth ?? 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  let body: React.ReactNode;
  switch (name) {
    case "check":
      body = <Path d="M5 12.5l4.5 4.5L19 7.5" {...p} strokeWidth={strokeWidth ?? 2.4} />;
      break;
    case "note":
      body = (
        <>
          <Path d="M4 20h4L19 9l-4-4L4 16v4z" {...p} />
          <Path d="M13.5 6.5l4 4" {...p} />
        </>
      );
      break;
    case "skip":
      body = (
        <>
          <Path d="M5 5l9 7-9 7V5z" {...p} />
          <Path d="M19 5v14" {...p} />
        </>
      );
      break;
    case "focus":
      body = (
        <>
          <Path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4" {...p} strokeWidth={strokeWidth ?? 2.2} />
          <Circle cx={12} cy={12} r={2.5} {...p} strokeWidth={strokeWidth ?? 2.2} />
        </>
      );
      break;
    case "plus":
      body = <Path d="M12 5v14M5 12h14" {...p} strokeWidth={strokeWidth ?? 2.4} />;
      break;
    case "chev":
      body = <Path d="M9 6l6 6-6 6" {...p} strokeWidth={strokeWidth ?? 2.2} />;
      break;
    case "back":
      body = <Path d="M15 6l-6 6 6 6" {...p} strokeWidth={strokeWidth ?? 2.2} />;
      break;
    case "down":
      body = <Path d="M6 9l6 6 6-6" {...p} strokeWidth={strokeWidth ?? 2.2} />;
      break;
    case "close":
      body = <Path d="M6 6l12 12M18 6L6 18" {...p} strokeWidth={strokeWidth ?? 2.2} />;
      break;
    case "now":
      body = (
        <>
          <Path d="M4 16a8 8 0 0116 0" {...p} />
          <Circle cx={16.5} cy={9.5} r={1.8} fill={color} />
        </>
      );
      break;
    case "plan":
      body = (
        <>
          <Rect x={4} y={5} width={16} height={15} rx={3} {...p} />
          <Path d="M4 10h16M9 3v4M15 3v4" {...p} />
        </>
      );
      break;
    case "insights":
      body = <Path d="M5 20V12M12 20V5M19 20v-9" {...p} />;
      break;
    case "me":
      body = (
        <>
          <Circle cx={12} cy={8.5} r={3.5} {...p} />
          <Path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5" {...p} />
        </>
      );
      break;
    case "bulb":
      body = <Path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z" {...p} />;
      break;
    case "warn":
      body = (
        <>
          <Path d="M12 4l9 16H3l9-16z" {...p} />
          <Path d="M12 10v4M12 17v.5" {...p} />
        </>
      );
      break;
    case "late":
      body = (
        <>
          <Circle cx={12} cy={13} r={8} {...p} />
          <Path d="M12 9v4l3 2M9 2h6" {...p} />
        </>
      );
      break;
    case "later":
      body = <Path d="M4 12h12M12 6l6 6-6 6" {...p} />;
      break;
    case "cloud":
      body = (
        <>
          <Path d="M7 18a4.5 4.5 0 01-.5-9A6 6 0 0118 9a4.5 4.5 0 01-1 9H7z" {...p} />
          <Path d="M12 11v5M9.5 13.5L12 11l2.5 2.5" {...p} />
        </>
      );
      break;
    case "trash":
      body = <Path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" {...p} />;
      break;
    case "phone":
      body = (
        <>
          <Rect x={6} y={2} width={12} height={20} rx={3} {...p} />
          <Path d="M10 18h4" {...p} />
        </>
      );
      break;
    case "bell":
      body = (
        <>
          <Path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15L6 16z" {...p} />
          <Path d="M10 20.5a2 2 0 004 0" {...p} />
        </>
      );
      break;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {body}
    </Svg>
  );
}
