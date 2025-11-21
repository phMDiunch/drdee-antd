// src/shared/constants/master-data.ts
// ⚠️ Không dùng Prisma Enum - dùng String để linh hoạt thêm type mới không cần migration

export const MASTER_DATA_TYPES = {
  // === Inventory Module ===
  SUPPLIER_GROUP: "SUPPLIER_GROUP", // Nhóm nhà cung cấp
  DEPARTMENT: "DEPARTMENT", // Bộ môn (Nội nha, Phục hình, Nha chu, Implant...)
  MATERIAL_CATEGORY: "MATERIAL_CATEGORY", // Nhóm & Phân nhóm vật tư (có cấu trúc cây)
  UNIT: "UNIT", // Đơn vị tính (Cái, Hộp, Chai, Kg...) - Admin có thể thêm mới

  // === Future Modules (thêm trực tiếp vào constants, không cần migration) ===
  // CUSTOMER_SOURCE: "CUSTOMER_SOURCE",   // Nguồn khách hàng
  // TREATMENT_CATEGORY: "TREATMENT_CATEGORY", // Nhóm điều trị
  // PAYMENT_METHOD: "PAYMENT_METHOD",     // Phương thức thanh toán tùy chỉnh
} as const;

export type MasterDataType =
  (typeof MASTER_DATA_TYPES)[keyof typeof MASTER_DATA_TYPES];

// Helper để lấy danh sách types hiện tại
export const MASTER_DATA_TYPE_LIST = Object.values(MASTER_DATA_TYPES);
