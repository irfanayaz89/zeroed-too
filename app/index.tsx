import { View } from "react-native";
import { useZ } from "@/lib/prefs-context";

/** The root layout routes from here once auth and the profile have loaded. */
export default function Index() {
  const { c } = useZ();
  return <View style={{ flex: 1, backgroundColor: c.bg }} />;
}
