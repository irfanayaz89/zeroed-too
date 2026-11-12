import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS } from "@/constants/focusd";
import { useFd } from "@/lib/prefs-context";

type ToastFn = (text: string, action?: { label: string; onPress: () => void }) => void;
const ToastContext = createContext<ToastFn>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const { c } = useFd();
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState<{ text: string; action?: { label: string; onPress: () => void } } | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback<ToastFn>(
    (text, action) => {
      setMsg({ text, action });
      if (timer.current) clearTimeout(timer.current);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setMsg(null));
      }, 3200);
    },
    [anim]
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      {msg ? (
        <Animated.View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            bottom: insets.bottom + 100,
            opacity: anim,
            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          }}
        >
          <View
            style={{
              backgroundColor: c.night,
              borderRadius: 18,
              paddingVertical: 13,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Text style={{ flex: 1, color: c.fInk, fontFamily: FONTS.bold, fontSize: 14 }}>{msg.text}</Text>
            {msg.action ? (
              <Pressable
                onPress={() => {
                  msg.action?.onPress();
                  Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => setMsg(null));
                }}
              >
                <Text style={{ color: "#B6EE4E", fontFamily: FONTS.heavy, fontSize: 14 }}>{msg.action.label}</Text>
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
