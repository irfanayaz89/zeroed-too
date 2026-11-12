import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { useTheme } from "@/hooks/useTheme";

export interface CardProps extends ViewProps {
  children: ReactNode;
  elevated?: boolean;
  padding?: number;
}

export function Card({
  children,
  elevated = false,
  padding,
  style,
  ...props
}: CardProps) {
  const { colors, radii, spacing, shadows } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: padding ?? spacing.md,
        },
        elevated ? shadows.sm : null,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
