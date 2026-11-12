import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Btn, Field, FieldLabel, LinkBtn, RoundBtn, Row, Screen, T } from "@/components/z/ui";
import { FS } from "@/constants/theme";
import { haptic } from "@/lib/haptics";
import { supabase } from "@/lib/supabase";
import { useZ } from "@/lib/prefs-context";

/**
 * Turns the guest account into a real one (same user, so the plan, history
 * carry over). Email first, then the password once the email is confirmed.
 */
export default function SaveAccount() {
  const { c } = useZ();
  const router = useRouter();
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
    haptic.success();
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
      <RoundBtn icon="close" label="Close" onPress={close} />
    </Row>
  );

  if (step === "done") {
    return (
      <Screen>
        <View style={{ flex: 1 }} />
        <T v="caps" style={{ textAlign: "center" }}>All set</T>
        <T v="page" style={{ textAlign: "center" }}>Your progress is saved</T>
        <T color="text2" style={{ textAlign: "center", fontSize: FS.body, lineHeight: 22 }}>Sign in with {email.trim()} on any phone and everything comes with you.</T>
        <View style={{ flex: 1 }} />
        <Btn title="Done" onPress={close} testID="save-done" />
      </Screen>
    );
  }

  if (step === "verify") {
    return (
      <Screen>
        {header}
        <T v="page">Check your email</T>
        <T color="text2" style={{ fontSize: FS.body, lineHeight: 22 }}>We sent a message to {email.trim()}. Type the code from it, or tap its link and come back here.</T>
        <FieldLabel>Code</FieldLabel>
        <Field value={code} onChangeText={setCode} placeholder="123456" keyboardType="number-pad" maxLength={10} testID="save-code" />
        {error ? <T v="small" color={c.bad}>{error}</T> : null}
        <View style={{ flex: 1 }} />
        <Btn title="Confirm code" disabled={code.trim().length < 6} loading={busy} onPress={verifyCode} />
        <Btn kind="ghost" title="I tapped the link" disabled={busy} onPress={checkLink} />
        <LinkBtn title="Use a different email" onPress={() => { setStep("form"); setCode(""); setError(null); }} />
      </Screen>
    );
  }

  return (
    <Screen>
      {header}
      <T v="page">Save your progress</T>
      <T color="text2" style={{ fontSize: FS.body, lineHeight: 22 }}>
        Right now your plan and history live only on this phone. Add an email and password so they&apos;re safe if you switch or lose it.
      </T>
      <FieldLabel>Email</FieldLabel>
      <Field value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" testID="save-email" />
      <FieldLabel>Password</FieldLabel>
      <Field value={pw} onChangeText={setPw} placeholder="8+ characters" secureTextEntry autoComplete="new-password" testID="save-password" />
      {error ? <T v="small" color={c.bad}>{error}</T> : null}
      <View style={{ flex: 1, minHeight: 20 }} />
      <Btn title="Save your progress" onPress={submit} loading={busy} testID="save-submit" />
      <T v="small" style={{ textAlign: "center" }}>By saving you agree to the Terms and Privacy Policy.</T>
    </Screen>
  );
}
