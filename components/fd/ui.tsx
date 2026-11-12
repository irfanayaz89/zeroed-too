import React, { useEffect, useRef, type ReactNode } from "react";
import {
  ActivityIndicator,
  Animated,
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
import * as Haptics from "expo-haptics";
import { FONTS } from "@/constants/focusd";
import { useFd } from "@/lib/prefs-context";

/* ---------- text ---------- */
type Variant = "display" | "title" | "h2" | "body" | "bodyStrong" | "small" | "eyebrow" | "label";

const VARIANTS: Record<Variant, TextStyle> = {
  display: { fontFamily: FONTS.display, fontSize: 34, lineHeight: 38 },
  title: { fontFamily: FONTS.display, fontSize: 28, lineHeight: 32 },
  h2: { fontFamily: FONTS.heavy, fontSize: 21, lineHeight: 26 },
  body: { fontFamily: FONTS.semibold, fontSize: 15.5, lineHeight: 21 },
  bodyStrong: { fontFamily: FONTS.heavy, fontSize: 16, lineHeight: 21 },
  small: { fontFamily: FONTS.semibold, fontSize: 13.5, lineHeight: 18 },
  eyebrow: { fontFamily: FONTS.heavy, fontSize: 12, letterSpacing: 1, textTransform: "uppercase" },
  label: { fontFamily: FONTS.heavy, fontSize: 11.5, letterSpacing: 0.9, textTransform: "uppercase" },
};

export function T({
  v = "body",
  color,
  style,
  ...rest
}: TextProps & { v?: Variant; color?: "ink" | "sub" | "soft" | "accent" | string }) {
  const { c } = useFd();
  const col =
    color === undefined ? (v === "small" || v === "eyebrow" || v === "label" ? c.sub : c.ink)
    : color === "ink" ? c.ink
    : color === "sub" ? c.sub
    : color === "soft" ? c.soft
    : color === "accent" ? c.accent
    : color;
  return <Text {...rest} style={[VARIANTS[v], { color: col }, style]} />;
}

/* ---------- layout ---------- */
export function Screen({
  children,
  scroll = true,
  tabs = false,
  dark = false,
  style,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  /** Leaves room for the tab bar. */
  tabs?: boolean;
  dark?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const { c } = useFd();
  const insets = useSafeAreaInsets();
  const pad = {
    paddingTop: insets.top + 10,
    paddingBottom: (tabs ? 110 : 24) + insets.bottom,
    paddingHorizontal: 20,
    gap: 12,
  };
  const bg = { backgroundColor: dark ? c.night : c.bg };
  if (!scroll) {
    return <View style={[{ flex: 1 }, bg, pad, style, contentStyle]}>{children}</View>;
  }
  return (
    <KeyboardAvoidingView style={[{ flex: 1 }, bg, style]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[{ flexGrow: 1 }, pad, contentStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Row({ children, style, gap = 10 }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: "row", alignItems: "center", gap }, style]}>{children}</View>;
}

export function Spacer() {
  return <View style={{ flex: 1 }} />;
}

export function Card({
  children,
  style,
  onPress,
  testID,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  testID?: string;
}) {
  const { c, isDark } = useFd();
  const base: ViewStyle = {
    backgroundColor: c.card,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 18,
    ...(isDark
      ? {}
      : { shadowColor: "#78003C", shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 }),
  };
  if (onPress) {
    return (
      <Pressable testID={testID} onPress={onPress} style={({ pressed }) => [base, style, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  }
  return <View testID={testID} style={[base, style]}>{children}</View>;
}

/* ---------- buttons ---------- */
export function Btn({
  title,
  onPress,
  kind = "primary",
  disabled,
  loading,
  style,
  flex,
  small,
  testID,
}: {
  title: string;
  onPress?: () => void;
  kind?: "primary" | "secondary" | "accent" | "danger" | "link";
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  flex?: boolean;
  small?: boolean;
  testID?: string;
}) {
  const { c } = useFd();
  const bg =
    kind === "primary" ? c.ink : kind === "accent" ? c.accent : kind === "danger" ? c.danger : kind === "link" ? "transparent" : c.card;
  const fg = kind === "primary" ? c.bg : kind === "accent" || kind === "danger" ? "#fff" : kind === "link" ? c.sub : c.ink;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.();
      }}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: 999,
          minHeight: small ? 40 : kind === "link" ? 40 : 56,
          paddingHorizontal: small ? 14 : 20,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.35 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        flex && { flex: 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={{ fontFamily: FONTS.heavy, fontSize: small ? 13.5 : 16.5, color: fg }}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  on,
  onPress,
  dashed,
  dot,
  small,
  testID,
}: {
  label: string;
  on?: boolean;
  onPress?: () => void;
  dashed?: boolean;
  dot?: string;
  small?: boolean;
  testID?: string;
}) {
  const { c } = useFd();
  return (
    <Pressable
      testID={testID}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress?.();
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: dashed ? "transparent" : on ? c.ink : c.card,
        borderRadius: 999,
        borderWidth: 2,
        borderColor: dashed ? c.dash : "transparent",
        borderStyle: dashed ? "dashed" : "solid",
        paddingVertical: small ? 5 : 8,
        paddingHorizontal: small ? 10 : 14,
      }}
    >
      {dot ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dot }} /> : null}
      <Text style={{ fontFamily: FONTS.heavy, fontSize: small ? 12.5 : 14, color: dashed ? c.sub : on ? c.bg : c.ink }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Chips({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{children}</View>;
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <T v="label" style={{ marginTop: 6, marginBottom: -2, marginLeft: 4 }}>
      {children}
    </T>
  );
}

export function Field(props: TextInputProps & { multiline?: boolean }) {
  const { c } = useFd();
  return (
    <TextInput
      placeholderTextColor={c.sub + "99"}
      {...props}
      style={[
        {
          backgroundColor: c.field,
          color: c.ink,
          borderRadius: 18,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontFamily: FONTS.bold,
          fontSize: 16,
          minHeight: props.multiline ? 90 : undefined,
          textAlignVertical: props.multiline ? "top" : "center",
        },
        props.style,
      ]}
    />
  );
}

export function Toggle({ on }: { on: boolean }) {
  const { c } = useFd();
  const x = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(x, { toValue: on ? 1 : 0, duration: 180, useNativeDriver: false }).start();
  }, [on, x]);
  return (
    <Animated.View
      style={{
        width: 50,
        height: 30,
        borderRadius: 15,
        backgroundColor: x.interpolate({ inputRange: [0, 1], outputRange: [c.line, c.accent] }),
        padding: 3,
      }}
    >
      <Animated.View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: "#fff",
          transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }],
        }}
      />
    </Animated.View>
  );
}

