import { useColorScheme } from "react-native";
import { useMemo } from "react";
import { buildTheme, themeTokens, type Theme } from "@/constants/theme";

export function useTheme(): Theme & typeof themeTokens {
  const colorScheme = useColorScheme();
  return useMemo(() => ({ ...buildTheme(colorScheme), ...themeTokens }), [colorScheme]);
}
