import { Stack } from "expo-router";
import { useZ } from "@/lib/prefs-context";

export default function AuthLayout() {
  const { c } = useZ();
  return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right", contentStyle: { backgroundColor: c.bg } }} />;
}
