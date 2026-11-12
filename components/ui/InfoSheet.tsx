import { Modal, Pressable, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/hooks/useTheme";

export const FOCUS_SCORE_INFO_BODY =
  "Your Focus Score reflects your day — how you're moving through your blocks, whether you check in with yourself at the end of the day, and how you respond when reminders nudge you back on track. It's not about being perfect. It's about showing up.";

interface InfoSheetProps {
  visible: boolean;
  title?: string;
  body: string;
  onClose: () => void;
}

export function InfoSheet({
  visible,
  title = "What's this?",
  body,
  onClose,
}: InfoSheetProps) {
  const { colors, spacing, radii } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.overlayLight }]}
          onPress={onClose}
        />
        <View
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderBottomWidth: 0,
            borderTopLeftRadius: radii.xl,
            borderTopRightRadius: radii.xl,
            paddingHorizontal: spacing.screenX,
            paddingTop: spacing.md,
            paddingBottom: spacing.lg + spacing.xs,
            gap: spacing.sm + spacing.xs,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text variant="h3">{title}</Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close info"
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
          <Text variant="bodySmall" color="secondary" style={{ lineHeight: 22 }}>
            {body}
          </Text>
        </View>
      </View>
    </Modal>
  );
}
