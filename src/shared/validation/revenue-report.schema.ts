import { z } from "zod";

// ============================================================================
// QUERY SCHEMAS (Request)
// ============================================================================

/**
 * Query schema for summary endpoint
 * GET /api/v1/reports/revenue/summary
 */
export const GetRevenueSummaryQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
  clinicId: z.string().optional(), // Admin: optional, Employee: enforced in backend
});

export type GetRevenueSummaryQuery = z.infer<
  typeof GetRevenueSummaryQuerySchema
>;

/**
 * Query schema for detail endpoint
 * GET /api/v1/reports/revenue/detail
 */
export const GetRevenueDetailQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
  clinicId: z.string().optional(), // Admin: optional, Employee: enforced in backend
  tab: z.enum([
    "daily",
    "source",
    "department",
    "serviceGroup",
    "service",
    "doctor",
  ]),
  key: z.string(), // Date string (YYYY-MM-DD), source name, department name, serviceGroup, serviceId, doctorId
});

export type GetRevenueDetailQuery = z.infer<typeof GetRevenueDetailQuerySchema>;

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

/**
 * KPI metrics response
 */
export const RevenueKpiDataSchema = z.object({
  totalRevenue: z.number(),
  cash: z.number(),
  cardRegular: z.number(),
  cardVisa: z.number(),
  transfer: z.number(),

  // Growth for total revenue only
  totalRevenueGrowthMoM: z.number().nullable(),

  // Percentages for payment methods
  cashPercentage: z.number(),
  cardRegularPercentage: z.number(),
  cardVisaPercentage: z.number(),
  transferPercentage: z.number(),

  // Previous month data for comparison
  previousMonthRevenue: z.number().nullable(),
});

export type RevenueKpiData = z.infer<typeof RevenueKpiDataSchema>;

/**
 * Daily revenue detail row
 */
export const DailyRevenueDataSchema = z.object({
  id: z.string(), // date as YYYY-MM-DD
  date: z.string(), // DD/MM/YYYY display
  cash: z.number(),
  cardRegular: z.number(),
  cardVisa: z.number(),
  transfer: z.number(),
  totalRevenue: z.number(),
  companyRevenue: z.number(), // Revenue from services with paymentAccountType = COMPANY
  percentage: z.number(),
});

export type DailyRevenueData = z.infer<typeof DailyRevenueDataSchema>;

/**
 * Source revenue detail row
 */
export const SourceRevenueDataSchema = z.object({
  id: z.string(),
  source: z.string(),
  voucherCount: z.number(),
  customerCount: z.number(),
  totalRevenue: z.number(),
  percentage: z.number(),
});

export type SourceRevenueData = z.infer<typeof SourceRevenueDataSchema>;

/**
 * Department revenue detail row
 */
export const DepartmentRevenueDataSchema = z.object({
  id: z.string(),
  department: z.string(),
  totalRevenue: z.number(),
  percentageOfTotal: z.number(),
  paymentPercentage: z.number(), // (paid / finalPrice) * 100
  totalPaid: z.number(),
  totalFinalPrice: z.number(),
});

export type DepartmentRevenueData = z.infer<typeof DepartmentRevenueDataSchema>;

/**
 * Service Group revenue detail row
 */
export const ServiceGroupRevenueDataSchema = z.object({
  id: z.string(),
  serviceGroup: z.string(),
  totalRevenue: z.number(),
  percentageOfTotal: z.number(),
  paymentPercentage: z.number(), // (paid / finalPrice) * 100
  totalPaid: z.number(),
  totalFinalPrice: z.number(),
});

export type ServiceGroupRevenueData = z.infer<
  typeof ServiceGroupRevenueDataSchema
>;

/**
 * Service revenue detail row
 */
export const ServiceRevenueDataSchema = z.object({
  id: z.string(),
  serviceId: z.string(),
  serviceName: z.string(),
  serviceGroup: z.string().nullable(),
  totalRevenue: z.number(),
  percentageOfTotal: z.number(),
  paymentPercentage: z.number(), // (paid / finalPrice) * 100
  totalPaid: z.number(),
  totalFinalPrice: z.number(),
});

export type ServiceRevenueData = z.infer<typeof ServiceRevenueDataSchema>;

/**
 * Doctor revenue detail row
 */
export const DoctorRevenueDataSchema = z.object({
  id: z.string(),
  doctorId: z.string(),
  doctorName: z.string(),
  totalRevenue: z.number(),
  percentage: z.number(),
});

export type DoctorRevenueData = z.infer<typeof DoctorRevenueDataSchema>;

/**
 * Summary tabs data (aggregated)
 */
export const RevenueSummaryTabsDataSchema = z.object({
  byDate: z.array(DailyRevenueDataSchema),
  bySource: z.array(SourceRevenueDataSchema),
  byDepartment: z.array(DepartmentRevenueDataSchema),
  byServiceGroup: z.array(ServiceGroupRevenueDataSchema),
  byService: z.array(ServiceRevenueDataSchema),
  byDoctor: z.array(DoctorRevenueDataSchema),
});

export type RevenueSummaryTabsData = z.infer<
  typeof RevenueSummaryTabsDataSchema
>;

/**
 * Full summary response (KPI + tabs)
 */
export const RevenueSummaryResponseSchema = z.object({
  kpi: RevenueKpiDataSchema,
  summaryTabs: RevenueSummaryTabsDataSchema,
});

export type RevenueSummaryResponse = z.infer<
  typeof RevenueSummaryResponseSchema
>;

// ============================================================================
// DETAIL PANEL SCHEMAS
// ============================================================================

/**
 * Single payment detail record for detail panel
 */
export const PaymentDetailRecordSchema = z.object({
  id: z.string(),
  paymentDate: z.string(), // ISO date
  paymentDateDisplay: z.string(), // DD/MM/YYYY
  serviceName: z.string(),
  customerName: z.string(),
  customerCode: z.string(),
  customerId: z.string(),
  treatingDoctorName: z.string().nullable(),
  toothPositions: z.array(z.string()).nullable(),
  quantity: z.number(),
  amount: z.number(),
  paymentPercentage: z.number(),
  totalPaid: z.number(),
  finalPrice: z.number(),
  consultedServiceId: z.string(),
});

export type PaymentDetailRecord = z.infer<typeof PaymentDetailRecordSchema>;

/**
 * Detail panel data response
 */
export const RevenueDetailResponseSchema = z.object({
  records: z.array(PaymentDetailRecordSchema),
  totalRecords: z.number(),
  totalRevenue: z.number(),
});

export type RevenueDetailResponse = z.infer<typeof RevenueDetailResponseSchema>;
