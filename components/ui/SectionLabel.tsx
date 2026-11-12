import { Text, type TextProps } from "@/components/ui/Text";
import { useTheme } from "@/hooks/useTheme";

export function SectionLabel({ children, style, ...props }: TextProps) {
  const { spacing } = useTheme();

  return (
    <Text
      variant="label"
      color="secondary"
      style={[
        {
          textTransform: "uppercase",
          marginTop: spacing.sm + 4,
          marginBottom: 6,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
