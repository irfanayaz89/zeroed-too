import { TextStyle } from "react-native";

export const fontFamily = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
} as const;

export const typography = {
  display: {
    fontFamily: fontFamily.bold,
    fontSize: 42,
    fontWeight: "700",
    lineHeight: 48,
  },
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: 26,
    fontWeight: "700",
  },
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    fontWeight: "700",
  },
  h3: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    fontWeight: "700",
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 22,
  },
  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontSize: 17,
    fontWeight: "400",
    lineHeight: 24,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    fontWeight: "700",
  },
  scoreDisplay: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    fontWeight: "700",
  },
  hero: {
    fontFamily: fontFamily.bold,
    fontSize: 48,
    fontWeight: "700",
  },
  bodyMedium: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  caption: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  micro: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    fontWeight: "700",
  },
  timerLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
