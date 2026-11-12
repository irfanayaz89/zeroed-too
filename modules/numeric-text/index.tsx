import { requireNativeView, requireOptionalNativeModule } from "expo";
import { Platform, type ViewProps } from "react-native";

export interface NumericTextProps extends ViewProps {
  text: string;
  color: string;
  fontSize: number;
}

/** Missing in Expo Go, on web and on Android. */
export const isNumericTextAvailable =
  Platform.OS === "ios" && !!requireOptionalNativeModule("NumericText");

export const NumericText = isNumericTextAvailable
  ? requireNativeView<NumericTextProps>("NumericText")
  : null;
