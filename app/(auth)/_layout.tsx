import { Stack } from "expo-router";
import { useFd } from "@/lib/prefs-context";

export default function AuthLayout() {
  const { c } = useFd();
  return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right", contentStyle: { backgroundColor: c.bg } }} />;
}
