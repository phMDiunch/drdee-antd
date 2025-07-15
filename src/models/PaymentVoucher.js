// models/PaymentVoucher.js
const mongoose = require("mongoose");

const paymentVoucherSchema = new mongoose.Schema(
  {
    soPhieuThu: {
      type: String,
      unique: true,
      // Sẽ được tạo tự động bằng hook pre-save
    },
    khachHang: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    ngayThu: {
      type: Date,
      required: true,
      default: Date.now,
    },
    trangThaiPhieu: {
      type: String,
      enum: ["Đã thu", "Đã hủy", "Nháp"],
      default: "Đã thu",
    },
    ghiChu: { type: String },
    anhGiaoDich: { type: String }, // Link ảnh hoặc base64
    chuKyKH: { type: String },

    nguoiTao: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    nguoiCapNhat: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  },
  {
    timestamps: { createdAt: "ngayTao", updatedAt: "ngayCapNhat" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Hook để tự động tạo soPhieuThu
paymentVoucherSchema.pre("save", async function (next) {
  if (this.isNew) {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const prefix = `PT${year}${month}-`; // PT = Phiếu Thu

    const lastVoucher = await this.constructor
      .findOne({ soPhieuThu: { $regex: `^${prefix}` } })
      .sort({ soPhieuThu: -1 });

    let sequenceNumber = 1;
    if (lastVoucher) {
      sequenceNumber = parseInt(lastVoucher.soPhieuThu.split("-")[1]) + 1;
    }
    this.soPhieuThu = `${prefix}${sequenceNumber.toString().padStart(3, "0")}`;
  }
  next();
});

/**
 * Tính toán tổng số tiền của phiếu thu này dựa trên các chi tiết của nó.
 * @returns {Promise<number>} Tổng số tiền đã thu.
 */
paymentVoucherSchema.methods.calculateTotal = async function () {
  // `this` ở đây chính là document của một phiếu thu cụ thể
  const voucherId = this._id;

  // 1. Tìm tất cả các chi tiết thuộc về phiếu thu này
  const details = await mongoose.model("PaymentVoucherDetail").find({
    phieuThu: voucherId,
  });

  // 2. Tính tổng tiền từ các chi tiết
  const totalAmount = details.reduce(
    (sum, detail) => sum + detail.soTienThu,
    0
  );

  return totalAmount;
};

// Virtual để link đến các chi tiết của nó
paymentVoucherSchema.virtual("chiTiet", {
  ref: "PaymentVoucherDetail",
  localField: "_id",
  foreignField: "phieuThu",
});

module.exports = mongoose.model("PaymentVoucher", paymentVoucherSchema);
