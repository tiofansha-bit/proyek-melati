import { Feather } from "@react-native-vector-icons/feather";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/src/api";
import { useAuth } from "@/src/auth";
import { ActivityCard, LeaveCard } from "@/src/components/cards";
import { EmptyState } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";

const HERO =
  "https://images.unsplash.com/photo-1675251171768-5d49233cc410?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHNhZ2UlMjBncmVlbiUyMG1pbmltYWwlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc4OTA5Mjg1NXww&ixlib=rb-4.1.0&q=85";

export default function EmployeeHome() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const employeeId = session?.employeeId ?? "";

  const leavesQuery = useQuery({
    queryKey: ["leaves", employeeId],
    queryFn: () => api.listLeaves({ employee_id: employeeId }),
    enabled: !!employeeId,
  });
  const logsQuery = useQuery({
    queryKey: ["activity-logs", employeeId],
    queryFn: () => api.listActivityLogs({ employee_id: employeeId }),
    enabled: !!employeeId,
  });

  const leaves = leavesQuery.data ?? [];
  const logs = logsQuery.data ?? [];
  const approvedLeaves = leaves.filter((l) => l.status === "approved").length;
  const approvedLogs = logs.filter((l) => l.status === "approved").length;
  const pending =
    leaves.filter((l) => l.status === "pending").length +
    logs.filter((l) => l.status === "pending").length;

  const recent = [
    ...leaves.map((l) => ({ kind: "leave" as const, at: l.created_at, data: l })),
    ...logs.map((l) => ({ kind: "log" as const, at: l.created_at, data: l })),
  ]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 6);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Image source={{ uri: HERO }} style={styles.heroImg} contentFit="cover" />
          <LinearGradient
            colors={["transparent", colors.surfaceInverse]}
            style={styles.heroScrim}
          />
          <View style={[styles.heroContent, { paddingTop: insets.top + 20 }]}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.greeting}>Halo,</Text>
                <Text style={styles.name}>{session?.employeeName}</Text>
              </View>
              <Pressable style={styles.logout} onPress={signOut} testID="logout-button">
                <Feather name="log-out" size={18} color={colors.onSurfaceInverse} />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.statsRow}>
            <View style={styles.statCard} testID="stat-absences">
              <Text style={styles.statValue}>{approvedLeaves}</Text>
              <Text style={styles.statLabel}>Izin disetujui</Text>
            </View>
            <View style={styles.statCard} testID="stat-activities">
              <Text style={styles.statValue}>{approvedLogs}</Text>
              <Text style={styles.statLabel}>Kegiatan luar</Text>
            </View>
            <View style={styles.statCard} testID="stat-pending">
              <Text style={[styles.statValue, { color: colors.warning }]}>{pending}</Text>
              <Text style={styles.statLabel}>Menunggu</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              style={styles.actionCard}
              onPress={() => router.push("/izin-form")}
              testID="quick-izin"
            >
              <View style={styles.actionIcon}>
                <Feather name="calendar" size={20} color={colors.onBrandPrimary} />
              </View>
              <Text style={styles.actionText}>Ajukan Izin</Text>
            </Pressable>
            <Pressable
              style={styles.actionCard}
              onPress={() => router.push("/kegiatan-form")}
              testID="quick-kegiatan"
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.brandSecondary }]}>
                <Feather name="map-pin" size={20} color={colors.onBrandSecondary} />
              </View>
              <Text style={styles.actionText}>Catat Kegiatan</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Riwayat Terbaru</Text>
          {recent.length === 0 ? (
            <EmptyState
              icon="clock"
              title="Belum ada riwayat"
              subtitle="Ajukan izin atau catat kegiatan luar Anda"
            />
          ) : (
            <View style={{ gap: 12 }}>
              {recent.map((r) =>
                r.kind === "leave" ? (
                  <LeaveCard key={r.data.id} leave={r.data} />
                ) : (
                  <ActivityCard key={r.data.id} log={r.data} />
                ),
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.surface },
  hero: { height: 200, justifyContent: "flex-end" },
  heroImg: { ...({ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as const) },
  heroScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: 200 },
  heroContent: { paddingHorizontal: 24, paddingBottom: 20 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  greeting: { fontSize: 16, color: colors.onSurfaceInverse, opacity: 0.85 },
  name: { fontSize: 26, color: colors.onSurfaceInverse, fontWeight: "500", marginTop: 2 },
  logout: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { paddingHorizontal: 20, paddingTop: 20, gap: 20 },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "flex-start",
  },
  statValue: { fontSize: 28, color: colors.onSurface, fontWeight: "500" },
  statLabel: { fontSize: 12, color: colors.muted, marginTop: 4 },
  actionRow: { flexDirection: "row", gap: 12 },
  actionCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { flex: 1, fontSize: 14, color: colors.onSurface, fontWeight: "500" },
  sectionTitle: { fontSize: 18, color: colors.onSurface, fontWeight: "500" },
}));
