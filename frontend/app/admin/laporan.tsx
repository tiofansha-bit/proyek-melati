import { Feather } from "@react-native-vector-icons/feather";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/src/api";
import { Avatar, EmptyState, Segmented } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";

type Tab = "absences" | "activities";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const MONTHS_FULL = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function Laporan() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("absences");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number | null>(null); // null = seluruh tahun

  const params = { year, month: month ?? undefined };

  const absQuery = useQuery({
    queryKey: ["report-absences", year, month],
    queryFn: () => api.reportAbsences(params),
  });
  const actQuery = useQuery({
    queryKey: ["report-activities", year, month],
    queryFn: () => api.reportActivities(params),
  });

  const isAbs = tab === "absences";
  const activeQuery = isAbs ? absQuery : actQuery;
  const rows = (activeQuery.data ?? []) as any[];

  const periodText = month === null ? `Tahun ${year}` : `${MONTHS_FULL[month - 1]} ${year}`;

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

        <View style={styles.yearRow}>
          <Pressable
            style={styles.yearBtn}
            onPress={() => setYear((y) => y - 1)}
            testID="year-prev"
          >
            <Feather name="chevron-left" size={20} color={colors.brandPrimary} />
          </Pressable>
          <Text style={styles.yearText} testID="year-value">
            {year}
          </Text>
          <Pressable
            style={styles.yearBtn}
            onPress={() => setYear((y) => y + 1)}
            testID="year-next"
          >
            <Feather name="chevron-right" size={20} color={colors.brandPrimary} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.monthRow}
          style={styles.monthScroll}
        >
          <Pressable
            style={[styles.monthChip, month === null && styles.monthChipActive]}
            onPress={() => setMonth(null)}
            testID="month-all"
          >
            <Text style={[styles.monthText, month === null && styles.monthTextActive]}>Semua</Text>
          </Pressable>
          {MONTHS.map((m, i) => {
            const active = month === i + 1;
            return (
              <Pressable
                key={m}
                style={[styles.monthChip, active && styles.monthChipActive]}
                onPress={() => setMonth(i + 1)}
                testID={`month-${i + 1}`}
              >
                <Text style={[styles.monthText, active && styles.monthTextActive]}>{m}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
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
            {(isAbs
              ? "Jumlah hari tidak hadir masuk kerja (izin disetujui)"
              : "Jumlah kegiatan luar gedung (disetujui)") + ` · ${periodText}`}
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
  yearRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginTop: 14,
  },
  yearBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  yearText: { fontSize: 20, color: colors.onSurface, fontWeight: "500", minWidth: 64, textAlign: "center" },
  monthScroll: { marginTop: 12, marginHorizontal: -20 },
  monthRow: { gap: 8, paddingHorizontal: 20 },
  monthChip: {
    flexShrink: 0,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthChipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  monthText: { fontSize: 14, color: colors.onSurfaceTertiary },
  monthTextActive: { color: colors.onBrandPrimary },
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
