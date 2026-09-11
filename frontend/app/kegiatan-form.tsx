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

import { api } from "@/src/api";
import { useAuth } from "@/src/auth";
import { DateField, toISODate } from "@/src/components/date-field";
import { useToast } from "@/src/components/toast";
import { Avatar, Button, Field } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";

export default function KegiatanForm() {
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
  const [activityName, setActivityName] = useState("");
  const [date, setDate] = useState(today);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: api.listEmployees,
    enabled: isAdmin,
  });
  const activitiesQuery = useQuery({ queryKey: ["activities"], queryFn: api.listActivities });

  const submit = useMutation({
    mutationFn: () =>
      api.createActivityLog({
        employee_id: employeeId,
        activity_name: activityName.trim(),
        date,
        location: location.trim(),
        notes,
        status: isAdmin ? "approved" : "pending",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activity-logs"] });
      qc.invalidateQueries({ queryKey: ["pending"] });
      qc.invalidateQueries({ queryKey: ["report-activities"] });
      toast(isAdmin ? "Kegiatan dicatat" : "Kegiatan diajukan", "success");
      router.back();
    },
    onError: (e: any) => toast(e.message, "error"),
  });

  const canSubmit = !!employeeId && !!activityName.trim() && !!location.trim() && !!date;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>{isAdmin ? "Catat Kegiatan" : "Catat Kegiatan Luar"}</Text>
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

          <Field
            label="Nama Kegiatan"
            value={activityName}
            onChangeText={setActivityName}
            placeholder="Contoh: Rapat Klien"
            testID="kegiatan-name"
          />
          {(activitiesQuery.data ?? []).length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {(activitiesQuery.data ?? []).map((a) => (
                <Pressable
                  key={a.id}
                  style={styles.tagChip}
                  onPress={() => setActivityName(a.name)}
                  testID={`activity-suggest-${a.id}`}
                >
                  <Text style={styles.tagChipText}>{a.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}

          <DateField label="Tanggal" value={date} onChange={setDate} testID="kegiatan-date" />
          <Field
            label="Lokasi"
            value={location}
            onChangeText={setLocation}
            placeholder="Contoh: Kantor Cabang Jakarta"
            testID="kegiatan-location"
          />

          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Keterangan</Text>
            <TextInput
              style={styles.textarea}
              placeholder="Detail kegiatan..."
              placeholderTextColor={colors.muted}
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
              testID="kegiatan-notes"
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Button
            label={isAdmin ? "Simpan" : "Catat"}
            onPress={() => submit.mutate()}
            loading={submit.isPending}
            disabled={!canSubmit}
            icon="check"
            testID="submit-kegiatan"
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
  tagChip: {
    flexShrink: 0,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.brandTertiary,
  },
  tagChipText: { fontSize: 13, color: colors.onBrandTertiary },
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
