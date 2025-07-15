// models/ConsultedService.js
const mongoose = require("mongoose");

const consultedServiceSchema = new mongoose.Schema(
  {
    // ---- LIÊN KẾT DỮ LIỆU ----
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
    },
    dichVuNhaKhoa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DentalService",
      required: true,
    },

    // ---- DỮ LIỆU SAO CHÉP (DENORMALIZED) ĐỂ GIỮ LỊCH SỬ ----
    // Các trường này được sao chép từ các collection khác tại thời điểm tư vấn
    // để đảm bảo dữ liệu không bị thay đổi nếu dịch vụ gốc hoặc khách hàng gốc có sự thay đổi.
    tenDichVu: { type: String, required: true },
    nhomDichVu: { type: String },
    hoTenKH: { type: String },
    donVi: { type: String },
    giaNiemYet: { type: Number, default: 0 },
    baoHanhChinhHang: { type: String },
    baoHanhUyTin: { type: String },

    // ---- THÔNG TIN ĐIỀU TRỊ CHI TIẾT ----
    viTriRangSua: [{ type: String, trim: true }], // Mảng chứa tên răng, vd: ["R84", "R85"]
    viTriRangVinhVien: [{ type: String, trim: true }], // vd: ["18", "28"]
    tinhTrangCuThe: { type: String }, // Ghi chú của bác sĩ về tình trạng

    // ---- THÔNG TIN TÀI CHÍNH ----
    giaUuDai: { type: Number }, // Giá sau khi đã áp dụng ưu đãi
    thanhTien: { type: Number, required: true, default: 0 },

    // ---- TRẠNG THÁI & NGÀY QUAN TRỌNG ----
    ngayTuVan: { type: Date, default: Date.now },
    ngayChotDichVu: { type: Date }, // Chỉ có khi khách hàng đồng ý
    trangThaiDichVu: {
      type: String,
      enum: ["Đã chốt", "Chưa chốt"],
      default: "Chưa chốt",
    },
    trangThaiDieuTri: {
      type: String,
      enum: ["Chưa điều trị", "Đang điều trị", "Đã hoàn thành"],
      default: "Chưa điều trị",
    },
    chuKyKH: { type: String }, // Lưu chữ ký dạng Base64

    // ---- THÔNG TIN PHÂN CÔNG ----
    saleTuVan: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    bacSiTuVan: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    bacSiDieuTri: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },

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

// 1. Tự động tính toán số lượng
consultedServiceSchema.virtual("soLuong").get(function () {
  const soRangSua = this.viTriRangSua?.length || 0;
  const soRangVinhVien = this.viTriRangVinhVien?.length || 0;
  // Nếu đơn vị là "Răng", số lượng là tổng số răng. Ngược lại là 1.
  if (this.donVi === "Răng") {
    return soRangSua + soRangVinhVien;
  }
  return 1;
});

// 2. Các virtual liên quan đến tài chính
// Lưu ý: Các giá trị này cần được tính toán từ collection khác (ví dụ: PhieuThu)
// và gán vào sau khi truy vấn. Virtual ở đây chỉ để hiển thị.
consultedServiceSchema.virtual("soTienDaThanhToan").get(function () {
  // Logic này sẽ được tính ở tầng ứng dụng, ví dụ:
  // const payments = await Payment.find({ consultedServiceId: this._id });
  // return payments.reduce((sum, p) => sum + p.amount, 0);
  return this._soTienDaThanhToan || 0; // Trả về giá trị được gán tạm
});

consultedServiceSchema.virtual("conNo").get(function () {
  return (this.thanhTien || 0) - (this.soTienDaThanhToan || 0);
});

// --- HOOKS ---

// Hook để tự động tính toán giữa `thanhTien` và `giaUuDai`
consultedServiceSchema.pre("save", function (next) {
  // Chỉ chạy khi `thanhTien` hoặc `giaUuDai` được sửa đổi
  if (this.isModified("giaUuDai") && this.soLuong > 0) {
    this.thanhTien = this.giaUuDai * this.soLuong;
  } else if (this.isModified("thanhTien") && this.soLuong > 0) {
    this.giaUuDai = this.thanhTien / this.soLuong;
  }
  next();
});

module.exports = mongoose.model("ConsultedService", consultedServiceSchema);
