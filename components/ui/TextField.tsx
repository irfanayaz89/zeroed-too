import type { ReactNode } from "react";
import {
  TextInput,
  View,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { typography } from "@/constants/tokens/typography";
import { useTheme } from "@/hooks/useTheme";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

export interface TextFieldProps extends TextInputProps {
  leftIcon?: IoniconName;
  rightElement?: ReactNode;
  containerStyle?: ViewStyle;
}

export function TextField({
  leftIcon,
  rightElement,
  containerStyle,
  style,
  placeholderTextColor,
  ...props
}: TextFieldProps) {
  const { colors, radii, spacing } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radii.lg,
          paddingHorizontal: spacing.md,
        },
        containerStyle,
      ]}
    >
      {leftIcon ? (
        <Ionicons
          name={leftIcon}
          size={20}
          color={colors.textSecondary}
          style={styles.leftIcon}
        />
      ) : null}
      <TextInput
        style={[
          typography.body,
          styles.input,
          { color: colors.textPrimary },
          style,
        ]}
        placeholderTextColor={placeholderTextColor ?? colors.textTertiary}
        {...props}
      />
      {rightElement}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderWidth: 1,
  },
  leftIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: "100%",
    padding: 0,
  },
});
