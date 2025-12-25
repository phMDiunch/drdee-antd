import { prisma } from "@/services/prisma/prisma";
import type {
  GetSalesSummaryQuery,
  GetSalesDetailQuery,
} from "@/shared/validation/sales-report.schema";

/**
 * Sales Report Repository
 * Data access layer for sales reports
 * Uses Zod types from shared/validation for type safety
 */

/**
 * Raw data structure from database for aggregations
 */
export interface RawDailyData {
  date: string;
  customersVisited: number;
  consultations: number;
  closed: number;
  revenue: number;
}

export interface RawSourceData {
  source: string | null;
  customersVisited: number;
  consultations: number;
  closed: number;
  revenue: number;
}

export interface RawServiceData {
  serviceGroup: string | null;
  customersVisited: number;
  consultations: number;
  closed: number;
  revenue: number;
}

export interface RawDepartmentData {
  department: string | null;
  customersVisited: number;
  consultations: number;
  closed: number;
  revenue: number;
}

export interface RawEmployeeData {
  id: string;
  fullName: string;
  customersVisited: number;
  consultations: number;
  closed: number;
  revenue: number;
}

/**
 * Các kiểu dữ liệu helper nội bộ cho tổng hợp dữ liệu
 */
type AggregationMap = Map<
  string | null,
  {
    fullName?: string;
    customersVisited: Set<string>;
    consultations: number;
    closed: number;
    revenue: number;
  }
>;

type ServiceRecord = {
  serviceConfirmDate?: Date | null;
  consultationDate?: Date | null;
  customerId: string;
  finalPrice?: number;
  [key: string]: unknown;
};

