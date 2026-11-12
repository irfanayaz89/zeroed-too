import React, { useMemo, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { FOCUS_TYPES, type FocusType, FS } from "@/constants/focusd";
import { Btn, Chip, Chips, Dialog, Field, Label, Row, Screen, T } from "@/components/fd/ui";
import { MiniBalloon } from "@/components/fd/Balloon";
import { useToast } from "@/components/fd/toast";
import { useBlocks, useFocusActions } from "@/hooks/useFocusData";
import { useAuth } from "@/lib/auth-context";
import { useFd } from "@/lib/prefs-context";
import { DAY_SHORT, MON_FIRST, blockMinutes, focusTypeOf, fmt, guessType, overlaps, rangeLabel, toHHMM, toMin } from "@/lib/focus";

type Repeat = "one" | "wd" | "we" | "custom";
const FULL_DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const LENGTHS = [25, 30, 45, 60, 90];

function repeatOf(days: number[]): Repeat {
  const s = [...days].sort().join(",");
  if (days.length === 1) return "one";
  if (s === "1,2,3,4,5") return "wd";
  if (s === "0,6") return "we";
  return "custom";
}

function TimeStepper({ value, onChange }: { value: number; onChange: (m: number) => void }) {
  const { c, isDark } = useFd();
  const [open, setOpen] = useState(false);
  const step = (d: number) => onChange(Math.max(5 * 60, Math.min(23 * 60 + 45, value + d)));
  const asDate = useMemo(() => {
    const d = new Date();
    d.setHours(Math.floor(value / 60), value % 60, 0, 0);
    return d;
  }, [value]);
  return (
    <View style={{ gap: 8 }}>
      <Row style={{ backgroundColor: c.field, borderRadius: 18, padding: 6 }}>
        <Btn small kind="secondary" title="− 15" onPress={() => step(-15)} />
        <Pressable testID="start-time" style={{ flex: 1, alignItems: "center" }} onPress={() => Platform.OS !== "web" && setOpen((v) => !v)}>
          <T v="h2">{fmt(value)}</T>
        </Pressable>
        <Btn small kind="secondary" title="+ 15" onPress={() => step(15)} />
      </Row>
      {open && Platform.OS !== "web" ? (
        <DateTimePicker
          value={asDate}
          mode="time"
          minuteInterval={5}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          themeVariant={isDark ? "dark" : "light"}
          onChange={(e, d) => {
            if (Platform.OS === "android") setOpen(false);
            if (d && e.type !== "dismissed") onChange(d.getHours() * 60 + d.getMinutes());
          }}
        />
      ) : null}
    </View>
  );
}

export default function EditSession() {
  const { c } = useFd();
  const router = useRouter();
  const toast = useToast();
  const { profile } = useAuth();
  const params = useLocalSearchParams<{ id?: string; day?: string }>();
  const blocks = useBlocks().data ?? [];
  const { saveBlock, deleteBlock } = useFocusActions();
  const existing = params.id ? blocks.find((b) => b.id === params.id) : undefined;
  const baseDay = params.day !== undefined ? Number(params.day) : new Date().getDay();

  const [title, setTitle] = useState(existing?.title ?? "");
  const [type, setType] = useState<FocusType>((existing && focusTypeOf(existing.category)) || "study");
  const [typeTouched, setTypeTouched] = useState(!!existing);
  const [start, setStart] = useState(existing ? toMin(existing.start_time) : Math.max(16 * 60, Math.ceil((new Date().getHours() * 60 + new Date().getMinutes()) / 15) * 15));
  const [mins, setMins] = useState(existing ? blockMinutes(existing) : profile?.session_length ?? 45);
  const [repeat, setRepeat] = useState<Repeat>(existing ? repeatOf(existing.days_of_week) : "one");
  const [custom, setCustom] = useState<number[]>(existing?.days_of_week ?? [baseDay]);
  const [askDelete, setAskDelete] = useState(false);
  const day = existing?.days_of_week.length === 1 ? existing.days_of_week[0] : baseDay;

  const days = repeat === "one" ? [day] : repeat === "wd" ? [1, 2, 3, 4, 5] : repeat === "we" ? [0, 6] : custom;
  const clash = overlaps(blocks, { id: existing?.id, start, mins, days });
  const quick = (profile?.focus_areas ?? []).slice(0, 6);

  const close = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)/plan"));

  const save = () => {
    if (!days.length) return toast("Pick at least one day.");
    const t = title.trim() || "Focus session";
    saveBlock.mutate(
      {
        ...(existing ? { id: existing.id } : {}),
        title: t,
        category: type,
        start_time: toHHMM(start),
        end_time: toHHMM(start + mins),
        days_of_week: [...days].sort(),
      },
      {
        onSuccess: () => {
          toast(existing ? "Session updated" : `${t} added`);
          close();
        },
        onError: () => toast("Couldn't save. Try again."),
      }
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Screen>
        <Row style={{ justifyContent: "space-between" }}>
          <Pressable onPress={close} accessibilityLabel="Close" style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: c.card, alignItems: "center", justifyContent: "center" }}>
            <T v="bodyStrong">✕</T>
          </Pressable>
          <T v="bodyStrong" style={{ fontSize: FS.xl }}>{existing ? "Edit session" : "New session"}</T>
          <Btn small title="Save" onPress={save} loading={saveBlock.isPending} testID="save-session" />
        </Row>
        <View style={{ alignItems: "center", marginVertical: 4 }}>
          <MiniBalloon type={type} size={46} />
        </View>

        <Label>What will you focus on?</Label>
        <Field
          testID="session-title"
          value={title}
          onChangeText={(v) => {
            setTitle(v);
            if (!typeTouched) setType(guessType(v));
          }}
          placeholder="e.g. Maths worksheet"
        />
        {quick.length ? (
          <Chips>
            {quick.map((f) => (
              <Chip key={f} small label={f} onPress={() => { setTitle(f); if (!typeTouched) setType(guessType(f)); }} />
            ))}
          </Chips>
        ) : null}

        <Label>Focus type</Label>
        <Chips>
          {(Object.keys(FOCUS_TYPES) as FocusType[]).map((k) => (
            <Chip key={k} label={FOCUS_TYPES[k].label} dot={FOCUS_TYPES[k].color} on={type === k} onPress={() => { setType(k); setTypeTouched(true); }} />
          ))}
        </Chips>

        <Label>Starts at</Label>
        <TimeStepper value={start} onChange={setStart} />

        <Label>Length</Label>
        <Chips>
          {LENGTHS.map((n) => (
            <Chip key={n} label={`${n} min`} on={mins === n} onPress={() => setMins(n)} />
          ))}
        </Chips>
        <T v="small">{rangeLabel(start, start + mins)}</T>

        <Label>Repeats</Label>
        <Chips>
          {(
            [
              ["one", `Only ${FULL_DAY[day]}s`],
              ["wd", "Weekdays"],
              ["we", "Weekends"],
              ["custom", "Pick days"],
            ] as [Repeat, string][]
          ).map(([k, n]) => (
            <Chip key={k} label={n} on={repeat === k} onPress={() => setRepeat(k)} />
          ))}
        </Chips>
        {repeat === "custom" ? (
          <Row gap={6}>
            {MON_FIRST.map((d, i) => {
              const on = custom.includes(d);
              return (
                <Pressable
                  key={d}
                  onPress={() => setCustom((p) => (on ? p.filter((x) => x !== d) : [...p, d]))}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: "center", backgroundColor: on ? c.ink : c.card }}
                >
                  <T v="bodyStrong" color={on ? c.bg : c.ink} style={{ fontSize: FS.sm }}>{DAY_SHORT[i][0]}</T>
                </Pressable>
              );
            })}
          </Row>
        ) : null}

        {clash.length ? (
          <View style={{ backgroundColor: c.tip, borderRadius: 18, padding: 14 }}>
            <T v="bodyStrong" color={c.tipInk}>Heads up: this overlaps</T>
            {clash.slice(0, 3).map(({ block, day: d }) => (
              <T key={block.id + d} v="small" color={c.tipInk}>
                {block.title} on {FULL_DAY[d]} ({rangeLabel(toMin(block.start_time), toMin(block.start_time) + blockMinutes(block))})
              </T>
            ))}
            <T v="small" color={c.tipInk} style={{ marginTop: 4 }}>You can still save it.</T>
          </View>
        ) : null}

        {existing ? <Btn kind="link" title="Delete session" style={{ marginTop: 6 }} onPress={() => setAskDelete(true)} /> : null}
      </Screen>

      <Dialog visible={askDelete} onClose={() => setAskDelete(false)}>
        <T v="h2">Delete {existing?.title}?</T>
        <T color="sub">It comes off every day it repeats.</T>
        <Btn
          kind="danger"
          title="Delete"
          onPress={() => {
            if (!existing) return;
            setAskDelete(false);
            deleteBlock.mutate(existing.id, {
              onSuccess: () => {
                toast(`Deleted ${existing.title}`);
                close();
              },
              onError: () => toast("Couldn't delete. Try again."),
            });
          }}
        />
        <Btn kind="link" title="Cancel" onPress={() => setAskDelete(false)} />
      </Dialog>
    </View>
  );
}
