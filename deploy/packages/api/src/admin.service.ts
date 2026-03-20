import { getAdminStats } from "@evidex/database";

export async function fetchAdminDashboardStats() {
  return getAdminStats();
}
