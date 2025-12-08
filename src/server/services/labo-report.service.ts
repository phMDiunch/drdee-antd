import { ServiceError } from "@/server/services/errors";
import type { SessionUser } from "@/server/services/auth.service";
import {
  GetLaboReportSummaryQuerySchema,
  GetLaboReportDetailQuerySchema,
  type LaboReportSummaryResponse,
  type LaboReportDetailResponse,
} from "@/shared/validation/labo-report.schema";
import { laboReportRepo } from "@/server/repos/labo-report.repo";
import {
  mapKpiData,
  mapDailyData,
  mapSupplierData,
  mapDoctorData,
  mapServiceData,
  mapDetailRecords,
} from "./labo-report/_mappers";

export const laboReportService = {
  /**
   * Get labo report summary (KPI + 4 dimension tabs)
   * @param query - Month và clinicId (optional)
   * @param user - Current session user
   * @returns Summary response với KPI và 4 tabs data
   */
  async getLaboReportSummary(
    query: unknown,
    user: SessionUser
  ): Promise<LaboReportSummaryResponse> {
    // 1. Validate query
    const parsed = GetLaboReportSummaryQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new ServiceError(
        "INVALID_QUERY",
        "Tham số query không hợp lệ",
        400
      );
    }

    const { month, clinicId } = parsed.data;

    // 2. Check permissions - chỉ admin được xem báo cáo labo
    if (user.role !== "admin") {
      throw new ServiceError(
        "PERMISSION_DENIED",
        "Chỉ admin được xem báo cáo labo",
        403
      );
    }

    // 3. Parallel queries (5 repo methods)
    const [kpiData, dailyData, supplierData, doctorData, serviceData] =
      await Promise.all([
        laboReportRepo.getKpiData({ month, clinicId }),
        laboReportRepo.getDailyData({ month, clinicId }),
        laboReportRepo.getSupplierData({ month, clinicId }),
        laboReportRepo.getDoctorData({ month, clinicId }),
        laboReportRepo.getServiceData({ month, clinicId }),
      ]);

    // 4. Map raw data to response format (data đã sorted và ranked từ repo)
    const totalCost = kpiData.totalCost;

    return {
      kpi: mapKpiData(kpiData),
      summaryTabs: {
        byDate: mapDailyData(dailyData, totalCost),
        bySupplier: mapSupplierData(supplierData, totalCost),
        byDoctor: mapDoctorData(doctorData, totalCost),
        byService: mapServiceData(serviceData, totalCost),
      },
    };
  },

  /**
   * Get labo report detail records (drill-down panel)
   * @param query - Month, clinicId, tab, key, pagination
   * @param user - Current session user
   * @returns Detail response với records và pagination
   */
  async getLaboReportDetail(
    query: unknown,
    user: SessionUser
  ): Promise<LaboReportDetailResponse> {
    // 1. Validate query
    const parsed = GetLaboReportDetailQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new ServiceError(
        "INVALID_QUERY",
        "Tham số query không hợp lệ",
        400
      );
    }

    const { month, clinicId, tab, key, page, pageSize } = parsed.data;

    // 2. Check permissions - chỉ admin được xem báo cáo labo
    if (user.role !== "admin") {
      throw new ServiceError(
        "PERMISSION_DENIED",
        "Chỉ admin được xem báo cáo labo",
        403
      );
    }

    // 3. Get detail records
    const { records, total } = await laboReportRepo.getDetailRecords({
      month,
      clinicId,
      tab,
      key,
      page,
      pageSize,
    });

    // 4. Calculate total cost
    const totalCost = records.reduce((sum, r) => sum + r.totalCost, 0);

    return {
      records: mapDetailRecords(records),
      totalRecords: total,
      totalCost,
    };
  },
};
