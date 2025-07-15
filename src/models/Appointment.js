// models/Appointment.js
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    // ---- THÔNG TIN CƠ BẢN ----
    khachHang: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer", // Liên kết đến model Khách Hàng
      required: true,
      index: true, // Đánh index để tăng tốc độ truy vấn theo khách hàng
    },
    ngayHen: {
      type: Date,
      required: [true, "Ngày hẹn là bắt buộc"],
    },
    gioHen: {
      type: String, // Lưu dưới dạng "HH:mm", ví dụ: "09:30"
      trim: true,
    },
    noiDungHen: {
      type: String,
      trim: true,
    },

    // ---- THÔNG TIN CHECK-IN/CHECK-OUT ----
    checkIn: { type: Date }, // Lưu thời gian khách hàng đến, null nếu chưa đến
    checkOut: { type: Date }, // Lưu thời gian khách hàng về

    // ---- THÔNG TIN PHÂN CÔNG ----
    bacSi1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee", // Liên kết đến model Nhân Viên
    },
    bacSi2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    chiNhanh: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch", // Liên kết đến model Chi Nhánh
    },

    // ---- METADATA ----
    nguoiTao: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    nguoiCapNhat: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  },
  {
    timestamps: { createdAt: "ngayTao", updatedAt: "ngayCapNhat" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- CÁC TRƯỜNG DỮ LIỆU ẢO (VIRTUALS) ---

// 1. Tự động tính toán "YYYY/MM" từ `ngayHen`
appointmentSchema.virtual("namThangHen").get(function () {
  if (!this.ngayHen) return null;

  const date = new Date(this.ngayHen);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${year}/${month}`;
});

// 2. Tự động xác định trạng thái lịch hẹn dựa vào việc có `checkIn` hay không
appointmentSchema.virtual("trangThaiLich").get(function () {
  return this.checkIn ? "Đã đến" : "Chưa đến";
});

module.exports = mongoose.model("Appointment", appointmentSchema);
