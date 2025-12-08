import { z } from "zod";

// ================================
// Query Schemas
// ================================

export const GetLaboReportSummaryQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
  clinicId: z.string().optional(),
});

export const GetLaboReportDetailQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  clinicId: z.string().optional(),
  tab: z.enum(["daily", "supplier", "doctor", "service"]),
  key: z.string(), // date | supplierId | doctorId | serviceId
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(20),
});

export type GetLaboReportSummaryQuery = z.infer<
  typeof GetLaboReportSummaryQuerySchema
>;
export type GetLaboReportDetailQuery = z.infer<
  typeof GetLaboReportDetailQuerySchema
>;

// ================================
// Response Schemas
// ================================

// KPI Data
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

// Daily Data (by returnDate - ngày nhận mẫu)
export const DailyLaboDataSchema = z.object({
  id: z.string(), // date as YYYY-MM-DD
  date: z.string(), // DD/MM/YYYY display
  orderCount: z.number(),
  totalCost: z.number(),
  percentage: z.number(),
  // NOTE: No rank field (daily không có ranking)
});

// Supplier Data
export const SupplierLaboDataSchema = z.object({
  id: z.string(),
  supplierId: z.string(),
  supplierName: z.string(),
  orderCount: z.number(),
  totalCost: z.number(),
  avgCost: z.number(),
  percentage: z.number(),
  rank: z.number(), // 1, 2, 3...
});

// Doctor Data (sentBy)
export const DoctorLaboDataSchema = z.object({
  id: z.string(),
  doctorId: z.string(),
  doctorName: z.string(),
  orderCount: z.number(),
  totalCost: z.number(),
  percentage: z.number(),
  rank: z.number(),
});

// Service Data (laboService)
export const ServiceLaboDataSchema = z.object({
  id: z.string(),
  serviceId: z.string(),
  serviceName: z.string(),
  supplierName: z.string(),
  itemName: z.string(),
  orderCount: z.number(),
  totalCost: z.number(),
  percentage: z.number(),
  rank: z.number(),
});

// Detail Record (for drill-down panel)
export const LaboOrderDetailRecordSchema = z.object({
  id: z.string(),
  sendDate: z.string(), // ISO date
  sendDateDisplay: z.string(), // DD/MM/YYYY
  returnDate: z.string().nullable(),
  returnDateDisplay: z.string().nullable(),
  customerName: z.string(),
  customerCode: z.string(),
  customerId: z.string(),
  doctorName: z.string(),
  serviceName: z.string(),
  supplierName: z.string(),
  itemName: z.string(),
  orderType: z.string(), // "Làm mới" | "Bảo hành"
  quantity: z.number(),
  totalCost: z.number(),
  treatmentDate: z.string().nullable(),
  treatmentDateDisplay: z.string().nullable(),
});

// Summary Response
export const LaboReportSummaryResponseSchema = z.object({
  kpi: LaboKpiDataSchema,
  summaryTabs: z.object({
    byDate: z.array(DailyLaboDataSchema),
    bySupplier: z.array(SupplierLaboDataSchema),
    byDoctor: z.array(DoctorLaboDataSchema),
    byService: z.array(ServiceLaboDataSchema),
  }),
});

// Detail Response
export const LaboReportDetailResponseSchema = z.object({
  records: z.array(LaboOrderDetailRecordSchema),
  totalRecords: z.number(),
  totalCost: z.number(),
});

export type LaboKpiData = z.infer<typeof LaboKpiDataSchema>;
export type DailyLaboData = z.infer<typeof DailyLaboDataSchema>;
export type SupplierLaboData = z.infer<typeof SupplierLaboDataSchema>;
export type DoctorLaboData = z.infer<typeof DoctorLaboDataSchema>;
export type ServiceLaboData = z.infer<typeof ServiceLaboDataSchema>;
export type LaboOrderDetailRecord = z.infer<typeof LaboOrderDetailRecordSchema>;
export type LaboReportSummaryResponse = z.infer<
  typeof LaboReportSummaryResponseSchema
>;
export type LaboReportDetailResponse = z.infer<
  typeof LaboReportDetailResponseSchema
>;
