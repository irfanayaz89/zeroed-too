import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type ViewStyle,
} from "react-native";
import { Text } from "@/components/ui/Text";
import { spacing } from "@/constants/tokens/spacing";
import { useTheme } from "@/hooks/useTheme";

export interface ButtonProps extends Omit<PressableProps, "children"> {
  title: string;
  loading?: boolean;
  trailingIcon?: ReactNode;
  style?: ViewStyle;
}

export function Button({
  title,
  loading = false,
  disabled,
  trailingIcon,
  style,
  ...props
}: ButtonProps) {
  const { colors, radii } = useTheme();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: colors.primary,
          borderRadius: radii.lg,
        },
        style,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={colors.textOnPrimary} />
      ) : (
        <>
          <Text variant="bodyLarge" color="onPrimary">
            {title}
          </Text>
          {trailingIcon}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.4,
  },
});
