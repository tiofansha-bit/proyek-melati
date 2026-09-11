// Design tokens for this app. Light + Dark themes.
// Keys match the "color" block of /app/design_guidelines.json.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  surface: "#F9F9F8",
  onSurface: "#1C1C1E",
  surfaceSecondary: "#FFFFFF",
  onSurfaceSecondary: "#1C1C1E",
  surfaceTertiary: "#F0F0EE",
  onSurfaceTertiary: "#3A3A3C",
  surfaceInverse: "#2C4C3B",
  onSurfaceInverse: "#FFFFFF",
  muted: "#737375",

  brand: "#2C4C3B",
  onBrand: "#FFFFFF",
  brandPrimary: "#2C4C3B",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#4A7055",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#E6EFE9",
  onBrandTertiary: "#21392C",

  success: "#347A50",
  onSuccess: "#FFFFFF",
  warning: "#D68C38",
  onWarning: "#FFFFFF",
  error: "#CC4B37",
  onError: "#FFFFFF",
  info: "#505A61",
  onInfo: "#FFFFFF",

  border: "#E3E3E0",
  borderStrong: "#C7C7C5",
  divider: "#EFEFEF",
};

const dark: typeof light = {
  surface: "#0C0C0C",
  onSurface: "#F2F2F2",
  surfaceSecondary: "#1A1A1A",
  onSurfaceSecondary: "#F2F2F2",
  surfaceTertiary: "#262626",
  onSurfaceTertiary: "#CCCCCC",
  surfaceInverse: "#D1E3D8",
  onSurfaceInverse: "#122118",
  muted: "#8C8C8C",

  brand: "#A3C2B1",
  onBrand: "#122118",
  brandPrimary: "#A3C2B1",
  onBrandPrimary: "#122118",
  brandSecondary: "#83A58E",
  onBrandSecondary: "#0A140F",
  brandTertiary: "#23382B",
  onBrandTertiary: "#D1E3D8",

  success: "#4A9D6A",
  onSuccess: "#FFFFFF",
  warning: "#E0A352",
  onWarning: "#FFFFFF",
  error: "#E56B5A",
  onError: "#FFFFFF",
  info: "#7A8B99",
  onInfo: "#FFFFFF",

  border: "#333333",
  borderStrong: "#4D4D4D",
  divider: "#262626",
};

export type ThemeColors = typeof light;

export const defaultScheme = "light" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark?: ThemeColors } = { light, dark };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme);
}

setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
