import React from "react";
import { type TextProps } from "react-native";
import { Typography, type TypographyProps, type TypographyVariant } from "../../design-system";
import { useThemeColor } from "../../../hooks/useThemeColor";

export type ThemedTextProps = Omit<TextProps, 'style'> & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
  style?: TypographyProps['style'];
};

export function ThemedText({
  lightColor,
  darkColor,
  type = "default",
  style,
  ...rest
}: ThemedTextProps) {
  // Map old types to new design system variants
  const getVariant = (): TypographyVariant => {
    switch (type) {
      case "title":
        return "h1";
      case "subtitle":
        return "h3";
      case "defaultSemiBold":
        return "body";
      case "link":
        return "body";
      case "default":
      default:
        return "body";
    }
  };

  // Get color from legacy hook for backward compatibility
  const legacyColor = useThemeColor({ light: lightColor, dark: darkColor }, "text");
  
  // Use link color for link type, otherwise use legacy color for backward compatibility
  const finalColor = type === "link" ? "#0a7ea4" : undefined;

  return (
    <Typography
      variant={getVariant()}
      color={finalColor ? undefined : "primary"} // Let design system handle color unless it's a link
      style={[
        // Apply legacy color for backward compatibility
        finalColor ? { color: finalColor } : lightColor || darkColor ? { color: legacyColor } : undefined,
        // Apply font weight for semibold variant
        type === "defaultSemiBold" ? { fontWeight: "600" } : undefined,
        style,
      ]}
      {...rest}
    />
  );
}
