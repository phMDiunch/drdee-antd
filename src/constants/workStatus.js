// Work Status
export const WORK_STATUS = {
  PROBATION: "nhân viên thử việc",
  OFFICIAL: "nhân viên chính thức",
  RESIGNED: "đã nghỉ",
};

export const WORK_STATUS_OPTIONS = [
  {
    value: WORK_STATUS.PROBATION,
    label: "Nhân viên thử việc",
    shortLabel: "Thử việc",
    color: "orange",
    colorHex: "#fa8c16",
  },
  {
    value: WORK_STATUS.OFFICIAL,
    label: "Nhân viên chính thức",
    shortLabel: "Chính thức",
    color: "green",
    colorHex: "#52c41a",
  },
  {
    value: WORK_STATUS.RESIGNED,
    label: "Đã nghỉ việc",
    shortLabel: "Đã nghỉ",
    color: "red",
    colorHex: "#ff4d4f",
  },
];

export const getWorkStatusConfig = (status) => {
  return (
    WORK_STATUS_OPTIONS.find((option) => option.value === status) || {
      color: "default",
      label: status,
      shortLabel: status,
      colorHex: "#d9d9d9",
    }
  );
};

export const WORK_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  ...WORK_STATUS_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  })),
];
