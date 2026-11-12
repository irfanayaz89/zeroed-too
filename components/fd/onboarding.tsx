import React, { type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Dots, Row, T } from "./ui";
import { useFd } from "@/lib/prefs-context";

/** Back button + step dots used at the top of every onboarding step. */
export function StepTop({ step, of = 6, onBack, hideBack }: { step: number; of?: number; onBack?: () => void; hideBack?: boolean }) {
  const { c } = useFd();
  const router = useRouter();
  return (
    <Row style={{ justifyContent: "space-between" }}>
      {hideBack ? <View style={{ width: 42 }} /> : <Pressable
        accessibilityLabel="Back"
        onPress={onBack ?? (() => router.back())}
        style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: c.card, alignItems: "center", justifyContent: "center" }}
      >
        <T v="h2" style={{ marginTop: -3 }}>‹</T>
      </Pressable>}
      <Dots index={step} count={of} />
      <View style={{ width: 42 }} />
    </Row>
  );
}

export function StepHead({ title, lead }: { title: string; lead?: ReactNode }) {
  return (
    <View style={{ gap: 6, marginTop: 8 }}>
      <T v="title">{title}</T>
      {lead ? <T color="sub">{lead}</T> : null}
    </View>
  );
}
