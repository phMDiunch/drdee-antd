export const LABO_REPORT_QUERY_KEYS = {
  summary: (month: string, clinicId?: string) =>
    ["labo-report", "summary", month, clinicId] as const,
  detail: (
    tab: string | null,
    key: string | null,
    month: string,
    clinicId?: string
  ) => ["labo-report", "detail", tab, key, month, clinicId] as const,
} as const;

export const LABO_REPORT_MESSAGES = {
  LOAD_ERROR: "Không thể tải báo cáo labo",
  NO_DATA: "Không có dữ liệu trong tháng này",
} as const;
