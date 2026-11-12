import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/hooks/useTheme";

export interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  const { colors, radii, spacing } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.errorBackground,
          borderRadius: radii.md,
          gap: spacing.sm,
          padding: spacing.sm + 4,
        },
      ]}
    >
      <Ionicons name="alert-circle" size={18} color={colors.danger} />
      <Text variant="caption" style={{ color: colors.danger, flex: 1 }}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
});
