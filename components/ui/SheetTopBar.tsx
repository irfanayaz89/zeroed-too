import type { ReactNode } from "react";
import { View, Pressable, type ViewProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/hooks/useTheme";

export interface SheetTopBarProps {
  title: string;
  left?: ReactNode;
  right?: ReactNode;
}

export function SheetTopBar({ title, left, right }: SheetTopBarProps) {
  const { colors, spacing } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.screenX,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ minWidth: 24, alignItems: "flex-start" }}>
        {left ?? <View style={{ width: 24, height: 24 }} />}
      </View>
      <Text variant="bodyLarge" style={{ textAlign: "center", flex: 1 }}>
        {title}
      </Text>
      <View style={{ minWidth: 24, alignItems: "flex-end" }}>
        {right ?? <View style={{ width: 24, height: 24 }} />}
      </View>
    </View>
  );
}

export function SheetCloseButton({
  onPress,
  accessibilityLabel = "Close",
}: {
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();

  return (
    <Pressable onPress={onPress} hitSlop={12} accessibilityLabel={accessibilityLabel}>
      <Ionicons name="close" size={24} color={colors.textPrimary} />
    </Pressable>
  );
}

export interface SheetScreenProps extends ViewProps {
  children: ReactNode;
  paddingTop?: number;
}

export function SheetScreen({ children, paddingTop, style, ...props }: SheetScreenProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[{ flex: 1, backgroundColor: colors.background, paddingTop }, style]}
      {...props}
    >
      {children}
    </View>
  );
}
