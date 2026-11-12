import React, { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { CATEGORIES, FONTS, FS } from "@/constants/theme";
import { ONBOARDING_STEPS, StepHead, StepTop } from "@/components/z/onboarding";
import { Btn, Chip, Chips, Field, FieldLabel, Press, Row, Screen, T } from "@/components/z/ui";
import { useAuth } from "@/lib/auth-context";
import { CHALLENGE_OPTIONS, FOCUS_GROUPS, FREE_WINDOWS, challengeOf, generatePlan } from "@/lib/focus";
import { getDraft, setDraft, type SetupDraft } from "@/lib/onboarding-draft";
import { useZ } from "@/lib/prefs-context";

/** Onboarding before the warm-up: name, focus areas, biggest challenge, free times. */
export default function Setup() {
  const { c } = useZ();
  const router = useRouter();
  const { profile } = useAuth();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<SetupDraft>(
    () =>
      getDraft() ?? {
        name: profile?.name ?? "",
        focus: profile?.focus_areas ?? [],
        free: profile?.free_times ?? [],
        perDay: profile?.sessions_per_day ?? 3,
        len: profile?.session_length ?? 45,
        challenge: profile?.focus_struggle ?? null,
        plan: null,
      }
  );
  const [adding, setAdding] = useState(false);
  const [extra, setExtra] = useState("");

  const up = (patch: Partial<SetupDraft>) => setD((x) => ({ ...x, ...patch }));
  const toggle = (k: "focus" | "free", v: string) => setD((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }));
  const back = step > 0 ? () => setStep(step - 1) : undefined;
  const known = FOCUS_GROUPS.flatMap(([, items]) => items);
  const custom = d.focus.filter((f) => !known.includes(f));
  const ch = challengeOf(d.challenge);

  let body: React.ReactNode;
  let next: React.ReactNode;
  if (step === 0) {
    body = (
      <>
        <StepHead title="What should we call you?" lead="Just a first name. It's only used inside the app." />
        <Field value={d.name} onChangeText={(v) => up({ name: v })} placeholder="Your first name" autoComplete="given-name" autoFocus maxLength={24} testID="setup-name" />
      </>
    );
    next = <Btn title="Continue" disabled={!d.name.trim()} onPress={() => setStep(1)} testID="setup-next" />;
  } else if (step === 1) {
    body = (
      <>
        <StepHead title="What do you want to make time for?" lead="Pick a few. Each one becomes a focus block in your week." />
        {FOCUS_GROUPS.map(([cat, items], gi) => (
          <View key={cat} style={{ gap: 8 }}>
            <FieldLabel>{CATEGORIES[cat].label}</FieldLabel>
            <Chips>
              {items.map((f) => (
                <Chip key={f} label={f} dot={CATEGORIES[cat].color} on={d.focus.includes(f)} onPress={() => toggle("focus", f)} testID={`focus-${f}`} />
              ))}
              {gi === FOCUS_GROUPS.length - 1 ? (
                <>
                  {custom.map((f) => (
                    <Chip key={f} label={f} on onPress={() => toggle("focus", f)} />
                  ))}
                  <Chip label="+ Add your own" onPress={() => setAdding(true)} testID="focus-add" />
                </>
              ) : null}
            </Chips>
          </View>
        ))}
        {adding ? (
          <Row>
            <View style={{ flex: 1 }}>
              <Field value={extra} onChangeText={setExtra} placeholder="e.g. Portfolio site" autoFocus maxLength={30} />
            </View>
            <Btn
              kind="pri"
              title="Add"
              onPress={() => {
                const v = extra.trim();
                if (v && !d.focus.includes(v)) up({ focus: [...d.focus, v] });
                setExtra("");
                setAdding(false);
              }}
            />
          </Row>
        ) : null}
      </>
    );
    next = <Btn title={`Continue${d.focus.length ? ` · ${d.focus.length} picked` : ""}`} disabled={!d.focus.length} onPress={() => setStep(2)} testID="setup-next" />;
  } else if (step === 2) {
    body = (
      <>
        <StepHead title="What gets in the way most?" lead="We'll set your defaults around it, and give you a plan for when it happens." />
        <View style={{ gap: 8 }}>
          {CHALLENGE_OPTIONS.map((o) => {
            const on = d.challenge === o.id;
            return (
              <Press
                key={o.id}
                testID={`challenge-${o.id}`}
                scale={0.985}
                onPress={() => up({ challenge: o.id, ...o.defaults })}
                style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: c.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: on ? c.accent : c.line }}
              >
                <View style={{ flex: 1 }}>
                  <T v="bodyStrong">{o.label}</T>
                  <T v="small">{o.hint}</T>
                </View>
                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: on ? c.accent : c.line, backgroundColor: on ? c.accent : "transparent" }} />
              </Press>
            );
          })}
        </View>
        {ch ? (
          <Animated.View key={ch.id} entering={FadeIn.duration(250)} style={{ backgroundColor: c.accentSoft, borderRadius: 16, padding: 14, gap: 4 }}>
            <T v="caps" color="accent">Your if-then plan</T>
            <T v="bodyStrong">{ch.plan}</T>
            <T v="small">It shows when each block starts.</T>
          </Animated.View>
        ) : null}
      </>
    );
    next = <Btn title="Continue" disabled={!d.challenge} onPress={() => setStep(3)} testID="setup-next" />;
  } else {
    const chip = (w: (typeof FREE_WINDOWS)[number]) => (
      <Chip key={w.id} label={`${w.label} · ${w.time}`} on={d.free.includes(w.id)} onPress={() => toggle("free", w.id)} testID={`free-${w.id}`} />
    );
    body = (
      <>
        <StepHead title="When do you usually have time?" lead="Blocks only go in these windows. You can move anything later." />
        <View style={{ gap: 8 }}>
          <FieldLabel>Weekdays</FieldLabel>
          <Chips>{FREE_WINDOWS.filter((w) => !w.weekend).map(chip)}</Chips>
        </View>
        <View style={{ gap: 8 }}>
          <FieldLabel>Weekends</FieldLabel>
          <Chips>{FREE_WINDOWS.filter((w) => w.weekend).map(chip)}</Chips>
        </View>
        <View style={{ gap: 8 }}>
          <FieldLabel>Blocks a day</FieldLabel>
          <Chips>
            {[2, 3, 4].map((n) => (
              <Chip key={n} label={String(n)} on={d.perDay === n} onPress={() => up({ perDay: n })} />
            ))}
          </Chips>
        </View>
        <View style={{ gap: 8 }}>
          <FieldLabel>Block length</FieldLabel>
          <Chips>
            {[25, 45, 60, 90].map((n) => (
              <Chip key={n} label={n === 90 ? "1h 30m" : n === 60 ? "1h" : `${n} min`} on={d.len === n} onPress={() => up({ len: n })} />
            ))}
          </Chips>
        </View>
        {ch && (ch.defaults.len || ch.defaults.perDay) ? (
          <Text style={{ fontFamily: FONTS.semibold, fontSize: FS.chip, color: c.text3, lineHeight: 18 }}>
            We started you on {ch.defaults.len ? `${ch.defaults.len}-minute blocks` : `${ch.defaults.perDay} blocks a day`} because of “{ch.label.toLowerCase()}”. Change it if you like.
          </Text>
        ) : null}
      </>
    );
    next = (
      <Btn
        title="Continue"
        disabled={!d.free.length}
        testID="setup-next"
        onPress={() => {
          const plan = generatePlan({ focus: d.focus, free: d.free, perDay: d.perDay, len: d.len });
          setDraft({ ...d, name: d.name.trim(), plan });
          router.push("/(onboarding)/warmup");
        }}
      />
    );
  }

  return (
    <Screen>
      <StepTop step={step} of={ONBOARDING_STEPS} onBack={back} hideBack={step === 0} />
      {body}
      <View style={{ flex: 1, minHeight: 16 }} />
      {next}
    </Screen>
  );
}
