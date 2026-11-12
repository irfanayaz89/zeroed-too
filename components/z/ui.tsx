/**
 * The adult app's design-system primitives: text, layout, cards, buttons,
 * chips, fields, toggles, lists and the bottom sheet.
 */
import React, { useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { FONTS, FS, STATUS } from "@/constants/theme";
import { haptic } from "@/lib/haptics";
import { useZ } from "@/lib/prefs-context";
import { Icon, type IconName } from "./icons";

export const EASE_OUT = Easing.bezier(0.33, 1, 0.68, 1);

/* ---------- text ---------- */
type Variant = "page" | "display" | "h3" | "title" | "body" | "bodyStrong" | "small" | "caps" | "stat";

const VARIANTS: Record<Variant, TextStyle> = {
  page: { fontFamily: FONTS.displaySemi, fontSize: FS.page, letterSpacing: -0.5 },
  display: { fontFamily: FONTS.displaySemi, fontSize: FS.title, letterSpacing: -0.4 },
  h3: { fontFamily: FONTS.displaySemi, fontSize: FS.h3, letterSpacing: -0.3 },
  title: { fontFamily: FONTS.displaySemi, fontSize: FS.h2, lineHeight: 24, letterSpacing: -0.3 },
  body: { fontFamily: FONTS.semibold, fontSize: FS.md, lineHeight: 20 },
  bodyStrong: { fontFamily: FONTS.bold, fontSize: FS.body, lineHeight: 20 },
  small: { fontFamily: FONTS.semibold, fontSize: FS.chip, lineHeight: 18 },
  caps: { fontFamily: FONTS.bold, fontSize: FS.label, letterSpacing: 1.5, textTransform: "uppercase" },
  stat: { fontFamily: FONTS.displaySemi, fontSize: FS.tile, fontVariant: ["tabular-nums"], letterSpacing: -0.2 },
};

export function T({
  v = "body",
  color,
  style,
  ...rest
}: TextProps & { v?: Variant; color?: "text" | "text2" | "text3" | "accent" | string }) {
  const { c } = useZ();
  const col =
    color === undefined
      ? v === "small"
        ? c.text2
        : v === "caps"
          ? c.text3
          : c.text
      : color === "text"
        ? c.text
        : color === "text2"
          ? c.text2
          : color === "text3"
            ? c.text3
            : color === "accent"
              ? c.accent
              : color;
  return <Text {...rest} style={[VARIANTS[v], { color: col }, style]} />;
}

/* ---------- layout ---------- */
/** Bottom padding that keeps content clear of the tab bar. */
export const TAB_SPACE = 104;

export function Screen({
  children,
  scroll = true,
  tabs = false,
  style,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  /** Leaves room for the tab bar. */
  tabs?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const { c } = useZ();
  const insets = useSafeAreaInsets();
  const pad: ViewStyle = {
    paddingTop: insets.top + 6,
    paddingBottom: (tabs ? TAB_SPACE : 24) + insets.bottom,
    paddingHorizontal: 20,
    gap: 16,
  };
  if (!scroll) return <View style={[{ flex: 1, backgroundColor: c.bg }, pad, style, contentStyle]}>{children}</View>;
  return (
    <KeyboardAvoidingView style={[{ flex: 1, backgroundColor: c.bg }, style]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[{ flexGrow: 1 }, pad, contentStyle]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Row({ children, style, gap = 10 }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: "row", alignItems: "center", gap }, style]}>{children}</View>;
}

/** Pressable that dips slightly when pressed. */
export function Press({
  children,
  onPress,
  style,
  disabled,
  scale = 0.97,
  accessibilityLabel,
  accessibilityRole = "button",
  testID,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  scale?: number;
  accessibilityLabel?: string;
  accessibilityRole?: "button" | "tab" | "switch" | "link";
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [style, { transform: [{ scale: pressed ? scale : 1 }] }, disabled && { opacity: 0.45 }]}
    >
      {children}
    </Pressable>
  );
}

export function Card({ children, style, onPress, testID, accessibilityLabel }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; testID?: string; accessibilityLabel?: string }) {
  const { c } = useZ();
  const base: ViewStyle = { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16 };
  if (onPress)
    return (
      <Press testID={testID} onPress={onPress} accessibilityLabel={accessibilityLabel} scale={0.985} style={[base, style]}>
        {children}
      </Press>
    );
  return (
    <View testID={testID} style={[base, style]}>
      {children}
    </View>
  );
}

