// template
import { Link, Stack } from "expo-router";
import { StyleSheet } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { spacing } from "@/constants/tokens/spacing";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <Screen style={styles.container}>
        <Text variant="title" style={styles.title}>
          This screen doesn&apos;t exist.
        </Text>

        <Link href="/(tabs)/now" style={styles.link}>
          <Text variant="caption" color="accent" style={styles.linkText}>
            Go to home screen!
          </Text>
        </Link>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.screenX,
  },
  title: {},
  link: {
    marginTop: spacing.mdSm,
    paddingVertical: spacing.mdSm,
  },
  linkText: {},
});
