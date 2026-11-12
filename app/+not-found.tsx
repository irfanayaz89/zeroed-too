import { Stack, useRouter } from "expo-router";
import { View } from "react-native";
import { LinkBtn, T } from "@/components/z/ui";
import { useZ } from "@/lib/prefs-context";

export default function NotFoundScreen() {
  const { c } = useZ();
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ title: "Not found" }} />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 24, backgroundColor: c.bg }}>
        <T v="display">This screen doesn&apos;t exist.</T>
        <LinkBtn title="Back to today" chevron onPress={() => router.replace("/(tabs)/now")} />
      </View>
    </>
  );
}
