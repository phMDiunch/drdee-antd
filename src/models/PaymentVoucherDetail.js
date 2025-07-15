// models/PaymentVoucherDetail.js
const mongoose = require("mongoose");

const paymentVoucherDetailSchema = new mongoose.Schema(
  {
    phieuThu: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentVoucher",
      required: true,
      index: true,
    },
    khachHang: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    lichHen: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" }, // Tùy chọn, không bắt buộc
    dichVuTuVan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConsultedService",
      required: true,
    },
    soTienThu: {
      type: Number,
      required: true,
      min: 0,
    },
    noiDungThu: {
      type: String,
      enum: ["Đặt cọc", "Thanh toán dịch vụ", "Hoàn tất", "Khác"],
      default: "Thanh toán dịch vụ",
    },
    loaiGiaoDich: {
      type: String,
      enum: ["Tiền mặt", "Chuyển khoản", "Quẹt thẻ", "Visa/Mastercard"],
      required: true,
    },

    // Sao chép trạng thái từ phiếu thu cha để dễ truy vấn
    trangThaiPhieu: { type: String, required: true },

    nguoiTao: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    nguoiCapNhat: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  },
  {
    timestamps: { createdAt: "ngayTao", updatedAt: "ngayCapNhat" },
  }
);

module.exports = mongoose.model(
  "PaymentVoucherDetail",
  paymentVoucherDetailSchema
);
