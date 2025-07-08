import React from "react";
import { View, type ViewProps } from "react-native";
import { useColors } from "../../design-system";
import { useThemeColor } from "../../../hooks/useThemeColor";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const designSystemColors = useColors();
  
  // For backward compatibility, use legacy hook when specific colors are provided
  const legacyBackgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background"
  );

  // Use design system background color by default, but allow override via props
  const backgroundColor = lightColor || darkColor 
    ? legacyBackgroundColor 
    : designSystemColors.background;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
