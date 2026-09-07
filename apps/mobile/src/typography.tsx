import React from "react";
import { Text as NativeText, type TextProps } from "react-native";

// Static faces avoid platform-dependent synthetic weights on iOS and Android.
export const fonts = {
  regular: "IRANYekanXFaNum-Regular",
  medium: "IRANYekanXFaNum-Medium",
  semibold: "IRANYekanXFaNum-DemiBold",
  bold: "IRANYekanXFaNum-Bold",
} as const;

export const fontAssets = {
  [fonts.regular]: require("../assets/fonts/IRANYekanXFaNum-Regular.ttf"),
  [fonts.medium]: require("../assets/fonts/IRANYekanXFaNum-Medium.ttf"),
  [fonts.semibold]: require("../assets/fonts/IRANYekanXFaNum-DemiBold.ttf"),
  [fonts.bold]: require("../assets/fonts/IRANYekanXFaNum-Bold.ttf"),
};

// React Native does not inherit typography through View containers.
export function Text({ style, ...props }: TextProps) {
  return (
    <NativeText
      {...props}
      style={[{ fontFamily: fonts.regular, fontWeight: "normal" }, style]}
    />
  );
}
