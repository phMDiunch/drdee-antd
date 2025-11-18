import { z } from "zod";

// ============================================================================
// QUERY SCHEMAS (Request)
// ============================================================================

/**
 * Query schema for summary endpoint
 * GET /api/v1/reports/sales/summary
 */
export const GetSalesSummaryQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
  clinicId: z.string().optional(), // Admin: optional, Employee: enforced in backend
});

export type GetSalesSummaryQuery = z.infer<typeof GetSalesSummaryQuerySchema>;

/**
 * Query schema for detail endpoint
 * GET /api/v1/reports/sales/detail
 */
export const GetSalesDetailQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
  clinicId: z.string().optional(), // Admin: optional, Employee: enforced in backend
  tab: z.enum(["daily", "source", "service", "sale", "doctor"]),
  key: z.string(), // Date string, source name, service category, employee ID, etc.
});

export type GetSalesDetailQuery = z.infer<typeof GetSalesDetailQuerySchema>;

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

/**
 * KPI metrics response
 */
export const KpiDataSchema = z.object({
  totalSales: z.number(),
  totalSalesGrowthMoM: z.number(), // vs previous month
  totalSalesGrowthYoY: z.number(), // vs same month last year

  closedDeals: z.number(),
  closedDealsGrowthMoM: z.number(),
  closedDealsGrowthYoY: z.number(),

  newCustomers: z.number(),
  newCustomersGrowthMoM: z.number(),
  newCustomersGrowthYoY: z.number(),

  newCustomerSales: z.number(), // Sales from new customers
  oldCustomerSales: z.number(), // Sales from existing customers
  newCustomerGrowth: z.number(), // Growth of new customer sales vs previous month
});

export type KpiData = z.infer<typeof KpiDataSchema>;

/**
 * Daily detail row
 */
export const DailyDetailDataSchema = z.object({
  id: z.string(), // Date in YYYY-MM-DD format
  date: z.string(), // Display date DD/MM/YYYY
  rank: z.number(), // Ranking based on revenue (1 = highest)
  customersVisited: z.number(),
  consultations: z.number(),
  closed: z.number(),
  revenue: z.number(),
  closingRate: z.number(), // (closed / consultations) * 100
  averagePerService: z.number(),
  revenuePercentage: z.number(), // % of total month revenue
});

export type DailyDetailData = z.infer<typeof DailyDetailDataSchema>;

/**
 * Source detail row
 */
export const SourceDetailDataSchema = z.object({
  id: z.string(),
  source: z.string(),
  customersVisited: z.number(),
  consultations: z.number(),
  closed: z.number(),
  revenue: z.number(),
  closingRate: z.number(),
  averagePerService: z.number(),
  revenuePercentage: z.number(),
});

export type SourceDetailData = z.infer<typeof SourceDetailDataSchema>;

/**
 * Service detail row
 */
export const ServiceDetailDataSchema = z.object({
  id: z.string(),
  service: z.string(),
  customersVisited: z.number(),
  consultations: z.number(),
  closed: z.number(),
  revenue: z.number(),
  closingRate: z.number(),
  averagePerService: z.number(),
  revenuePercentage: z.number(),
});

export type ServiceDetailData = z.infer<typeof ServiceDetailDataSchema>;

/**
 * Sale performance row
 */
export const SaleDetailDataSchema = z.object({
  id: z.string(),
  saleName: z.string(),
  customersVisited: z.number(),
  consultations: z.number(),
  closed: z.number(),
  revenue: z.number(),
  closingRate: z.number(),
  averagePerService: z.number(),
  revenuePercentage: z.number(),
});

export type SaleDetailData = z.infer<typeof SaleDetailDataSchema>;

/**
 * Doctor performance row
 */
export const DoctorDetailDataSchema = z.object({
  id: z.string(),
  doctorName: z.string(),
  customersVisited: z.number(),
  consultations: z.number(),
  closed: z.number(),
  revenue: z.number(),
  closingRate: z.number(),
  averagePerService: z.number(),
  revenuePercentage: z.number(),
});

export type DoctorDetailData = z.infer<typeof DoctorDetailDataSchema>;

/**
 * Summary tabs data (aggregated)
 */
export const SummaryTabsDataSchema = z.object({
  byDate: z.array(DailyDetailDataSchema),
  bySource: z.array(SourceDetailDataSchema),
  byService: z.array(ServiceDetailDataSchema),
  bySale: z.array(SaleDetailDataSchema),
  byDoctor: z.array(DoctorDetailDataSchema),
});

export type SummaryTabsData = z.infer<typeof SummaryTabsDataSchema>;

/**
 * Full summary response (KPI + tabs)
 */
export const SalesSummaryResponseSchema = z.object({
  kpi: KpiDataSchema,
  summaryTabs: SummaryTabsDataSchema,
});

export type SalesSummaryResponse = z.infer<typeof SalesSummaryResponseSchema>;

// ============================================================================
// DETAIL PANEL SCHEMAS
// ============================================================================

/**
 * Single consulted service detail for detail panel
 */
export const ConsultedServiceDetailSchema = z.object({
  id: z.string(),
  consultationDate: z.string(), // ISO date - ngày tư vấn
  serviceConfirmDate: z.string().nullable(), // ISO date - ngày chốt (nullable cho dịch vụ chưa chốt)
  finalPrice: z.number(),
  serviceStatus: z.string(),

  customer: z.object({
    id: z.string(),
    fullName: z.string(),
    phone: z.string().nullable(),
    source: z.string().nullable(),
  }),

  dentalService: z.object({
    id: z.string(),
    name: z.string(),
    serviceGroup: z.string().nullable(),
  }),

  consultingSale: z
    .object({
      id: z.string(),
      fullName: z.string(),
    })
    .nullable(),

  consultingDoctor: z
    .object({
      id: z.string(),
      fullName: z.string(),
    })
    .nullable(),
});

export type ConsultedServiceDetail = z.infer<
  typeof ConsultedServiceDetailSchema
>;

/**
 * Detail panel data response
 */
export const SalesDetailResponseSchema = z.object({
  records: z.array(ConsultedServiceDetailSchema),
  totalRecords: z.number(),
  totalRevenue: z.number(),
});

export type SalesDetailResponse = z.infer<typeof SalesDetailResponseSchema>;
