// User Constants
export const GENDER_OPTIONS = [
  { value: "Nam", label: "Nam" },
  { value: "Nữ", label: "Nữ" },
  { value: "Khác", label: "Khác" },
];

export const ACCOUNT_STATUS = {
  PENDING: "pending",
  APPROVE: "approve",
  REJECT: "reject",
};

export const ACCOUNT_STATUS_OPTIONS = [
  {
    value: ACCOUNT_STATUS.PENDING,
    label: "Chờ duyệt",
    color: "orange",
    colorHex: "#fa8c16",
  },
  {
    value: ACCOUNT_STATUS.APPROVE,
    label: "Đã duyệt",
    color: "green",
    colorHex: "#52c41a",
  },
  {
    value: ACCOUNT_STATUS.REJECT,
    label: "Từ chối",
    color: "red",
    colorHex: "#ff4d4f",
  },
];

export const WORK_STATUS = {
  PROBATION: "nhân viên thử việc",
  OFFICIAL: "nhân viên chính thức",
  RESIGNED: "đã nghỉ",
};

export const WORK_STATUS_OPTIONS = [
  {
    value: WORK_STATUS.PROBATION,
    label: "Nhân viên thử việc",
    shortLabel: "Thử việc",
    color: "orange",
    colorHex: "#fa8c16",
  },
  {
    value: WORK_STATUS.OFFICIAL,
    label: "Nhân viên chính thức",
    shortLabel: "Chính thức",
    color: "green",
    colorHex: "#52c41a",
  },
  {
    value: WORK_STATUS.RESIGNED,
    label: "Đã nghỉ việc",
    shortLabel: "Đã nghỉ",
    color: "red",
    colorHex: "#ff4d4f",
  },
];

// Organization Constants
export const POSITION_OPTIONS = [
  "Bác sĩ",
  "Lễ tân",
  "Điều dưỡng",
  "Kế toán",
  "Tạp vụ",
  "Digital",
  "Content",
  "Thiết kế",
  "Lead MKT",
  "Quay dựng",
  "HCNS",
  "Sale Onl",
  "Sale Off",
  "Bảo vệ",
  "Tuyển dụng",
];

export const ROLE_OPTIONS = [
  "Giám đốc",
  "Trưởng phòng",
  "Nhóm trưởng",
  "Tổ trưởng",
  "Nhân viên",
  "Công nhân",
  "Quản lý",
  "Thủ kho",
];

export const DEPARTMENT_OPTIONS = [
  "Ban Giám Đốc",
  "Phòng Kinh Doanh",
  "Phòng Chuyên Môn",
  "Phòng Back Office",
];

export const DIVISION_OPTIONS = ["Bác sĩ", "Điều dưỡng", "Quầy", "Sale"];

// Helper functions
export const getAccountStatusConfig = (status) => {
  return (
    ACCOUNT_STATUS_OPTIONS.find((option) => option.value === status) || {
      color: "default",
      label: status,
      colorHex: "#d9d9d9",
    }
  );
};

export const getWorkStatusConfig = (status) => {
  return (
    WORK_STATUS_OPTIONS.find((option) => option.value === status) || {
      color: "default",
      label: status,
      shortLabel: status,
      colorHex: "#d9d9d9",
    }
  );
};

// Filter options for Select components
export const ACCOUNT_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  ...ACCOUNT_STATUS_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  })),
];

export const WORK_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  ...WORK_STATUS_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  })),
];

// Trạng thái của lead
export const LEAD_STATUS_OPTIONS = [
  { label: "Mới", value: "new" },
  { label: "Đang chăm sóc", value: "in_progress" },
  { label: "Hẹn lịch", value: "appointment" },
  { label: "Đã đến", value: "visited" },
  { label: "Chưa liên hệ được", value: "unreachable" },
  { label: "Từ chối", value: "rejected" },
  { label: "Không tiềm năng", value: "not_potential" },
  // Thêm trạng thái khác nếu cần
];

// Danh sách nguồn khách
export const CHANNEL_OPTIONS = [
  { label: "Facebook", value: "facebook" },
  { label: "Messenger", value: "messenger" },
  { label: "Zalo", value: "zalo" },
  { label: "TikTok", value: "tiktok" },
  { label: "Hotline", value: "hotline" },
  { label: "Instagram", value: "instagram" },
  { label: "Website", value: "website" },
  // Thêm các kênh khác nếu cần
];

// Các trường hợp chăm sóc/loại tương tác (nếu cần)
export const INTERACTION_TYPE_OPTIONS = [
  { label: "Gọi điện", value: "call" },
  { label: "Nhắn tin", value: "message" },
  { label: "Đặt lịch", value: "appointment" },
  { label: "Chăm sóc sau", value: "followup" },
  // Thêm nếu cần
];

// Ví dụ, đưa vào constants/serviceOptions.js
export const SERVICE_OPTIONS = [
  { label: "Niềng răng", value: "nieng_rang" },
  { label: "Tẩy trắng", value: "tay_trang" },
  { label: "Trồng răng Implant", value: "implant" },
  { label: "Nhổ răng khôn", value: "nho_rang_khon" },
  // ... Bổ sung thêm
];

export const REGION_OPTIONS = [
  { label: "Hải Phòng", value: "haiphong" },
  { label: "Hà Nội", value: "hanoi" },
  { label: "Online", value: "online" },
  // ... Bổ sung thêm
];
