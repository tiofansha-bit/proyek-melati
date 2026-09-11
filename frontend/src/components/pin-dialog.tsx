import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { Button } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";

export type PinField = { key: string; label: string };

export function PinDialog({
  visible,
  title,
  subtitle,
  fields,
  submitLabel = "Simpan",
  loading,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  fields: PinField[];
  submitLabel?: string;
  loading?: boolean;
  onSubmit: (values: Record<string, string>) => void;
  onClose: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) setValues({});
  }, [visible]);

  const allValid = fields.every((f) => (values[f.key] ?? "").length >= 4);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdropPress} onPress={onClose} testID="pin-dialog-backdrop" />
        <View style={styles.card} testID="pin-dialog">
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={{ gap: 14, marginTop: 8 }}>
            {fields.map((f) => (
              <View key={f.key} style={{ gap: 6 }}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••"
                  placeholderTextColor={colors.muted}
                  value={values[f.key] ?? ""}
                  onChangeText={(t) => setValues((prev) => ({ ...prev, [f.key]: t }))}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={12}
                  testID={`pin-field-${f.key}`}
                />
              </View>
            ))}
          </View>
          <View style={styles.actions}>
            <Button label="Batal" variant="secondary" onPress={onClose} testID="pin-cancel" style={{ flex: 1 }} />
            <Button
              label={submitLabel}
              onPress={() => onSubmit(values)}
              loading={loading}
              disabled={!allValid}
              testID="pin-submit"
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useStyles = makeStyles((colors) => ({
  backdrop: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  backdropPress: { ...({ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as const), backgroundColor: "rgba(0,0,0,0.4)" },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    padding: 24,
  },
  title: { fontSize: 20, color: colors.onSurface, fontWeight: "500" },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 4 },
  label: { fontSize: 14, color: colors.onSurfaceTertiary, fontWeight: "500" },
  input: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 22,
    letterSpacing: 6,
    textAlign: "center",
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actions: { flexDirection: "row", gap: 12, marginTop: 20 },
}));
