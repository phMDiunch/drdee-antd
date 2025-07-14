// Account Status
export const ACCOUNT_STATUS = {
  PENDING: "pending",
  APPROVE: "approve",
  REJECT: "reject",
};

export const ACCOUNT_STATUS_OPTIONS = [
  {
    value: ACCOUNT_STATUS.PENDING,
    label: "Chờ duyệt",
    color: "orange",
    colorHex: "#fa8c16",
  },
  {
    value: ACCOUNT_STATUS.APPROVE,
    label: "Đã duyệt",
    color: "green",
    colorHex: "#52c41a",
  },
  {
    value: ACCOUNT_STATUS.REJECT,
    label: "Từ chối",
    color: "red",
    colorHex: "#ff4d4f",
  },
];

export const getAccountStatusConfig = (status) => {
  return (
    ACCOUNT_STATUS_OPTIONS.find((option) => option.value === status) || {
      color: "default",
      label: status,
      colorHex: "#d9d9d9",
    }
  );
};

export const ACCOUNT_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  ...ACCOUNT_STATUS_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  })),
];
