// models/DentalService.js
const mongoose = require("mongoose");

const dentalServiceSchema = new mongoose.Schema(
  {
    // ---- THÔNG TIN CƠ BẢN ----
    tenDichVuNhaKhoa: {
      type: String,
      required: [true, "Tên dịch vụ là bắt buộc"],
      unique: true,
      trim: true,
    },
    moTaDichVu: {
      type: String,
      trim: true,
    },

    // ---- THÔNG TIN PHÂN LOẠI ----
    nhomDichVu: {
      type: String,
      // Gợi ý: Có thể dùng `ref` đến collection `ServiceGroup` để quản lý chuyên nghiệp hơn
    },
    nhomDichVuMKT: {
      type: String, // Nhóm dịch vụ dùng cho mục đích marketing
    },
    boMon: {
      type: String, // Ví dụ: Phục hình, Chỉnh nha, Tổng quát
    },

    // ---- THÔNG TIN GIÁ & ĐƠN VỊ ----
    donViTinh: {
      type: String,
      enum: ["Răng", "Hàm", "Lần", "Gói", "Trọn gói", "Ca"], // Giới hạn các giá trị hợp lệ
      required: true,
    },
    donGia: {
      type: Number,
      required: [true, "Đơn giá là bắt buộc"],
      default: 0,
    },

    // ---- THÔNG TIN CHI TIẾT ----
    baoHanhChinhHang: { type: String }, // Ví dụ: "1 năm", "10 năm", "Trọn đời"
    baoHanhUyTin: { type: String }, // Bảo hành thêm từ phòng khám
    xuatXu: { type: String }, // Ví dụ: "Đức", "Mỹ", "Hàn Quốc"
    soPhutDieuTriTB: { type: Number }, // Số phút điều trị trung bình
    soBuoiDieuTriTB: { type: Number }, // Số buổi điều trị trung bình

    // ---- METADATA ----
    nguoiTao: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    nguoiCapNhat: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  },
  {
    timestamps: { createdAt: "ngayTao", updatedAt: "ngayCapNhat" },
  }
);

module.exports = mongoose.model("DentalService", dentalServiceSchema);
