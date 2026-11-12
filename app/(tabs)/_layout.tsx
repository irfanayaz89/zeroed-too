import React from "react";
import { Pressable, Text, View } from "react-native";
import { Tabs } from "expo-router";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { FONTS, FS, FIXED } from "@/constants/focusd";
import { useFd } from "@/lib/prefs-context";

const ICONS: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  now: ["flash-outline", "flash"],
  plan: ["calendar-outline", "calendar"],
  insights: ["stats-chart-outline", "stats-chart"],
  me: ["person-outline", "person"],
};

/** Floating pill tab bar from the design. */
function FdTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { c } = useFd();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        position: "absolute",
        left: 18,
        right: 18,
        bottom: Math.max(insets.bottom, 12) + 4,
        height: 70,
        borderRadius: 26,
        backgroundColor: c.tab,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        paddingHorizontal: 6,
      }}
    >
      {state.routes.map((route, i) => {
        const on = state.index === i;
        const label = (descriptors[route.key].options.title ?? route.name) as string;
        const [off, onIcon] = ICONS[route.name] ?? ["ellipse-outline", "ellipse"];
        return (
          <Pressable
            key={route.key}
            testID={`tab-${route.name}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => {
              const e = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!on && !e.defaultPrevented) {
                Haptics.selectionAsync().catch(() => {});
                navigation.navigate(route.name);
              }
            }}
            style={{
              alignItems: "center",
              gap: 2,
              paddingVertical: 7,
              paddingHorizontal: 14,
              borderRadius: 18,
              backgroundColor: on ? c.accent : "transparent",
            }}
          >
            <Ionicons name={on ? onIcon : off} size={22} color={on ? FIXED.white : c.fSub} />
            <Text style={{ fontFamily: FONTS.heavy, fontSize: FS.tiny, color: on ? FIXED.white : c.fSub }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs initialRouteName="now" screenOptions={{ headerShown: false }} tabBar={(p) => <FdTabBar {...p} />}>
      <Tabs.Screen name="now" options={{ title: "Now" }} />
      <Tabs.Screen name="plan" options={{ title: "Plan" }} />
      <Tabs.Screen name="insights" options={{ title: "Insights" }} />
      <Tabs.Screen name="me" options={{ title: "Me" }} />
    </Tabs>
  );
}
