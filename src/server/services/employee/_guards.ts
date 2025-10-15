import type { UserCore } from "@/shared/types/user";
import { ERR } from "@/server/services/errors";

// Chuyển các hàm kiểm tra quyền sang đây
export function isAdmin(user: UserCore | null | undefined) {
  return user?.role?.toLowerCase() === "admin";
}

export function ensureSelfOrAdmin(user: UserCore | null | undefined, employeeId: string) {
  if (!user) throw ERR.UNAUTHORIZED();
  if (isAdmin(user)) return;
  if (user.employeeId === employeeId) return;
  throw ERR.FORBIDDEN("You are not allowed to access this record.");
}