/* ---------- buttons ---------- */
type BtnKind = "primary" | "ghost" | "secondary" | "pri" | "danger";

export function Btn({
  title,
  onPress,
  kind = "primary",
  icon,
  disabled,
  loading,
  style,
  flex,
  testID,
}: {
  title: string;
  onPress?: () => void;
  /** primary / ghost: the big 52pt buttons. secondary / pri / danger: the 42pt row buttons. */
  kind?: BtnKind;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  flex?: boolean;
  testID?: string;
}) {
  const { c } = useZ();
  const big = kind === "primary" || kind === "ghost";
  const bg = kind === "primary" || kind === "pri" ? c.accent : kind === "ghost" ? c.accentSoft : c.surface2;
  const fg = kind === "primary" || kind === "pri" ? c.onAccent : kind === "ghost" ? c.accent : kind === "danger" ? c.bad : c.text;
  return (
    <Press
      testID={testID}
      disabled={disabled || loading}
      scale={0.98}
      onPress={() => {
        haptic.light();
        onPress?.();
      }}
      style={[
        {
          height: big ? 52 : 42,
          borderRadius: big ? 16 : 12,
          backgroundColor: bg,
          borderWidth: big || kind === "pri" ? 0 : 1,
          borderColor: c.line,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingHorizontal: 16,
        },
        flex && { flex: 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={20} color={fg} /> : null}
          <Text style={{ fontFamily: big ? FONTS.heavy : FONTS.bold, fontSize: big ? FS.body : FS.smPlus, color: fg }}>{title}</Text>
        </>
      )}
    </Press>
  );
}

/** A plain text link with an optional chevron ("View the full day ›"). */
export function LinkBtn({ title, onPress, chevron, color, testID }: { title: string; onPress: () => void; chevron?: boolean; color?: string; testID?: string }) {
  const { c } = useZ();
  return (
    <Press testID={testID} onPress={onPress} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, padding: 6, alignSelf: "center" }}>
      <Text style={{ fontFamily: FONTS.bold, fontSize: FS.sm, color: color ?? c.text2 }}>{title}</Text>
      {chevron ? <Icon name="chev" size={16} color={color ?? c.text2} /> : null}
    </Press>
  );
}

export function Chip({ label, on, onPress, dot, testID }: { label: string; on?: boolean; onPress?: () => void; dot?: string; testID?: string }) {
  const { c } = useZ();
  return (
    <Press
      testID={testID}
      accessibilityLabel={label}
      onPress={() => {
        haptic.select();
        onPress?.();
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 13,
        borderRadius: 999,
        backgroundColor: on ? c.text : c.surface2,
        borderWidth: 1,
        borderColor: on ? c.text : c.line,
      }}
    >
      {dot ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} /> : null}
      <Text style={{ fontFamily: FONTS.bold, fontSize: FS.sm, color: on ? c.bg : c.text2 }}>{label}</Text>
    </Press>
  );
}

export function Chips({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: "row", flexWrap: "wrap", gap: 8 }, style]}>{children}</View>;
}

