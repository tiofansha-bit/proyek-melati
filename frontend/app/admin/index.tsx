import { Feather } from "@react-native-vector-icons/feather";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, type Status } from "@/src/api";
import { useAuth } from "@/src/auth";
import { ActivityCard, LeaveCard } from "@/src/components/cards";
import { PinDialog } from "@/src/components/pin-dialog";
import { useToast } from "@/src/components/toast";
import { EmptyState } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";

export default function AdminPending() {
  const { signOut } = useAuth();
  const router = useRouter();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [pinOpen, setPinOpen] = useState(false);

  const query = useQuery({ queryKey: ["pending"], queryFn: api.getPending });

  const changePin = useMutation({
    mutationFn: (v: Record<string, string>) => api.changeAdminPin(v.current, v.next),
    onSuccess: () => {
      setPinOpen(false);
      toast("PIN admin diperbarui", "success");
    },
    onError: (e: any) => toast(e.message, "error"),
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["pending"] });
    qc.invalidateQueries({ queryKey: ["report-absences"] });
    qc.invalidateQueries({ queryKey: ["report-activities"] });
    qc.invalidateQueries({ queryKey: ["leaves"] });
    qc.invalidateQueries({ queryKey: ["activity-logs"] });
  };

  const leaveStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) =>
      api.updateLeaveStatus(id, status),
    onSuccess: (_d, v) => {
      invalidateAll();
      toast(v.status === "approved" ? "Izin disetujui" : "Izin ditolak", "success");
    },
    onError: (e: any) => toast(e.message, "error"),
  });
  const logStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) =>
      api.updateActivityLogStatus(id, status),
    onSuccess: (_d, v) => {
      invalidateAll();
      toast(v.status === "approved" ? "Kegiatan disetujui" : "Kegiatan ditolak", "success");
    },
    onError: (e: any) => toast(e.message, "error"),
  });

  const leaves = query.data?.leaves ?? [];
  const logs = query.data?.activities ?? [];
  const total = leaves.length + logs.length;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Persetujuan</Text>
            <Text style={styles.subtitle}>{total} pengajuan menunggu</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn} onPress={() => setPinOpen(true)} testID="admin-settings-button">
              <Feather name="key" size={18} color={colors.onSurface} />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={signOut} testID="logout-button">
              <Feather name="log-out" size={18} color={colors.onSurface} />
            </Pressable>
          </View>
        </View>
        <View style={styles.quickRow}>
          <Pressable style={styles.quickBtn} onPress={() => router.push("/izin-form")} testID="admin-add-izin">
            <Feather name="calendar" size={16} color={colors.brandPrimary} />
            <Text style={styles.quickText}>Catat Izin</Text>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={() => router.push("/kegiatan-form")} testID="admin-add-kegiatan">
            <Feather name="map-pin" size={16} color={colors.brandPrimary} />
            <Text style={styles.quickText}>Catat Kegiatan</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={query.isFetching}
            onRefresh={() => query.refetch()}
            tintColor={colors.brandPrimary}
          />
        }
      >
        {total === 0 && !query.isLoading ? (
          <EmptyState
            icon="check-circle"
            title="Semua sudah diproses"
            subtitle="Tidak ada pengajuan yang menunggu persetujuan"
          />
        ) : null}

        {leaves.length > 0 ? <Text style={styles.groupTitle}>Izin</Text> : null}
        {leaves.map((lv) => (
          <LeaveCard
            key={lv.id}
            leave={lv}
            showEmployee
            onApprove={() => leaveStatus.mutate({ id: lv.id, status: "approved" })}
            onReject={() => leaveStatus.mutate({ id: lv.id, status: "rejected" })}
          />
        ))}

        {logs.length > 0 ? <Text style={styles.groupTitle}>Kegiatan Luar</Text> : null}
        {logs.map((lg) => (
          <ActivityCard
            key={lg.id}
            log={lg}
            showEmployee
            onApprove={() => logStatus.mutate({ id: lg.id, status: "approved" })}
            onReject={() => logStatus.mutate({ id: lg.id, status: "rejected" })}
          />
        ))}
      </ScrollView>

      <PinDialog
        visible={pinOpen}
        title="Ubah PIN Admin"
        subtitle="Masukkan PIN saat ini lalu PIN baru (4-12 digit)."
        fields={[
          { key: "current", label: "PIN Saat Ini" },
          { key: "next", label: "PIN Baru" },
        ]}
        submitLabel="Perbarui"
        loading={changePin.isPending}
        onSubmit={(v) => changePin.mutate(v)}
        onClose={() => setPinOpen(false)}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: 14,
  },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerActions: { flexDirection: "row", gap: 10 },
  title: { fontSize: 24, color: colors.onSurface, fontWeight: "500" },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 2 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  quickRow: { flexDirection: "row", gap: 10 },
  quickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.brandTertiary,
  },
  quickText: { fontSize: 14, color: colors.brandPrimary, fontWeight: "500" },
  groupTitle: { fontSize: 16, color: colors.onSurface, fontWeight: "500", marginTop: 4 },
}));
