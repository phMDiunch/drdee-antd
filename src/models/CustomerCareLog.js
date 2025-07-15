// models/CustomerCareLog.js
const mongoose = require("mongoose");

const customerCareLogSchema = new mongoose.Schema(
  {
    // ---- THÔNG TIN LIÊN KẾT ----
    khachHang: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    lichHen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true, // Liên kết đến buổi hẹn có các dịch vụ được điều trị
      index: true,
    },

    // ---- THÔNG TIN TỔNG HỢP TỪ BUỔI ĐIỀU TRỊ ----
    // Các trường này được sao chép/tổng hợp tại thời điểm tạo phiếu chăm sóc
    // để dễ dàng xem lại mà không cần truy vấn phức tạp.
    ngayDieuTri: {
      type: Date,
      required: true,
    },
    tenDichVuDieuTri: {
      type: String, // Ví dụ: "Nhổ răng R18, Cạo vôi răng"
      required: true,
    },
    bacSiDieuTri: [
      {
        type: mongoose.Schema.Types.ObjectId, // Có thể có nhiều bác sĩ trong 1 buổi
        ref: "Employee",
      },
    ],

    // ---- NỘI DUNG CHĂM SÓC ----
    ngayChamSoc: {
      type: Date,
      required: true,
      default: Date.now,
    },
    noiDungChamSoc: {
      type: String,
      required: [true, "Nội dung chăm sóc là bắt buộc"],
      trim: true,
    },
    trangThaiChamSoc: {
      type: String,
      enum: ["Bệnh nhân đã ổn", "Cần chăm sóc thêm", "Chưa liên lạc được"],
      required: true,
    },
    loaiChamSoc: {
      type: String,
      enum: ["Gọi điện", "Nhắn tin", "Zalo", "Khác"],
      required: true,
    },

    // ---- METADATA ----
    nguoiTao: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" }, // Nhân viên chăm sóc
    nguoiCapNhat: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  },
  {
    timestamps: { createdAt: "ngayTao", updatedAt: "ngayCapNhat" },
  }
);

module.exports = mongoose.model("CustomerCareLog", customerCareLogSchema);
