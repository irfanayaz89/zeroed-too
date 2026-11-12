import { Platform, type ViewStyle } from "react-native";
import { palette } from "./palette";

type ShadowStyle = Pick<
  ViewStyle,
  "shadowColor" | "shadowOffset" | "shadowOpacity" | "shadowRadius" | "elevation"
>;

function shadow(base: ShadowStyle): ShadowStyle {
  return Platform.OS === "android"
    ? { elevation: base.elevation, shadowColor: base.shadowColor }
    : base;
}

export const shadows = {
  sm: shadow({
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  }),
  md: shadow({
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }),
  lg: shadow({
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  }),
  primaryGlow: shadow({
    shadowColor: palette.purple500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 0,
  }),
} as const;
