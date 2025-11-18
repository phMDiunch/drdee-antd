import { salesReportRepo } from "@/server/repos/sales-report.repo";
import { ServiceError } from "./errors";
import type { UserCore } from "@/shared/types/user";
import type {
  GetSalesSummaryQuery,
  GetSalesDetailQuery,
  SalesSummaryResponse,
  SalesDetailResponse,
} from "@/shared/validation/sales-report.schema";
import {
  GetSalesSummaryQuerySchema,
  GetSalesDetailQuerySchema,
} from "@/shared/validation/sales-report.schema";
import {
  mapKpiData,
  mapDailyData,
  mapSourceData,
  mapServiceData,
  mapSaleData,
  mapDoctorData,
  mapDetailRecords,
} from "./sales-report/_mappers";

/**
 * Sales Report Service
 * Business logic for sales reports
 */

export const salesReportService = {
  /**
   * Lấy báo cáo tổng quan (KPI + tất cả các tab)
   */
  async getSummary(
    currentUser: UserCore | null,
    query: GetSalesSummaryQuery
  ): Promise<SalesSummaryResponse> {
    // Kiểm tra đăng nhập
    if (!currentUser) {
      throw new ServiceError("UNAUTHORIZED", "Bạn chưa đăng nhập", 401);
    }

    // Validate dữ liệu đầu vào
    const parsed = GetSalesSummaryQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new ServiceError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
        400
      );
    }
    const validatedQuery = parsed.data;

    // Nhân viên: chỉ được xem clinic của mình
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

    // Lấy dữ liệu song song: KPI riêng, các dimension dùng chung raw data
    const { startDate, endDate } = salesReportRepo.getMonthDateRange(
      params.month
    );
    const [kpiData, rawData] = await Promise.all([
      salesReportRepo.getKpiData(params),
      salesReportRepo.queryAllAggregationData(startDate, endDate, clinicId),
    ]);

    // Group dữ liệu theo từng dimension (trong memory, rất nhanh)
    const dailyData = salesReportRepo.groupByDimension(rawData, {
      getKey: (s) => s.consultationDate?.toISOString().split("T")[0] || "",
      mapResult: (date, data) => ({
        date: date!,
        customersVisited: data.customersVisited.size,
        consultations: data.consultations,
        closed: data.closed,
        revenue: data.revenue,
      }),
    });

    const sourceData = salesReportRepo.groupByDimension(rawData, {
      getKey: (s) =>
        (s as unknown as { customer: { source: string | null } }).customer
          .source,
      mapResult: (source, data) => ({
        source,
        customersVisited: data.customersVisited.size,
        consultations: data.consultations,
        closed: data.closed,
        revenue: data.revenue,
      }),
    });

    const serviceData = salesReportRepo.groupByDimension(rawData, {
      getKey: (s) =>
        (s as unknown as { dentalService: { serviceGroup: string | null } })
          .dentalService.serviceGroup,
      mapResult: (serviceGroup, data) => ({
        serviceGroup,
        customersVisited: data.customersVisited.size,
        consultations: data.consultations,
        closed: data.closed,
        revenue: data.revenue,
      }),
    });

    const saleData = salesReportRepo.groupByDimension(rawData, {
      getKey: (s) => {
        const sale = s as {
          consultingSale?: { id: string; fullName: string } | null;
        };
        return sale.consultingSale?.id || null;
      },
      getMetadata: (s) => {
        const sale = s as {
          consultingSale?: { id: string; fullName: string } | null;
        };
        return { fullName: sale.consultingSale?.fullName };
      },
      mapResult: (id, data) => ({
        id: id!,
        fullName: data.fullName!,
        customersVisited: data.customersVisited.size,
        consultations: data.consultations,
        closed: data.closed,
        revenue: data.revenue,
      }),
      filterNull: true,
    });

    const doctorData = salesReportRepo.groupByDimension(rawData, {
      getKey: (s) => {
        const doctor = s as {
          consultingDoctor?: { id: string; fullName: string } | null;
        };
        return doctor.consultingDoctor?.id || null;
      },
      getMetadata: (s) => {
        const doctor = s as {
          consultingDoctor?: { id: string; fullName: string } | null;
        };
        return { fullName: doctor.consultingDoctor?.fullName };
      },
      mapResult: (id, data) => ({
        id: id!,
        fullName: data.fullName!,
        customersVisited: data.customersVisited.size,
        consultations: data.consultations,
        closed: data.closed,
        revenue: data.revenue,
      }),
      filterNull: true,
    });

    // Chuyển đổi dữ liệu bằng mapper functions
    const kpi = mapKpiData(kpiData);
    const totalRevenue = dailyData.reduce((sum, d) => sum + d.revenue, 0);
    const byDate = mapDailyData(dailyData, totalRevenue);
    const bySource = mapSourceData(sourceData, totalRevenue);
    const byService = mapServiceData(serviceData, totalRevenue);
    const bySale = mapSaleData(saleData, totalRevenue);
    const byDoctor = mapDoctorData(doctorData, totalRevenue);

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
   * Lấy danh sách chi tiết cho một tab/key cụ thể
   */
  async getDetail(
    currentUser: UserCore | null,
    query: GetSalesDetailQuery
  ): Promise<SalesDetailResponse> {
    // Kiểm tra đăng nhập
    if (!currentUser) {
      throw new ServiceError("UNAUTHORIZED", "Bạn chưa đăng nhập", 401);
    }

    // Validate dữ liệu đầu vào
    const parsed = GetSalesDetailQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new ServiceError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
        400
      );
    }
    const validatedQuery = parsed.data;

    // Nhân viên: chỉ được xem clinic của mình
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

    // Chuyển đổi sang định dạng response bằng mapper
    const records = mapDetailRecords(services);
    const totalRevenue = records.reduce((sum, r) => sum + r.finalPrice, 0);

    return {
      records,
      totalRecords: records.length,
      totalRevenue,
    };
  },
};
