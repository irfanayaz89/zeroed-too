import type { ReactNode } from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { useTheme } from "@/hooks/useTheme";

interface BottomBarProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function BottomBar({ children, style }: BottomBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.borderLight,
          padding: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: Math.max(insets.bottom, spacing.md),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export interface BottomBarButtonProps extends ButtonProps {
  barStyle?: ViewStyle;
}

export function BottomBarButton({ barStyle, style, ...buttonProps }: BottomBarButtonProps) {
  return (
    <BottomBar style={barStyle}>
      <Button style={style} {...buttonProps} />
    </BottomBar>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
  },
});
