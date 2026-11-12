import type { ReactNode } from "react";
import { View, type ViewProps, type ViewStyle } from "react-native";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/hooks/useTheme";

export interface ScreenProps extends ViewProps {
  children: ReactNode;
}

export function Screen({ children, style, ...props }: ScreenProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[{ flex: 1, backgroundColor: colors.background }, style]}
      {...props}
    >
      {children}
    </View>
  );
}

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  paddingTop?: number;
  style?: ViewStyle;
  right?: ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  paddingTop,
  style,
  right,
}: ScreenHeaderProps) {
  const { spacing } = useTheme();

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          paddingHorizontal: spacing.screenX,
          paddingBottom: spacing.md,
          paddingTop,
        },
        style,
      ]}
    >
      <View style={{ flex: 1, marginRight: right ? spacing.sm : 0 }}>
        <Text variant="h1">{title}</Text>
        {subtitle ? (
          <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}
