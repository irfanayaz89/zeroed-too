import React, { useState } from "react";
import { Platform, Share, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import { format } from "date-fns";
import { ACCENTS, FONTS, FS, THEMES, type AccentName, type ThemeName } from "@/constants/theme";
import { Icon } from "@/components/z/icons";
import { useToast } from "@/components/z/toast";
import { Btn, Field, FieldLabel, List, ListItem, Press, Row, Screen, Section, Sheet, SheetTitle, T, Toggle } from "@/components/z/ui";
import { useFocusActions, useFocusOverview } from "@/hooks/useFocusData";
import { useAuth } from "@/lib/auth-context";
import { dur, fmt } from "@/lib/focus";
import { usePrefs, useZ } from "@/lib/prefs-context";
import { supabase } from "@/lib/supabase";

const LENGTHS = [25, 45, 60, 90];
const DAY_STARTS = [6 * 60, 7 * 60, 8 * 60, 9 * 60];
const HEADS_UP = [0, 2, 5, 10];

const cycle = <T,>(list: T[], cur: T) => list[(list.indexOf(cur) + 1) % list.length];

function ThemeCard({ name, on, onPress }: { name: ThemeName; on: boolean; onPress: () => void }) {
  const { c } = useZ();
  const t = THEMES[name];
  return (
    <Press
      testID={`theme-${name}`}
      accessibilityLabel={`${t.name} theme`}
      onPress={onPress}
      style={{ flex: 1, borderRadius: 14, borderWidth: 2, borderColor: on ? c.accent : c.line, padding: 10, gap: 8 }}
    >
      <View style={{ height: 46, borderRadius: 9, backgroundColor: t.bg, borderWidth: 1, borderColor: t.line, overflow: "hidden" }}>
        <View style={{ position: "absolute", left: 8, right: "40%", top: 9, height: 8, borderRadius: 4, backgroundColor: t.surface2 }} />
        <View style={{ position: "absolute", left: 8, right: "60%", top: 23, height: 8, borderRadius: 4, backgroundColor: c.accent }} />
      </View>
      <Text style={{ fontFamily: FONTS.bold, fontSize: FS.chip, color: c.text }}>{t.name}</Text>
    </Press>
  );
}

export default function MeScreen() {
  const { c } = useZ();
  const { prefs, setPrefs } = usePrefs();
  const { profile, user, signOut, isAnonymous } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const o = useFocusOverview();
  const { updateProfile } = useFocusActions();
  const [sheet, setSheet] = useState<null | "name" | "delete" | "signout">(null);
  const [nameDraft, setNameDraft] = useState("");
  const [delText, setDelText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const name = profile?.name?.trim() || "You";
  const since = profile?.created_at ? format(new Date(profile.created_at), "MMM d") : null;
  const accent: AccentName = prefs.accent ?? THEMES[prefs.theme].defAccent;
  const len = profile?.session_length ?? 45;

  const exportData = async () => {
    const byId = new Map(o.blocks.map((b) => [b.id, b]));
    const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const rows = o.logs
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((l) => {
        const b = byId.get(l.block_id);
        const status = l.completed ? "done" : l.skipped ? "skipped" : "planned";
        return [l.date, q(b?.title ?? "Deleted block"), b?.category ?? "", l.planned_start ?? b?.start_time ?? "", b?.end_time ?? "", status, l.focused_minutes ?? "", q(l.block_note ?? "")].join(",");
      });
    const csv = ["date,block,category,start,end,status,focused_minutes,note", ...rows].join("\n");
    try {
      await Share.share({ title: "Zeroed history", message: csv });
    } catch {
      toast("Couldn't export. Try again.");
    }
  };

  const doSignOut = async () => {
    setSheet(null);
    qc.clear();
    await signOut();
  };

  const deleteAccount = async () => {
    setDeleting(true);
    const { error } = await supabase.rpc("delete_my_account");
    setDeleting(false);
    if (error) return toast("Couldn't delete your account. Try again.");
    setSheet(null);
    qc.clear();
    await signOut();
  };

  const setHeadsUp = async () => {
    const next = cycle(HEADS_UP, prefs.nudge ? prefs.headsUp : 0);
    if (next === 0) return setPrefs({ nudge: false });
    if (!prefs.nudge && Platform.OS !== "web") {
      const { granted } = await Notifications.requestPermissionsAsync().catch(() => ({ granted: false }));
      if (!granted) return toast("Turn on notifications for Zeroed in Settings first.");
    }
    setPrefs({ nudge: true, headsUp: next });
  };

  const saveLen = () =>
    updateProfile.mutate({ session_length: cycle(LENGTHS, LENGTHS.includes(len) ? len : 45) }, { onError: () => toast("Couldn't save. Try again.") });

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Screen tabs>
        <T v="page">Me</T>

        <Press testID="me-profile" accessibilityLabel="Edit your name" scale={0.99} onPress={() => { setNameDraft(profile?.name ?? ""); setSheet("name"); }}>
          <Row gap={14}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: c.surface2, borderWidth: 1, borderColor: c.line, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontFamily: FONTS.displaySemi, fontSize: FS.h3, color: c.accent }}>{name[0]?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONTS.heavy, fontSize: FS.lg, color: c.text }}>{name}</Text>
              <T v="small" style={{ marginTop: 2 }}>
                {[since ? `Since ${since}` : null, `${o.streak} good day${o.streak === 1 ? "" : "s"} in a row`].filter(Boolean).join(" · ")}
              </T>
            </View>
          </Row>
        </Press>

        {isAnonymous ? (
          <Press
            testID="save-progress"
            onPress={() => router.push("/save-account")}
            scale={0.99}
            style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: c.accentSoft, borderWidth: 1, borderColor: c.accent + "4D", borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 }}
          >
            <Icon name="cloud" size={20} color={c.accent} />
            <Text style={{ flex: 1, fontFamily: FONTS.semibold, fontSize: FS.sm, lineHeight: 18, color: c.text2 }}>
              <Text style={{ fontFamily: FONTS.bold, color: c.text }}>Save your progress.</Text> You&apos;re using Zeroed without an account. Add an email so your history survives a new phone.
            </Text>
          </Press>
        ) : null}

        <Section title="Appearance">
          <List>
            <View style={{ flexDirection: "row", gap: 10, padding: 14, paddingHorizontal: 16 }}>
              {(Object.keys(THEMES) as ThemeName[]).map((t) => (
                <ThemeCard key={t} name={t} on={prefs.theme === t} onPress={() => setPrefs({ theme: t, accent: prefs.accent })} />
              ))}
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16, paddingBottom: 14 }}>
              {(Object.keys(ACCENTS) as AccentName[]).map((a) => (
                <Press
                  key={a}
                  testID={`accent-${a}`}
                  accessibilityLabel={`${ACCENTS[a].name} accent`}
                  onPress={() => setPrefs({ accent: a })}
                  style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: accent === a ? c.text : "transparent", padding: 3 }}
                >
                  <View style={{ flex: 1, borderRadius: 12, backgroundColor: ACCENTS[a].c }} />
                </Press>
              ))}
            </View>
          </List>
        </Section>

        <Section title="Planning">
          <List>
            <ListItem first label="Default block length" value={dur(len)} onPress={saveLen} testID="me-len" />
            <ListItem label="Day starts at" value={fmt(prefs.dayStart)} onPress={() => setPrefs({ dayStart: cycle(DAY_STARTS, prefs.dayStart) })} />
            <ListItem label="Heads-up before a block" value={prefs.nudge ? `${prefs.headsUp} min before` : "Off"} onPress={setHeadsUp} testID="me-headsup" />
          </List>
        </Section>

        <Section title="Timer and alerts">
          <List>
            <ListItem first label="Live Activity" sub="Countdown on the Lock Screen and Dynamic Island" right={<Toggle on={prefs.liveActivity} />} onPress={() => setPrefs({ liveActivity: !prefs.liveActivity })} testID="toggle-live" />
            <ListItem label="Nudge if I haven't started" right={<Toggle on={prefs.notStarted} />} onPress={() => setPrefs({ notStarted: !prefs.notStarted })} />
            <ListItem label="Quiet hours" sub={`${fmt(prefs.quietStart)} to ${fmt(prefs.quietEnd)}`} right={<Toggle on={prefs.quiet} />} onPress={() => setPrefs({ quiet: !prefs.quiet })} />
            <ListItem label="Haptics" right={<Toggle on={prefs.haptics} />} onPress={() => setPrefs({ haptics: !prefs.haptics })} />
          </List>
        </Section>

        <Section title="Your data">
          <List>
            <ListItem first label="Export my history" value="CSV" onPress={exportData} testID="me-export" />
            <ListItem label="Delete account and data" danger onPress={() => { setDelText(""); setSheet("delete"); }} testID="me-delete" />
          </List>
        </Section>

        <Section title="Account">
          <List>
            <ListItem first label={isAnonymous ? "Not signed in" : (user?.email ?? "Signed in")} chevron={false} />
            <ListItem label="Sign out" onPress={() => (isAnonymous ? setSheet("signout") : doSignOut())} testID="me-signout" />
          </List>
        </Section>

        <Text style={{ textAlign: "center", fontFamily: FONTS.semibold, fontSize: FS.tiny, color: c.text3, paddingTop: 6 }}>
          Zeroed {Constants.expoConfig?.version ?? "1.0"}
        </Text>
      </Screen>

      <Sheet visible={sheet === "name"} onClose={() => setSheet(null)}>
        <SheetTitle title="Your name" sub="Used in the greeting on Now." />
        <Field value={nameDraft} onChangeText={setNameDraft} autoFocus maxLength={24} placeholder="First name" />
        <Row gap={8} style={{ marginTop: 16 }}>
          <Btn kind="secondary" flex title="Cancel" onPress={() => setSheet(null)} />
          <Btn
            kind="pri"
            flex
            title="Save"
            disabled={!nameDraft.trim()}
            onPress={() => updateProfile.mutate({ name: nameDraft.trim() }, { onSuccess: () => setSheet(null), onError: () => toast("Couldn't save. Try again.") })}
          />
        </Row>
      </Sheet>

      <Sheet visible={sheet === "delete"} onClose={() => setSheet(null)} testID="delete-sheet">
        <SheetTitle title="Delete your account?" sub="This removes every block, note and score, in Zeroed and in Zero'd. It can't be undone. Type DELETE to confirm." />
        <View style={{ gap: 8, marginBottom: 16 }}>
          <FieldLabel>Confirm</FieldLabel>
          <Field testID="delete-input" value={delText} onChangeText={setDelText} autoCapitalize="characters" autoCorrect={false} placeholder="DELETE" />
        </View>
        <Row gap={8}>
          <Btn kind="secondary" flex title="Keep my account" onPress={() => setSheet(null)} />
          <Btn kind="danger" flex title="Delete" testID="delete-confirm" disabled={delText.trim() !== "DELETE"} loading={deleting} onPress={deleteAccount} />
        </Row>
      </Sheet>

      <Sheet visible={sheet === "signout"} onClose={() => setSheet(null)}>
        <SheetTitle title="Your progress isn't saved yet" sub="You haven't added an email, so signing out loses your plan and your history. Save your progress first to keep them." />
        <View style={{ gap: 8 }}>
          <Btn kind="pri" title="Save your progress" onPress={() => { setSheet(null); router.push("/save-account"); }} />
          <Btn kind="danger" title="Sign out and lose it" onPress={doSignOut} />
        </View>
      </Sheet>
    </View>
  );
}
