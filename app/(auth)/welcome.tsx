import React, { useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { FocusArc } from "@/components/z/FocusArc";
import { Btn, LinkBtn, Screen, T } from "@/components/z/ui";
import { FS } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";
import { useZ } from "@/lib/prefs-context";

export default function Welcome() {
  const router = useRouter();
  const { c } = useZ();
  const { width } = useWindowDimensions();
  const { startAnonymous } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start first, account later: a guest session now, "Save your progress" from Me.
  const start = async () => {
    setError(null);
    setBusy(true);
    const r = await startAnonymous();
    setBusy(false);
    if (r.error) setError(`Couldn't get started: ${r.error}`);
  };

  return (
    <Screen>
      <View style={{ flex: 1 }} />
      <View style={{ alignItems: "center" }}>
        <FocusArc width={Math.min(300, width - 80)} progress={0.62} color={c.accent} />
      </View>
      <View style={{ alignItems: "center", gap: 10, marginTop: 6 }}>
        <T v="page" style={{ fontSize: FS.big, lineHeight: 40 }}>Zeroed</T>
        <T v="body" color="text2" style={{ textAlign: "center", fontSize: FS.body, lineHeight: 22, maxWidth: 300 }}>
          Plan two to four focus blocks a day. Zeroed counts you down through each one, and finished minutes add up to your Focus Score.
        </T>
      </View>
      <View style={{ flex: 1 }} />
      {error ? (
        <T v="small" color={c.bad} style={{ textAlign: "center" }}>
          {error}
        </T>
      ) : null}
      <Btn title="Get started" onPress={start} loading={busy} testID="get-started" />
      <LinkBtn title="I already have an account" onPress={() => router.push("/(auth)/sign-in")} testID="have-account" />
    </Screen>
  );
}
