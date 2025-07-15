// models/TreatmentDetail.js
const mongoose = require("mongoose");

const treatmentDetailSchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },
    dichVuTuVan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConsultedService", // Liên kết đến dịch vụ cụ thể đã được chốt
      required: true,
    },

    // ---- THÔNG TIN LÂM SÀNG ----
    ngayDieuTri: {
      type: Date,
      required: true,
      default: Date.now,
    },
    chiTietDieuTri: {
      type: String,
      required: [true, "Nội dung điều trị là bắt buộc"],
      trim: true,
    },
    noiDungDieuTriTiepTheo: {
      type: String, // Kế hoạch cho buổi hẹn tiếp theo
      trim: true,
    },
    trangThaiDieuTri: {
      type: String,
      enum: ["Đang tiến hành", "Hoàn tất bước", "Hoàn tất dịch vụ"],
      required: true,
    },
    // Không cần trường `% điều trị` vì nó không trực quan và khó đo lường,
    // `trangThaiDieuTri` và `noiDungDieuTriTiepTheo` đã đủ để thể hiện tiến trình.

    // ---- HÌNH ẢNH & PHIM ----
    anhChup: [{ type: String }], // Mảng chứa các URL của hình ảnh
    xQuang: [{ type: String }], // Mảng chứa các URL của phim X-quang

    // ---- NHÂN SỰ THỰC HIỆN ----
    bacSiDieuTri: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    troThu1: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    troThu2: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },

    // ---- METADATA ----
    nguoiTao: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    nguoiCapNhat: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  },
  {
    timestamps: { createdAt: "ngayTao", updatedAt: "ngayCapNhat" },
  }
);

module.exports = mongoose.model("TreatmentDetail", treatmentDetailSchema);