export const salesReportRepo = {
  /**
   * Get date range for a given month
   */
  getMonthDateRange(month: string) {
    const [year, monthNum] = month.split("-").map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    return { startDate, endDate };
  },

  /**
   * Helper: Lấy TẤT CẢ dữ liệu aggregation (1 lần query duy nhất)
   * Query song song closedServices và allConsultations với đầy đủ relations
   */
  async queryAllAggregationData(
    startDate: Date,
    endDate: Date,
    clinicId: string | undefined
  ) {
    const [closedServices, allConsultations] = await Promise.all([
      prisma.consultedService.findMany({
        where: {
          serviceStatus: "Đã chốt",
          serviceConfirmDate: { gte: startDate, lte: endDate },
          ...(clinicId && { clinicId }),
        },
        select: {
          serviceConfirmDate: true,
          consultationDate: true,
          customerId: true,
          finalPrice: true,
          customer: { select: { source: true } },
          dentalService: { select: { serviceGroup: true, department: true } },
          consultingSale: { select: { id: true, fullName: true } },
          consultingDoctor: { select: { id: true, fullName: true } },
        },
      }),
      prisma.consultedService.findMany({
        where: {
          consultationDate: { gte: startDate, lte: endDate },
          ...(clinicId && { clinicId }),
        },
        select: {
          consultationDate: true,
          customerId: true,
          customer: { select: { source: true } },
          dentalService: { select: { serviceGroup: true, department: true } },
          consultingSale: { select: { id: true, fullName: true } },
          consultingDoctor: { select: { id: true, fullName: true } },
        },
      }),
    ]);

    return { closedServices, allConsultations };
  },

  /**
   * Helper: Tổng hợp số lượt tư vấn vào Map
   * Hàm helper nội bộ (private)
   */
  aggregateConsultations(
    allServices: ServiceRecord[],
    getKey: (service: ServiceRecord) => string | null,
    getMetadata?: (service: ServiceRecord) => { fullName?: string }
  ): AggregationMap {
    const map: AggregationMap = new Map();

    allServices.forEach((service) => {
      const key = getKey(service);
      if (!map.has(key)) {
        map.set(key, {
          ...getMetadata?.(service),
          customersVisited: new Set(),
          consultations: 0,
          closed: 0,
          revenue: 0,
        });
      }
      const data = map.get(key)!;
      data.customersVisited.add(service.customerId);
      data.consultations++;
    });

    return map;
  },

  /**
   * Helper: Tổng hợp dịch vụ đã chốt vào Map có sẵn
   * Hàm helper nội bộ (private)
   */
  aggregateClosedDeals(
    services: ServiceRecord[],
    map: AggregationMap,
    getKey: (service: ServiceRecord) => string | null,
    getMetadata?: (service: ServiceRecord) => { fullName?: string }
  ): void {
    services.forEach((service) => {
      if (!service.serviceConfirmDate) return;
      const key = getKey(service);
      if (!map.has(key)) {
        map.set(key, {
          ...getMetadata?.(service),
          customersVisited: new Set(),
          consultations: 0,
          closed: 0,
          revenue: 0,
        });
      }
      const data = map.get(key)!;
      data.closed++;
      data.revenue += service.finalPrice || 0;
    });
  },

  /**
   * Get KPI data for the month
   */
  async getKpiData(params: GetSalesSummaryQuery) {
    const { month, clinicId } = params;
    const { startDate, endDate } = this.getMonthDateRange(month);

    // Tính toán tháng trước và cùng kỳ năm ngoái
    const [year, monthNum] = month.split("-").map(Number);
    const prevMonth = new Date(year, monthNum - 2, 1);
    const prevMonthEnd = new Date(year, monthNum - 1, 0, 23, 59, 59, 999);
    const sameMonthLastYear = new Date(year - 1, monthNum - 1, 1);
    const sameMonthLastYearEnd = new Date(
      year - 1,
      monthNum,
      0,
      23,
      59,
      59,
      999
    );

    const baseWhere = {
      serviceStatus: "Đã chốt",
      ...(clinicId && { clinicId }),
    };

    // Chỉ select các field cần thiết, không JOIN customer
    const selectFields = {
      finalPrice: true,
      customerId: true,
      customer: {
        select: {
          createdAt: true,
        },
      },
    };

    // Chạy 3 queries song song để tăng hiệu suất
    const [currentMonthServices, prevMonthServices, lastYearServices] =
      await Promise.all([
        // Dữ liệu tháng hiện tại
        prisma.consultedService.findMany({
          where: {
            ...baseWhere,
            serviceConfirmDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: selectFields,
        }),
        // Dữ liệu tháng trước
        prisma.consultedService.findMany({
          where: {
            ...baseWhere,
            serviceConfirmDate: {
              gte: prevMonth,
              lte: prevMonthEnd,
            },
          },
          select: selectFields,
        }),
        // Dữ liệu cùng kỳ năm ngoái
        prisma.consultedService.findMany({
          where: {
            ...baseWhere,
            serviceConfirmDate: {
              gte: sameMonthLastYear,
              lte: sameMonthLastYearEnd,
            },
          },
          select: selectFields,
        }),
      ]);

    // Helper: Tính metrics cho một khoảng thời gian
    const calculatePeriodMetrics = (
      services: Array<{
        finalPrice: number;
        customerId: string;
        customer: { createdAt: Date };
      }>,
      periodStart: Date,
      periodEnd: Date
    ) => {
      let totalSales = 0;
      let newCustomerSales = 0;
      const newCustomerIds = new Set<string>();

      // Chỉ duyệt 1 lần để tính tất cả metrics
      services.forEach((s) => {
        totalSales += s.finalPrice;

        const isNewCustomer =
          s.customer.createdAt >= periodStart &&
          s.customer.createdAt <= periodEnd;

        if (isNewCustomer) {
          newCustomerIds.add(s.customerId);
          newCustomerSales += s.finalPrice;
        }
      });

      return {
        totalSales,
        closedDeals: services.length,
        newCustomers: newCustomerIds.size,
        newCustomerSales,
        oldCustomerSales: totalSales - newCustomerSales,
      };
    };

    // Helper: Tính % tăng trưởng
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Tính metrics cho 3 kỳ
    const current = calculatePeriodMetrics(
      currentMonthServices,
      startDate,
      endDate
    );
    const prev = calculatePeriodMetrics(
      prevMonthServices,
      prevMonth,
      prevMonthEnd
    );
    const lastYear = calculatePeriodMetrics(
      lastYearServices,
      sameMonthLastYear,
      sameMonthLastYearEnd
    );

    return {
      totalSales: current.totalSales,
      totalSalesGrowthMoM: calculateGrowth(current.totalSales, prev.totalSales),
      totalSalesGrowthYoY: calculateGrowth(
        current.totalSales,
        lastYear.totalSales
      ),

      closedDeals: current.closedDeals,
      closedDealsGrowthMoM: calculateGrowth(
        current.closedDeals,
        prev.closedDeals
      ),
      closedDealsGrowthYoY: calculateGrowth(
        current.closedDeals,
        lastYear.closedDeals
      ),

      newCustomers: current.newCustomers,
      newCustomersGrowthMoM: calculateGrowth(
        current.newCustomers,
        prev.newCustomers
      ),
      newCustomersGrowthYoY: calculateGrowth(
        current.newCustomers,
        lastYear.newCustomers
      ),

      newCustomerSales: current.newCustomerSales,
      oldCustomerSales: current.oldCustomerSales,
      newCustomerGrowth: calculateGrowth(
        current.newCustomerSales,
        prev.newCustomerSales
      ),
    };
  },

  /**
   * Helper: Group dữ liệu theo dimension từ raw data
   * Hàm helper nội bộ (private) - dùng chung cho tất cả các dimension
   */
  groupByDimension<T>(
    rawData: {
      closedServices: ServiceRecord[];
      allConsultations: ServiceRecord[];
    },
    config: {
      getKey: (service: ServiceRecord) => string | null;
      getMetadata?: (service: ServiceRecord) => { fullName?: string };
      mapResult: (
        key: string | null,
        data: {
          fullName?: string;
          customersVisited: Set<string>;
          consultations: number;
          closed: number;
          revenue: number;
        }
      ) => T;
      filterNull?: boolean; // true cho sale/doctor, false cho các dimension khác
    }
  ): T[] {
    // Tổng hợp số lượt tư vấn
    const map = this.aggregateConsultations(
      rawData.allConsultations,
      config.getKey,
      config.getMetadata
    );

    // Tổng hợp dịch vụ đã chốt
    this.aggregateClosedDeals(
      rawData.closedServices,
      map,
      config.getKey,
      config.getMetadata
    );

    // Chuyển đổi Map thành array và áp dụng filter nếu cần
    let entries = Array.from(map.entries());

    if (config.filterNull) {
      entries = entries.filter(([key]) => key !== null);
    }

    return entries.map(([key, data]) => config.mapResult(key, data));
  },

  /**
   * Get daily breakdown data
   * Sort by date ASC (mapper sẽ sort thêm 1 lần by revenue để tính rank)
   */
  async getDailyData(params: GetSalesSummaryQuery): Promise<RawDailyData[]> {
    const { month, clinicId } = params;
    const { startDate, endDate } = this.getMonthDateRange(month);
    const rawData = await this.queryAllAggregationData(
      startDate,
      endDate,
      clinicId
    );

    const result = this.groupByDimension(rawData, {
      getKey: (s) => s.consultationDate?.toISOString().split("T")[0] || "",
      mapResult: (date, data) => ({
        date: date!,
        customersVisited: data.customersVisited.size,
        consultations: data.consultations,
        closed: data.closed,
        revenue: data.revenue,
      }),
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  },

  /**
   * Get source breakdown data
   * Sort by revenue DESC
   */
  async getSourceData(params: GetSalesSummaryQuery): Promise<RawSourceData[]> {
    const { month, clinicId } = params;
    const { startDate, endDate } = this.getMonthDateRange(month);
    const rawData = await this.queryAllAggregationData(
      startDate,
      endDate,
      clinicId
    );

    const result = this.groupByDimension(rawData, {
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

    return result.sort((a, b) => b.revenue - a.revenue);
  },

  /**
   * Get service breakdown data
   * Sort by revenue DESC
   */
  async getServiceData(
    params: GetSalesSummaryQuery
  ): Promise<RawServiceData[]> {
    const { month, clinicId } = params;
    const { startDate, endDate } = this.getMonthDateRange(month);
    const rawData = await this.queryAllAggregationData(
      startDate,
      endDate,
      clinicId
    );

    const result = this.groupByDimension(rawData, {
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

    return result.sort((a, b) => b.revenue - a.revenue);
  },

  /**
   * Get department breakdown data
   * Sort by revenue DESC
   */
  async getDepartmentData(
    params: GetSalesSummaryQuery
  ): Promise<RawDepartmentData[]> {
    const { month, clinicId } = params;
    const { startDate, endDate } = this.getMonthDateRange(month);
    const rawData = await this.queryAllAggregationData(
      startDate,
      endDate,
      clinicId
    );

    const result = this.groupByDimension(rawData, {
      getKey: (s) =>
        (s as unknown as { dentalService: { department: string | null } })
          .dentalService.department,
      mapResult: (department, data) => ({
        department,
        customersVisited: data.customersVisited.size,
        consultations: data.consultations,
        closed: data.closed,
        revenue: data.revenue,
      }),
    });

    return result.sort((a, b) => b.revenue - a.revenue);
  },

  /**
   * Get sale performance data
   * Sort by revenue DESC
   */
  async getSaleData(params: GetSalesSummaryQuery): Promise<RawEmployeeData[]> {
    const { month, clinicId } = params;
    const { startDate, endDate } = this.getMonthDateRange(month);
    const rawData = await this.queryAllAggregationData(
      startDate,
      endDate,
      clinicId
    );

    const result = this.groupByDimension(rawData, {
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

    return result.sort((a, b) => b.revenue - a.revenue);
  },

  /**
   * Get doctor performance data
   * Sort by revenue DESC
   */
  async getDoctorData(
    params: GetSalesSummaryQuery
  ): Promise<RawEmployeeData[]> {
    const { month, clinicId } = params;
    const { startDate, endDate } = this.getMonthDateRange(month);
    const rawData = await this.queryAllAggregationData(
      startDate,
      endDate,
      clinicId
    );

    const result = this.groupByDimension(rawData, {
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

    return result.sort((a, b) => b.revenue - a.revenue);
  },

  /**
   * Get detail records for a specific tab/key combination
   */
  async getDetailRecords(params: GetSalesDetailQuery) {
    const { month, clinicId, tab, key } = params;
    const { startDate, endDate } = this.getMonthDateRange(month);

    const baseWhere = {
      // Hiển thị tất cả dịch vụ (cả "Đã chốt" và "Chưa chốt")
      consultationDate: {
        gte: startDate,
        lte: endDate,
      },
      ...(clinicId && { clinicId }),
    };

    // Xây dựng bộ lọc bổ sung theo tab
    let additionalWhere = {};
    switch (tab) {
      case "daily":
        // Phân tích chuỗi ngày (YYYY-MM-DD) và tạo khoảng thời gian cho cả ngày
        // Lọc theo consultationDate (ngày tư vấn) để hiển thị cả dịch vụ chưa chốt
        const [year, monthNum, day] = key.split("-").map(Number);
        const keyDate = new Date(year, monthNum - 1, day, 0, 0, 0, 0);
        const keyDateEnd = new Date(year, monthNum - 1, day, 23, 59, 59, 999);
        additionalWhere = {
          consultationDate: {
            gte: keyDate,
            lte: keyDateEnd,
          },
        };
        break;
      case "source":
        additionalWhere = {
          customer: {
            source: key === "null" ? null : key,
          },
        };
        break;
      case "department":
        additionalWhere = {
          dentalService: {
            department: key === "null" ? null : key,
          },
        };
        break;
      case "service":
        additionalWhere = {
          dentalService: {
            serviceGroup: key === "null" ? null : key,
          },
        };
        break;
      case "sale":
        additionalWhere = {
          consultingSaleId: key,
        };
        break;
      case "doctor":
        additionalWhere = {
          consultingDoctorId: key,
        };
        break;
    }

    const services = await prisma.consultedService.findMany({
      where: {
        ...baseWhere,
        ...additionalWhere,
      },
      select: {
        id: true,
        consultationDate: true,
        serviceStatus: true,
        serviceConfirmDate: true,
        finalPrice: true,
        customerId: true,
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            source: true,
            sourceNotes: true,
            customerCode: true,
          },
        },
        dentalService: {
          select: {
            id: true,
            name: true,
            serviceGroup: true,
            department: true,
          },
        },
        consultingSale: {
          select: {
            id: true,
            fullName: true,
          },
        },
        consultingDoctor: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        consultationDate: "desc",
      },
    });

    return services;
  },
};
