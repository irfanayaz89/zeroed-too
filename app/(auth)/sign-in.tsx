import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Btn, Field, Label, Row, Screen, T } from "@/components/fd/ui";
import { Dot } from "@/components/fd/DotCharacter";
import { useToast } from "@/components/fd/toast";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useFd } from "@/lib/prefs-context";
import { DOT_START } from "@/constants/focusd";

export default function SignIn() {
  const { c } = useFd();
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
        <Pressable
          accessibilityLabel="Back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(auth)/welcome"))}
          style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: c.card, alignItems: "center", justifyContent: "center" }}
        >
          <T v="h2" style={{ marginTop: -3 }}>‹</T>
        </Pressable>
      </Row>
      <View style={{ height: 170, alignItems: "center", justifyContent: "flex-end", zIndex: 10 }}>
        <Dot size={220} grow={DOT_START} />
      </View>
      <T v="title" style={{ textAlign: "center" }}>Welcome back</T>
      <Label>Email</Label>
      <Field value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" testID="signin-email" />
      <Label>Password</Label>
      <Field value={pw} onChangeText={setPw} placeholder="Password" secureTextEntry autoComplete="current-password" testID="signin-password" />
      {error ? <T v="small" color={c.danger}>{error}</T> : null}
      <Btn kind="link" title="Forgot password?" onPress={reset} style={{ alignSelf: "flex-end" }} />
      <View style={{ flex: 1 }} />
      <Btn title="Sign in" onPress={submit} loading={loading} disabled={!email || !pw} testID="signin-submit" />
    </Screen>
  );
}
