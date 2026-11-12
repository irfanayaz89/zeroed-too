import { Stack } from "expo-router";
import { useFd } from "@/lib/prefs-context";

export default function OnboardingLayout() {
  const { c } = useFd();
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right", contentStyle: { backgroundColor: c.bg } }}>
      <Stack.Screen name="setup" />
      <Stack.Screen name="building" options={{ gestureEnabled: false, animation: "fade" }} />
      <Stack.Screen name="preview" options={{ gestureEnabled: false, animation: "fade" }} />
    </Stack>
  );
}
