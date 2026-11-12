import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Btn, Field, Label, Row, Screen, T } from "@/components/fd/ui";
import { Dot } from "@/components/fd/DotCharacter";
import { useBuddyName } from "@/components/fd/shared";
import { supabase } from "@/lib/supabase";
import { useFd } from "@/lib/prefs-context";
import { DOT_START } from "@/constants/focusd";

/**
 * Turns the guest account into a real one (same user, so the plan, history
 * and Dot carry over). Email first, then the password once the email is confirmed.
 */
export default function SaveAccount() {
  const { c } = useFd();
  const router = useRouter();
  const buddy = useBuddyName();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"form" | "verify" | "done">("form");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)/now"));

  const finishWithPassword = async () => {
    const { error: err } = await supabase.auth.updateUser({ password: pw });
    if (err) {
      setError(err.message);
      return false;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setStep("done");
    return true;
  };

  /** True once the new email is on the account (confirmation off, or confirmed). */
  const emailConfirmed = async () => {
    await supabase.auth.refreshSession().catch(() => {});
    const { data } = await supabase.auth.getUser();
    const u = data.user;
    return !!u && u.email?.toLowerCase() === email.trim().toLowerCase() && !u.new_email;
  };

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("That email doesn't look right.");
    if (pw.length < 8) return setError("Use at least 8 characters for your password.");
    setError(null);
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ email: email.trim() });
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    if (await emailConfirmed()) await finishWithPassword();
    else setStep("verify");
    setBusy(false);
  };

  const verifyCode = async () => {
    setError(null);
    setBusy(true);
    const { error: err } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email_change" });
    if (err) setError(err.message);
    else await finishWithPassword();
    setBusy(false);
  };

  const checkLink = async () => {
    setError(null);
    setBusy(true);
    if (await emailConfirmed()) await finishWithPassword();
    else setError("Not confirmed yet. Tap the link in the email, then try again.");
    setBusy(false);
  };

  const header = (
    <Row style={{ justifyContent: "space-between" }}>
      <Pressable onPress={close} accessibilityLabel="Close" style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: c.card, alignItems: "center", justifyContent: "center" }}>
        <T v="bodyStrong">✕</T>
      </Pressable>
    </Row>
  );

  if (step === "done") {
    return (
      <Screen>
        <View style={{ flex: 1 }} />
        <View style={{ height: 220, alignItems: "center", justifyContent: "flex-end", zIndex: 10 }}>
          <Dot mood="happy" size={250} grow={DOT_START} />
        </View>
        <T v="title" style={{ textAlign: "center" }}>{buddy} is saved!</T>
        <T color="sub" style={{ textAlign: "center" }}>Sign in with {email.trim()} on any phone and everything comes with you.</T>
        <View style={{ flex: 1 }} />
        <Btn title="Done" onPress={close} testID="save-done" />
      </Screen>
    );
  }

  if (step === "verify") {
    return (
      <Screen>
        {header}
        <T v="title">Check your email</T>
        <T color="sub">We sent a message to {email.trim()}. Type the code from it, or tap its link and come back here.</T>
        <Label>Code</Label>
        <Field value={code} onChangeText={setCode} placeholder="123456" keyboardType="number-pad" maxLength={10} testID="save-code" />
        {error ? <T v="small" color={c.danger}>{error}</T> : null}
        <View style={{ flex: 1 }} />
        <Btn title="Confirm code" disabled={code.trim().length < 6} loading={busy} onPress={verifyCode} />
        <Btn kind="secondary" title="I tapped the link" disabled={busy} onPress={checkLink} />
        <Btn kind="link" title="Use a different email" onPress={() => { setStep("form"); setCode(""); setError(null); }} />
      </Screen>
    );
  }

  return (
    <Screen>
      {header}
      <T v="title">Save {buddy}</T>
      <T color="sub">
        Right now your plan and {buddy} live only on this phone. Add an email and password so they&apos;re safe if you switch or lose it.
      </T>
      <Label>Email</Label>
      <Field value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" testID="save-email" />
      <Label>Password</Label>
      <Field value={pw} onChangeText={setPw} placeholder="8+ characters" secureTextEntry autoComplete="new-password" testID="save-password" />
      {error ? <T v="small" color={c.danger}>{error}</T> : null}
      <View style={{ flex: 1, minHeight: 20 }} />
      <Btn title={`Save ${buddy}`} onPress={submit} loading={busy} testID="save-submit" />
      <T v="small" style={{ textAlign: "center" }}>By saving you agree to the Terms and Privacy Policy.</T>
    </Screen>
  );
}
