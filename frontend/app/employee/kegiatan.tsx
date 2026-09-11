import { Feather } from "@react-native-vector-icons/feather";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/src/api";
import { useAuth } from "@/src/auth";
import { ActivityCard } from "@/src/components/cards";
import { useToast } from "@/src/components/toast";
import { EmptyState } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";

export default function EmployeeKegiatan() {
  const { session } = useAuth();
  const router = useRouter();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const employeeId = session?.employeeId ?? "";

  const query = useQuery({
    queryKey: ["activity-logs", employeeId],
    queryFn: () => api.listActivityLogs({ employee_id: employeeId }),
    enabled: !!employeeId,
  });

  const del = useMutation({
    mutationFn: (id: string) => api.deleteActivityLog(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activity-logs", employeeId] });
      toast("Kegiatan dihapus", "success");
    },
    onError: (e: any) => toast(e.message, "error"),
  });

  const data = query.data ?? [];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Kegiatan Luar</Text>
        <Text style={styles.subtitle}>Riwayat kegiatan luar gedung</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={query.isFetching}
            onRefresh={() => query.refetch()}
            tintColor={colors.brandPrimary}
          />
        }
        ListEmptyComponent={
          query.isLoading ? null : (
            <EmptyState
              icon="map-pin"
              title="Belum ada kegiatan"
              subtitle="Tekan tombol + untuk mencatat kegiatan luar"
            />
          )
        }
        renderItem={({ item }) => (
          <ActivityCard
            log={item}
            onDelete={item.status === "pending" ? () => del.mutate(item.id) : undefined}
          />
        )}
      />

      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => router.push("/kegiatan-form")}
        testID="add-kegiatan-fab"
      >
        <Feather name="plus" size={24} color={colors.onBrandPrimary} />
      </Pressable>
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
  fab: {
    position: "absolute",
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
}));
