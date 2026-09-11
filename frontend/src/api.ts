const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let detail = "Terjadi kesalahan";
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {}
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export type Employee = {
  id: string;
  name: string;
  avatar_url?: string | null;
  created_at: string;
};

export type Activity = { id: string; name: string; created_at: string };

export type LeaveType = "sakit" | "cuti" | "izin";
export type Status = "pending" | "approved" | "rejected";

export type Leave = {
  id: string;
  employee_id: string;
  employee_name: string;
  type: LeaveType;
  start_date: string;
  end_date: string;
  notes: string;
  status: Status;
  created_at: string;
};

export type ActivityLog = {
  id: string;
  employee_id: string;
  employee_name: string;
  activity_name: string;
  date: string;
  location: string;
  notes: string;
  status: Status;
  created_at: string;
};

export type AbsenceReport = {
  employee_id: string;
  name: string;
  avatar_url?: string | null;
  count: number;
  days: number;
};

export type ActivityReport = {
  employee_id: string;
  name: string;
  avatar_url?: string | null;
  count: number;
};

export const api = {
  adminLogin: (pin: string) =>
    request<{ ok: boolean }>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ pin }),
    }),

  listEmployees: () => request<Employee[]>("/employees"),
  createEmployee: (name: string) =>
    request<Employee>("/employees", { method: "POST", body: JSON.stringify({ name }) }),
  deleteEmployee: (id: string) => request(`/employees/${id}`, { method: "DELETE" }),

  listActivities: () => request<Activity[]>("/activities"),
  createActivity: (name: string) =>
    request<Activity>("/activities", { method: "POST", body: JSON.stringify({ name }) }),
  deleteActivity: (id: string) => request(`/activities/${id}`, { method: "DELETE" }),

  listLeaves: (params?: { employee_id?: string; status?: Status }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<Leave[]>(`/leaves${q ? `?${q}` : ""}`);
  },
  createLeave: (body: {
    employee_id: string;
    type: LeaveType;
    start_date: string;
    end_date: string;
    notes: string;
    status?: Status;
  }) => request<Leave>("/leaves", { method: "POST", body: JSON.stringify(body) }),
  updateLeaveStatus: (id: string, status: Status) =>
    request<Leave>(`/leaves/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  deleteLeave: (id: string) => request(`/leaves/${id}`, { method: "DELETE" }),

  listActivityLogs: (params?: { employee_id?: string; status?: Status }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<ActivityLog[]>(`/activity-logs${q ? `?${q}` : ""}`);
  },
  createActivityLog: (body: {
    employee_id: string;
    activity_name: string;
    date: string;
    location: string;
    notes: string;
    status?: Status;
  }) => request<ActivityLog>("/activity-logs", { method: "POST", body: JSON.stringify(body) }),
  updateActivityLogStatus: (id: string, status: Status) =>
    request<ActivityLog>(`/activity-logs/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  deleteActivityLog: (id: string) => request(`/activity-logs/${id}`, { method: "DELETE" }),

  getPending: () =>
    request<{ leaves: Leave[]; activities: ActivityLog[] }>("/pending"),

  reportAbsences: () => request<AbsenceReport[]>("/reports/absences"),
  reportActivities: () => request<ActivityReport[]>("/reports/activities"),
};
