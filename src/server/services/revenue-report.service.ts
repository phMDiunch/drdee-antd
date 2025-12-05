import { revenueReportRepo } from "@/server/repos/revenue-report.repo";
import { ServiceError } from "./errors";
import type { UserCore } from "@/shared/types/user";
import type {
  GetRevenueSummaryQuery,
  GetRevenueDetailQuery,
  RevenueSummaryResponse,
  RevenueDetailResponse,
} from "@/shared/validation/revenue-report.schema";
import {
  GetRevenueSummaryQuerySchema,
  GetRevenueDetailQuerySchema,
} from "@/shared/validation/revenue-report.schema";
import {
  mapKpiData,
  mapDailyData,
  mapSourceData,
  mapDepartmentData,
  mapServiceData,
  mapDoctorData,
  mapDetailRecords,
} from "./revenue-report/_mappers";

/**
 * Revenue Report Service
 * Business logic for revenue reports based on PaymentVoucherDetail
 */

export const revenueReportService = {
  /**
   * Lấy báo cáo tổng quan (KPI + tất cả các tab)
   */
  async getSummary(
    currentUser: UserCore | null,
    query: GetRevenueSummaryQuery
  ): Promise<RevenueSummaryResponse> {
    // Kiểm tra đăng nhập
    if (!currentUser) {
      throw new ServiceError("UNAUTHORIZED", "Bạn chưa đăng nhập", 401);
    }

    // Validate dữ liệu đầu vào
    const parsed = GetRevenueSummaryQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new ServiceError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
        400
      );
    }
    const validatedQuery = parsed.data;

    // Nhân viên: chỉ được xem clinic của mình
    const queryParams = {
      month: validatedQuery.month,
      clinicId:
        currentUser.role === "admin"
          ? validatedQuery.clinicId || undefined
          : currentUser.clinicId || undefined,
    };

    // Query tất cả dữ liệu song song từ repo public methods
    const [kpiData, dailyData, sourceData, departmentData, serviceData, doctorData] =
      await Promise.all([
        revenueReportRepo.getKpiData(queryParams),
        revenueReportRepo.getDailyData(queryParams),
        revenueReportRepo.getSourceData(queryParams),
        revenueReportRepo.getDepartmentData(queryParams),
        revenueReportRepo.getServiceData(queryParams),
        revenueReportRepo.getDoctorData(queryParams),
      ]);

    // Map to response format
    const totalRevenue = kpiData.totalRevenue;

    return {
      kpi: mapKpiData(kpiData),
      summaryTabs: {
        byDate: mapDailyData(dailyData, totalRevenue),
        bySource: mapSourceData(sourceData, totalRevenue),
        byDepartment: mapDepartmentData(departmentData, totalRevenue),
        byService: mapServiceData(serviceData, totalRevenue),
        byDoctor: mapDoctorData(doctorData, totalRevenue),
      },
    };
  },

  /**
   * Lấy chi tiết theo tab và key
   */
  async getDetail(
    currentUser: UserCore | null,
    query: GetRevenueDetailQuery
  ): Promise<RevenueDetailResponse> {
    // Kiểm tra đăng nhập
    if (!currentUser) {
      throw new ServiceError("UNAUTHORIZED", "Bạn chưa đăng nhập", 401);
    }

    // Validate dữ liệu đầu vào
    const parsed = GetRevenueDetailQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new ServiceError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
        400
      );
    }
    const validatedQuery = parsed.data;

    // Nhân viên: chỉ được xem clinic của mình
    const queryParams = {
      month: validatedQuery.month,
      tab: validatedQuery.tab,
      key: validatedQuery.key,
      clinicId:
        currentUser.role === "admin"
          ? validatedQuery.clinicId || undefined
          : currentUser.clinicId || undefined,
    };

    // Query detail records từ repo
    const detailRecords = await revenueReportRepo.getDetailRecords(queryParams);

    // Get payment aggregations map for percentage calculation
    const { startDate, endDate } = revenueReportRepo.getMonthDateRange(
      queryParams.month
    );
    const aggregationsMap = await revenueReportRepo.queryPaymentAggregations(
      startDate,
      endDate,
      queryParams.clinicId
    );

    // Calculate total revenue
    const totalRevenue = detailRecords.reduce(
      (sum, detail) => sum + detail.amount,
      0
    );

    // Map to response format
    const records = mapDetailRecords(detailRecords, aggregationsMap);

    return {
      records,
      totalRecords: records.length,
      totalRevenue,
    };
  },
};
