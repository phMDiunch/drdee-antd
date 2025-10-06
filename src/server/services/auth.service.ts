// src/server/services/auth.service.ts

import { createClient } from "@/services/supabase/server";
import type { UserCore } from "@/shared/types/user";
import { ERR } from "./errors";

// Nếu sau này dùng Prisma để đọc Employee, bạn mở comment ở dưới
// import { prisma } from "@/server/prisma"; // đảm bảo đường dẫn prisma client của bạn

/**
 * Lấy thông tin user hiện tại bằng SSR (dùng cho (private)/layout.tsx).
 * Hiện tại: trả từ Supabase Auth + user_metadata (nếu có).
 * Tương lai: merge thêm từ bảng Employee (fullName/role/avatarUrl/clinicId).
 */
export async function getSessionUser(): Promise<UserCore | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const u = data.user;
  if (!u) return null;

  // Lấy sơ bộ từ Supabase
  const meta = (u.user_metadata || {}) as Record<string, any>;
  const user: UserCore = {
    id: u.id,
    email: u.email,
    fullName: meta.fullName ?? null,
    role: meta.role ?? null,
    avatarUrl: meta.avatarUrl ?? null,
    employeeId: null,
    clinicId: null,
  };

  // ====== (Nâng cấp SAU khi có bảng Employee) ======
  // - Khuyến nghị có cột `authUserId` trong bảng Employee để join chắc chắn.
  // - Nếu chưa có, có thể fallback join theo email (ít an toàn hơn).
  //
  // try {
  //   const employee = await prisma.employee.findFirst({
  //     where: { authUserId: u.id },  // hoặc { email: u.email ?? undefined }
  //     select: { id: true, fullName: true, role: true, avatarUrl: true, clinicId: true },
  //   });
  //   if (employee) {
  //     user = {
  //       ...user,
  //       employeeId: employee.id,
  //       fullName: employee.fullName ?? user.fullName,
  //       role: employee.role ?? user.role,
  //       avatarUrl: employee.avatarUrl ?? user.avatarUrl,
  //       clinicId: employee.clinicId ?? user.clinicId,
  //     };
  //   }
  // } catch {
  //   // tránh làm vỡ render nếu DB lỗi tạm thời
  // }

  return user;
}

export function requireAdmin(user: UserCore | null | undefined) {
  if (!user) throw ERR.UNAUTHORIZED("Bạn chưa đăng nhập.");
  console.log("Current user:", user);
  if (
    user.role?.toString().toLocaleLowerCase() == "admin" ||
    user.email?.toString().toLowerCase() == "dr.phamminhduc@gmail.com"
  )
    return true;
  throw ERR.FORBIDDEN("Chỉ admin được phép thực hiện thao tác này.");
}
