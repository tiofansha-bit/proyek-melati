import { Feather } from "@react-native-vector-icons/feather";
import { useQuery } from "@tanstack/react-query";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, type Employee } from "@/src/api";
import { useAuth } from "@/src/auth";
import { useToast } from "@/src/components/toast";
import { Avatar, Button } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";

type Mode = "select" | "employee" | "admin";

export default function Login() {
  const { session, ready, signInEmployee, signInAdmin } = useAuth();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();

  const [mode, setMode] = useState<Mode>("select");
  const [search, setSearch] = useState("");
  const [pin, setPin] = useState("");
  const [checking, setChecking] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [empPin, setEmpPin] = useState("");
  const [empChecking, setEmpChecking] = useState(false);

  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: api.listEmployees,
    enabled: mode === "employee",
  });

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brandPrimary} />
      </View>
    );
  }
  if (session?.role === "employee") return <Redirect href="/employee" />;
  if (session?.role === "admin") return <Redirect href="/admin" />;

  const filtered = (employeesQuery.data ?? []).filter((e) =>
    e.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const handleAdmin = async () => {
    setChecking(true);
    try {
      await api.adminLogin(pin);
      await signInAdmin(pin);
      router.replace("/admin");
    } catch (e: any) {
      toast(e.message || "PIN salah", "error");
    } finally {
      setChecking(false);
    }
  };

  const handleEmployeeLogin = async () => {
    if (!selectedEmp) return;
    setEmpChecking(true);
    try {
      await api.employeeLogin(selectedEmp.id, empPin);
      await signInEmployee(selectedEmp.id, selectedEmp.name, selectedEmp.avatar_url);
      router.replace("/employee");
    } catch (e: any) {
      toast(e.message || "PIN salah", "error");
    } finally {
      setEmpChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24, paddingHorizontal: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <Feather name="feather" size={26} color={colors.onBrandPrimary} />
            </View>
          </View>
          <Text style={styles.appName}>Izin & Kegiatan</Text>
          <Text style={styles.tagline}>Manajemen izin dan kegiatan luar pegawai</Text>

          {mode === "select" ? (
            <View style={styles.roleWrap}>
              <Pressable
                style={styles.roleCard}
                onPress={() => setMode("employee")}
                testID="role-employee"
              >
                <View style={styles.roleIcon}>
                  <Feather name="users" size={24} color={colors.brandSecondary} />
                </View>
                <Text style={styles.roleTitle}>Masuk sebagai Pegawai</Text>
                <Text style={styles.roleSub}>Ajukan izin & catat kegiatan luar</Text>
                <Feather name="chevron-right" size={20} color={colors.muted} style={styles.roleChevron} />
              </Pressable>

              <Pressable
                style={styles.roleCard}
                onPress={() => setMode("admin")}
                testID="role-admin"
              >
                <View style={styles.roleIcon}>
                  <Feather name="shield" size={24} color={colors.brandSecondary} />
                </View>
                <Text style={styles.roleTitle}>Masuk sebagai Admin</Text>
                <Text style={styles.roleSub}>Setujui, kelola pegawai & lihat laporan</Text>
                <Feather name="chevron-right" size={20} color={colors.muted} style={styles.roleChevron} />
              </Pressable>
            </View>
          ) : null}

          {mode === "employee" && !selectedEmp ? (
            <View style={styles.section}>
              <BackLink
                onPress={() => {
                  setMode("select");
                  setSearch("");
                }}
              />
              <Text style={styles.sectionTitle}>Pilih nama Anda</Text>
              <View style={styles.searchBox}>
                <Feather name="search" size={18} color={colors.muted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Cari nama..."
                  placeholderTextColor={colors.muted}
                  value={search}
                  onChangeText={setSearch}
                  testID="employee-search"
                />
              </View>
              {employeesQuery.isLoading ? (
                <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: 24 }} />
              ) : filtered.length === 0 ? (
                <Text style={styles.emptyText}>Tidak ada pegawai. Minta admin menambahkan.</Text>
              ) : (
                filtered.map((emp) => (
                  <Pressable
                    key={emp.id}
                    style={styles.empRow}
                    testID={`employee-pick-${emp.id}`}
                    onPress={() => {
                      setSelectedEmp(emp);
                      setEmpPin("");
                    }}
                  >
                    <Avatar name={emp.name} url={emp.avatar_url} size={44} />
                    <Text style={styles.empName}>{emp.name}</Text>
                    <Feather name="chevron-right" size={20} color={colors.muted} />
                  </Pressable>
                ))
              )}
            </View>
          ) : null}

          {mode === "employee" && selectedEmp ? (
            <View style={styles.section}>
              <BackLink onPress={() => setSelectedEmp(null)} />
              <View style={styles.selectedEmp}>
                <Avatar name={selectedEmp.name} url={selectedEmp.avatar_url} size={56} />
                <Text style={styles.selectedName}>{selectedEmp.name}</Text>
                <Text style={styles.hint}>Masukkan PIN Anda</Text>
              </View>
              <TextInput
                style={styles.pinInput}
                placeholder="••••"
                placeholderTextColor={colors.muted}
                value={empPin}
                onChangeText={setEmpPin}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={12}
                autoFocus
                testID="employee-pin-input"
              />
              <Text style={styles.hint}>PIN default: 1234</Text>
              <Button
                label="Masuk"
                onPress={handleEmployeeLogin}
                loading={empChecking}
                disabled={empPin.length < 4}
                testID="employee-login-button"
                style={{ marginTop: 8 }}
              />
            </View>
          ) : null}

          {mode === "admin" ? (
            <View style={styles.section}>
              <BackLink onPress={() => setMode("select")} />
              <Text style={styles.sectionTitle}>Masukkan PIN Admin</Text>
              <TextInput
                style={styles.pinInput}
                placeholder="••••"
                placeholderTextColor={colors.muted}
                value={pin}
                onChangeText={setPin}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={8}
                testID="admin-pin-input"
              />
              <Text style={styles.hint}>PIN default: 1234</Text>
              <Button
                label="Masuk"
                onPress={handleAdmin}
                loading={checking}
                disabled={pin.length === 0}
                testID="admin-login-button"
                style={{ marginTop: 8 }}
              />
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function BackLink({ onPress }: { onPress: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable style={styles.back} onPress={onPress} testID="login-back">
      <Feather name="arrow-left" size={18} color={colors.brandPrimary} />
      <Text style={styles.backText}>Kembali</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  brandRow: { alignItems: "flex-start" },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: { fontSize: 28, color: colors.onSurface, fontWeight: "500", marginTop: 20 },
  tagline: { fontSize: 15, color: colors.muted, marginTop: 6, marginBottom: 32 },
  roleWrap: { gap: 16 },
  roleCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  roleTitle: { fontSize: 18, color: colors.onSurface, fontWeight: "500" },
  roleSub: { fontSize: 14, color: colors.muted, marginTop: 4 },
  roleChevron: { position: "absolute", right: 20, top: 24 },
  section: { gap: 14 },
  sectionTitle: { fontSize: 18, color: colors.onSurface, fontWeight: "500" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: colors.onSurface },
  empRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  empName: { flex: 1, fontSize: 16, color: colors.onSurface, fontWeight: "500" },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 24 },
  selectedEmp: { alignItems: "center", gap: 8, marginVertical: 8 },
  selectedName: { fontSize: 20, color: colors.onSurface, fontWeight: "500" },
  pinInput: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: "center",
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hint: { fontSize: 13, color: colors.muted, textAlign: "center" },
  back: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  backText: { fontSize: 15, color: colors.brandPrimary, fontWeight: "500" },
}));