/** Small pill button used on cards ("Move it", "Running late"). */
export function PillBtn({ title, onPress, primary, icon, testID }: { title: string; onPress: () => void; primary?: boolean; icon?: IconName; testID?: string }) {
  const { c } = useZ();
  const fg = primary ? c.onAccent : c.text;
  return (
    <Press
      testID={testID}
      onPress={() => {
        haptic.light();
        onPress();
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: primary ? c.accent : c.surface2,
        borderWidth: primary ? 0 : 1,
        borderColor: c.line,
      }}
    >
      {icon ? <Icon name={icon} size={16} color={fg} /> : null}
      <Text style={{ fontFamily: FONTS.bold, fontSize: FS.chip, color: fg }}>{title}</Text>
    </Press>
  );
}

/* ---------- form ---------- */
export function FieldLabel({ children }: { children: ReactNode }) {
  return <T v="caps">{children}</T>;
}

export function Field(props: TextInputProps) {
  const { c } = useZ();
  return (
    <TextInput
      placeholderTextColor={c.text3}
      keyboardAppearance="dark"
      selectionColor={c.accent}
      {...props}
      style={[
        {
          minHeight: props.multiline ? 110 : 48,
          borderRadius: 14,
          backgroundColor: c.surface2,
          borderWidth: 1,
          borderColor: c.line,
          paddingHorizontal: 14,
          paddingVertical: props.multiline ? 12 : 0,
          color: c.text,
          fontFamily: FONTS.semibold,
          fontSize: FS.body,
          textAlignVertical: props.multiline ? "top" : "center",
        },
        props.style,
      ]}
    />
  );
}

export function Toggle({ on }: { on: boolean }) {
  const { c, reduceMotion } = useZ();
  const x = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    x.value = reduceMotion ? (on ? 1 : 0) : withTiming(on ? 1 : 0, { duration: 200, easing: EASE_OUT });
  }, [on, x, reduceMotion]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * 18 }] }));
  return (
    <View style={{ width: 46, height: 28, borderRadius: 14, backgroundColor: on ? c.accent : c.surface2, borderWidth: on ? 0 : 1, borderColor: c.line, justifyContent: "center", paddingHorizontal: on ? 3 : 2 }}>
      <Animated.View style={[{ width: 22, height: 22, borderRadius: 11, backgroundColor: on ? STATUS.white : c.text2 }, knob]} />
    </View>
  );
}

/* ---------- lists (Me) ---------- */
export function List({ children }: { children: ReactNode }) {
  const { c } = useZ();
  return <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 18, overflow: "hidden" }}>{children}</View>;
}

export function ListItem({
  label,
  sub,
  value,
  onPress,
  right,
  danger,
  first,
  chevron = true,
  testID,
}: {
  label: string;
  sub?: string;
  value?: string;
  onPress?: () => void;
  right?: ReactNode;
  danger?: boolean;
  first?: boolean;
  chevron?: boolean;
  testID?: string;
}) {
  const { c } = useZ();
  return (
    <Pressable
      testID={testID}
      accessibilityRole={right ? "switch" : "button"}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: c.line,
        backgroundColor: pressed && onPress ? c.surface2 : "transparent",
      })}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: FONTS.semibold, fontSize: FS.md, color: danger ? c.bad : c.text }}>{label}</Text>
        {sub ? <Text style={{ fontFamily: FONTS.medium, fontSize: FS.caption, color: c.text3, marginTop: 2 }}>{sub}</Text> : null}
      </View>
      {right ?? (
        <Row gap={4}>
          {value !== undefined ? (
            <Text numberOfLines={1} style={{ fontFamily: FONTS.semibold, fontSize: FS.smPlus, color: c.text2, maxWidth: 180 }}>
              {value}
            </Text>
          ) : null}
          {chevron && !danger ? <Icon name="chev" size={16} color={c.text3} /> : null}
        </Row>
      )}
    </Pressable>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <T v="caps" style={{ marginTop: 4 }}>{title}</T>
      {children}
    </View>
  );
}

