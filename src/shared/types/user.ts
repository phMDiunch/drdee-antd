// src/shared/types/user.ts

export type UserCore = {
  id: string;
  email: string | null;

  // Có thể có từ Supabase user_metadata hoặc từ bảng Employee
  fullName?: string | null;
  role?: "admin" | "manager" | "employee" | string | null;
  avatarUrl?: string | null;

  // Dành cho khi đã có bảng Employee/Clinic
  employeeId?: string | null;
  clinicId?: string | null;
  jobTitle?: string | null; // Chức danh (để check sale online)

  // Clinic object (for payment QR, etc.)
  clinic?: {
    id: string;
    clinicCode: string;
    name: string;
    shortName: string | null;
    companyBankName: string | null;
    companyBankAccountNo: string | null;
    companyBankAccountName: string | null;
    personalBankName: string | null;
    personalBankAccountNo: string | null;
    personalBankAccountName: string | null;
  } | null;
};
