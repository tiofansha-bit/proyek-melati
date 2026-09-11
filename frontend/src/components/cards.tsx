import { Feather } from "@react-native-vector-icons/feather";
import { Pressable, Text, View } from "react-native";

import type { ActivityLog, Leave } from "@/src/api";
import { Avatar, StatusBadge, TYPE_LABEL, formatDate } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";

type Actions = {
  onApprove?: () => void;
  onReject?: () => void;
  onDelete?: () => void;
};

function ActionBar({ onApprove, onReject, onDelete }: Actions) {
  const styles = useStyles();
  const { colors } = useTheme();
  if (!onApprove && !onReject && !onDelete) return null;
  return (
    <View style={styles.actions}>
      {onApprove ? (
        <Pressable
          style={[styles.actionBtn, { backgroundColor: colors.success + "1F" }]}
          onPress={onApprove}
          testID="action-approve"
        >
          <Feather name="check" size={16} color={colors.success} />
          <Text style={[styles.actionText, { color: colors.success }]}>Setujui</Text>
        </Pressable>
      ) : null}
      {onReject ? (
        <Pressable
          style={[styles.actionBtn, { backgroundColor: colors.error + "1F" }]}
          onPress={onReject}
          testID="action-reject"
        >
          <Feather name="x" size={16} color={colors.error} />
          <Text style={[styles.actionText, { color: colors.error }]}>Tolak</Text>
        </Pressable>
      ) : null}
      {onDelete ? (
        <Pressable style={styles.iconBtn} onPress={onDelete} testID="action-delete">
          <Feather name="trash-2" size={16} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function LeaveCard({
  leave,
  showEmployee,
  ...actions
}: { leave: Leave; showEmployee?: boolean } & Actions) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.card} testID={`leave-card-${leave.id}`}>
      <View style={styles.header}>
        <View style={styles.iconChip}>
          <Feather name="user-x" size={16} color={colors.brandSecondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {TYPE_LABEL[leave.type]}
            {showEmployee ? ` · ${leave.employee_name}` : ""}
          </Text>
          <Text style={styles.sub}>
            {formatDate(leave.start_date)} – {formatDate(leave.end_date)}
          </Text>
        </View>
        <StatusBadge status={leave.status} />
      </View>
      {leave.notes ? <Text style={styles.notes}>{leave.notes}</Text> : null}
      <ActionBar {...actions} />
    </View>
  );
}

export function ActivityCard({
  log,
  showEmployee,
  ...actions
}: { log: ActivityLog; showEmployee?: boolean } & Actions) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.card} testID={`activity-card-${log.id}`}>
      <View style={styles.header}>
        <View style={styles.iconChip}>
          <Feather name="map-pin" size={16} color={colors.brandSecondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {log.activity_name}
            {showEmployee ? ` · ${log.employee_name}` : ""}
          </Text>
          <Text style={styles.sub}>
            {formatDate(log.date)} · {log.location}
          </Text>
        </View>
        <StatusBadge status={log.status} />
      </View>
      {log.notes ? <Text style={styles.notes}>{log.notes}</Text> : null}
      <ActionBar {...actions} />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 15, color: colors.onSurface, fontWeight: "500" },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  notes: {
    fontSize: 14,
    color: colors.onSurfaceTertiary,
    backgroundColor: colors.surfaceTertiary,
    padding: 10,
    borderRadius: 10,
  },
  actions: { flexDirection: "row", gap: 8, alignItems: "center" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  actionText: { fontSize: 14, fontWeight: "500" },
  iconBtn: {
    marginLeft: "auto",
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
}));