/* ---------- bottom sheet ---------- */
/** Slides up over 320ms; the content stays mounted until it has slid away. */
export function Sheet({ visible, onClose, children, testID }: { visible: boolean; onClose: () => void; children: ReactNode; testID?: string }) {
  const { c, reduceMotion } = useZ();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const k = useSharedValue(0);
  const [h, setH] = useState(600);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      k.value = reduceMotion ? 1 : withTiming(1, { duration: 320, easing: EASE_OUT });
    } else if (mounted) {
      const done = () => setMounted(false);
      if (reduceMotion) {
        k.value = 0;
        done();
      } else k.value = withTiming(0, { duration: 240, easing: EASE_OUT }, (fin) => fin && runOnJS(done)());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, reduceMotion]);

  const dim = useAnimatedStyle(() => ({ opacity: k.value }));
  const slide = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - k.value) * (h + 40) }] }));

  if (!mounted) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }, dim]}>
          <Pressable
            accessibilityLabel="Close"
            style={StyleSheet.absoluteFill}
            onPress={() => {
              Keyboard.dismiss();
              onClose();
            }}
          />
        </Animated.View>
        <View style={{ flex: 1 }} pointerEvents="box-none" />
        <Animated.View
          testID={testID}
          accessibilityViewIsModal
          onLayout={(e) => setH(e.nativeEvent.layout.height)}
          style={[
            { backgroundColor: c.surface, borderTopWidth: 1, borderColor: c.line, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "88%" },
            slide,
          ]}
        >
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24 + insets.bottom }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ width: 38, height: 5, borderRadius: 3, backgroundColor: c.line, alignSelf: "center", marginBottom: 14 }} />
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function SheetTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={{ marginBottom: 16, gap: 4 }}>
      <T v="h3">{title}</T>
      {sub ? <T v="small" style={{ fontSize: FS.sm, lineHeight: 19 }}>{sub}</T> : null}
    </View>
  );
}

/** A tappable option row inside a sheet (icon, title, one-line explanation). */
export function SheetOption({ icon, title, sub, onPress, danger, testID }: { icon: IconName; title: string; sub?: string; onPress: () => void; danger?: boolean; testID?: string }) {
  const { c } = useZ();
  return (
    <Press
      testID={testID}
      onPress={onPress}
      scale={0.985}
      style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, backgroundColor: c.surface2, borderWidth: 1, borderColor: c.line }}
    >
      <Icon name={icon} size={20} color={danger ? c.bad : c.text2} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: FONTS.bold, fontSize: FS.md, color: danger ? c.bad : c.text }}>{title}</Text>
        {sub ? <Text style={{ fontFamily: FONTS.medium, fontSize: FS.chip, color: c.text2, marginTop: 2 }}>{sub}</Text> : null}
      </View>
    </Press>
  );
}

export function Warn({ children }: { children: ReactNode }) {
  const { c } = useZ();
  return (
    <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start", backgroundColor: c.warn + "1A", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 }}>
      <View style={{ marginTop: 1 }}>
        <Icon name="warn" size={16} color={c.warn} />
      </View>
      <Text style={{ flex: 1, fontFamily: FONTS.semibold, fontSize: FS.chip, lineHeight: 18, color: c.warn }}>{children}</Text>
    </View>
  );
}

/** Round icon button (focus mode's chevron, onboarding back). */
export function RoundBtn({ icon, onPress, label, testID }: { icon: IconName; onPress: () => void; label: string; testID?: string }) {
  const { c } = useZ();
  return (
    <Press
      testID={testID}
      accessibilityLabel={label}
      onPress={onPress}
      style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, alignItems: "center", justifyContent: "center" }}
    >
      <Icon name={icon} size={20} color={c.text} />
    </Press>
  );
}

/** Onboarding step dots. */
export function Dots({ index, count }: { index: number; count: number }) {
  const { c } = useZ();
  return (
    <Row gap={6} style={{ justifyContent: "center" }}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ height: 6, width: i === index ? 20 : 6, borderRadius: 3, backgroundColor: i === index ? c.accent : c.line }} />
      ))}
    </Row>
  );
}
