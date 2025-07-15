export * from "./genderOptions";
export * from "./userStatus";
export * from "./workStatus";
export * from "./positionOptions";
export * from "./roleOptions";
export * from "./departmentOptions";
export * from "./divisionOptions";
export * from "./leadStatus";
export * from "./channelOptions";
export * from "./interactionTypeOptions";
export * from "./serviceOptions";
export * from "./regionOptions";

// constants/index.js

/**
 * ==========================
 * QUY ƯỚC NHẬP LIỆU HỆ THỐNG
 * ==========================
 * - Mỗi nhóm là 1 constant riêng biệt, có chú thích giải thích rõ ý nghĩa và cách dùng.
 * - Dùng array/object phù hợp thực tế nghiệp vụ.
 * - Có thể import từng nhóm hoặc import default toàn bộ.
 */

// ===== Nhóm nhà cung cấp =====
/**
 * Phân loại nhà cung cấp theo mặt hàng, phục vụ quản lý kho - mua hàng.
 */
export const NHOM_NHA_CUNG_CAP = [
  "Nha phẩm",
  "Thiết bị văn phòng",
  "Thiết bị y tế",
  "Labo - Xưởng răng giả",
];

// ===== Nhóm chi nhánh làm việc =====
/**
 * Danh sách chi nhánh làm việc: gồm tên ngắn & tên dài (hiển thị).
 */
export const CHI_NHANH_LAM_VIEC = [
  { shortName: "450 MK HN", fullName: "450 Minh Khai, HN" },
  { shortName: "153 ĐN HP", fullName: "153 Đà Nẵng, HP" },
  { shortName: "143 TĐT HN", fullName: "143 Tôn Đức Thắng, HN" },
];

// ===== Nhóm bảo hành =====
/**
 * Bảo hành chia 2 nhóm: "Bảo hành chính hãng" và "Bảo hành uy tín".
 * Dùng cho module hợp đồng, chính sách khách hàng, báo giá.
 */
export const BAO_HANH = {
  "Bảo hành chính hãng": [
    "1 năm",
    "2 năm",
    "3 năm",
    "4 năm",
    "5 năm",
    "6 năm",
    "7 năm",
    "8 năm",
    "9 năm",
    "10 năm",
    "11 năm",
    "12 năm",
    "13 năm",
    "14 năm",
    "15 năm",
    "20 năm",
    "30 năm",
    "Trọn đời",
    "Không bảo hành",
  ],
  "Bảo hành uy tín": [
    "1 tháng",
    "3 tháng",
    "6 tháng",
    "1 năm",
    "2 năm",
    "3 năm",
    "4 năm",
    "5 năm",
    "6 năm",
    "7 năm",
    "8 năm",
    "9 năm",
    "10 năm",
    "15 năm",
    "20 năm",
    "25 năm",
    "30 năm",
    "Trọn đời",
    "Không bảo hành",
  ],
};

// ===== Nhóm loại giao dịch =====
/**
 * Dùng để phân biệt hình thức thanh toán, giao dịch tài chính.
 */
export const LOAI_GIAO_DICH = [
  "Tiền mặt",
  "Quẹt thẻ",
  "Quẹt thẻ VISA",
  "Chuyển khoản",
];

// ===== Nhóm vị trí răng (tên răng) =====
/**
 * Dùng cho phiếu điều trị, hợp đồng dịch vụ, kế hoạch điều trị.
 * Gồm răng sữa và răng vĩnh viễn (format: label, value).
 */
export const VI_TRI_RANG_SUA = [
  "R51",
  "R52",
  "R53",
  "R54",
  "R55",
  "R61",
  "R62",
  "R63",
  "R64",
  "R65",
  "R71",
  "R72",
  "R73",
  "R74",
  "R75",
  "R81",
  "R82",
  "R83",
  "R84",
  "R85",
];
export const VI_TRI_RANG_VINH_VIEN = [
  "R11",
  "R12",
  "R13",
  "R14",
  "R15",
  "R16",
  "R17",
  "R18",
  "R21",
  "R22",
  "R23",
  "R24",
  "R25",
  "R26",
  "R27",
  "R28",
  "R31",
  "R32",
  "R33",
  "R34",
  "R35",
  "R36",
  "R37",
  "R38",
  "R41",
  "R42",
  "R43",
  "R44",
  "R45",
  "R46",
  "R47",
  "R48",
];

// ===== Nhóm chức danh, chức vụ, phòng ban =====
/**
 * Phân quyền, quản lý nhân sự và tổ chức.
 */
