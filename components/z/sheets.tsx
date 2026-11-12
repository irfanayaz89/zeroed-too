/** Sheets shared by Now and Plan: note, skip, and a block's details. */
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { CATEGORIES } from "@/constants/theme";
import { dur, freeSlot, fmt, rangeLabel, type Session } from "@/lib/focus";
import { useZ } from "@/lib/prefs-context";
import { Btn, Field, FieldLabel, Row, Sheet, SheetOption, SheetTitle, T } from "./ui";

export function NoteSheet({ s, onClose, onSave }: { s: Session | null; onClose: () => void; onSave: (s: Session, text: string) => void }) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (s) setText(s.log?.block_note ?? "");
  }, [s]);
  return (
    <Sheet visible={!!s} onClose={onClose} testID="note-sheet">
      {s ? (
        <>
          <SheetTitle title={`Note for ${s.block.title}`} sub="Jot what you got through or where to pick up. It stays with this block's history." />
          <View style={{ gap: 8, marginBottom: 16 }}>
            <FieldLabel>Note</FieldLabel>
            <Field testID="note-input" value={text} onChangeText={setText} multiline autoFocus placeholder="e.g. Drafted goals 1 to 3, need numbers for 4" />
          </View>
          <Row gap={8}>
            <Btn kind="secondary" flex title="Cancel" onPress={onClose} />
            <Btn kind="pri" flex title="Save note" testID="note-save" onPress={() => { onSave(s, text); onClose(); }} />
          </Row>
        </>
      ) : null}
    </Sheet>
  );
}

export function SkipSheet({
  s,
  today,
  nowMin,
  onClose,
  onMove,
  onSkip,
}: {
  s: Session | null;
  today: Session[];
  nowMin: number;
  onClose: () => void;
  onMove: (s: Session, to: number) => void;
  onSkip: (s: Session) => void;
}) {
  const slot = s ? freeSlot(today, s.mins, nowMin, s.key) : null;
  return (
    <Sheet visible={!!s} onClose={onClose} testID="skip-sheet">
      {s ? (
        <>
          <SheetTitle title={`Skip ${s.block.title}?`} sub="Skipping is fine. It just won't count toward today's score." />
          <View style={{ gap: 8, marginBottom: 12 }}>
            {slot !== null ? (
              <SheetOption icon="later" title="Move to later today" sub={`Next free slot is ${fmt(slot)}`} testID="skip-move" onPress={() => { onMove(s, slot); onClose(); }} />
            ) : null}
            <SheetOption icon="skip" title="Skip it today" sub="Logged as skipped" testID="skip-today" onPress={() => { onSkip(s); onClose(); }} />
          </View>
          <Btn kind="secondary" title="Keep going" onPress={onClose} />
        </>
      ) : null}
    </Sheet>
  );
}

export function BlockDetailSheet({
  s,
  isToday,
  dayName,
  nowMin,
  onClose,
  onEdit,
  onOpenTimer,
  onDelete,
}: {
  s: Session | null;
  isToday: boolean;
  dayName: string;
  nowMin: number;
  onClose: () => void;
  onEdit: (s: Session) => void;
  onOpenTimer: () => void;
  onDelete: (s: Session) => void;
}) {
  const { c } = useZ();
  if (!s) return <Sheet visible={false} onClose={onClose}>{null}</Sheet>;
  const cat = CATEGORIES[s.cat];
  const future = !isToday || (s.status === "todo" && s.start > nowMin);
  const current = isToday && s.status === "todo" && s.start <= nowMin && nowMin < s.end;
  const repeats = s.block.days_of_week.length > 1;
  return (
    <Sheet visible onClose={onClose} testID="detail-sheet">
      <Row gap={10} style={{ marginBottom: 6 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: cat.color }} />
        <T v="caps">{cat.label}</T>
      </Row>
      <SheetTitle
        title={s.block.title}
        sub={`${rangeLabel(s.start, s.end)} · ${dur(s.mins)}${s.status === "done" ? " · Done" : s.status === "skip" ? " · Skipped" : ""}`}
      />
      {s.log?.block_note ? (
        <View style={{ backgroundColor: c.surface2, borderRadius: 12, padding: 12, marginTop: -6, marginBottom: 14 }}>
          <T v="caps" style={{ marginBottom: 4 }}>Note</T>
          <T v="body" color="text2">{s.log.block_note}</T>
        </View>
      ) : null}
      <View style={{ gap: 8, marginBottom: 12 }}>
        {future && s.status === "todo" ? (
          <SheetOption icon="note" title="Edit block" sub="Name, time, length, category, days" testID="detail-edit" onPress={() => { onClose(); onEdit(s); }} />
        ) : null}
        {current ? <SheetOption icon="focus" title="Open the timer" sub="Full-screen countdown" testID="detail-timer" onPress={() => { onClose(); onOpenTimer(); }} /> : null}
        <SheetOption
          icon="trash"
          danger
          title="Delete block"
          sub={repeats ? `Removes it from ${dayName}s` : "Removes it from your plan"}
          testID="detail-delete"
          onPress={() => { onClose(); onDelete(s); }}
        />
      </View>
      <Btn kind="secondary" title="Close" onPress={onClose} />
    </Sheet>
  );
}
