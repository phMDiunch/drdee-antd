// src/server/services/auth.service.ts
import { createClient } from "@/services/supabase/server";
import type { UserCore } from "@/shared/types/user";
import { ERR } from "./errors";
import { prisma } from "@/services/prisma/prisma"; // Import prisma client

/**
 * Lấy thông tin user hiện tại bằng SSR.
 * Sửa lỗi: Bổ sung logic lấy thông tin từ bảng Employee để làm giàu session.
 */
export async function getSessionUser(): Promise<UserCore | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  // Khởi tạo thông tin user cơ bản từ Supabase Auth
  let user: UserCore = {
    id: authUser.id, // Đây là Supabase Auth user ID (uid)
    email: authUser.email ?? null,
    employeeId: null, // Sẽ được lấy từ bảng Employee
    role: (authUser.user_metadata?.role as string) ?? null,
    fullName: (authUser.user_metadata?.fullName as string) ?? null,
    avatarUrl: (authUser.user_metadata?.avatarUrl as string) ?? null,
    clinicId: null,
  };

  const metadata = authUser.user_metadata as Record<string, unknown> | null;
  const metadataEmployeeId =
    metadata && typeof metadata["employeeId"] === "string"
      ? (metadata["employeeId"] as string)
      : null;

  if (metadataEmployeeId) {
    user.employeeId = metadataEmployeeId;
  }

  try {
    // Tìm bản ghi Employee tương ứng trong DB bằng `uid`
    const employee = await prisma.employee.findUnique({
      where: { uid: authUser.id },
      select: {
        id: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        clinicId: true,
      },
    });

    // Nếu tìm thấy, hợp nhất thông tin vào đối tượng user
    if (employee) {
      user = {
        ...user,
        employeeId: employee.id, // QUAN TRỌNG: Lấy ID từ bảng Employee
        role: employee.role ?? user.role,
        fullName: employee.fullName ?? user.fullName,
        avatarUrl: employee.avatarUrl ?? user.avatarUrl,
        clinicId: employee.clinicId ?? user.clinicId,
      };
    }
  } catch {
    // Bỏ qua lỗi để không làm sập trang nếu DB có vấn đề
  }

  return user;
}

/**
 * Yêu cầu quyền Admin.
 * Sửa lỗi: Bổ sung kiểm tra employeeId phải tồn tại.
 */
export function requireAdmin(user: UserCore | null | undefined) {
  if (!user) throw ERR.UNAUTHORIZED("Bạn chưa đăng nhập.");

  const isAdminByRole = user.role?.toString().toLowerCase() === "admin";
  const isAdminByEmail =
    user.email?.toString().toLowerCase() === "dr.phamminhduc@gmail.com";

  if (isAdminByRole || isAdminByEmail) {
    // Admin phải được liên kết với một nhân viên để thực hiện các thao tác ghi dữ liệu
    if (!user.employeeId) {
      throw ERR.FORBIDDEN(
        "Tài khoản admin chưa được liên kết với một bản ghi nhân viên."
      );
    }
    return true;
  }

  throw ERR.FORBIDDEN("Chỉ admin được phép thực hiện thao tác này.");
}

/**
 * Yêu cầu quyền Employee (admin + employee).
 * Kiểm tra employeeId phải tồn tại.
 */
export function requireEmployee(user: UserCore | null | undefined) {
  if (!user) throw ERR.UNAUTHORIZED("Bạn chưa đăng nhập.");

  if (!user.employeeId) {
    throw ERR.FORBIDDEN(
      "Tài khoản chưa được liên kết với một bản ghi nhân viên."
    );
  }

  return true;
}
