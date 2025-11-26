// src/features/customers/constants.ts

export const CUSTOMER_ENDPOINTS = {
  ROOT: "/api/v1/customers",
  BY_ID: (id: string) => `/api/v1/customers/${id}`,
  DAILY: "/api/v1/customers/daily",
  SEARCH: "/api/v1/customers/search",
} as const;

export const CUSTOMER_QUERY_KEYS = {
  list: (filters?: Record<string, unknown>) => ["customers", filters] as const,
  daily: (date?: string, clinicId?: string) =>
    ["customers", "daily", { date, clinicId }] as const,
  byId: (id: string) => ["customer", id] as const,
  search: (q: string, options?: Record<string, unknown>) =>
    ["customers", "search", q, options] as const,
} as const;

export const CUSTOMER_MESSAGES = {
  CREATE_SUCCESS: "Tạo khách hàng thành công",
  UPDATE_SUCCESS: "Cập nhật khách hàng thành công",
  DELETE_SUCCESS: "Xóa khách hàng thành công",
  LOOKUP_PHONE_NOT_FOUND: "Không tìm thấy khách hàng với số điện thoại này",
  PHONE_ALREADY_EXISTS: "Số điện thoại đã tồn tại",
  EMAIL_ALREADY_EXISTS: "Email đã tồn tại",
} as const;

/**
 * Định nghĩa các loại hành vi cho ô "Ghi chú nguồn" trên form khách hàng.
 * - 'none': Ẩn ô ghi chú.
 * - 'text_input_optional': Ô nhập liệu dạng văn bản, không bắt buộc.
 * - 'text_input_required': Ô nhập liệu dạng văn bản, bắt buộc nhập.
 * - 'employee_search': Ô tìm kiếm và chọn từ danh sách nhân viên.
 * - 'customer_search': Ô tìm kiếm và chọn từ danh sách khách hàng.
 */

export type NoteType =
  | "none"
  | "text_input_optional"
  | "text_input_required"
  | "employee_search"
  | "customer_search";

export interface CustomerSource {
  value: string; // Giá trị lưu vào database
  label: string; // Nhãn hiển thị cho người dùng
  noteType: NoteType; // "Chỉ thị" cho UI
}

/** DANH SÁCH NGUỒN KHÁCH HÀNG theo requirements */
export const CUSTOMER_SOURCES: CustomerSource[] = [
  // Nhóm Giới thiệu
  {
    value: "employee_referral",
    label: "Nhân viên giới thiệu",
    noteType: "employee_search",
  },
  {
    value: "customer_referral",
    label: "Khách cũ giới thiệu",
    noteType: "customer_search",
  },
  {
    value: "acquaintance_referral",
    label: "Người quen giới thiệu",
    noteType: "text_input_optional",
  },

  // Nhóm Online
  { value: "facebook", label: "Facebook", noteType: "text_input_optional" },
  { value: "zalo", label: "Zalo", noteType: "text_input_optional" },
  { value: "tiktok", label: "Tiktok", noteType: "text_input_optional" },
  { value: "youtube", label: "Youtube", noteType: "text_input_optional" },
  { value: "google_search", label: "Tìm kiếm Google", noteType: "none" },
  { value: "google_maps", label: "Google Maps", noteType: "none" },
  { value: "website", label: "Website Dr Dee", noteType: "none" },

  // Nhóm Offline & Sự kiện
  {
    value: "voucher",
    label: "Voucher / Tờ rơi",
    noteType: "text_input_optional",
  },
  {
    value: "event",
    label: "Sự kiện / Hội thảo",
    noteType: "text_input_optional",
  },
  { value: "walk_in", label: "Khách vãng lai", noteType: "none" },
  { value: "hismile", label: "Hismile", noteType: "text_input_optional" },

  // Nguồn khác
  { value: "other", label: "Nguồn khác", noteType: "text_input_required" },
];

