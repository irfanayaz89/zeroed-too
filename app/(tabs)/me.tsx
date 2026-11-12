import React, { useState } from "react";
import { Platform, Pressable, Share, View } from "react-native";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import { DOT_COLORS, THEMES, themeColors, type DotColorName, type ThemeName, FS } from "@/constants/focusd";
import { Btn, Chip, Chips, Dialog, Field, Label, Row, Screen, Sheet, T, Toggle } from "@/components/fd/ui";
import { DotArt } from "@/components/fd/DotCharacter";
import { useBuddyName } from "@/components/fd/shared";
import { useToast } from "@/components/fd/toast";
import { useFocusActions, useFocusOverview } from "@/hooks/useFocusData";
import { useAuth } from "@/lib/auth-context";
import { useFd, usePrefs } from "@/lib/prefs-context";
import { useFocusSession } from "@/lib/focus-session";
import { supabase } from "@/lib/supabase";
import { CHALLENGE_OPTIONS, FOCUS_GROUPS, FREE_WINDOWS, fmt } from "@/lib/focus";
import type { Profile } from "@/lib/types";

type EditKey = "name" | "age" | "focus" | "challenge" | "free" | "len" | "perDay" | "buddy" | "quiet" | "theme" | "privacy" | "terms";

function Group({ children }: { children: React.ReactNode }) {
  const { c } = useFd();
  return <View style={{ backgroundColor: c.card, borderRadius: 22, overflow: "hidden" }}>{children}</View>;
}

function RowItem({
  label,
  value,
  onPress,
  danger,
  accent,
  right,
  last,
  testID,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  accent?: boolean;
  right?: React.ReactNode;
  last?: boolean;
  testID?: string;
}) {
  const { c } = useFd();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 15,
        paddingHorizontal: 18,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: c.line,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <T v="bodyStrong" color={danger ? c.danger : accent ? "accent" : "ink"} style={{ flex: 1, fontSize: FS.body }}>{label}</T>
      {right ?? (value !== undefined ? <T v="small" numberOfLines={1} style={{ maxWidth: "55%", textAlign: "right" }}>{value}</T> : null)}
      {!right && !danger ? <T v="bodyStrong" color="sub">›</T> : null}
    </Pressable>
  );
}

