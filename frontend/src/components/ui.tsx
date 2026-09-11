import { Feather } from "@react-native-vector-icons/feather";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { makeStyles, useTheme } from "@/src/theme";
import type { Status, LeaveType } from "@/src/api";

// ------------------------- Button -------------------------
export function Button({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
  icon,
  testID,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Feather>["name"];
  testID?: string;
  style?: any;
}) {
  const styles = useButtonStyles();
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const bg =
    variant === "primary"
      ? styles.primary
      : variant === "secondary"
      ? styles.secondary
      : variant === "danger"
      ? styles.danger
      : styles.ghost;
  const fg =
    variant === "primary"
      ? colors.onBrandPrimary
      : variant === "secondary"
      ? colors.onBrandTertiary
      : variant === "danger"
      ? colors.onError
      : colors.brandPrimary;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        bg,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Feather name={icon} size={18} color={fg} /> : null}
          <Text style={[styles.label, { color: fg }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const useButtonStyles = makeStyles((colors) => ({
  base: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  primary: { backgroundColor: colors.brandPrimary },
  secondary: { backgroundColor: colors.brandTertiary },
  danger: { backgroundColor: colors.error },
  ghost: { backgroundColor: "transparent" },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  label: { fontSize: 16, fontWeight: "500" },
}));

// ------------------------- Avatar -------------------------
export function Avatar({
  name,
  url,
  size = 44,
}: {
  name: string;
  url?: string | null;
  size?: number;
}) {
  const styles = useAvatarStyles();
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        transition={200}
      />
    );
  }
  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials || "?"}</Text>
    </View>
  );
}

const useAvatarStyles = makeStyles((colors) => ({
  fallback: {
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { color: colors.onBrandTertiary, fontWeight: "500" },
}));

// ------------------------- Status badge -------------------------
const STATUS_LABEL: Record<Status, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

export function StatusBadge({ status }: { status: Status }) {
  const styles = useBadgeStyles();
  const { colors } = useTheme();
  const color =
    status === "approved" ? colors.success : status === "rejected" ? colors.error : colors.warning;
  return (
    <View style={[styles.badge, { backgroundColor: color + "22" }]} testID={`status-${status}`}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

const useBadgeStyles = makeStyles(() => ({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { fontSize: 12, fontWeight: "500" },
}));

// ------------------------- Field -------------------------
export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  const styles = useFieldStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, error ? styles.inputError : null]}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const useFieldStyles = makeStyles((colors) => ({
  wrap: { gap: 8 },
  label: { fontSize: 14, color: colors.onSurfaceTertiary, fontWeight: "500" },
  input: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: { borderColor: colors.error },
  errorText: { fontSize: 12, color: colors.error },
}));

// ------------------------- Segmented control -------------------------
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  testIDPrefix,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
  testIDPrefix?: string;
}) {
  const styles = useSegStyles();
  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            testID={testIDPrefix ? `${testIDPrefix}-${opt.value}` : undefined}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onChange(opt.value);
            }}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useSegStyles = makeStyles((colors) => ({
  container: {
    flexDirection: "row",
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 9,
  },
  segmentActive: { backgroundColor: colors.surfaceSecondary },
  segmentText: { fontSize: 14, color: colors.muted, fontWeight: "500" },
  segmentTextActive: { color: colors.onSurface },
}));

// ------------------------- Empty state -------------------------
export function EmptyState({
  icon = "inbox",
  title,
  subtitle,
}: {
  icon?: React.ComponentProps<typeof Feather>["name"];
  title: string;
  subtitle?: string;
}) {
  const styles = useEmptyStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.wrap} testID="empty-state">
      <View style={styles.iconWrap}>
        <Feather name={icon} size={28} color={colors.brandSecondary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const useEmptyStyles = makeStyles((colors) => ({
  wrap: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 24, gap: 8 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: { fontSize: 16, color: colors.onSurface, fontWeight: "500", textAlign: "center" },
  subtitle: { fontSize: 14, color: colors.muted, textAlign: "center" },
}));

// ------------------------- helpers -------------------------
export const TYPE_LABEL: Record<LeaveType, string> = {
  sakit: "Sakit",
  cuti: "Cuti",
  izin: "Izin",
};

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso.length <= 10 ? iso + "T00:00:00" : iso);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}
