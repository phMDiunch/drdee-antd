const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    // Thông tin cơ bản
    maNhanVien: { type: String, unique: true, required: true, sparse: true },
    hoTen: { type: String, required: true },
    ngaySinh: { type: Date },
    gioiTinh: { type: String, enum: ["Nam", "Nữ", "Khác"] },
    avatar: { type: String },

    // Thông tin liên hệ
    soDienThoai: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    diaChiHienTai: { type: String },
    queQuan: { type: String },

    // Thông tin pháp lý & BH
    soCCCD: { type: String, unique: true, sparse: true },
    ngayCapCCCD: { type: Date },
    noiCapCCCD: { type: String },
    maSoThue: { type: String, unique: true, sparse: true },
    soSoBaoHiem: { type: String, unique: true, sparse: true },

    // Thông tin ngân hàng
    soTkNganHang: { type: String },
    nganHang: { type: String },

    // Thông tin công việc & Hợp đồng
    trangThaiLamViec: {
      type: String,
      enum: ["Đang làm việc", "Thử việc", "Nghỉ việc"],
      default: "Thử việc",
    },
    chiNhanhLamViec: { type: String },
    phongBan: { type: String },
    chucVu: { type: String },
    nguoiQuanLy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    loaiHopDong: { type: String, enum: ["Thử việc", "Chính thức", "Thời vụ"] },
    ngayBatDauLamViec: { type: Date },

    // Thông tin tài khoản hệ thống
    password: { type: String, required: true, select: false },
    vaiTro: {
      type: String,
      enum: ["admin", "manager", "employee"],
      default: "employee",
    },

    // Metadata
    nguoiTao: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    nguoiCapNhat: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  },
  {
    // Tự động thêm createdAt và updatedAt
    timestamps: true,
  }
);

module.exports = mongoose.model("Employee", employeeSchema);
