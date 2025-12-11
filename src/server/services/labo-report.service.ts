import { ServiceError } from "@/server/services/errors";
import type { UserCore } from "@/shared/types/user";
import type {
  GetLaboReportSummaryQuery,
  GetLaboReportDetailQuery,
  LaboReportSummaryResponse,
  LaboReportDetailResponse,
} from "@/shared/validation/labo-report.schema";
import {
  GetLaboReportSummaryQuerySchema,
  GetLaboReportDetailQuerySchema,
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
   * Lấy báo cáo tổng quan (KPI + 4 dimension tabs)
   */
  async getSummary(
    currentUser: UserCore | null,
    query: GetLaboReportSummaryQuery
  ): Promise<LaboReportSummaryResponse> {
    // Kiểm tra đăng nhập
    if (!currentUser) {
      throw new ServiceError("UNAUTHORIZED", "Bạn chưa đăng nhập", 401);
    }

    // Chỉ admin được xem báo cáo labo
    if (currentUser.role !== "admin") {
      throw new ServiceError(
        "PERMISSION_DENIED",
        "Chỉ admin được xem báo cáo labo",
        403
      );
    }

    // Validate dữ liệu đầu vào
    const parsed = GetLaboReportSummaryQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new ServiceError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
        400
      );
    }
    const validatedQuery = parsed.data;

    const params = {
      month: validatedQuery.month,
      clinicId: validatedQuery.clinicId,
    };

    // Gọi DB 2 lần song song (current month + previous month)
    const [orders, prevMonthOrders] = await Promise.all([
      laboReportRepo.queryAllOrders(params),
      (async () => {
        const [year, monthNum] = params.month.split("-").map(Number);
        const prevMonth = new Date(year, monthNum - 2, 1);
        const prevYear = prevMonth.getFullYear();
        const prevMonthNum = prevMonth.getMonth() + 1;
        const prevMonthStr = `${prevYear}-${prevMonthNum
          .toString()
          .padStart(2, "0")}`;
        return laboReportRepo.queryAllOrders({
          month: prevMonthStr,
          clinicId: params.clinicId,
        });
      })(),
    ]);

    // Tính previous month data từ orders có sẵn
    const prevMonthData = {
      orders: prevMonthOrders.length,
      cost: prevMonthOrders.reduce((sum, o) => sum + o.totalCost, 0),
    };

    // Compute tất cả dimensions từ data có sẵn - KHÔNG query DB thêm
    const kpiData = laboReportRepo.computeKpiData(
      orders,
      prevMonthData.orders,
      prevMonthData.cost
    );
    const dailyData = laboReportRepo.computeDailyData(orders);
    const supplierData = laboReportRepo.computeSupplierData(orders);
    const doctorData = laboReportRepo.computeDoctorData(orders);
    const serviceData = laboReportRepo.computeServiceData(orders);

    // Map to response format
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
   * Lấy danh sách chi tiết cho một tab/key cụ thể
   */
  async getDetail(
    currentUser: UserCore | null,
    query: GetLaboReportDetailQuery
  ): Promise<LaboReportDetailResponse> {
    // Kiểm tra đăng nhập
    if (!currentUser) {
      throw new ServiceError("UNAUTHORIZED", "Bạn chưa đăng nhập", 401);
    }

    // Chỉ admin được xem báo cáo labo
    if (currentUser.role !== "admin") {
      throw new ServiceError(
        "PERMISSION_DENIED",
        "Chỉ admin được xem báo cáo labo",
        403
      );
    }

    // Validate dữ liệu đầu vào
    const parsed = GetLaboReportDetailQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new ServiceError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
        400
      );
    }
    const validatedQuery = parsed.data;

    // Query TẤT CẢ orders trong tháng (1 lần duy nhất)
    const allOrders = await laboReportRepo.queryAllOrders({
      month: validatedQuery.month,
      clinicId: validatedQuery.clinicId,
    });

    // Filter detail records từ data có sẵn (không query DB)
    const filteredOrders = laboReportRepo.filterDetailsByTabAndKey(
      allOrders,
      validatedQuery.tab,
      validatedQuery.key
    );

    // Chuyển đổi sang định dạng response bằng mapper
    const mappedRecords = mapDetailRecords(filteredOrders);
    const totalCost = filteredOrders.reduce((sum, r) => sum + r.totalCost, 0);

    return {
      records: mappedRecords,
      totalRecords: filteredOrders.length,
      totalCost,
    };
  },
};
