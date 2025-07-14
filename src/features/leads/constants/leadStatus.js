export const LEAD_STATUS_OPTIONS = [
  { value: "so_dien_thoai", label: "Số điện thoại" },
  { value: "dang_goi", label: "Đang gọi" },
  { value: "dat_lich", label: "Đặt lịch" },
  { value: "da_den", label: "Đã đến" },
];

export const getLeadStatusConfig = (status) => {
  const config = {
    so_dien_thoai: { color: "#1890ff", label: "Số điện thoại" },
    dang_goi: { color: "#faad14", label: "Đang gọi" },
    dat_lich: { color: "#13c2c2", label: "Đặt lịch" },
    da_den: { color: "#52c41a", label: "Đã đến" },
  };
  return (
    config[status] || { color: "#bfbfbf", label: status || "Không xác định" }
  );
};