/** DANH SÁCH CÁC DỊCH VỤ QUAN TÂM theo requirements */
export const SERVICES_OF_INTEREST = [
  { label: "Implant", value: "implant" },
  { label: "Răng sứ", value: "rang_su" },
  { label: "Niềng răng", value: "nieng_rang" },
  { label: "Mặt lưỡi", value: "mat_luoi" },
  { label: "Invisalign", value: "invisalign" },
  { label: "Tẩy trắng răng", value: "tay_trang_rang" },
  { label: "Nhổ răng khôn", value: "nho_rang_khon" },
  { label: "Cười hở lợi", value: "cuoi_ho_loi" },
  { label: "Tổng quát", value: "tong_quat" },
];

/** Primary Contact Role options - Vai trò của người liên hệ chính */
export const PRIMARY_CONTACT_ROLES = [
  { label: "Bố", value: "bo" },
  { label: "Mẹ", value: "me" },
  { label: "Con", value: "con" },
  { label: "Vợ", value: "vo" },
  { label: "Chồng", value: "chong" },
  { label: "Anh/Em trai", value: "anh_em_trai" },
  { label: "Chị/Em gái", value: "chi_em_gai" },
  { label: "Ông", value: "ong" },
  { label: "Bà", value: "ba" },
  { label: "Cháu", value: "chau" },
  { label: "Bạn", value: "ban" },
];

/** Gender options */
export const GENDER_OPTIONS = [
  { label: "Nam", value: "male" },
  { label: "Nữ", value: "female" },
];

export const OCCUPATIONS = [
  // Nhóm văn phòng/công sở
  "Nhân viên văn phòng",
  "Kế toán",
  "Nhân viên hành chính",
  "Thư ký",
  "Chuyên viên marketing",
  "Chuyên viên kinh doanh",
  "Lập trình viên",
  "Kỹ sư phần mềm",
  "Kỹ sư xây dựng",
  "Kiến trúc sư",
  "Nhân sự (HR)",
  "Thiết kế đồ họa",
  "Biên tập viên",
  "Phóng viên",
  "Phiên dịch viên/Biên dịch viên",
  "Trợ lý",
  "Giám đốc/Trưởng phòng",
  "Chuyên gia tài chính",
  "Nhân viên ngân hàng",

  // Nhóm dịch vụ/thương mại
  "Bán hàng",
  "Nhân viên siêu thị/cửa hàng",
  "Nhân viên thu ngân",
  "Nhân viên phục vụ (nhà hàng, quán ăn)",
  "Đầu bếp",
  "Quản lý nhà hàng/khách sạn",
  "Hướng dẫn viên du lịch",
  "Lễ tân",
  "Tài xế/Lái xe",
  "Nhân viên giao hàng",
  "Chủ cửa hàng/doanh nghiệp nhỏ",
  "Cắt tóc/Làm đẹp",
  "Thợ may",
  "Thợ sửa chữa (điện, nước, xe máy...)",
  "Nhân viên pha chế",
  "Môi giới bất động sản",
  "Môi giới chứng khoán",

  // Nhóm giáo dục/y tế
  "Giáo viên",
  "Giảng viên",
  "Học sinh/Sinh viên", // Mặc dù là học, nhưng thường được tính như một nhóm khách hàng
  "Bác sĩ",
  "Y tá/Điều dưỡng",
  "Dược sĩ",
  "Kỹ thuật viên y tế",

  // Nhóm sản xuất/công nghiệp
  "Công nhân",
  "Kỹ thuật viên sản xuất",
  "Giám sát sản xuất",
  "Nông dân",
  "Ngư dân",
  "Thủ công mỹ nghệ",

  // Nhóm tự do/khác
  "Freelancer",
  "Nội trợ",
  "Người về hưu",
  "Nghệ sĩ (ca sĩ, nhạc sĩ, họa sĩ...)",
  "Vận động viên",
  "Văn sĩ/Nhà thơ",
  "Youtuber/Streamer/Influencer",
  "Chủ hộ kinh doanh cá thể",
  "Lao động phổ thông",
  "Bảo vệ",
  "Thợ điện",
  "Thợ hàn",
  "Thợ mộc",
  "Thợ hồ",
  "Tài xế công nghệ (Grab, Gojek...)",
];
