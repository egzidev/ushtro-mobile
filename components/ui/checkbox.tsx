import { Colors, TOUCH_TARGET_MIN } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type CheckboxProps = {
  checked?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  shape?: "square" | "circle";
  /** When checked, use this color for border/background instead of theme tint */
  checkedColor?: string;
};

export function Checkbox({
  checked = false,
  onPress,
  disabled = false,
  shape = "square",
  checkedColor,
}: CheckboxProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const tint = colors.tint;
  const checkedFill = checkedColor ?? tint;
  const uncheckedBg = colorScheme === "dark" ? "#374151" : "#d1d5db";
  const uncheckedBorder = colorScheme === "dark" ? "#6b7280" : "#9ca3af";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.wrapper,
        { minWidth: TOUCH_TARGET_MIN, minHeight: TOUCH_TARGET_MIN },
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
    >
      <View
        style={[
          styles.box,
          shape === "circle" && styles.boxCircle,
          {
            borderWidth: shape === "circle" ? 0 : 1,
            borderColor: checked ? checkedFill : uncheckedBorder,
            backgroundColor: checked ? checkedFill : uncheckedBg,
          },
        ]}
      >
        <MaterialIcons name="check" size={18} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  boxCircle: {
    borderRadius: 12,
  },
});
