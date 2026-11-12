import React, { useState } from "react";
import { reloadAppAsync } from "expo";
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  Modal,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Text } from "@/components/ui/Text";
import { Screen } from "@/components/ui/Screen";
import { spacing } from "@/constants/tokens/spacing";
import { useTheme } from "@/hooks/useTheme";
import { shadows } from "@/constants/tokens/shadows";

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const { colors, spacing, radii } = useTheme();
  const insets = useSafeAreaInsets();

  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleRestart = async () => {
    try {
      await reloadAppAsync();
    } catch (restartError) {
      console.error("Failed to restart app:", restartError);
      resetError();
    }
  };

  const formatErrorDetails = (): string => {
    let details = `Error: ${error.message}\n\n`;
    if (error.stack) {
      details += `Stack Trace:\n${error.stack}`;
    }
    return details;
  };

  const monoFont = Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "monospace",
  });

  return (
    <Screen style={styles.container}>
      {__DEV__ ? (
        <Pressable
          onPress={() => setIsModalVisible(true)}
          accessibilityLabel="View error details"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.topButton,
            {
              top: insets.top + spacing.md,
              backgroundColor: colors.surfaceMuted,
              borderRadius: radii.sm,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Feather name="alert-circle" size={20} color={colors.textPrimary} />
        </Pressable>
      ) : null}

      <View style={[styles.content, { gap: spacing.md }]}>
        <Text variant="h1" style={{ color: colors.textPrimary, textAlign: "center", lineHeight: 40 }}>
          Something went wrong
        </Text>

        <Text variant="body" color="secondary" style={{ textAlign: "center", lineHeight: 24 }}>
          Please reload the app to continue.
        </Text>

        <Pressable
          onPress={handleRestart}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.primary,
              borderRadius: radii.sm,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Text variant="bodyMedium" color="onPrimary" style={{ textAlign: "center" }}>
            Try Again
          </Text>
        </Pressable>
      </View>

      {__DEV__ ? (
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
            <View
              style={[
                styles.modalContainer,
                {
                  backgroundColor: colors.background,
                  borderTopLeftRadius: radii.xl,
                  borderTopRightRadius: radii.xl,
                },
              ]}
            >
              <View
                style={[
                  styles.modalHeader,
                  {
                    borderBottomColor: colors.border,
                    paddingHorizontal: spacing.md,
                    paddingTop: spacing.md,
                    paddingBottom: spacing.mdSm,
                  },
                ]}
              >
                <Text variant="h3" style={{ color: colors.textPrimary }}>
                  Error Details
                </Text>
                <Pressable
                  onPress={() => setIsModalVisible(false)}
                  accessibilityLabel="Close error details"
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.closeButton,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <Feather name="x" size={24} color={colors.textPrimary} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={[
                  styles.modalScrollContent,
                  { padding: spacing.md, paddingBottom: insets.bottom + spacing.md },
                ]}
                showsVerticalScrollIndicator
              >
                <View
                  style={[
                    styles.errorContainer,
                    {
                      backgroundColor: colors.surfaceMuted,
                      borderRadius: radii.sm,
                      padding: spacing.md,
                    },
                  ]}
                >
                  <Text
                    variant="body"
                    style={{
                      color: colors.textPrimary,
                      fontFamily: monoFont,
                      lineHeight: 18,
                    }}
                    selectable
                  >
                    {formatErrorDetails()}
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 600,
  },
  topButton: {
    position: "absolute",
    right: 16,
    width: 44,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    minWidth: 200,
    ...shadows.md,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContainer: {
    width: "100%",
    height: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {},
  errorContainer: {
    width: "100%",
    overflow: "hidden",
  },
});
