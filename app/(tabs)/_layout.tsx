import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Tabs } from "expo-router";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS, FS, rgba } from "@/constants/theme";
import { Icon, type IconName } from "@/components/z/icons";
import { haptic } from "@/lib/haptics";
import { useZ } from "@/lib/prefs-context";

const ICONS: Record<string, IconName> = { now: "now", plan: "plan", insights: "insights", me: "me" };

function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { c } = useZ();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, borderTopWidth: 1, borderTopColor: c.line, overflow: "hidden" }}>
      {Platform.OS === "ios" ? <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} /> : null}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: rgba(c.bg, Platform.OS === "ios" ? 0.86 : 0.97) }]} />
      <View style={{ flexDirection: "row", paddingTop: 8, paddingHorizontal: 10, paddingBottom: Math.max(insets.bottom, 10) }}>
        {state.routes.map((route, i) => {
          const on = state.index === i;
          const label = (descriptors[route.key].options.title ?? route.name) as string;
          return (
            <Pressable
              key={route.key}
              testID={`tab-${route.name}`}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: on }}
              onPress={() => {
                const e = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (!on && !e.defaultPrevented) {
                  haptic.select();
                  navigation.navigate(route.name);
                }
              }}
              style={{ flex: 1, alignItems: "center", gap: 4 }}
            >
              <Icon name={ICONS[route.name] ?? "now"} size={24} color={on ? c.accent : c.text3} />
              <Text style={{ fontFamily: FONTS.bold, fontSize: FS.label, letterSpacing: 0.2, color: on ? c.text : c.text3 }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { c } = useZ();
  return (
    <Tabs initialRouteName="now" screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.bg } }} tabBar={(p) => <TabBar {...p} />}>
      <Tabs.Screen name="now" options={{ title: "Now" }} />
      <Tabs.Screen name="plan" options={{ title: "Plan" }} />
      <Tabs.Screen name="insights" options={{ title: "Insights" }} />
      <Tabs.Screen name="me" options={{ title: "Me" }} />
    </Tabs>
  );
}
