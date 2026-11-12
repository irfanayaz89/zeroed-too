import { View, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/Text";
import { spacing } from "@/constants/tokens/spacing";
import { radii } from "@/constants/tokens/radii";
import { useTheme } from "@/hooks/useTheme";

interface AuthBrandingHeaderProps {
  paddingTop: number;
}

export function AuthBrandingHeader({ paddingTop }: AuthBrandingHeaderProps) {
  const { colors, spacing } = useTheme();

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryGradientMid, colors.primaryLight]}
      style={[styles.header, { paddingTop, paddingBottom: spacing["2xl"] }]}
    >
      <View style={styles.logoContainer}>
        <View style={[styles.logoCircle, { backgroundColor: colors.surface }]}>
          <Ionicons name="radio-button-on" size={32} color={colors.primary} />
        </View>
      </View>
      <Text variant="scoreDisplay" color="onPrimary" style={styles.appName}>
        Zeroed
      </Text>
      <Text variant="caption" style={{ color: colors.textOnPrimaryMuted, marginTop: spacing.xs }}>
        by Zero Noise Labs
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    borderBottomLeftRadius: radii.xl + spacing.md,
    borderBottomRightRadius: radii.xl + spacing.md,
  },
  logoContainer: {
    marginBottom: spacing.mdSm,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: radii.xl + spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    letterSpacing: -0.5,
    lineHeight: Platform.OS === "ios" ? 38 : 40,
  },
});
