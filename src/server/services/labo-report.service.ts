import { ServiceError } from "@/server/services/errors";
import type { UserCore } from "@/shared/types/user";
import dayjs from "dayjs";
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

    // Gọi DB 1 lần duy nhất để lấy tất cả orders
    const [orders, prevMonthData] = await Promise.all([
      laboReportRepo.queryAllOrders(params),
      (async () => {
        const prevMonth = dayjs(params.month)
          .subtract(1, "month")
          .format("YYYY-MM");
        const prevOrders = await laboReportRepo.queryAllOrders({
          month: prevMonth,
          clinicId: params.clinicId,
        });
        return {
          orders: prevOrders.length,
          cost: prevOrders.reduce((sum, o) => sum + o.totalCost, 0),
        };
      })(),
    ]);

    // Tính toán tất cả dimensions từ data có sẵn (không query DB thêm)
    const kpiData = laboReportRepo.computeKpiData(
      orders,
      prevMonthData.orders,
      prevMonthData.cost
    );
    const dailyData = laboReportRepo.computeDailyData(orders);
    const supplierData = laboReportRepo.computeSupplierData(orders);
    const doctorData = laboReportRepo.computeDoctorData(orders);
    const serviceData = laboReportRepo.computeServiceData(orders);

    // Chuyển đổi dữ liệu bằng mapper functions
    const kpi = mapKpiData(kpiData);
    const totalCost = kpiData.totalCost;
    const byDate = mapDailyData(dailyData, totalCost);
    const bySupplier = mapSupplierData(supplierData, totalCost);
    const byDoctor = mapDoctorData(doctorData, totalCost);
    const byService = mapServiceData(serviceData, totalCost);

    return {
      kpi,
      summaryTabs: {
        byDate,
        bySupplier,
        byDoctor,
        byService,
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

    const params = {
      month: validatedQuery.month,
      clinicId: validatedQuery.clinicId,
      tab: validatedQuery.tab,
      key: validatedQuery.key,
      page: validatedQuery.page,
      pageSize: validatedQuery.pageSize,
    };

    // Lấy dữ liệu chi tiết
    const { records, total } = await laboReportRepo.getDetailRecords(params);

    // Chuyển đổi sang định dạng response bằng mapper
    const mappedRecords = mapDetailRecords(records);
    const totalCost = records.reduce((sum, r) => sum + r.totalCost, 0);

    return {
      records: mappedRecords,
      totalRecords: total,
      totalCost,
    };
  },
};
