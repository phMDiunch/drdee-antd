import { z } from "zod";

// ============================================================================
// QUERY SCHEMAS (Request)
// ============================================================================

/**
 * Query schema for summary endpoint
 * GET /api/v1/reports/labo/summary
 */
export const GetLaboReportSummaryQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
  clinicId: z.string().optional(), // Admin: optional, Employee: enforced in backend
});

export type GetLaboReportSummaryQuery = z.infer<
  typeof GetLaboReportSummaryQuerySchema
>;

/**
 * Query schema for detail endpoint
 * GET /api/v1/reports/labo/detail
 */
export const GetLaboReportDetailQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
  clinicId: z.string().optional(), // Admin: optional, Employee: enforced in backend
  tab: z.enum(["daily", "supplier", "doctor", "service"]),
  key: z.string(), // date | supplierId | doctorId | serviceId
});

export type GetLaboReportDetailQuery = z.infer<
  typeof GetLaboReportDetailQuerySchema
>;

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

/**
 * KPI metrics response
 */
export const LaboKpiDataSchema = z.object({
  totalOrders: z.number(),
  totalCost: z.number(),

  // Growth MoM
  totalOrdersGrowthMoM: z.number().nullable(),
  totalCostGrowthMoM: z.number().nullable(),

  // Previous month data for comparison
  previousMonthOrders: z.number().nullable(),
  previousMonthCost: z.number().nullable(),
});

export type LaboKpiData = z.infer<typeof LaboKpiDataSchema>;

/**
 * Daily data row (by returnDate - ngày nhận mẫu)
 */
export const DailyLaboDataSchema = z.object({
  id: z.string(), // date as YYYY-MM-DD
  date: z.string(), // DD/MM/YYYY display
  orderCount: z.number(),
  totalCost: z.number(),
  percentage: z.number(),
  // NOTE: No rank field (daily không có ranking)
});

export type DailyLaboData = z.infer<typeof DailyLaboDataSchema>;

/**
 * Supplier data row
 */
export const SupplierLaboDataSchema = z.object({
  id: z.string(),
  supplierId: z.string(),
  supplierShortName: z.string().nullable(),
  orderCount: z.number(),
  totalCost: z.number(),
  percentage: z.number(),
  rank: z.number(), // 1, 2, 3...
});

export type SupplierLaboData = z.infer<typeof SupplierLaboDataSchema>;

/**
 * Doctor data row (sentBy)
 */
export const DoctorLaboDataSchema = z.object({
  id: z.string(),
  doctorId: z.string(),
  doctorName: z.string(),
  orderCount: z.number(),
  totalCost: z.number(),
  percentage: z.number(),
  rank: z.number(),
});

export type DoctorLaboData = z.infer<typeof DoctorLaboDataSchema>;

/**
 * Service data row (laboService)
 */
export const ServiceLaboDataSchema = z.object({
  id: z.string(),
  serviceId: z.string(),
  serviceName: z.string(),
  supplierShortName: z.string().nullable(),
  itemName: z.string(),
  orderCount: z.number(),
  totalCost: z.number(),
  percentage: z.number(),
  rank: z.number(),
});

export type ServiceLaboData = z.infer<typeof ServiceLaboDataSchema>;

// ============================================================================
// DETAIL PANEL SCHEMAS
// ============================================================================

/**
 * Single labo order detail record for detail panel
 */
export const LaboOrderDetailRecordSchema = z.object({
  id: z.string(),
  sentDate: z.string(), // ISO date
  sentDateDisplay: z.string(), // DD/MM/YYYY
  returnDate: z.string().nullable(),
  returnDateDisplay: z.string().nullable(),
  customerName: z.string(),
  customerCode: z.string().nullable(),
  customerId: z.string(),
  doctorName: z.string(),
  serviceName: z.string(),
  supplierShortName: z.string().nullable(),
  itemName: z.string(),
  orderType: z.string(), // "Làm mới" | "Bảo hành"
  quantity: z.number(),
  unitPrice: z.number(),
  totalCost: z.number(),
  treatmentDate: z.string().nullable(),
  treatmentDateDisplay: z.string().nullable(),
});

export type LaboOrderDetailRecord = z.infer<typeof LaboOrderDetailRecordSchema>;

/**
 * Summary tabs data (aggregated)
 */
export const LaboSummaryTabsDataSchema = z.object({
  byDate: z.array(DailyLaboDataSchema),
  bySupplier: z.array(SupplierLaboDataSchema),
  byDoctor: z.array(DoctorLaboDataSchema),
  byService: z.array(ServiceLaboDataSchema),
});

export type LaboSummaryTabsData = z.infer<typeof LaboSummaryTabsDataSchema>;

/**
 * Full summary response (KPI + tabs)
 */
export const LaboReportSummaryResponseSchema = z.object({
  kpi: LaboKpiDataSchema,
  summaryTabs: LaboSummaryTabsDataSchema,
});

export type LaboReportSummaryResponse = z.infer<
  typeof LaboReportSummaryResponseSchema
>;

/**
 * Detail panel data response
 */
export const LaboReportDetailResponseSchema = z.object({
  records: z.array(LaboOrderDetailRecordSchema),
  totalRecords: z.number(),
  totalCost: z.number(),
});

export type LaboReportDetailResponse = z.infer<
  typeof LaboReportDetailResponseSchema
>;
