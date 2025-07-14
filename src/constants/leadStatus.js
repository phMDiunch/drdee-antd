// Trạng thái của lead
export const LEAD_STATUS_OPTIONS = [
  { label: "Mới", value: "new" },
  { label: "Đang chăm sóc", value: "in_progress" },
  { label: "Hẹn lịch", value: "appointment" },
  { label: "Đã đến", value: "visited" },
  { label: "Chưa liên hệ được", value: "unreachable" },
  { label: "Từ chối", value: "rejected" },
  { label: "Không tiềm năng", value: "not_potential" },
  // Thêm trạng thái khác nếu cần
];

// Helper cho trạng thái lead
export const getLeadStatusConfig = (status) => {
  const found = LEAD_STATUS_OPTIONS.find((option) => option.value === status);
  if (found) {
    const colorMap = {
      new: "#1890ff",
      in_progress: "#faad14",
      appointment: "#13c2c2",
      visited: "#52c41a",
      unreachable: "#bfbfbf",
      rejected: "#f5222d",
      not_potential: "#d9d9d9",
    };
    return {
      color: colorMap[status] || "default",
      label: found.label,
    };
  }
  return { color: "default", label: status || "Không xác định" };
};
