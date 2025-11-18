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

export interface RawEmployeeData {
  id: string;
  fullName: string;
  customersVisited: number;
  consultations: number;
  closed: number;
  revenue: number;
}

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
   * Get KPI data for the month
   */
  async getKpiData(params: GetSalesSummaryQuery) {
    const { month, clinicId } = params;
    const { startDate, endDate } = this.getMonthDateRange(month);

    // Calculate previous month and same month last year
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

    // Current month data
    const currentMonthServices = await prisma.consultedService.findMany({
      where: {
        ...baseWhere,
        serviceConfirmDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    });

    // Previous month data
    const prevMonthServices = await prisma.consultedService.findMany({
      where: {
        ...baseWhere,
        serviceConfirmDate: {
          gte: prevMonth,
          lte: prevMonthEnd,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    });

    // Same month last year data
    const lastYearServices = await prisma.consultedService.findMany({
      where: {
        ...baseWhere,
        serviceConfirmDate: {
          gte: sameMonthLastYear,
          lte: sameMonthLastYearEnd,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    });

    // Calculate metrics
    const totalSales = currentMonthServices.reduce(
      (sum, s) => sum + s.finalPrice,
      0
    );
    const closedDeals = currentMonthServices.length;

    // New customers: createdAt in current month
    const newCustomers = new Set(
      currentMonthServices
        .filter(
          (s) =>
            s.customer.createdAt >= startDate && s.customer.createdAt <= endDate
        )
        .map((s) => s.customerId)
    ).size;

    // New vs old customer sales
    const newCustomerSales = currentMonthServices
      .filter(
        (s) =>
          s.customer.createdAt >= startDate && s.customer.createdAt <= endDate
      )
      .reduce((sum, s) => sum + s.finalPrice, 0);
    const oldCustomerSales = totalSales - newCustomerSales;

    // Previous month metrics
    const prevMonthSales = prevMonthServices.reduce(
      (sum, s) => sum + s.finalPrice,
      0
    );
    const prevMonthDeals = prevMonthServices.length;
    const prevMonthNewCustomers = new Set(
      prevMonthServices
        .filter(
          (s) =>
            s.customer.createdAt >= prevMonth &&
            s.customer.createdAt <= prevMonthEnd
        )
        .map((s) => s.customerId)
    ).size;
    const prevMonthNewCustomerSales = prevMonthServices
      .filter(
        (s) =>
          s.customer.createdAt >= prevMonth &&
          s.customer.createdAt <= prevMonthEnd
      )
      .reduce((sum, s) => sum + s.finalPrice, 0);

    // Last year metrics
    const lastYearSales = lastYearServices.reduce(
      (sum, s) => sum + s.finalPrice,
      0
    );
    const lastYearDeals = lastYearServices.length;
    const lastYearNewCustomers = new Set(
      lastYearServices
        .filter(
          (s) =>
            s.customer.createdAt >= sameMonthLastYear &&
            s.customer.createdAt <= sameMonthLastYearEnd
        )
        .map((s) => s.customerId)
    ).size;

    // Calculate growth percentages
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      totalSales,
      totalSalesGrowthMoM: calculateGrowth(totalSales, prevMonthSales),
      totalSalesGrowthYoY: calculateGrowth(totalSales, lastYearSales),

      closedDeals,
      closedDealsGrowthMoM: calculateGrowth(closedDeals, prevMonthDeals),
      closedDealsGrowthYoY: calculateGrowth(closedDeals, lastYearDeals),

      newCustomers,
      newCustomersGrowthMoM: calculateGrowth(
        newCustomers,
        prevMonthNewCustomers
      ),
      newCustomersGrowthYoY: calculateGrowth(
        newCustomers,
        lastYearNewCustomers
      ),

      newCustomerSales,
      oldCustomerSales,
      newCustomerGrowth: calculateGrowth(
        newCustomerSales,
        prevMonthNewCustomerSales
      ),
    };
  },

  /**
   * Get daily breakdown data
   */
  async getDailyData(params: GetSalesSummaryQuery): Promise<RawDailyData[]> {
    const { month, clinicId } = params;
    const { startDate, endDate } = this.getMonthDateRange(month);

    const services = await prisma.consultedService.findMany({
      where: {
        serviceStatus: "Đã chốt",
        serviceConfirmDate: {
          gte: startDate,
          lte: endDate,
        },
        ...(clinicId && { clinicId }),
      },
      include: {
        customer: {
          select: {
            id: true,
          },
        },
      },
    });

    // Get all consulted services (not just closed) for consultations count
    const allServices = await prisma.consultedService.findMany({
      where: {
        consultationDate: {
          gte: startDate,
          lte: endDate,
        },
        ...(clinicId && { clinicId }),
      },
      select: {
        consultationDate: true,
        customerId: true,
      },
    });

    // Group by date
    const dailyMap = new Map<
      string,
      {
        customersVisited: Set<string>;
        consultations: number;
        closed: number;
        revenue: number;
      }
    >();

    // Count consultations
    allServices.forEach((service) => {
      const date = service.consultationDate.toISOString().split("T")[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          customersVisited: new Set(),
          consultations: 0,
          closed: 0,
          revenue: 0,
        });
      }
      const day = dailyMap.get(date)!;
      day.customersVisited.add(service.customerId);
      day.consultations++;
    });

    // Count closed deals - group by serviceConfirmDate (ngày chốt)
    services.forEach((service) => {
      if (!service.serviceConfirmDate) return;
      const date = service.serviceConfirmDate.toISOString().split("T")[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          customersVisited: new Set(),
          consultations: 0,
          closed: 0,
          revenue: 0,
        });
      }
      const day = dailyMap.get(date)!;
      day.closed++;
      day.revenue += service.finalPrice;
    });

    // Convert to array
    return Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      customersVisited: data.customersVisited.size,
      consultations: data.consultations,
      closed: data.closed,
      revenue: data.revenue,
    }));
  },

  /**
   * Get source breakdown data
   */
  async getSourceData(params: GetSalesSummaryQuery): Promise<RawSourceData[]> {
    const { month, clinicId } = params;
    const { startDate, endDate } = this.getMonthDateRange(month);

    const services = await prisma.consultedService.findMany({
      where: {
        serviceStatus: "Đã chốt",
        serviceConfirmDate: {
          gte: startDate,
          lte: endDate,
        },
        ...(clinicId && { clinicId }),
      },
      include: {
        customer: {
          select: {
            id: true,
            source: true,
          },
        },
      },
    });

    // Get all consulted services for consultations count
    const allServices = await prisma.consultedService.findMany({
      where: {
        consultationDate: {
          gte: startDate,
          lte: endDate,
        },
        ...(clinicId && { clinicId }),
      },
      include: {
        customer: {
          select: {
            id: true,
            source: true,
          },
        },
      },
    });

    // Group by source
    const sourceMap = new Map<
      string | null,
      {
        customersVisited: Set<string>;
        consultations: number;
        closed: number;
        revenue: number;
      }
    >();

    // Count consultations
    allServices.forEach((service) => {
      const source = service.customer.source;
      if (!sourceMap.has(source)) {
        sourceMap.set(source, {
          customersVisited: new Set(),
          consultations: 0,
          closed: 0,
          revenue: 0,
        });
      }
      const sourceData = sourceMap.get(source)!;
      sourceData.customersVisited.add(service.customerId);
      sourceData.consultations++;
    });

    // Count closed deals
    services.forEach((service) => {
      const source = service.customer.source;
      if (!sourceMap.has(source)) {
        sourceMap.set(source, {
          customersVisited: new Set(),
          consultations: 0,
          closed: 0,
          revenue: 0,
        });
      }
      const sourceData = sourceMap.get(source)!;
      sourceData.closed++;
      sourceData.revenue += service.finalPrice;
    });

    return Array.from(sourceMap.entries()).map(([source, data]) => ({
      source,
      customersVisited: data.customersVisited.size,
      consultations: data.consultations,
      closed: data.closed,
      revenue: data.revenue,
    }));
  },

  /**
   * Get service breakdown data
   */
  async getServiceData(
    params: GetSalesSummaryQuery
  ): Promise<RawServiceData[]> {
    const { month, clinicId } = params;
    const { startDate, endDate } = this.getMonthDateRange(month);

    const services = await prisma.consultedService.findMany({
      where: {
        serviceStatus: "Đã chốt",
        serviceConfirmDate: {
          gte: startDate,
          lte: endDate,
        },
        ...(clinicId && { clinicId }),
      },
      include: {
        customer: {
          select: {
            id: true,
          },
        },
        dentalService: {
          select: {
            serviceGroup: true,
          },
        },
      },
    });

    // Get all consulted services for consultations count
    const allServices = await prisma.consultedService.findMany({
      where: {
        consultationDate: {
          gte: startDate,
          lte: endDate,
        },
        ...(clinicId && { clinicId }),
      },
      include: {
        customer: {
          select: {
            id: true,
          },
        },
        dentalService: {
          select: {
            serviceGroup: true,
          },
        },
      },
    });

    // Group by service group
    const serviceMap = new Map<
      string | null,
      {
        customersVisited: Set<string>;
        consultations: number;
        closed: number;
        revenue: number;
      }
    >();

    // Count consultations
    allServices.forEach((service) => {
      const serviceGroup = service.dentalService.serviceGroup;
      if (!serviceMap.has(serviceGroup)) {
        serviceMap.set(serviceGroup, {
          customersVisited: new Set(),
          consultations: 0,
          closed: 0,
          revenue: 0,
        });
      }
      const serviceData = serviceMap.get(serviceGroup)!;
      serviceData.customersVisited.add(service.customerId);
      serviceData.consultations++;
    });

    // Count closed deals
    services.forEach((service) => {
      const serviceGroup = service.dentalService.serviceGroup;
      if (!serviceMap.has(serviceGroup)) {
        serviceMap.set(serviceGroup, {
          customersVisited: new Set(),
          consultations: 0,
          closed: 0,
          revenue: 0,
        });
      }
      const serviceData = serviceMap.get(serviceGroup)!;
      serviceData.closed++;
      serviceData.revenue += service.finalPrice;
    });

    return Array.from(serviceMap.entries()).map(([serviceGroup, data]) => ({
      serviceGroup,
      customersVisited: data.customersVisited.size,
      consultations: data.consultations,
      closed: data.closed,
      revenue: data.revenue,
    }));
  },

  /**
   * Get sale performance data
   */
  async getSaleData(params: GetSalesSummaryQuery): Promise<RawEmployeeData[]> {
    const { month, clinicId } = params;
    const { startDate, endDate } = this.getMonthDateRange(month);

    const services = await prisma.consultedService.findMany({
      where: {
        serviceStatus: "Đã chốt",
        serviceConfirmDate: {
          gte: startDate,
          lte: endDate,
        },
        consultingSaleId: { not: null },
        ...(clinicId && { clinicId }),
      },
      include: {
        customer: {
          select: {
            id: true,
          },
        },
        consultingSale: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Get all consulted services for consultations count
    const allServices = await prisma.consultedService.findMany({
      where: {
        consultationDate: {
          gte: startDate,
          lte: endDate,
        },
        consultingSaleId: { not: null },
        ...(clinicId && { clinicId }),
      },
      include: {
        customer: {
          select: {
            id: true,
          },
        },
        consultingSale: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Group by sale
    const saleMap = new Map<
      string,
      {
        fullName: string;
        customersVisited: Set<string>;
        consultations: number;
        closed: number;
        revenue: number;
      }
    >();

    // Count consultations
    allServices.forEach((service) => {
      if (!service.consultingSale) return;
      const saleId = service.consultingSale.id;
      if (!saleMap.has(saleId)) {
        saleMap.set(saleId, {
          fullName: service.consultingSale.fullName,
          customersVisited: new Set(),
          consultations: 0,
          closed: 0,
          revenue: 0,
        });
      }
      const saleData = saleMap.get(saleId)!;
      saleData.customersVisited.add(service.customerId);
      saleData.consultations++;
    });

    // Count closed deals
    services.forEach((service) => {
      if (!service.consultingSale) return;
      const saleId = service.consultingSale.id;
      if (!saleMap.has(saleId)) {
        saleMap.set(saleId, {
          fullName: service.consultingSale.fullName,
          customersVisited: new Set(),
          consultations: 0,
          closed: 0,
          revenue: 0,
        });
      }
      const saleData = saleMap.get(saleId)!;
      saleData.closed++;
      saleData.revenue += service.finalPrice;
    });

    return Array.from(saleMap.entries()).map(([id, data]) => ({
      id,
      fullName: data.fullName,
      customersVisited: data.customersVisited.size,
      consultations: data.consultations,
      closed: data.closed,
      revenue: data.revenue,
    }));
  },

  /**
   * Get doctor performance data
   */
  async getDoctorData(
    params: GetSalesSummaryQuery
  ): Promise<RawEmployeeData[]> {
    const { month, clinicId } = params;
    const { startDate, endDate } = this.getMonthDateRange(month);

    const services = await prisma.consultedService.findMany({
      where: {
        serviceStatus: "Đã chốt",
        serviceConfirmDate: {
          gte: startDate,
          lte: endDate,
        },
        consultingDoctorId: { not: null },
        ...(clinicId && { clinicId }),
      },
      include: {
        customer: {
          select: {
            id: true,
          },
        },
        consultingDoctor: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Get all consulted services for consultations count
    const allServices = await prisma.consultedService.findMany({
      where: {
        consultationDate: {
          gte: startDate,
          lte: endDate,
        },
        consultingDoctorId: { not: null },
        ...(clinicId && { clinicId }),
      },
      include: {
        customer: {
          select: {
            id: true,
          },
        },
        consultingDoctor: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Group by doctor
    const doctorMap = new Map<
      string,
      {
        fullName: string;
        customersVisited: Set<string>;
        consultations: number;
        closed: number;
        revenue: number;
      }
    >();

    // Count consultations
    allServices.forEach((service) => {
      if (!service.consultingDoctor) return;
      const doctorId = service.consultingDoctor.id;
      if (!doctorMap.has(doctorId)) {
        doctorMap.set(doctorId, {
          fullName: service.consultingDoctor.fullName,
          customersVisited: new Set(),
          consultations: 0,
          closed: 0,
          revenue: 0,
        });
      }
      const doctorData = doctorMap.get(doctorId)!;
      doctorData.customersVisited.add(service.customerId);
      doctorData.consultations++;
    });

    // Count closed deals
    services.forEach((service) => {
      if (!service.consultingDoctor) return;
      const doctorId = service.consultingDoctor.id;
      if (!doctorMap.has(doctorId)) {
        doctorMap.set(doctorId, {
          fullName: service.consultingDoctor.fullName,
          customersVisited: new Set(),
          consultations: 0,
          closed: 0,
          revenue: 0,
        });
      }
      const doctorData = doctorMap.get(doctorId)!;
      doctorData.closed++;
      doctorData.revenue += service.finalPrice;
    });

    return Array.from(doctorMap.entries()).map(([id, data]) => ({
      id,
      fullName: data.fullName,
      customersVisited: data.customersVisited.size,
      consultations: data.consultations,
      closed: data.closed,
      revenue: data.revenue,
    }));
  },

  /**
   * Get detail records for a specific tab/key combination
   */
  async getDetailRecords(params: GetSalesDetailQuery) {
    const { month, clinicId, tab, key } = params;
    const { startDate, endDate } = this.getMonthDateRange(month);

    const baseWhere = {
      // Show all services (both "Đã chốt" and "Chưa chốt")
      consultationDate: {
        gte: startDate,
        lte: endDate,
      },
      ...(clinicId && { clinicId }),
    };

    // Build additional filters based on tab
    let additionalWhere = {};
    switch (tab) {
      case "daily":
        // Parse date string (YYYY-MM-DD) and create date range for the full day
        // Filter by consultationDate (ngày tư vấn) để hiển thị cả dịch vụ chưa chốt
        const [year, month, day] = key.split("-").map(Number);
        const keyDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        const keyDateEnd = new Date(year, month - 1, day, 23, 59, 59, 999);
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
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            source: true,
          },
        },
        dentalService: {
          select: {
            id: true,
            name: true,
            serviceGroup: true,
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
