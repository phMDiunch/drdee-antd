import { salesReportRepo } from "@/server/repos/sales-report.repo";
import { CUSTOMER_SOURCES } from "@/features/customers/constants";
import type { UserCore } from "@/shared/types/user";
import type {
  GetSalesSummaryQuery,
  GetSalesDetailQuery,
  SalesSummaryResponse,
  SalesDetailResponse,
  KpiData,
  DailyDetailData,
  SourceDetailData,
  ServiceDetailData,
  SaleDetailData,
  DoctorDetailData,
  ConsultedServiceDetail,
} from "@/shared/validation/sales-report.schema";
import {
  GetSalesSummaryQuerySchema,
  GetSalesDetailQuerySchema,
} from "@/shared/validation/sales-report.schema";
import dayjs from "dayjs";

/**
 * Sales Report Service
 * Business logic for sales reports
 */

export const salesReportService = {
  /**
   * Get sales summary (KPI + all tabs data)
   */
  async getSummary(
    currentUser: UserCore,
    query: GetSalesSummaryQuery
  ): Promise<SalesSummaryResponse> {
    // Validate query
    const validatedQuery = GetSalesSummaryQuerySchema.parse(query);

    // Employee: enforce clinic filter
    let clinicId: string | undefined;
    if (currentUser.role === "admin") {
      clinicId = validatedQuery.clinicId || undefined;
    } else {
      clinicId = currentUser.clinicId || undefined;
    }

    const params = {
      month: validatedQuery.month,
      clinicId,
    };

    // Fetch all data in parallel
    const [kpiData, dailyData, sourceData, serviceData, saleData, doctorData] =
      await Promise.all([
        salesReportRepo.getKpiData(params),
        salesReportRepo.getDailyData(params),
        salesReportRepo.getSourceData(params),
        salesReportRepo.getServiceData(params),
        salesReportRepo.getSaleData(params),
        salesReportRepo.getDoctorData(params),
      ]);

    // Map KPI data
    const kpi: KpiData = {
      totalSales: kpiData.totalSales,
      totalSalesGrowthMoM: Math.round(kpiData.totalSalesGrowthMoM * 10) / 10,
      totalSalesGrowthYoY: Math.round(kpiData.totalSalesGrowthYoY * 10) / 10,
      closedDeals: kpiData.closedDeals,
      closedDealsGrowthMoM: Math.round(kpiData.closedDealsGrowthMoM * 10) / 10,
      closedDealsGrowthYoY: Math.round(kpiData.closedDealsGrowthYoY * 10) / 10,
      newCustomers: kpiData.newCustomers,
      newCustomersGrowthMoM:
        Math.round(kpiData.newCustomersGrowthMoM * 10) / 10,
      newCustomersGrowthYoY:
        Math.round(kpiData.newCustomersGrowthYoY * 10) / 10,
      newCustomerSales: kpiData.newCustomerSales,
      oldCustomerSales: kpiData.oldCustomerSales,
      newCustomerGrowth: Math.round(kpiData.newCustomerGrowth * 10) / 10,
    };

    // Calculate total revenue for percentage calculations
    const totalRevenue = dailyData.reduce((sum, d) => sum + d.revenue, 0);

    // Map daily data and calculate ranking based on revenue
    const byDateWithRank: DailyDetailData[] = dailyData
      .map((d) => ({
        id: d.date,
        date: dayjs(d.date).format("DD/MM/YYYY"),
        rank: 0, // Will be set below
        customersVisited: d.customersVisited,
        consultations: d.consultations,
        closed: d.closed,
        revenue: d.revenue,
        closingRate:
          d.consultations > 0
            ? Math.round((d.closed / d.consultations) * 1000) / 10
            : 0,
        averagePerService: d.closed > 0 ? Math.round(d.revenue / d.closed) : 0,
        revenuePercentage:
          totalRevenue > 0
            ? Math.round((d.revenue / totalRevenue) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue) // Sort by revenue DESC to assign rank
      .map((item, index) => ({ ...item, rank: index + 1 })) // Assign rank
      .sort((a, b) => a.id.localeCompare(b.id)); // Sort back by date ASC

    const byDate = byDateWithRank;

    // Map source data
    const bySource: SourceDetailData[] = sourceData
      .map((s) => {
        const sourceValue = s.source;
        let sourceLabel = "Không rõ nguồn";
        if (sourceValue) {
          const sourceConfig = CUSTOMER_SOURCES.find(
            (cs) => cs.value === sourceValue
          );
          sourceLabel = sourceConfig?.label || sourceValue;
        }
        return {
          id: sourceValue || "null",
          source: sourceLabel,
          customersVisited: s.customersVisited,
          consultations: s.consultations,
          closed: s.closed,
          revenue: s.revenue,
          closingRate:
            s.consultations > 0
              ? Math.round((s.closed / s.consultations) * 1000) / 10
              : 0,
          averagePerService:
            s.closed > 0 ? Math.round(s.revenue / s.closed) : 0,
          revenuePercentage:
            totalRevenue > 0
              ? Math.round((s.revenue / totalRevenue) * 1000) / 10
              : 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    // Map service data
    const byService: ServiceDetailData[] = serviceData
      .map((s) => ({
        id: s.serviceGroup || "null",
        service: s.serviceGroup || "Không rõ nhóm dịch vụ",
        customersVisited: s.customersVisited,
        consultations: s.consultations,
        closed: s.closed,
        revenue: s.revenue,
        closingRate:
          s.consultations > 0
            ? Math.round((s.closed / s.consultations) * 1000) / 10
            : 0,
        averagePerService: s.closed > 0 ? Math.round(s.revenue / s.closed) : 0,
        revenuePercentage:
          totalRevenue > 0
            ? Math.round((s.revenue / totalRevenue) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Map sale data
    const bySale: SaleDetailData[] = saleData
      .map((s) => ({
        id: s.id,
        saleName: s.fullName,
        customersVisited: s.customersVisited,
        consultations: s.consultations,
        closed: s.closed,
        revenue: s.revenue,
        closingRate:
          s.consultations > 0
            ? Math.round((s.closed / s.consultations) * 1000) / 10
            : 0,
        averagePerService: s.closed > 0 ? Math.round(s.revenue / s.closed) : 0,
        revenuePercentage:
          totalRevenue > 0
            ? Math.round((s.revenue / totalRevenue) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Map doctor data
    const byDoctor: DoctorDetailData[] = doctorData
      .map((d) => ({
        id: d.id,
        doctorName: d.fullName,
        customersVisited: d.customersVisited,
        consultations: d.consultations,
        closed: d.closed,
        revenue: d.revenue,
        closingRate:
          d.consultations > 0
            ? Math.round((d.closed / d.consultations) * 1000) / 10
            : 0,
        averagePerService: d.closed > 0 ? Math.round(d.revenue / d.closed) : 0,
        revenuePercentage:
          totalRevenue > 0
            ? Math.round((d.revenue / totalRevenue) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      kpi,
      summaryTabs: {
        byDate,
        bySource,
        byService,
        bySale,
        byDoctor,
      },
    };
  },

  /**
   * Get detail records for a specific tab/key combination
   */
  async getDetail(
    currentUser: UserCore,
    query: GetSalesDetailQuery
  ): Promise<SalesDetailResponse> {
    // Validate query
    const validatedQuery = GetSalesDetailQuerySchema.parse(query);

    // Employee: enforce clinic filter
    let clinicId: string | undefined;
    if (currentUser.role === "admin") {
      clinicId = validatedQuery.clinicId || undefined;
    } else {
      clinicId = currentUser.clinicId || undefined;
    }

    const params = {
      month: validatedQuery.month,
      clinicId,
      tab: validatedQuery.tab,
      key: validatedQuery.key,
    };

    const services = await salesReportRepo.getDetailRecords(params);

    // Map to response format
    const records: ConsultedServiceDetail[] = services.map((service) => ({
      id: service.id,
      consultationDate: service.consultationDate.toISOString(),
      serviceConfirmDate: service.serviceConfirmDate?.toISOString() || null,
      finalPrice: service.finalPrice,
      serviceStatus: service.serviceStatus,
      customer: {
        id: service.customer.id,
        fullName: service.customer.fullName,
        phone: service.customer.phone,
        source: service.customer.source,
      },
      dentalService: {
        id: service.dentalService.id,
        name: service.dentalService.name,
        serviceGroup: service.dentalService.serviceGroup,
      },
      consultingSale: service.consultingSale
        ? {
            id: service.consultingSale.id,
            fullName: service.consultingSale.fullName,
          }
        : null,
      consultingDoctor: service.consultingDoctor
        ? {
            id: service.consultingDoctor.id,
            fullName: service.consultingDoctor.fullName,
          }
        : null,
    }));

    const totalRevenue = records.reduce((sum, r) => sum + r.finalPrice, 0);

    return {
      records,
      totalRecords: records.length,
      totalRevenue,
    };
  },
};
