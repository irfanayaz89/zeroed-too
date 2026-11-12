import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { FONTS, FS, mix, STATUS } from "@/constants/theme";
import { useZ } from "@/lib/prefs-context";
import { EASE_OUT } from "./ui";

type Action = { label: string; onPress: () => void };
type ToastFn = (text: string, action?: Action) => void;
const ToastContext = createContext<ToastFn>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const { c } = useZ();
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState<{ text: string; action?: Action } | null>(null);
  const k = useSharedValue(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    k.value = withTiming(0, { duration: 250, easing: EASE_OUT });
    timer.current = setTimeout(() => setMsg(null), 260);
  }, [k]);

  const show = useCallback<ToastFn>(
    (text, action) => {
      if (timer.current) clearTimeout(timer.current);
      setMsg({ text, action });
      k.value = withTiming(1, { duration: 250, easing: EASE_OUT });
      timer.current = setTimeout(hide, action ? 4000 : 2800);
    },
    [k, hide]
  );

  const style = useAnimatedStyle(() => ({ opacity: k.value, transform: [{ translateY: (1 - k.value) * 20 }] }));

  return (
    <ToastContext.Provider value={show}>
      {children}
      {msg ? (
        <Animated.View pointerEvents="box-none" style={[{ position: "absolute", left: 20, right: 20, bottom: insets.bottom + 100 }, style]}>
          <View accessibilityRole="alert" style={{ backgroundColor: c.text, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ flex: 1, color: c.bg, fontFamily: FONTS.bold, fontSize: FS.smPlus }}>{msg.text}</Text>
            {msg.action ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={10}
                onPress={() => {
                  msg.action?.onPress();
                  if (timer.current) clearTimeout(timer.current);
                  hide();
                }}
              >
                <Text style={{ color: mix(c.accent, STATUS.black, 0.45), fontFamily: FONTS.heavy, fontSize: FS.smPlus }}>{msg.action.label}</Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastFn {
  return useContext(ToastContext);
}
