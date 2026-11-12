import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { FS, DOT_START } from "@/constants/focusd";
import { Btn, Chip, Chips, Field, Label, Row, Screen, T } from "@/components/fd/ui";
import { StepHead, StepTop } from "@/components/fd/onboarding";
import { Dot } from "@/components/fd/DotCharacter";
import { useAuth } from "@/lib/auth-context";
import { useFd } from "@/lib/prefs-context";
import { CHALLENGE_OPTIONS, FOCUS_GROUPS, FREE_WINDOWS, challengeOf, generatePlan } from "@/lib/focus";
import { getDraft, setDraft, type SetupDraft } from "@/lib/onboarding-draft";

const BUDDY_NAMES = ["Dot", "Foci", "Fuzz", "Mote"];
/** Steps on this screen; the warm-up is the last dot. */
const STEPS = 6;

/** Onboarding before the warm-up: name, focus areas, challenge, free times, buddy name. */
export default function Setup() {
  const { c } = useFd();
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
        buddy: profile?.buddy_name ?? "Dot",
        plan: null,
      }
  );
  const [adding, setAdding] = useState(false);
  const [extra, setExtra] = useState("");

  const up = (patch: Partial<SetupDraft>) => setD((x) => ({ ...x, ...patch }));
  const toggle = (k: "focus" | "free", v: string) => setD((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }));
  const back = step > 0 ? () => setStep(step - 1) : () => (router.canGoBack() ? router.back() : undefined);
  const known = FOCUS_GROUPS.flatMap(([, items]) => items);
  const custom = d.focus.filter((f) => !known.includes(f));
  const buddy = d.buddy.trim() || "Dot";
  const ch = challengeOf(d.challenge);

  let body: React.ReactNode;
  let next: React.ReactNode;
  if (step === 0) {
    body = (
      <>
        <StepHead title="Hi! What should I call you?" lead="Just a first name. It's only used inside the app." />
        <View style={{ height: 180, alignItems: "center", justifyContent: "flex-end", zIndex: 10 }}>
          <Dot mood="happy" size={220} grow={DOT_START} />
        </View>
        <Field value={d.name} onChangeText={(v) => up({ name: v })} placeholder="Your first name" autoComplete="given-name" maxLength={24} testID="setup-name" />
      </>
    );
    next = <Btn title="Continue" disabled={!d.name.trim()} onPress={() => setStep(1)} testID="setup-next" />;
  } else if (step === 1) {
    body = (
      <>
        <StepHead title="What do you want to focus on?" lead="Pick a few. These become your focus sessions." />
        {FOCUS_GROUPS.map(([g, items], gi) => (
          <View key={g} style={{ gap: 8 }}>
            <Label>{g}</Label>
            <Chips>
              {items.map((f) => <Chip key={f} label={f} on={d.focus.includes(f)} onPress={() => toggle("focus", f)} testID={`focus-${f}`} />)}
              {gi === FOCUS_GROUPS.length - 1 ? (
                <>
                  {custom.map((f) => <Chip key={f} label={f} on onPress={() => toggle("focus", f)} />)}
                  <Chip dashed label="+ Add your own" onPress={() => setAdding(true)} />
                </>
              ) : null}
            </Chips>
          </View>
        ))}
        {adding ? (
          <Row>
            <View style={{ flex: 1 }}>
              <Field value={extra} onChangeText={setExtra} placeholder="e.g. Chemistry" autoFocus maxLength={30} />
            </View>
            <Btn
              small
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
        <StepHead title="What gets in the way most?" lead={`${buddy} will help with this one first.`} />
        {CHALLENGE_OPTIONS.map((o) => {
          const on = d.challenge === o.id;
          return (
            <Pressable
              key={o.id}
              testID={`challenge-${o.id}`}
              onPress={() => up({ challenge: o.id, ...o.defaults })}
              style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.card, borderRadius: 20, padding: 16, borderWidth: 2, borderColor: on ? c.accent : "transparent" }}
            >
              <View style={{ flex: 1 }}>
                <T v="bodyStrong">{o.label}</T>
                <T v="small">{o.hint}</T>
              </View>
              <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: c.accent, backgroundColor: on ? c.accent : "transparent" }} />
            </Pressable>
          );
        })}
        {ch ? (
          <Animated.View key={ch.id} entering={FadeIn.duration(250)} style={{ backgroundColor: c.tip, borderRadius: 20, padding: 16, gap: 4 }}>
            <T v="label" color={c.tipInk}>Your plan for it</T>
            <T v="bodyStrong" color={c.tipInk}>{ch.plan}</T>
            <T v="small" color={c.tipInk}>{buddy} will remind you of this when each session starts.</T>
          </Animated.View>
        ) : null}
      </>
    );
    next = <Btn title="Continue" disabled={!d.challenge} onPress={() => setStep(3)} testID="setup-next" />;
  } else if (step === 3) {
    const chip = (w: (typeof FREE_WINDOWS)[number]) => (
      <Chip key={w.id} label={`${w.label} · ${w.time}`} on={d.free.includes(w.id)} onPress={() => toggle("free", w.id)} testID={`free-${w.id}`} />
    );
    body = (
      <>
        <StepHead title="When do you usually have time?" lead="We'll only plan focus in these windows." />
        <Label>Weekdays</Label>
        <Chips>{FREE_WINDOWS.filter((w) => !w.weekend).map(chip)}</Chips>
        <Label>Weekends</Label>
        <Chips>{FREE_WINDOWS.filter((w) => w.weekend).map(chip)}</Chips>
        <Label>Sessions a day</Label>
        <Chips>{[2, 3, 4].map((n) => <Chip key={n} label={String(n)} on={d.perDay === n} onPress={() => up({ perDay: n })} />)}</Chips>
        <Label>Session length</Label>
        <Chips>{[25, 45, 60].map((n) => <Chip key={n} label={`${n} min`} on={d.len === n} onPress={() => up({ len: n })} />)}</Chips>
        {ch && (ch.defaults.len || ch.defaults.perDay) ? (
          <T v="small">We started you on {ch.defaults.len ? `${ch.defaults.len}-minute sessions` : `${ch.defaults.perDay} sessions a day`} because of “{ch.label.toLowerCase()}”. Change it if you like.</T>
        ) : null}
      </>
    );
    next = <Btn title="Continue" disabled={!d.free.length} onPress={() => setStep(4)} testID="setup-next" />;
  } else {
    body = (
      <>
        <StepHead title="Meet your focus buddy" lead="It soaks up every balloon you pop and grows as you have good days. Give it a poke, then pick a name." />
        <View style={{ height: 210, alignItems: "center", justifyContent: "flex-end", zIndex: 10 }}>
          <Dot mood="happy" size={250} grow={DOT_START} />
        </View>
        <Field value={d.buddy} onChangeText={(v) => up({ buddy: v })} maxLength={14} style={{ textAlign: "center", fontSize: FS.h3 }} testID="buddy-name" />
        <View style={{ alignItems: "center" }}>
          <Chips>{BUDDY_NAMES.map((n) => <Chip key={n} label={n} on={d.buddy === n} onPress={() => up({ buddy: n })} />)}</Chips>
        </View>
      </>
    );
    next = (
      <Btn
        title="Continue"
        disabled={!d.buddy.trim()}
        testID="setup-next"
        onPress={() => {
          const plan = generatePlan({ focus: d.focus, free: d.free, perDay: d.perDay, len: d.len });
          setDraft({ ...d, name: d.name.trim(), buddy: d.buddy.trim(), plan });
          router.push("/(onboarding)/warmup");
        }}
      />
    );
  }

  return (
    <Screen>
      <StepTop step={step} of={STEPS} onBack={back} hideBack={step === 0 && !router.canGoBack()} />
      {body}
      <View style={{ flex: 1, minHeight: 16 }} />
      {next}
    </Screen>
  );
}
