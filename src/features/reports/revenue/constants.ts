export const REVENUE_REPORT_QUERY_KEYS = {
  summary: (month: string, clinicId?: string) =>
    ["revenue-report", "summary", month, clinicId] as const,
  detail: (
    tab: string | null,
    key: string | null,
    month: string,
    clinicId?: string
  ) => ["revenue-report", "detail", tab, key, month, clinicId] as const,
} as const;

export const REVENUE_REPORT_MESSAGES = {
  LOAD_ERROR: "Không thể tải báo cáo doanh thu",
  NO_DATA: "Không có dữ liệu trong tháng này",
} as const;
