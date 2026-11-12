import React, { type ReactNode } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { FS } from "@/constants/theme";
import { Dots, RoundBtn, Row, T } from "./ui";

/** Back button + step dots at the top of every onboarding step. */
export function StepTop({ step, of, onBack, hideBack }: { step: number; of: number; onBack?: () => void; hideBack?: boolean }) {
  const router = useRouter();
  return (
    <Row style={{ justifyContent: "space-between" }}>
      {hideBack ? <View style={{ width: 40 }} /> : <RoundBtn icon="back" label="Back" onPress={onBack ?? (() => router.back())} />}
      <Dots index={step} count={of} />
      <View style={{ width: 40 }} />
    </Row>
  );
}

export function StepHead({ title, lead }: { title: string; lead?: ReactNode }) {
  return (
    <View style={{ gap: 6, marginTop: 8 }}>
      <T v="page" style={{ lineHeight: 34 }}>{title}</T>
      {lead ? <T v="body" color="text2" style={{ fontSize: FS.body, lineHeight: 22 }}>{lead}</T> : null}
    </View>
  );
}

/** Total onboarding steps shown in the dots: name, focus, challenge, free times, warm-up, nudges. */
export const ONBOARDING_STEPS = 6;