export const CHUC_DANH = [
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

export const CHUC_VU = [
  "Giám đốc",
  "Trưởng phòng",
  "Nhóm trưởng",
  "Tổ trưởng",
  "Nhân viên",
  "Công nhân",
  "Quản lý",
  "Thủ kho",
];

export const PHONG_BAN = [
  "Ban Giám Đốc",
  "Phòng Kinh Doanh",
  "Phòng Chuyên Môn",
  "Phòng Back Office",
];

// ===== Nhóm ngân hàng =====
/**
 * Danh sách ngân hàng (shortName, fullName)
 * Dùng cho nhập thông tin chuyển khoản, hóa đơn, thanh toán.
 */
export const NGAN_HANG = [
  { shortName: "VPBank", fullName: "TMCP Việt Nam Thịnh Vượng" },
  { shortName: "BIDV", fullName: "TMCP Đầu tư và Phát triển Việt Nam" },
  { shortName: "Vietcombank", fullName: "TMCP Ngoại Thương Việt Nam" },
  { shortName: "VietinBank", fullName: "TMCP Công thương Việt Nam" },
  { shortName: "MBBANK", fullName: "TMCP Quân Đội" },
  { shortName: "ACB", fullName: "TMCP Á Châu" },
  { shortName: "SHB", fullName: "TMCP Sài Gòn – Hà Nội" },
  { shortName: "Techcombank", fullName: "TMCP Kỹ Thương" },
  { shortName: "Agribank", fullName: "NN&PT Nông thôn Việt Nam" },
  { shortName: "HDBank", fullName: "TMCP Phát triển Thành phố Hồ Chí Minh" },
  { shortName: "LienVietPostBank", fullName: "TMCP Bưu điện Liên Việt" },
  { shortName: "VIB", fullName: "TMCP Quốc Tế" },
  { shortName: "SeABank", fullName: "TMCP Đông Nam Á" },
  { shortName: "VBSP", fullName: "Chính sách xã hội Việt Nam" },
  { shortName: "TPBank", fullName: "TMCP Tiên Phong" },
  { shortName: "OCB", fullName: "TMCP Phương Đông" },
  { shortName: "MSB", fullName: "TMCP Hàng Hải" },
  { shortName: "Sacombank", fullName: "TMCP Sài Gòn Thương Tín" },
  { shortName: "Eximbank", fullName: "TMCP Xuất Nhập Khẩu" },
  { shortName: "SCB", fullName: "TMCP Sài Gòn" },
  { shortName: "VDB", fullName: "Phát triển Việt Nam" },
  { shortName: "Nam A Bank", fullName: "TMCP Nam Á" },
  { shortName: "ABBANK", fullName: "TMCP An Bình" },
  { shortName: "PVcomBank", fullName: "TMCP Đại Chúng Việt Nam" },
  { shortName: "Bac A Bank", fullName: "TMCP Bắc Á" },
  { shortName: "UOB", fullName: "TNHH MTV UOB Việt Nam" },
  { shortName: "Woori", fullName: "TNHH MTV Woori Việt Nam" },
  { shortName: "HSBC", fullName: "TNHH MTV HSBC Việt Nam" },
  { shortName: "SCBVL", fullName: "TNHH MTV Standard Chartered Việt Nam" },
  { shortName: "PBVN", fullName: "TNHH MTV Public Bank Việt Nam" },
  { shortName: "SHBVN", fullName: "TNHH MTV Shinhan Việt Nam" },
  { shortName: "NCB", fullName: "TMCP Quốc dân" },
  { shortName: "VietABank", fullName: "TMCP Việt Á" },
  { shortName: "Viet Capital Bank", fullName: "TMCP Bản Việt" },
  { shortName: "DongA Bank", fullName: "TMCP Đông Á" },
  { shortName: "Vietbank", fullName: "TMCP Việt Nam Thương Tín" },
  { shortName: "ANZVL", fullName: "TNHH MTV ANZ Việt Nam" },
  { shortName: "OceanBank", fullName: "TNHH MTV Đại Dương" },
  { shortName: "CIMB", fullName: "TNHH MTV CIMB Việt Nam" },
  { shortName: "Kienlongbank", fullName: "TMCP Kiên Long" },
  { shortName: "IVB", fullName: "TNHH Indovina" },
  { shortName: "BAOVIET Bank", fullName: "TMCP Bảo Việt" },
  { shortName: "SAIGONBANK", fullName: "TMCP Sài Gòn Công Thương" },
  { shortName: "Co-opBank", fullName: "Hợp tác xã Việt Nam" },
  { shortName: "GPBank", fullName: "TNHH MTV Dầu khí toàn cầu" },
  { shortName: "VRB", fullName: "Liên doanh Việt Nga" },
  { shortName: "CB", fullName: "TNHH MTV Xây dựng" },
  { shortName: "HLBVN", fullName: "TNHH MTV Hong Leong Việt Nam" },
  { shortName: "PG Bank", fullName: "TMCP Xăng dầu Petrolimex" },
];

// ===== Nhóm dịch vụ marketing =====
/**
 * Dùng cho quản lý thông tin nhu cầu/dịch vụ khách hàng quan tâm.
 */
export const DICH_VU_MARKETING = [
  "Implant",
  "Răng sứ",
  "Niềng răng",
  "Mặt lưỡi",
  "Invisalign",
  "Tẩy trắng răng",
  "Nhổ răng khôn",
  "Cười hở lợi",
];

// ===== Địa giới hành chính (tỉnh/thành -> quận/huyện/thị xã) =====
/**
 * Dùng cho các trường hợp lọc tỉnh/thành phố và các quận/huyện trực thuộc.
 * Format: { [tinhThanh]: [danh sách quận/huyện] }
 */
export const DIA_GIOI_HANH_CHINH = {
  "An Giang": [
    "Long Xuyên",
    "Châu Đốc",
    "An Phú",
    "Tân Châu",
    "Phú Tân",
    "Châu Phú",
    "Tịnh Biên",
    "Tri Tôn",
    "Châu Thành",
    "Chợ Mới",
    "Thoại Sơn",
  ],
  "Bà Rịa Vũng Tàu": [
    "Vũng Tàu",
    "Bà Rịa",
    "Châu Đức",
    "Xuyên Mộc",
    "Long Điền",
    "Đất Đỏ",
    "Tân Thành",
  ],
  "Bạc Liêu": [
    "Bạc Liêu",
    "Hồng Dân",
    "Phước Long",
    "Vĩnh Lợi",
    "Giá Rai",
    "Đông Hải",
    "Hoà Bình",
  ],
  "Bắc Giang": [
    "Bắc Giang",
    "Yên Thế",
    "Tân Yên",
    "Lạng Giang",
    "Lục Nam",
    "Lục Ngạn",
    "Sơn Động",
    "Yên Dũng",
    "Việt Yên",
    "Hiệp Hòa",
  ],
  // ... tiếp tục thêm các tỉnh/thành phố khác tương tự (bạn paste dữ liệu từ file excel hoặc script generate ra)
  "Hà Nội": [
    "Ba Đình",
    "Ba Vì",
    "Bắc Từ Liêm",
    "Cầu Giấy",
    "Chương Mỹ",
    "Đan Phượng",
    "Đông Anh",
    "Đống Đa",
    "Gia Lâm",
    "Hà Đông",
    "Hai Bà Trưng",
    "Hoài Đức",
    "Hoàn Kiếm",
    "Hoàng Mai",
    "Long Biên",
    "Mê Linh",
    "Mỹ Đức",
    "Nam Từ Liêm",
    "Phú Xuyên",
    "Phúc Thọ",
    "Quốc Oai",
    "Sóc Sơn",
    "Sơn Tây",
    "Tây Hồ",
    "Thạch Thất",
    "Thanh Oai",
    "Thanh Trì",
    "Thanh Xuân",
    "Thường Tín",
    "Ứng Hòa",
  ],
  "Hải Phòng": [
    "Hồng Bàng",
    "Ngô Quyền",
    "Lê Chân",
    "Hải An",
    "Kiến An",
    "Đồ Sơn",
    "Dương Kinh",
    "Thuỷ Nguyên",
    "An Dương",
    "An Lão",
    "Kiến Thuỵ",
    "Tiên Lãng",
    "Vĩnh Bảo",
    "Cát Hải",
  ],
  // ... bạn bổ sung đầy đủ tỉnh thành còn lại tương tự
};

// ===== Export default tất cả nhóm (nếu muốn import chung) =====
export default {
  NHOM_NHA_CUNG_CAP,
  CHI_NHANH_LAM_VIEC,
  BAO_HANH,
  LOAI_GIAO_DICH,
  VI_TRI_RANG,
  CHUC_DANH,
  CHUC_VU,
  PHONG_BAN,
  NGAN_HANG,
  DICH_VU_MARKETING,
  DIA_GIOI_HANH_CHINH,
};
