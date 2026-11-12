import React, { useState } from "react";
import { reloadAppAsync } from "expo";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { ACCENTS, FS, THEMES } from "@/constants/theme";

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

/** Shown above every provider, so it uses the default theme directly. */
const t = THEMES.graphite;
const a = ACCENTS[t.defAccent];

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const [details, setDetails] = useState(false);
  const restart = async () => {
    try {
      await reloadAppAsync();
    } catch {
      resetError();
    }
  };
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: "center", padding: 24, gap: 14 }}>
      <Text style={{ color: t.text, fontSize: FS.title, fontWeight: "600", textAlign: "center" }}>Something went wrong</Text>
      <Text style={{ color: t.text2, fontSize: FS.body, textAlign: "center" }}>Reload the app to carry on.</Text>
      <Pressable onPress={restart} style={{ backgroundColor: a.c, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: a.on, fontSize: FS.body, fontWeight: "800" }}>Try again</Text>
      </Pressable>
      {__DEV__ ? (
        <>
          <Pressable onPress={() => setDetails((d) => !d)} style={{ alignSelf: "center", padding: 8 }}>
            <Text style={{ color: t.text2, fontSize: FS.sm }}>{details ? "Hide details" : "Show details"}</Text>
          </Pressable>
          {details ? (
            <ScrollView style={{ maxHeight: 300, backgroundColor: t.surface, borderRadius: 12, padding: 12 }}>
              <Text selectable style={{ color: t.text, fontSize: FS.caption, fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }) }}>
                {`Error: ${error.message}\n\n${error.stack ?? ""}`}
              </Text>
            </ScrollView>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
