import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { Field, formatDate } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";

let DateTimePicker: any = null;
if (Platform.OS !== "web") {
  DateTimePicker = require("@react-native-community/datetimepicker").default;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DateField({
  label,
  value,
  onChange,
  testID,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  testID?: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [show, setShow] = useState(false);

  if (Platform.OS === "web") {
    return (
      <Field
        label={label}
        value={value}
        onChangeText={onChange}
        placeholder="YYYY-MM-DD"
        testID={testID}
      />
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.input} onPress={() => setShow(true)} testID={testID}>
        <Text style={styles.value}>{formatDate(value)}</Text>
      </Pressable>
      {show ? (
        <DateTimePicker
          value={new Date(value + "T00:00:00")}
          mode="date"
          display="default"
          onChange={(_e: any, selected?: Date) => {
            setShow(Platform.OS === "ios");
            if (selected) onChange(toISODate(selected));
          }}
          themeVariant={colors.surface === "#0C0C0C" ? "dark" : "light"}
        />
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { gap: 8 },
  label: { fontSize: 14, color: colors.onSurfaceTertiary, fontWeight: "500" },
  input: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  value: { fontSize: 16, color: colors.onSurface },
}));

export { toISODate };
