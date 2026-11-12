import React from "react";
import { FS, DOT_START } from "@/constants/focusd";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Btn, Screen, T } from "@/components/fd/ui";
import { Dot } from "@/components/fd/DotCharacter";
import { Bubble } from "@/components/fd/shared";
import { useAuth } from "@/lib/auth-context";
import { useFd } from "@/lib/prefs-context";

export default function Welcome() {
  const router = useRouter();
  const { c } = useFd();
  const { startAnonymous } = useAuth();
  const [line, setLine] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Start first, account later: a guest session now, "Save Dot" after the first pop.
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
      <View style={{ height: 300, alignItems: "center", justifyContent: "flex-end", zIndex: 10 }}>
        <View style={{ position: "absolute", top: 0, zIndex: 2 }} pointerEvents="none">
          <Bubble name="DOT" text={line ?? "Hi! Let's plan your focus together."} />
        </View>
        <Dot mood="happy" size={260} grow={DOT_START} onBoop={(l) => { setLine(l); setTimeout(() => setLine(null), 1600); }} />
      </View>
      <View style={{ alignItems: "center", gap: 10 }}>
        <T v="display" style={{ fontSize: FS.hero, lineHeight: 56 }}>Focus&apos;d</T>
        <T color="sub" style={{ textAlign: "center", fontSize: FS.lg }}>
          Plan 2 to 4 focus sessions a day.{"\n"}Fill a balloon in each one. Pop it when you&apos;re done.
        </T>
      </View>
      <View style={{ flex: 1 }} />
      {error ? <T v="small" color={c.danger} style={{ textAlign: "center" }}>{error}</T> : null}
      <Btn title="Get started" onPress={start} loading={busy} testID="get-started" />
      <Btn kind="link" title="I already have an account" onPress={() => router.push("/(auth)/sign-in")} testID="have-account" />
    </Screen>
  );
}
