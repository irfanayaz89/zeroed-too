import {
  Text as RNText,
  type TextProps as RNTextProps,
  type TextStyle,
} from "react-native";
import { typography, type TypographyVariant } from "@/constants/tokens/typography";
import { useTheme } from "@/hooks/useTheme";
import type { ThemeColors } from "@/constants/theme/types";

type TextColor = "primary" | "secondary" | "tertiary" | "onPrimary" | "accent";

const colorKey: Record<TextColor, keyof ThemeColors> = {
  primary: "textPrimary",
  secondary: "textSecondary",
  tertiary: "textTertiary",
  onPrimary: "textOnPrimary",
  accent: "primary",
};

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: TextColor;
}

export function Text({
  variant = "body",
  color = "primary",
  style,
  ...props
}: TextProps) {
  const theme = useTheme();
  const textColor = theme.colors[colorKey[color]];

  return (
    <RNText
      style={[typography[variant], { color: textColor }, style] as TextStyle[]}
      {...props}
    />
  );
}

export { typography };