export default function MeScreen() {
  const { c } = useFd();
  const { prefs, setPrefs, dotColorName } = usePrefs();
  const { profile, user, signOut, isAnonymous } = useAuth();
  const router = useRouter();
  const [guestOut, setGuestOut] = useState(false);
  const { updateProfile } = useFocusActions();
  const o = useFocusOverview();
  const { cancel } = useFocusSession();
  const qc = useQueryClient();
  const toast = useToast();
  const buddy = useBuddyName();
  const [edit, setEdit] = useState<EditKey | null>(null);
  const [del, setDel] = useState<0 | 1 | 2>(0);
  const [delText, setDelText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const p = profile ?? ({} as Profile);
  const challenge = CHALLENGE_OPTIONS.find((x) => x.id === p.focus_struggle)?.label ?? "Not set";
  const isDark = prefs.appearance === "system" ? undefined : prefs.appearance === "dark";
  const { isDark: darkNow } = useFd();

  const save = (patch: Partial<Profile>) =>
    updateProfile.mutate(patch, {
      onSuccess: () => {
        toast("Saved");
        setEdit(null);
      },
      onError: () => toast("Couldn't save. Try again."),
    });

  const exportData = async () => {
    const head = "date,session,start,end,status,focused_minutes,note";
    const byId = new Map(o.blocks.map((b) => [b.id, b]));
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const rows = o.logs
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((l) => {
        const b = byId.get(l.block_id);
        const status = l.completed ? "done" : l.skipped ? "skipped" : "planned";
        return [l.date, esc(b?.title ?? "Deleted session"), b?.start_time ?? "", b?.end_time ?? "", status, l.focused_minutes ?? "", esc(l.block_note ?? "")].join(",");
      });
    const refl = o.reflections.map((r) => `${r.date},${r.mood ?? ""},${esc(r.note ?? "")}`);
    const csv = [head, ...rows, "", "date,mood,note", ...refl].join("\n");
    try {
      await Share.share({ title: "Focus'd data", message: csv });
    } catch {
      toast("Couldn't export. Try again.");
    }
  };

  const doSignOut = () => {
    cancel();
    qc.clear();
    signOut();
  };

  const toggleNudge = async () => {
    if (prefs.nudge || Platform.OS === "web") return setPrefs({ nudge: !prefs.nudge });
    const { granted } = await Notifications.requestPermissionsAsync().catch(() => ({ granted: false }));
    if (granted) setPrefs({ nudge: true });
    else toast("Turn on notifications for Focus'd in Settings first.");
  };

  const deleteAccount = async () => {
    setDeleting(true);
    const { error } = await supabase.rpc("delete_my_account");
    setDeleting(false);
    if (error) {
      toast("Couldn't delete your account. Try again.");
      return;
    }
    setDel(0);
    cancel();
    qc.clear();
    await signOut();
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Screen tabs>
        <Row gap={14} style={{ marginTop: 4 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: c.card, alignItems: "center", justifyContent: "flex-end", overflow: "hidden" }}>
            <DotArt mood="calm" size={70} body={DOT_COLORS[dotColorName]} />
          </View>
          <View style={{ flex: 1 }}>
            <T v="title">{p.name || "You"}</T>
            <T v="small">{isAnonymous ? `Not saved yet · ${buddy} lives on this phone only` : [p.age ? String(p.age) : null, user?.email].filter(Boolean).join(" · ")}</T>
          </View>
        </Row>

        <Label>About you</Label>
        <Group>
          <RowItem label="Name" value={p.name ?? ""} onPress={() => setEdit("name")} testID="me-name" />
          <RowItem label="Age" value={p.age ? String(p.age) : "Not set"} onPress={() => setEdit("age")} />
          <RowItem label="Focus areas" value={(p.focus_areas ?? []).join(", ") || "Not set"} onPress={() => setEdit("focus")} />
          <RowItem label="What gets in the way" value={challenge} onPress={() => setEdit("challenge")} last />
        </Group>

        <Label>Focus preferences</Label>
        <Group>
          <RowItem label="Usual free times" value={`${(p.free_times ?? []).length} windows`} onPress={() => setEdit("free")} />
          <RowItem label="Default session length" value={`${p.session_length ?? 45} min`} onPress={() => setEdit("len")} />
          <RowItem label="Sessions a day" value={String(p.sessions_per_day ?? 3)} onPress={() => setEdit("perDay")} last />
        </Group>

        <Label>Your buddy</Label>
        <Group>
          <RowItem label="Name" value={buddy} onPress={() => setEdit("buddy")} />
          <RowItem label="Theme and colour" value={`${THEMES[prefs.theme].name} · ${DOT_COLORS[dotColorName].name}`} onPress={() => setEdit("theme")} last />
        </Group>

        <Label>Reminders</Label>
        <Group>
          <RowItem label="Live session on Lock Screen" onPress={() => setPrefs({ liveActivity: !prefs.liveActivity })} right={<Toggle on={prefs.liveActivity} />} testID="toggle-live" />
          <RowItem label="Nudge before a session" onPress={toggleNudge} right={<Toggle on={prefs.nudge} />} testID="toggle-nudge" />
          <RowItem label="Quiet hours" value={`${fmt(prefs.quietStart)} – ${fmt(prefs.quietEnd)}`} onPress={() => setEdit("quiet")} last />
        </Group>

        <Label>Appearance</Label>
        <Group>
          <RowItem
            label="Dark mode"
            onPress={() => setPrefs({ appearance: (isDark ?? darkNow) ? "light" : "dark" })}
            right={<Toggle on={isDark ?? darkNow} />}
            testID="toggle-dark"
          />
          <RowItem
            label="Match my phone"
            onPress={() => setPrefs({ appearance: prefs.appearance === "system" ? (darkNow ? "dark" : "light") : "system" })}
            right={<Toggle on={prefs.appearance === "system"} />}
            last
          />
        </Group>

        <Label>Your data</Label>
        <Group>
          <RowItem label="Export my data" value="CSV" onPress={exportData} />
          <RowItem label="Privacy policy" onPress={() => setEdit("privacy")} />
          <RowItem label="Terms" onPress={() => setEdit("terms")} last />
        </Group>

        <Label>Account</Label>
        <Group>
          {isAnonymous ? <RowItem label={`Save ${buddy} with an account`} accent onPress={() => router.push("/save-account")} testID="save-dot" /> : null}
          <RowItem label="Sign out" onPress={() => (isAnonymous ? setGuestOut(true) : doSignOut())} testID="sign-out" />
          <RowItem label="Delete account" danger onPress={() => setDel(1)} last testID="delete-account" />
        </Group>
        <T v="small" style={{ textAlign: "center", marginVertical: 6 }}>Focus&apos;d {Constants.expoConfig?.version ?? "1.0"}</T>
      </Screen>

      <EditSheet k={edit} p={p} onClose={() => setEdit(null)} onSave={save} saving={updateProfile.isPending} />

      <Dialog visible={guestOut} onClose={() => setGuestOut(false)}>
        <T v="h2">{buddy} isn&apos;t saved yet</T>
        <T color="sub">You haven&apos;t added an email, so signing out loses your plan, your history and {buddy}. Save {buddy} first to keep them.</T>
        <Btn title={`Save ${buddy}`} onPress={() => { setGuestOut(false); router.push("/save-account"); }} />
        <Btn kind="danger" title="Sign out and lose it" onPress={() => { setGuestOut(false); setDel(2); setDelText(""); }} />
        <Btn kind="link" title="Cancel" onPress={() => setGuestOut(false)} />
      </Dialog>
      <Dialog visible={del === 1} onClose={() => setDel(0)}>
        <T v="h2">Delete your account?</T>
        <T color="sub">Your plan, every session, your check-ins and {buddy} go for good. This can&apos;t be undone.</T>
        <Btn kind="danger" title="Continue" onPress={() => { setDelText(""); setDel(2); }} testID="delete-continue" />
        <Btn kind="link" title="Keep my account" onPress={() => setDel(0)} />
      </Dialog>
      <Dialog visible={del === 2} onClose={() => setDel(0)}>
        <T v="h2">Are you completely sure?</T>
        <T color="sub">Type DELETE to confirm.</T>
        <Field value={delText} onChangeText={setDelText} autoCapitalize="characters" placeholder="DELETE" testID="delete-input" />
        <Btn kind="danger" title="Delete my account" disabled={delText.trim() !== "DELETE"} loading={deleting} onPress={deleteAccount} testID="delete-confirm" />
        <Btn kind="link" title="Cancel" onPress={() => setDel(0)} />
      </Dialog>
    </View>
  );
}

function EditSheet({
  k,
  p,
  onClose,
  onSave,
  saving,
}: {
  k: EditKey | null;
  p: Profile;
  onClose: () => void;
  onSave: (patch: Partial<Profile>) => void;
  saving: boolean;
}) {
  const { c } = useFd();
  const { prefs, setPrefs, dotColorName } = usePrefs();
  const [text, setText] = useState("");
  const [list, setList] = useState<string[]>([]);
  const [num, setNum] = useState(0);
  const [q, setQ] = useState<[number, number]>([prefs.quietStart, prefs.quietEnd]);
  const [lastK, setLastK] = useState<EditKey | null>(null);

  // Reset the draft when a different row is opened.
  if (k !== lastK) {
    setLastK(k);
    if (k === "name") setText(p.name ?? "");
    if (k === "buddy") setText(p.buddy_name ?? "Dot");
    if (k === "age") setNum(p.age ?? 16);
    if (k === "focus") setList(p.focus_areas ?? []);
    if (k === "free") setList(p.free_times ?? []);
    if (k === "challenge") setText(p.focus_struggle ?? "");
    if (k === "len") setNum(p.session_length ?? 45);
    if (k === "perDay") setNum(p.sessions_per_day ?? 3);
    if (k === "quiet") setQ([prefs.quietStart, prefs.quietEnd]);
  }
  const toggle = (v: string) => setList((l) => (l.includes(v) ? l.filter((x) => x !== v) : [...l, v]));
  const stepQ = (i: 0 | 1, d: number) => setQ((cur) => {
    const n = [...cur] as [number, number];
    n[i] = (n[i] + d + 1440) % 1440;
    return n;
  });

  let body: React.ReactNode = null;
  switch (k) {
    case "name":
    case "buddy":
      body = (
        <>
          <T v="title">{k === "name" ? "Your name" : "Your buddy's name"}</T>
          <Field value={text} onChangeText={setText} autoFocus maxLength={24} placeholder={k === "name" ? "Your name" : "Dot"} />
          <Btn title="Save" loading={saving} disabled={!text.trim()} onPress={() => onSave(k === "name" ? { name: text.trim() } : { buddy_name: text.trim() })} />
        </>
      );
      break;
    case "age":
      body = (
        <>
          <T v="title">Your age</T>
          <Row style={{ justifyContent: "center" }} gap={20}>
            <Btn small kind="secondary" title="−" onPress={() => setNum((n) => Math.max(13, n - 1))} />
            <T v="display">{num}</T>
            <Btn small kind="secondary" title="+" onPress={() => setNum((n) => Math.min(99, n + 1))} />
          </Row>
          <Btn title="Save" loading={saving} onPress={() => onSave({ age: num })} />
        </>
      );
      break;
    case "focus":
      body = (
        <>
          <T v="title">Focus areas</T>
          {FOCUS_GROUPS.map(([g, items]) => (
            <View key={g} style={{ gap: 8 }}>
              <Label>{g}</Label>
              <Chips>{items.map((f) => <Chip key={f} label={f} on={list.includes(f)} onPress={() => toggle(f)} />)}</Chips>
            </View>
          ))}
          <Btn title="Save" loading={saving} disabled={!list.length} onPress={() => onSave({ focus_areas: list })} />
        </>
      );
      break;
    case "challenge":
      body = (
        <>
          <T v="title">What gets in the way?</T>
          {CHALLENGE_OPTIONS.map((o) => (
            <Pressable
              key={o.id}
              onPress={() => setText(o.id)}
              style={{ backgroundColor: c.card, borderRadius: 18, padding: 14, borderWidth: 2, borderColor: text === o.id ? c.accent : "transparent" }}
            >
              <T v="bodyStrong">{o.label}</T>
              <T v="small">{o.hint}</T>
            </Pressable>
          ))}
          <Btn title="Save" loading={saving} disabled={!text} onPress={() => onSave({ focus_struggle: text })} />
        </>
      );
      break;
    case "free":
      body = (
        <>
          <T v="title">Usual free times</T>
          <T color="sub">New sessions go in these times. Your current plan stays as it is.</T>
          <Label>Weekdays</Label>
          <Chips>{FREE_WINDOWS.filter((w) => !w.weekend).map((w) => <Chip key={w.id} label={`${w.label} · ${w.time}`} on={list.includes(w.id)} onPress={() => toggle(w.id)} />)}</Chips>
          <Label>Weekends</Label>
          <Chips>{FREE_WINDOWS.filter((w) => w.weekend).map((w) => <Chip key={w.id} label={`${w.label} · ${w.time}`} on={list.includes(w.id)} onPress={() => toggle(w.id)} />)}</Chips>
          <Btn title="Save" loading={saving} disabled={!list.length} onPress={() => onSave({ free_times: list })} />
        </>
      );
      break;
    case "len":
      body = (
        <>
          <T v="title">Default session length</T>
          <Chips>{[25, 30, 45, 60, 90].map((n) => <Chip key={n} label={`${n} min`} on={num === n} onPress={() => setNum(n)} />)}</Chips>
          <Btn title="Save" loading={saving} onPress={() => onSave({ session_length: num })} />
        </>
      );
      break;
    case "perDay":
      body = (
        <>
          <T v="title">Sessions a day</T>
          <Chips>{[2, 3, 4].map((n) => <Chip key={n} label={String(n)} on={num === n} onPress={() => setNum(n)} />)}</Chips>
          <Btn title="Save" loading={saving} onPress={() => onSave({ sessions_per_day: num })} />
        </>
      );
      break;
    case "quiet":
      body = (
        <>
          <T v="title">Quiet hours</T>
          <T color="sub">No nudges in this window, and Running late won&apos;t push sessions into it.</T>
          {(["From", "Until"] as const).map((lbl, i) => (
            <Row key={lbl} style={{ backgroundColor: c.card, borderRadius: 18, padding: 8 }}>
              <T v="bodyStrong" style={{ width: 60, marginLeft: 8 }}>{lbl}</T>
              <Btn small kind="secondary" title="−" onPress={() => stepQ(i as 0 | 1, -30)} />
              <T v="h2" style={{ flex: 1, textAlign: "center" }}>{fmt(q[i])}</T>
              <Btn small kind="secondary" title="+" onPress={() => stepQ(i as 0 | 1, 30)} />
            </Row>
          ))}
          <Btn title="Save" onPress={() => { setPrefs({ quietStart: q[0], quietEnd: q[1] }); onClose(); }} />
        </>
      );
      break;
    case "theme":
      body = (
        <>
          <T v="title">Theme and colour</T>
          <Label>App theme</Label>
          <Row gap={10}>
            {(Object.keys(THEMES) as ThemeName[]).map((t) => {
              const col = themeColors(t, false);
              const on = prefs.theme === t;
              return (
                <Pressable key={t} onPress={() => setPrefs({ theme: t, dotColor: null })} style={{ flex: 1, alignItems: "center", gap: 6 }} testID={`theme-${t}`}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: col.bg, borderWidth: 3, borderColor: on ? c.ink : "transparent", alignItems: "center", justifyContent: "center" }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: col.accent }} />
                  </View>
                  <T v="small" color={on ? "ink" : "sub"}>{THEMES[t].name}</T>
                </Pressable>
              );
            })}
          </Row>
          <Label>Buddy colour</Label>
          <Chips>
            {(Object.keys(DOT_COLORS) as DotColorName[]).map((d) => (
              <Chip key={d} label={DOT_COLORS[d].name} dot={DOT_COLORS[d].body} on={dotColorName === d} onPress={() => setPrefs({ dotColor: d })} />
            ))}
          </Chips>
          <View style={{ alignItems: "center" }}>
            <DotArt mood="happy" size={120} body={DOT_COLORS[dotColorName]} />
          </View>
          <Btn title="Done" onPress={onClose} />
        </>
      );
      break;
    case "privacy":
      body = (
        <>
          <T v="title">Privacy</T>
          <T>
            Focus&apos;d stores your account, your plan, the sessions you pop or skip, and your daily check-ins so the app can work and learn
            your best times. We don&apos;t sell your data or show ads. You can export everything from Me, and deleting your account removes
            it all.
          </T>
          <T v="small">The full privacy policy will be published before launch.</T>
          <Btn title="Close" onPress={onClose} />
        </>
      );
      break;
    case "terms":
      body = (
        <>
          <T v="title">Terms</T>
          <T>Focus&apos;d is for people aged 13 and over. Be kind to yourself: it&apos;s a planner, not a judge.</T>
          <T v="small">The full terms will be published before launch.</T>
          <Btn title="Close" onPress={onClose} />
        </>
      );
      break;
  }

  return (
    <Sheet visible={k !== null} onClose={onClose}>
      {body}
    </Sheet>
  );
}
