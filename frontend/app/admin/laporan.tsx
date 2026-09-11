import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/src/api";
import { Avatar, EmptyState, Segmented } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";

type Tab = "absences" | "activities";

export default function Laporan() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("absences");

  const absQuery = useQuery({ queryKey: ["report-absences"], queryFn: api.reportAbsences });
  const actQuery = useQuery({ queryKey: ["report-activities"], queryFn: api.reportActivities });

  const isAbs = tab === "absences";
  const activeQuery = isAbs ? absQuery : actQuery;
  const rows = (activeQuery.data ?? []) as any[];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Laporan</Text>
        <Text style={styles.subtitle}>Rekap per pegawai</Text>
        <View style={{ marginTop: 14 }}>
          <Segmented
            testIDPrefix="laporan-tab"
            value={tab}
            onChange={(v) => setTab(v as Tab)}
            options={[
              { label: "Tidak Hadir", value: "absences" },
              { label: "Kegiatan Luar", value: "activities" },
            ]}
          />
        </View>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(i) => i.employee_id}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 10 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={activeQuery.isFetching}
            onRefresh={() => activeQuery.refetch()}
            tintColor={colors.brandPrimary}
          />
        }
        ListHeaderComponent={
          <Text style={styles.caption}>
            {isAbs
              ? "Jumlah hari tidak hadir masuk kerja (izin disetujui)"
              : "Jumlah kegiatan luar gedung (disetujui)"}
          </Text>
        }
        ListEmptyComponent={
          activeQuery.isLoading ? null : (
            <EmptyState icon="bar-chart-2" title="Belum ada data" subtitle="Tambahkan pegawai terlebih dahulu" />
          )
        }
        renderItem={({ item, index }) => {
          const value = isAbs ? item.days : item.count;
          return (
            <View style={styles.row} testID={`report-row-${item.employee_id}`}>
              <Text style={styles.rank}>{index + 1}</Text>
              <Avatar name={item.name} url={item.avatar_url} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                {isAbs ? (
                  <Text style={styles.meta}>{item.count} pengajuan izin</Text>
                ) : (
                  <Text style={styles.meta}>kegiatan luar gedung</Text>
                )}
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeValue}>{value}</Text>
                <Text style={styles.badgeUnit}>{isAbs ? "hari" : "keg."}</Text>
              </View>
            </View>
          );
        }}
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
  caption: { fontSize: 13, color: colors.muted, marginBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rank: { width: 20, fontSize: 14, color: colors.muted, fontWeight: "500", textAlign: "center" },
  name: { fontSize: 15, color: colors.onSurface, fontWeight: "500" },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  badge: {
    minWidth: 56,
    alignItems: "center",
    backgroundColor: colors.brandTertiary,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  badgeValue: { fontSize: 20, color: colors.onBrandTertiary, fontWeight: "500" },
  badgeUnit: { fontSize: 11, color: colors.onBrandTertiary, opacity: 0.7 },
}));
