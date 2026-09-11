import { Feather } from "@react-native-vector-icons/feather";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/src/api";
import { PinDialog } from "@/src/components/pin-dialog";
import { useToast } from "@/src/components/toast";
import { Avatar, Button, EmptyState, Segmented } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";

type Tab = "employees" | "activities";

export default function Kelola() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("employees");
  const [input, setInput] = useState("");
  const [pinTarget, setPinTarget] = useState<{ id: string; name: string } | null>(null);

  const empQuery = useQuery({ queryKey: ["employees"], queryFn: api.listEmployees });
  const actQuery = useQuery({ queryKey: ["activities"], queryFn: api.listActivities });

  const isEmp = tab === "employees";

  const addEmp = useMutation({
    mutationFn: (name: string) => api.createEmployee(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({ queryKey: ["report-absences"] });
      qc.invalidateQueries({ queryKey: ["report-activities"] });
      setInput("");
      toast("Pegawai ditambahkan", "success");
    },
    onError: (e: any) => toast(e.message, "error"),
  });
  const delEmp = useMutation({
    mutationFn: (id: string) => api.deleteEmployee(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast("Pegawai dihapus", "success");
    },
    onError: (e: any) => toast(e.message, "error"),
  });
  const addAct = useMutation({
    mutationFn: (name: string) => api.createActivity(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activities"] });
      setInput("");
      toast("Kegiatan ditambahkan", "success");
    },
    onError: (e: any) => toast(e.message, "error"),
  });
  const delAct = useMutation({
    mutationFn: (id: string) => api.deleteActivity(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activities"] });
      toast("Kegiatan dihapus", "success");
    },
    onError: (e: any) => toast(e.message, "error"),
  });
  const resetPin = useMutation({
    mutationFn: (v: { id: string; pin: string }) => api.setEmployeePin(v.id, v.pin),
    onSuccess: () => {
      setPinTarget(null);
      toast("PIN pegawai diperbarui", "success");
    },
    onError: (e: any) => toast(e.message, "error"),
  });

  const rows = (isEmp ? empQuery.data : actQuery.data) ?? [];
  const adding = isEmp ? addEmp.isPending : addAct.isPending;

  const handleAdd = () => {
    const name = input.trim();
    if (!name) return;
    if (isEmp) addEmp.mutate(name);
    else addAct.mutate(name);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Kelola</Text>
        <Text style={styles.subtitle}>Atur pegawai & daftar kegiatan</Text>
        <View style={{ marginTop: 14 }}>
          <Segmented
            testIDPrefix="kelola-tab"
            value={tab}
            onChange={(v) => {
              setTab(v as Tab);
              setInput("");
            }}
            options={[
              { label: "Pegawai", value: "employees" },
              { label: "Kegiatan", value: "activities" },
            ]}
          />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <FlatList
          data={rows}
          keyExtractor={(i: any) => i.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 10 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState
              icon={isEmp ? "users" : "list"}
              title={isEmp ? "Belum ada pegawai" : "Belum ada kegiatan"}
              subtitle={`Tambahkan ${isEmp ? "pegawai" : "kegiatan"} baru di bawah`}
            />
          }
          renderItem={({ item }: any) => (
            <View style={styles.row} testID={`kelola-row-${item.id}`}>
              {isEmp ? (
                <Avatar name={item.name} url={item.avatar_url} size={40} />
              ) : (
                <View style={styles.actIcon}>
                  <Feather name="briefcase" size={18} color={colors.brandSecondary} />
                </View>
              )}
              <Text style={styles.name}>{item.name}</Text>
              {isEmp ? (
                <Pressable
                  style={styles.pinBtn}
                  onPress={() => setPinTarget({ id: item.id, name: item.name })}
                  testID={`reset-pin-${item.id}`}
                >
                  <Feather name="key" size={18} color={colors.brandPrimary} />
                </Pressable>
              ) : null}
              <Pressable
                style={styles.delBtn}
                onPress={() => (isEmp ? delEmp.mutate(item.id) : delAct.mutate(item.id))}
                testID={`delete-${item.id}`}
              >
                <Feather name="trash-2" size={18} color={colors.error} />
              </Pressable>
            </View>
          )}
        />

        <View style={[styles.addBar, { paddingBottom: insets.bottom + 12 }]}>
          <TextInput
            style={styles.addInput}
            placeholder={isEmp ? "Nama pegawai baru" : "Nama kegiatan baru"}
            placeholderTextColor={colors.muted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
            testID="kelola-input"
          />
          <Button
            label="Tambah"
            onPress={handleAdd}
            loading={adding}
            disabled={!input.trim()}
            testID="kelola-add"
            style={{ paddingHorizontal: 18 }}
          />
        </View>
      </KeyboardAvoidingView>

      <PinDialog
        visible={!!pinTarget}
        title="Atur PIN Pegawai"
        subtitle={pinTarget ? `Setel PIN baru untuk ${pinTarget.name} (4-12 digit).` : undefined}
        fields={[{ key: "pin", label: "PIN Baru" }]}
        submitLabel="Simpan"
        loading={resetPin.isPending}
        onSubmit={(v) => pinTarget && resetPin.mutate({ id: pinTarget.id, pin: v.pin })}
        onClose={() => setPinTarget(null)}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: { fontSize: 24, color: colors.onSurface, fontWeight: "500" },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { flex: 1, fontSize: 15, color: colors.onSurface, fontWeight: "500" },
  pinBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  delBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  addBar: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  addInput: {
    flex: 1,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
}));
