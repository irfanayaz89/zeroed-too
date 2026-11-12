import { View, type ViewStyle } from "react-native";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/hooks/useTheme";

export interface FormSectionHeaderProps {
  title: string;
  description?: string;
  style?: ViewStyle;
}

export function FormSectionHeader({ title, description, style }: FormSectionHeaderProps) {
  const { spacing } = useTheme();

  return (
    <View style={[description ? { marginBottom: spacing.lg } : { marginBottom: spacing.sm }, style]}>
      <Text variant="h1" style={{ marginBottom: spacing.sm }}>
        {title}
      </Text>
      {description ? (
        <Text variant="body" color="secondary">
          {description}
        </Text>
      ) : null}
    </View>
  );
}

export interface AuthFormTitleProps {
  title: string;
}

export function AuthFormTitle({ title }: AuthFormTitleProps) {
  const { spacing } = useTheme();

  return (
    <Text variant="h2" style={{ marginBottom: spacing.sm }}>
      {title}
    </Text>
  );
}
