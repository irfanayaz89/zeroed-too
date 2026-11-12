import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Btn, Field, FieldLabel, LinkBtn, RoundBtn, Row, Screen, T } from "@/components/z/ui";
import { useToast } from "@/components/z/toast";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useZ } from "@/lib/prefs-context";

export default function SignIn() {
  const { c } = useZ();
  const router = useRouter();
  const toast = useToast();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    const r = await signIn(email.trim(), pw);
    setLoading(false);
    if (r.error) setError(r.error);
  };

  const reset = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Type your email first, then tap Forgot password.");
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (err) setError(err.message);
    else toast("We sent a reset link to your email.");
  };

  return (
    <Screen>
      <Row>
        <RoundBtn icon="back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace("/(auth)/welcome"))} />
      </Row>
      <T v="page" style={{ marginTop: 12 }}>Welcome back</T>
      <View style={{ gap: 8 }}>
        <FieldLabel>Email</FieldLabel>
        <Field value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" testID="signin-email" />
      </View>
      <View style={{ gap: 8 }}>
        <FieldLabel>Password</FieldLabel>
        <Field value={pw} onChangeText={setPw} placeholder="Password" secureTextEntry autoComplete="current-password" testID="signin-password" />
      </View>
      {error ? <T v="small" color={c.bad}>{error}</T> : null}
      <LinkBtn title="Forgot password?" onPress={reset} />
      <View style={{ flex: 1 }} />
      <Btn title="Sign in" onPress={submit} loading={loading} disabled={!email || !pw} testID="signin-submit" />
    </Screen>
  );
}
