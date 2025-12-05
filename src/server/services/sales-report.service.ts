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
  mapDepartmentData,
  mapSaleData,
  mapDoctorData,
  mapDetailRecords,
  enrichDetailRecordsWithSourceNames,
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

    // Lấy dữ liệu song song từ các public repo methods (đã có sort logic)
    const [kpiData, dailyData, sourceData, departmentData, serviceData, saleData, doctorData] =
      await Promise.all([
        salesReportRepo.getKpiData(params),
        salesReportRepo.getDailyData(params),
        salesReportRepo.getSourceData(params),
        salesReportRepo.getDepartmentData(params),
        salesReportRepo.getServiceData(params),
        salesReportRepo.getSaleData(params),
        salesReportRepo.getDoctorData(params),
      ]);

    // Chuyển đổi dữ liệu bằng mapper functions
    const kpi = mapKpiData(kpiData);
    const totalRevenue = dailyData.reduce((sum, d) => sum + d.revenue, 0);
    const byDate = mapDailyData(dailyData, totalRevenue);
    const bySource = mapSourceData(sourceData, totalRevenue);
    const byDepartment = mapDepartmentData(departmentData, totalRevenue);
    const byService = mapServiceData(serviceData, totalRevenue);
    const bySale = mapSaleData(saleData, totalRevenue);
    const byDoctor = mapDoctorData(doctorData, totalRevenue);

    return {
      kpi,
      summaryTabs: {
        byDate,
        bySource,
        byDepartment,
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

    // Enrich sourceNotes with names (employee/customer referrals)
    const enrichedServices = await enrichDetailRecordsWithSourceNames(services);

    // Chuyển đổi sang định dạng response bằng mapper
    const records = mapDetailRecords(enrichedServices);
    const totalRevenue = records.reduce((sum, r) => sum + r.finalPrice, 0);

    return {
      records,
      totalRecords: records.length,
      totalRevenue,
    };
  },
};
