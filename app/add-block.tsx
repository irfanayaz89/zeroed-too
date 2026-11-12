/** New / edit focus block. Opens as a sheet over Plan or Now. */
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CATEGORIES, CATEGORY_IDS, FONTS, FS, type CategoryId } from "@/constants/theme";
import { useToast } from "@/components/z/toast";
import { Btn, Chip, Chips, Field, FieldLabel, Press, Row, Screen, SheetTitle, Warn } from "@/components/z/ui";
import { useBlocks, useFocusActions, useFocusOverview } from "@/hooks/useFocusData";
import { useAuth } from "@/lib/auth-context";
import { DAY_SHORT, MON_FIRST, blockMinutes, categoryOf, dur, fmt, freeSlot, guessCategory, nowMinutes, overlaps, rangeLabel, toHHMM, toMin } from "@/lib/focus";
import { usePrefs, useZ } from "@/lib/prefs-context";

const LENGTHS = [25, 45, 60, 90];

function TimeField({ value, onChange }: { value: number; onChange: (m: number) => void }) {
  const { c } = useZ();
  const [open, setOpen] = useState(false);
  const asDate = useMemo(() => {
    const d = new Date();
    d.setHours(Math.floor(value / 60), value % 60, 0, 0);
    return d;
  }, [value]);
  const step = (d: number) => onChange(Math.max(0, Math.min(23 * 60 + 45, value + d)));
  return (
    <View style={{ gap: 8 }}>
      <Row gap={8}>
        <Press accessibilityLabel="15 minutes earlier" onPress={() => step(-15)} style={{ height: 48, paddingHorizontal: 14, borderRadius: 14, backgroundColor: c.surface2, borderWidth: 1, borderColor: c.line, justifyContent: "center" }}>
          <Text style={{ fontFamily: FONTS.bold, fontSize: FS.sm, color: c.text2 }}>− 15</Text>
        </Press>
        <Press
          testID="start-time"
          accessibilityLabel={`Starts at ${fmt(value)}. Change time`}
          onPress={() => Platform.OS !== "web" && setOpen((v) => !v)}
          style={{ flex: 1, height: 48, borderRadius: 14, backgroundColor: c.surface2, borderWidth: 1, borderColor: open ? c.accent : c.line, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontFamily: FONTS.semibold, fontSize: FS.body, color: c.text, fontVariant: ["tabular-nums"] }}>{fmt(value)}</Text>
        </Press>
        <Press accessibilityLabel="15 minutes later" onPress={() => step(15)} style={{ height: 48, paddingHorizontal: 14, borderRadius: 14, backgroundColor: c.surface2, borderWidth: 1, borderColor: c.line, justifyContent: "center" }}>
          <Text style={{ fontFamily: FONTS.bold, fontSize: FS.sm, color: c.text2 }}>+ 15</Text>
        </Press>
      </Row>
      {open && Platform.OS !== "web" ? (
        <DateTimePicker
          value={asDate}
          mode="time"
          minuteInterval={5}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          themeVariant="dark"
          textColor={c.text}
          onChange={(e, d) => {
            if (Platform.OS === "android") setOpen(false);
            if (d && e.type !== "dismissed") onChange(d.getHours() * 60 + d.getMinutes());
          }}
        />
      ) : null}
    </View>
  );
}

export default function AddBlock() {
  const { c } = useZ();
  const o = useFocusOverview();
  // Wait for blocks so edit mode and the free-slot default see real data on a cold open.
  if (o.loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }
  return <AddBlockForm />;
}

