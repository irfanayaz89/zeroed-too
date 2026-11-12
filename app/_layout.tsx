import React, { useEffect, useRef } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { useFonts } from "expo-font";
import { BagelFatOne_400Regular } from "@expo-google-fonts/bagel-fat-one";
import {
  Gabarito_500Medium,
  Gabarito_600SemiBold,
  Gabarito_700Bold,
  Gabarito_800ExtraBold,
} from "@expo-google-fonts/gabarito";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Btn, T } from "@/components/fd/ui";
import { ToastProvider } from "@/components/fd/toast";
import { queryClient } from "@/lib/query-client";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { PrefsProvider, usePrefs } from "@/lib/prefs-context";
import { FocusSessionProvider } from "@/lib/focus-session";
import { useNudges } from "@/hooks/useNudges";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { colors, isDark, loaded } = usePrefs();
  const { session, profile, profileError, isLoading, refreshProfile } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const splashHidden = useRef(false);
  useNudges();

  useEffect(() => {
    if (isLoading || !loaded) return;
    // This effect reruns on every navigation, and hiding the splash twice rejects.
    if (!splashHidden.current) {
      splashHidden.current = true;
      SplashScreen.hideAsync();
    }
    // Without a profile we can't tell if onboarding is done, so stay put.
    if (session && !profile && profileError) return;

    const top = segments[0] as string | undefined;
    const inAuth = top === "(auth)";
    const inOnboarding = top === "(onboarding)";

    if (!session) {
      if (!inAuth) router.replace("/(auth)/welcome");
    } else if (profile && !profile.onboarding_complete) {
      if (!inOnboarding) router.replace("/(onboarding)/setup");
    } else if (profile && (inAuth || inOnboarding || !top || top === "index")) {
      router.replace("/(tabs)/now");
    }
  }, [session, profile, profileError, isLoading, loaded, segments, router]);

  if (session && !profile && profileError) {
    return (
      <View style={{ flex: 1, justifyContent: "center", gap: 16, padding: 24, backgroundColor: colors.bg }}>
        <T v="h2">Couldn&apos;t load your profile.</T>
        <T color="sub">Check your connection and try again.</T>
        <Btn title="Try again" onPress={refreshProfile} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" options={{ gestureEnabled: false }} />
        <Stack.Screen name="focus" options={{ presentation: "fullScreenModal", animation: "fade", gestureEnabled: false }} />
        <Stack.Screen name="add-block" options={{ presentation: "modal" }} />
        <Stack.Screen name="save-account" options={{ presentation: "modal" }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

function Shell() {
  const { colors } = usePrefs();
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardProvider>
        <AuthProvider>
          <ToastProvider>
            <FocusSessionProvider>
              <RootLayoutNav />
            </FocusSessionProvider>
          </ToastProvider>
        </AuthProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BagelFatOne_400Regular,
    Gabarito_500Medium,
    Gabarito_600SemiBold,
    Gabarito_700Bold,
    Gabarito_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <PrefsProvider>
          <Shell />
        </PrefsProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
