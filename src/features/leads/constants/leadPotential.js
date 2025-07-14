export const LEAD_POTENTIAL_OPTIONS = [
  { value: "thap", label: "Tiềm năng thấp" },
  { value: "trung_binh", label: "Tiềm năng trung bình" },
  { value: "cao", label: "Tiềm năng cao" },
  { value: "that_bai", label: "Thất bại" },
];

export const getLeadPotentialConfig = (potential) => {
  const config = {
    thap: { color: "#d9d9d9", label: "Tiềm năng thấp" },
    trung_binh: { color: "#faad14", label: "Tiềm năng trung bình" },
    cao: { color: "#52c41a", label: "Tiềm năng cao" },
    that_bai: { color: "#ff4d4f", label: "Thất bại" },
  };
  return (
    config[potential] || {
      color: "#bfbfbf",
      label: potential || "Không xác định",
    }
  );
};
