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
  mapServiceGroupData,
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

    const { startDate, endDate } = revenueReportRepo.getMonthDateRange(
      queryParams.month
    );

    // Gọi DB 2 lần song song (current month + previous month)
    const [paymentDetails, prevMonthDetails] = await Promise.all([
      revenueReportRepo.queryAllPaymentDetails(
        startDate,
        endDate,
        queryParams.clinicId
      ),
      (async () => {
        const [year, monthNum] = queryParams.month.split("-").map(Number);
        const prevMonth = new Date(year, monthNum - 2, 1);
        prevMonth.setHours(0, 0, 0, 0);
        const prevMonthEnd = new Date(year, monthNum - 1, 0, 23, 59, 59, 999);
        return revenueReportRepo.queryAllPaymentDetails(
          prevMonth,
          prevMonthEnd,
          queryParams.clinicId
        );
      })(),
    ]);

    // Tính previous month revenue từ data có sẵn
    const previousMonthRevenue = prevMonthDetails.reduce(
      (sum, d) => sum + d.amount,
      0
    );

    // Compute tất cả dimensions từ data có sẵn - KHÔNG query DB thêm
    const paymentAggregations =
      revenueReportRepo.computePaymentAggregations(paymentDetails);
    const kpiData = revenueReportRepo.computeKpiData(
      paymentDetails,
      previousMonthRevenue
    );
    const dailyData = revenueReportRepo.computeDailyData(paymentDetails);
    const sourceData = revenueReportRepo.computeSourceData(paymentDetails);
    const departmentData = revenueReportRepo.computeDepartmentData(
      paymentDetails,
      paymentAggregations
    );
    const serviceGroupData = revenueReportRepo.computeServiceGroupData(
      paymentDetails,
      paymentAggregations
    );
    const serviceData = revenueReportRepo.computeServiceData(
      paymentDetails,
      paymentAggregations
    );
    const doctorData = revenueReportRepo.computeDoctorData(paymentDetails);

    // Map to response format
    const totalRevenue = kpiData.totalRevenue;

    return {
      kpi: mapKpiData(kpiData),
      summaryTabs: {
        byDate: mapDailyData(dailyData, totalRevenue),
        bySource: mapSourceData(sourceData, totalRevenue),
        byDepartment: mapDepartmentData(departmentData, totalRevenue),
        byServiceGroup: mapServiceGroupData(serviceGroupData, totalRevenue),
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

    const { startDate, endDate } = revenueReportRepo.getMonthDateRange(
      queryParams.month
    );

    // Query DB 1 lần duy nhất cho current month
    const paymentDetails = await revenueReportRepo.queryAllPaymentDetails(
      startDate,
      endDate,
      queryParams.clinicId
    );

    // Filter detail records từ data có sẵn (KHÔNG query DB)
    const detailRecords = revenueReportRepo.filterDetailsByTabAndKey(
      paymentDetails,
      queryParams.tab,
      queryParams.key
    );

    // Compute payment aggregations từ data có sẵn
    const aggregationsMap =
      revenueReportRepo.computePaymentAggregations(paymentDetails);

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
