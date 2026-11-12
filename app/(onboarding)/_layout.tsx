import { Stack } from "expo-router";
import { useZ } from "@/lib/prefs-context";

export default function OnboardingLayout() {
  const { c } = useZ();
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right", contentStyle: { backgroundColor: c.bg } }}>
      <Stack.Screen name="setup" />
      <Stack.Screen name="building" options={{ gestureEnabled: false, animation: "fade" }} />
      <Stack.Screen name="preview" options={{ gestureEnabled: false, animation: "fade" }} />
    </Stack>
  );
}
