import React, { useEffect, useRef } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { useFonts } from "expo-font";
import { Sora_300Light, Sora_400Regular, Sora_600SemiBold } from "@expo-google-fonts/sora";
import { Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from "@expo-google-fonts/manrope";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Btn, T } from "@/components/z/ui";
import { ToastProvider } from "@/components/z/toast";
import { queryClient } from "@/lib/query-client";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { PrefsProvider, useZ, usePrefs } from "@/lib/prefs-context";
import { useNudges } from "@/hooks/useNudges";
import { useBlockLiveActivity } from "@/hooks/useBlockLiveActivity";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { c } = useZ();
  const { loaded } = usePrefs();
  const { session, profile, profileError, isLoading, refreshProfile } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const splashHidden = useRef(false);
  useNudges();
  useBlockLiveActivity();

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
      <View style={{ flex: 1, justifyContent: "center", gap: 16, padding: 24, backgroundColor: c.bg }}>
        <T v="display">Couldn&apos;t load your profile.</T>
        <T color="text2">Check your connection and try again.</T>
        <Btn title="Try again" onPress={refreshProfile} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" options={{ gestureEnabled: false }} />
        <Stack.Screen name="focus" options={{ presentation: "fullScreenModal", animation: "fade", gestureEnabled: false }} />
        <Stack.Screen name="add-block" options={{ presentation: "modal", contentStyle: { backgroundColor: c.surface } }} />
        <Stack.Screen name="save-account" options={{ presentation: "modal" }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

function Shell() {
  const { c } = useZ();
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardProvider>
        <AuthProvider>
          <ToastProvider>
            <RootLayoutNav />
          </ToastProvider>
        </AuthProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Sora_300Light,
    Sora_400Regular,
    Sora_600SemiBold,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
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