function AddBlockForm() {
  const { c } = useZ();
  const { prefs } = usePrefs();
  const router = useRouter();
  const toast = useToast();
  const { profile } = useAuth();
  const o = useFocusOverview();
  const params = useLocalSearchParams<{ id?: string; day?: string }>();
  const blocks = useBlocks().data ?? [];
  const { saveBlock } = useFocusActions();
  const existing = params.id ? blocks.find((b) => b.id === params.id) : undefined;
  const todayDow = new Date().getDay();
  const baseDay = params.day !== undefined ? Number(params.day) : todayDow;
  const defLen = profile?.session_length ?? 45;

  const [title, setTitle] = useState(existing?.title ?? "");
  const [cat, setCat] = useState<CategoryId>(existing ? categoryOf(existing.category) : "work");
  const [catTouched, setCatTouched] = useState(!!existing);
  const [mins, setMins] = useState(existing ? blockMinutes(existing) : defLen);
  const [start, setStart] = useState(() => {
    if (existing) return toMin(existing.start_time);
    if (baseDay === todayDow) return freeSlot(o.today, defLen, Math.max(nowMinutes() + 15, prefs.dayStart - 15)) ?? prefs.dayStart;
    return prefs.dayStart;
  });
  const [days, setDays] = useState<number[]>(existing?.days_of_week ?? [baseDay]);

  const clash = overlaps(blocks, { id: existing?.id, start, mins, days })[0];
  const lengths = LENGTHS.includes(mins) ? LENGTHS : [...LENGTHS, mins].sort((a, b) => a - b);
  const close = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)/plan"));
  const t = title.trim();

  const save = () => {
    if (!t || !days.length) return;
    saveBlock.mutate(
      {
        ...(existing ? { id: existing.id } : {}),
        title: t,
        category: cat,
        start_time: toHHMM(start),
        end_time: toHHMM(start + mins),
        days_of_week: [...days].sort(),
      },
      {
        onSuccess: () => {
          toast(existing ? "Saved" : `Added ${t} at ${fmt(start)}`);
          close();
        },
        onError: () => toast("Couldn't save that. Check your connection."),
      }
    );
  };

  return (
    <Screen contentStyle={{ paddingTop: 24 }}>
      <View style={{ width: 38, height: 5, borderRadius: 3, backgroundColor: c.line, alignSelf: "center", marginTop: -10 }} />
      <SheetTitle
        title={existing ? "Edit block" : "New focus block"}
        sub={existing ? "Changes apply every day it repeats." : "One thing, one stretch of time. Zeroed counts you down when it starts."}
      />
      <View style={{ gap: 8 }}>
        <FieldLabel>What will you focus on?</FieldLabel>
        <Field
          testID="block-title"
          value={title}
          maxLength={40}
          autoFocus={!existing}
          placeholder="e.g. Write the Q4 roadmap"
          onChangeText={(v) => {
            setTitle(v);
            if (!catTouched) setCat(guessCategory(v));
          }}
        />
      </View>
      <View style={{ gap: 8 }}>
        <FieldLabel>Starts at</FieldLabel>
        <TimeField value={start} onChange={setStart} />
      </View>
      <View style={{ gap: 8 }}>
        <FieldLabel>Length</FieldLabel>
        <Chips>
          {lengths.map((n) => (
            <Chip key={n} label={dur(n)} on={mins === n} onPress={() => setMins(n)} testID={`len-${n}`} />
          ))}
        </Chips>
        <Text style={{ fontFamily: FONTS.semibold, fontSize: FS.caption, color: c.text3 }}>{rangeLabel(start, start + mins)}</Text>
      </View>
      <View style={{ gap: 8 }}>
        <FieldLabel>Category</FieldLabel>
        <Chips>
          {CATEGORY_IDS.map((k) => (
            <Chip key={k} label={CATEGORIES[k].label} dot={CATEGORIES[k].color} on={cat === k} onPress={() => { setCat(k); setCatTouched(true); }} testID={`cat-${k}`} />
          ))}
        </Chips>
      </View>
      <View style={{ gap: 8 }}>
        <FieldLabel>Repeat on</FieldLabel>
        <Chips>
          {MON_FIRST.map((d, i) => {
            const on = days.includes(d);
            return <Chip key={d} label={DAY_SHORT[i].slice(0, 2)} on={on} onPress={() => setDays((p) => (on ? p.filter((x) => x !== d) : [...p, d]))} testID={`rep-${d}`} />;
          })}
        </Chips>
      </View>
      {clash ? (
        <Warn>
          Overlaps {clash.block.title} ({rangeLabel(toMin(clash.block.start_time), toMin(clash.block.start_time) + blockMinutes(clash.block))}). You can still save it.
        </Warn>
      ) : null}
      {!days.length ? <Warn>Pick at least one day.</Warn> : null}
      <Row gap={8} style={{ marginTop: 4 }}>
        <Btn kind="secondary" flex title="Cancel" onPress={close} />
        <Btn kind="pri" flex title={existing ? "Save" : "Add block"} testID="block-save" disabled={!t || !days.length} loading={saveBlock.isPending} onPress={save} />
      </Row>
    </Screen>
  );
}
