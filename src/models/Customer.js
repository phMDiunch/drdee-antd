// models/Customer.js
const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    // ---- THÔNG TIN NHẬN DIỆN ----
    maKhachHang: {
      type: String,
      unique: true,
      // Sẽ được tạo tự động bằng hook pre-save ở dưới
    },
    hoTenKH: {
      type: String,
      required: [true, "Họ tên khách hàng là bắt buộc"],
      trim: true,
    },
    ngaySinh: { type: Date },
    gioiTinh: { type: String, enum: ["Nam", "Nữ", "Khác"] },

    // ---- THÔNG TIN LIÊN HỆ ----
    soDienThoai: {
      type: String,
      required: [true, "Số điện thoại là bắt buộc"],
      unique: true,
      trim: true,
    },
    eMail: {
      type: String,
      unique: true,
      trim: true,
      // `sparse: true` cho phép có nhiều giá trị null, nhưng các giá trị khác null phải là duy nhất.
      // Rất hữu ích cho các trường không bắt buộc nhưng phải là duy nhất nếu có.
      sparse: true,
    },
    nguoiGiamHo: { type: String, trim: true }, // Dành cho khách hàng trẻ em
    diaChi: { type: String },
    tinhThanhPho: { type: String },
    quanHuyenThiXa: { type: String },

    // ---- THÔNG TIN KHÁC ----
    ngheNghiep: { type: String },
    nguonKhach: { type: String },
    ghiChuNguon: { type: String }, // Chi tiết nguồn khách
    dichVuQuanTam: { type: String }, // Hoặc có thể là một mảng nếu khách quan tâm nhiều dịch vụ
    chiNhanh: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" }, // Liên kết đến collection Chi Nhánh

    // ---- METADATA ----
    nguoiTao: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    nguoiCapNhat: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  },
  {
    timestamps: { createdAt: "ngayTao", updatedAt: "ngayCapNhat" },
    toJSON: { virtuals: true }, // Bật tính năng để virtuals xuất hiện khi chuyển sang JSON
    toObject: { virtuals: true },
  }
);

// --- HOOK TỰ ĐỘNG TẠO `maKhachHang` ---
customerSchema.pre("save", async function (next) {
  // Chỉ chạy khi tạo mới document
  if (this.isNew) {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Lấy 2 số cuối của năm, ví dụ: 25
    const month = (now.getMonth() + 1).toString().padStart(2, "0"); // Lấy tháng, ví dụ: 07

    const prefix = `${year}${month}-`; // Ví dụ: "2507-"

    // Tìm khách hàng cuối cùng trong tháng này để lấy số thứ tự
    const lastCustomer = await this.constructor
      .findOne({ maKhachHang: { $regex: `^${prefix}` } })
      .sort({ maKhachHang: -1 });

    let sequenceNumber = 1;
    if (lastCustomer) {
      const lastSequence = parseInt(lastCustomer.maKhachHang.split("-")[1], 10);
      sequenceNumber = lastSequence + 1;
    }

    // Gán mã khách hàng hoàn chỉnh
    this.maKhachHang = `${prefix}${sequenceNumber.toString().padStart(3, "0")}`;
  }
  next();
});

// --- CÁC TRƯỜNG DỮ LIỆU ẢO (VIRTUALS) ---

// 1. Virtual đơn giản: Tính toán từ trường có sẵn
customerSchema.virtual("namThangDen").get(function () {
  if (this.ngayTao) {
    const date = new Date(this.ngayTao);
    return `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
  }
  return null;
});

// 2. Virtual phức tạp: Cần populate dữ liệu từ collection khác
// Các virtual này sẽ được tính toán sau khi bạn đã .populate() dữ liệu liên quan.
// Ví dụ:
customerSchema.virtual("lichHenGanNhat", {
  ref: "Appointment", // Tên model Lịch Hẹn
  localField: "_id",
  foreignField: "idKhachHang",
  justOne: true, // Chỉ lấy 1 lịch hẹn gần nhất
  options: { sort: { ngayHen: -1 } }, // Sắp xếp để lấy lịch gần nhất
});

customerSchema.virtual("tinhTrangLichHenGanNhat").get(function () {
  if (
    this.lichHenGanNhat &&
    new Date(this.lichHenGanNhat.ngayHen) < new Date()
  ) {
    return this.lichHenGanNhat.trangThai; // ví dụ: "Đã đến", "Không đến"
  }
  return "Chưa có lịch hẹn qua";
});

customerSchema.methods.getFinancials = async function () {
  // Lấy `_id` của khách hàng hiện tại
  const customerId = this._id;

  // 1. Tính tổng thành tiền từ các dịch vụ đã chốt
  const consultedServices = await mongoose.model("ConsultedService").find({
    khachHang: customerId,
    trangThaiDichVu: "Đã chốt", // Chỉ tính các dịch vụ đã chốt
  });
  const tongThanhTien = consultedServices.reduce(
    (sum, service) => sum + service.thanhTien,
    0
  );

  // 2. Tính tổng thực thu từ các phiếu thu chi tiết
  const paymentDetails = await mongoose.model("PaymentVoucherDetail").find({
    khachHang: customerId,
    trangThaiPhieu: "Đã thu", // Chỉ tính các phiếu đã thu thành công
  });
  const tongThucThu = paymentDetails.reduce(
    (sum, detail) => sum + detail.soTienThu,
    0
  );

  // 3. Tính công nợ
  const tongConNo = tongThanhTien - tongThucThu;

  return {
    tongThanhTien,
    tongThucThu,
    tongConNo,
  };
};

module.exports = mongoose.model("Customer", customerSchema);