/* ---------- sheet + dialog ---------- */
export function Sheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const { c } = useFd();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(30,6,22,0.45)" }]} onPress={() => { Keyboard.dismiss(); onClose(); }} />
        <View style={{ flex: 1 }} pointerEvents="box-none" />
        <View
          style={{
            backgroundColor: c.bg,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            maxHeight: "88%",
          }}
        >
          <ScrollView
            contentContainerStyle={{ padding: 22, paddingTop: 12, paddingBottom: 24 + insets.bottom, gap: 12 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ width: 42, height: 5, borderRadius: 3, backgroundColor: c.line, alignSelf: "center", marginBottom: 4 }} />
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function Dialog({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const { c } = useFd();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1, justifyContent: "center", padding: 24 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(30,6,22,0.5)" }]} onPress={onClose} />
        <View style={{ backgroundColor: c.bg, borderRadius: 28, padding: 22, gap: 12 }}>{children}</View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ---------- small bits ---------- */
export function Dots({ index, count }: { index: number; count: number }) {
  const { c } = useFd();
  return (
    <Row gap={6} style={{ justifyContent: "center" }}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{ height: 8, width: i === index ? 22 : 8, borderRadius: 4, backgroundColor: i === index ? c.accent : c.bar }}
        />
      ))}
    </Row>
  );
}

export function IconBtn({ label, onPress, testID }: { label: string; onPress: () => void; testID?: string }) {
  const { c } = useFd();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: c.card, alignItems: "center", justifyContent: "center" }}
    >
      <Text style={{ fontFamily: FONTS.heavy, fontSize: 20, color: c.ink, marginTop: -2 }}>{label}</Text>
    </Pressable>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const { c } = useFd();
  return (
    <View style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: c.bar, overflow: "hidden" }}>
      <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: "100%", borderRadius: 5, backgroundColor: c.accent }} />
    </View>
  );
}
