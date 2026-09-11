import { Feather } from "@react-native-vector-icons/feather";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, type LeaveType } from "@/src/api";
import { useAuth } from "@/src/auth";
import { DateField, toISODate } from "@/src/components/date-field";
import { useToast } from "@/src/components/toast";
import { Avatar, Button, Segmented } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";

export default function IzinForm() {
  const { session } = useAuth();
  const isAdmin = session?.role === "admin";
  const router = useRouter();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();

  const today = toISODate(new Date());
  const [employeeId, setEmployeeId] = useState<string>(session?.employeeId ?? "");
  const [type, setType] = useState<LeaveType>("izin");
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [notes, setNotes] = useState("");

  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: api.listEmployees,
    enabled: isAdmin,
  });

  const submit = useMutation({
    mutationFn: () =>
      api.createLeave({
        employee_id: employeeId,
        type,
        start_date: start,
        end_date: end,
        notes,
        status: isAdmin ? "approved" : "pending",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leaves"] });
      qc.invalidateQueries({ queryKey: ["pending"] });
      qc.invalidateQueries({ queryKey: ["report-absences"] });
      toast(isAdmin ? "Izin dicatat" : "Izin diajukan", "success");
      router.back();
    },
    onError: (e: any) => toast(e.message, "error"),
  });

  const canSubmit = !!employeeId && !!start && !!end;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>{isAdmin ? "Catat Izin" : "Ajukan Izin"}</Text>
        <Pressable onPress={() => router.back()} style={styles.close} testID="close-form">
          <Feather name="x" size={22} color={colors.onSurface} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 22 }}
          keyboardShouldPersistTaps="handled"
        >
          {isAdmin ? (
            <View style={{ gap: 10 }}>
              <Text style={styles.label}>Pilih Pegawai</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {(employeesQuery.data ?? []).map((e) => {
                  const active = e.id === employeeId;
                  return (
                    <Pressable
                      key={e.id}
                      style={[styles.empChip, active && styles.empChipActive]}
                      onPress={() => setEmployeeId(e.id)}
                      testID={`form-emp-${e.id}`}
                    >
                      <Avatar name={e.name} url={e.avatar_url} size={24} />
                      <Text style={[styles.empChipText, active && styles.empChipTextActive]}>
                        {e.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          <View style={{ gap: 10 }}>
            <Text style={styles.label}>Jenis Izin</Text>
            <Segmented
              testIDPrefix="izin-type"
              value={type}
              onChange={setType}
              options={[
                { label: "Sakit", value: "sakit" },
                { label: "Cuti", value: "cuti" },
                { label: "Izin", value: "izin" },
              ]}
            />
          </View>

          <DateField label="Tanggal Mulai" value={start} onChange={setStart} testID="izin-start" />
          <DateField label="Tanggal Selesai" value={end} onChange={setEnd} testID="izin-end" />

          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Keterangan</Text>
            <TextInput
              style={styles.textarea}
              placeholder="Tulis alasan / keterangan..."
              placeholderTextColor={colors.muted}
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
              testID="izin-notes"
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Button
            label={isAdmin ? "Simpan" : "Ajukan"}
            onPress={() => submit.mutate()}
            loading={submit.isPending}
            disabled={!canSubmit}
            icon="check"
            testID="submit-izin"
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: { fontSize: 20, color: colors.onSurface, fontWeight: "500" },
  close: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 14, color: colors.onSurfaceTertiary, fontWeight: "500" },
  chipRow: { gap: 8, paddingRight: 8 },
  empChip: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  empChipActive: { backgroundColor: colors.brandTertiary, borderColor: colors.brandSecondary },
  empChipText: { fontSize: 14, color: colors.onSurfaceTertiary },
  empChipTextActive: { color: colors.onBrandTertiary, fontWeight: "500" },
  textarea: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 12,
    padding: 14,
    minHeight: 100,
    fontSize: 16,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
}));
