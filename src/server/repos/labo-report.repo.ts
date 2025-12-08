import { prisma } from "@/services/prisma/prisma";
import dayjs from "dayjs";

// ================================
// Types for Raw Data (from Prisma)
// ================================

export type RawKpiData = {
  totalOrders: number;
  totalCost: number;
  previousMonthOrders: number | null;
  previousMonthCost: number | null;
};

export type RawDailyData = {
  date: Date;
  orderCount: number;
  totalCost: number;
};

export type RawSupplierData = {
  supplierId: string;
  supplierName: string;
  orderCount: number;
  totalCost: number;
  avgCost: number;
  rank: number;
};

export type RawDoctorData = {
  doctorId: string;
  doctorName: string;
  orderCount: number;
  totalCost: number;
  rank: number;
};

export type RawServiceData = {
  serviceId: string;
  serviceName: string;
  supplierName: string;
  itemName: string;
  orderCount: number;
  totalCost: number;
  rank: number;
};

export type RawDetailRecord = {
  id: string;
  sendDate: Date;
  returnDate: Date | null;
  customerName: string;
  customerCode: string;
  customerId: string;
  doctorName: string;
  serviceName: string | null;
  supplierName: string;
  itemName: string;
  orderType: string;
  quantity: number;
  totalCost: number;
  treatmentDate: Date | null;
};

// ================================
// Query Parameters
// ================================

type BaseQueryParams = {
  month: string; // YYYY-MM
  clinicId?: string;
};

type DetailQueryParams = BaseQueryParams & {
  tab: "daily" | "supplier" | "doctor" | "service";
  key: string;
  page: number;
  pageSize: number;
};

// ================================
// Repository
// ================================

export const laboReportRepo = {
  // ========== Public Methods ==========

  /**
   * Get KPI data with MoM growth
   */
  async getKpiData(params: BaseQueryParams): Promise<RawKpiData> {
    const { startDate, endDate } = getMonthDateRange(params.month);
    const whereClause = buildWhereClause(startDate, endDate, params.clinicId);

    // Current month
    const current = await prisma.laboOrder.aggregate({
      where: whereClause,
      _count: true,
      _sum: { totalCost: true },
    });

    // Previous month
    const prevMonth = dayjs(params.month)
      .subtract(1, "month")
      .format("YYYY-MM");
    const prevData = await getPreviousMonthData(prevMonth, params.clinicId);

    return {
      totalOrders: current._count,
      totalCost: current._sum.totalCost || 0,
      previousMonthOrders: prevData.orders,
      previousMonthCost: prevData.cost,
    };
  },

  /**
   * Get daily breakdown by returnDate (ngày nhận mẫu)
   * Sort ASC chronological, no rank
   */
  async getDailyData(params: BaseQueryParams): Promise<RawDailyData[]> {
    const { startDate, endDate } = getMonthDateRange(params.month);
    const whereClause = buildWhereClause(startDate, endDate, params.clinicId);

    const orders = await prisma.laboOrder.findMany({
      where: whereClause,
      select: {
        returnDate: true,
        totalCost: true,
      },
    });

    // Group by returnDate
    const grouped = new Map<string, { count: number; cost: number }>();

    for (const order of orders) {
      if (!order.returnDate) continue; // Skip orders chưa nhận mẫu

      const dateKey = dayjs(order.returnDate).format("YYYY-MM-DD");
      const existing = grouped.get(dateKey) || { count: 0, cost: 0 };
      grouped.set(dateKey, {
        count: existing.count + 1,
        cost: existing.cost + order.totalCost,
      });
    }

    // Convert to array và sort ASC
    const result: RawDailyData[] = [];
    for (const [dateStr, data] of grouped.entries()) {
      result.push({
        date: new Date(dateStr),
        orderCount: data.count,
        totalCost: data.cost,
      });
    }

    return result.sort((a, b) => a.date.getTime() - b.date.getTime());
  },

  /**
   * Get supplier breakdown
   * Sort DESC by totalCost, assign rank
   */
  async getSupplierData(params: BaseQueryParams): Promise<RawSupplierData[]> {
    const { startDate, endDate } = getMonthDateRange(params.month);
    const whereClause = buildWhereClause(startDate, endDate, params.clinicId);

    const orders = await prisma.laboOrder.findMany({
      where: whereClause,
      select: {
        supplierId: true,
        totalCost: true,
        supplier: {
          select: { shortName: true },
        },
      },
    });

    // Group by supplierId
    const grouped = new Map<
      string,
      { name: string; count: number; cost: number }
    >();

    for (const order of orders) {
      const existing = grouped.get(order.supplierId) || {
        name: order.supplier.shortName,
        count: 0,
        cost: 0,
      };
      grouped.set(order.supplierId, {
        name: existing.name,
        count: existing.count + 1,
        cost: existing.cost + order.totalCost,
      });
    }

    // Convert to array, sort DESC, assign rank
    const result: RawSupplierData[] = [];
    for (const [supplierId, data] of grouped.entries()) {
      result.push({
        supplierId,
        supplierName: data.name,
        orderCount: data.count,
        totalCost: data.cost,
        avgCost: data.cost / data.count,
        rank: 0, // Will assign below
      });
    }

    result.sort((a, b) => b.totalCost - a.totalCost);

    // Assign rank
    result.forEach((item, index) => {
      item.rank = index + 1;
    });

    return result;
  },

  /**
   * Get doctor breakdown (sentBy)
   * Sort DESC by totalCost, assign rank
   */
  async getDoctorData(params: BaseQueryParams): Promise<RawDoctorData[]> {
    const { startDate, endDate } = getMonthDateRange(params.month);
    const whereClause = buildWhereClause(startDate, endDate, params.clinicId);

    const orders = await prisma.laboOrder.findMany({
      where: whereClause,
      select: {
        doctorId: true,
        totalCost: true,
        doctor: {
          select: { fullName: true },
        },
      },
    });

    // Group by doctorId
    const grouped = new Map<
      string,
      { name: string; count: number; cost: number }
    >();

    for (const order of orders) {
      const existing = grouped.get(order.doctorId) || {
        name: order.doctor.fullName,
        count: 0,
        cost: 0,
      };
      grouped.set(order.doctorId, {
        name: existing.name,
        count: existing.count + 1,
        cost: existing.cost + order.totalCost,
      });
    }

    // Convert, sort DESC, assign rank
    const result: RawDoctorData[] = [];
    for (const [doctorId, data] of grouped.entries()) {
      result.push({
        doctorId,
        doctorName: data.name,
        orderCount: data.count,
        totalCost: data.cost,
        rank: 0,
      });
    }

    result.sort((a, b) => b.totalCost - a.totalCost);

    result.forEach((item, index) => {
      item.rank = index + 1;
    });

    return result;
  },

  /**
   * Get service breakdown (laboService)
   * Sort DESC by totalCost, assign rank
   */
  async getServiceData(params: BaseQueryParams): Promise<RawServiceData[]> {
    const { startDate, endDate } = getMonthDateRange(params.month);
    const whereClause = buildWhereClause(startDate, endDate, params.clinicId);

    const orders = await prisma.laboOrder.findMany({
      where: whereClause,
      select: {
        laboServiceId: true,
        totalCost: true,
        laboService: {
          select: {
            supplier: { select: { shortName: true } },
            laboItem: { select: { name: true } },
          },
        },
      },
    });

    // Group by laboServiceId
    const grouped = new Map<
      string,
      {
        name: string;
        supplierName: string;
        itemName: string;
        count: number;
        cost: number;
      }
    >();

    for (const order of orders) {
      if (!order.laboServiceId || !order.laboService) continue;

      const existing = grouped.get(order.laboServiceId) || {
        name: order.laboService.laboItem.name, // Service name is actually the laboItem name
        supplierName: order.laboService.supplier.shortName,
        itemName: order.laboService.laboItem.name,
        count: 0,
        cost: 0,
      };
      grouped.set(order.laboServiceId, {
        name: existing.name,
        supplierName: existing.supplierName,
        itemName: existing.itemName,
        count: existing.count + 1,
        cost: existing.cost + order.totalCost,
      });
    }

    // Convert, sort DESC, assign rank
    const result: RawServiceData[] = [];
    for (const [serviceId, data] of grouped.entries()) {
      result.push({
        serviceId,
        serviceName: data.name,
        supplierName: data.supplierName,
        itemName: data.itemName,
        orderCount: data.count,
        totalCost: data.cost,
        rank: 0,
      });
    }

    result.sort((a, b) => b.totalCost - a.totalCost);

    result.forEach((item, index) => {
      item.rank = index + 1;
    });

    return result;
  },

  /**
   * Get detail records for drill-down panel
   */
  async getDetailRecords(
    params: DetailQueryParams
  ): Promise<{ records: RawDetailRecord[]; total: number }> {
    const { startDate, endDate } = getMonthDateRange(params.month);
    let whereClause = buildWhereClause(startDate, endDate, params.clinicId);

    // Additional filter by dimension
    if (params.tab === "daily") {
      const targetDate = new Date(params.key);
      whereClause = {
        ...whereClause,
        returnDate: {
          gte: dayjs(targetDate).startOf("day").toDate(),
          lte: dayjs(targetDate).endOf("day").toDate(),
        },
      };
    } else if (params.tab === "supplier") {
      whereClause = { ...whereClause, supplierId: params.key };
    } else if (params.tab === "doctor") {
      whereClause = { ...whereClause, doctorId: params.key };
    } else if (params.tab === "service") {
      whereClause = { ...whereClause, laboServiceId: params.key };
    }

    const [records, total] = await Promise.all([
      prisma.laboOrder.findMany({
        where: whereClause,
        select: {
          id: true,
          sendDate: true,
          returnDate: true,
          orderType: true,
          quantity: true,
          totalCost: true,
          treatmentDate: true,
          customer: {
            select: {
              id: true,
              fullName: true,
              customerCode: true,
            },
          },
          doctor: {
            select: { fullName: true },
          },
          supplier: {
            select: { shortName: true },
          },
          laboItem: {
            select: { name: true },
          },
          laboService: {
            select: {
              laboItem: { select: { name: true } },
            },
          },
        },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        orderBy: { sendDate: "desc" },
      }),
      prisma.laboOrder.count({ where: whereClause }),
    ]);

    return {
      records: records.map((r) => ({
        id: r.id,
        sendDate: r.sendDate,
        returnDate: r.returnDate,
        customerName: r.customer.fullName,
        customerCode: r.customer.customerCode,
        customerId: r.customer.id,
        doctorName: r.doctor.fullName,
        serviceName: r.laboService?.laboItem.name || null,
        supplierName: r.supplier.shortName,
        itemName: r.laboItem.name,
        orderType: r.orderType,
        quantity: r.quantity,
        totalCost: r.totalCost,
        treatmentDate: r.treatmentDate,
      })),
      total,
    };
  },

  // ========== Private Helpers ==========
};

/**
 * Parse month string to date range
 */
function getMonthDateRange(month: string) {
  const startDate = dayjs(month).startOf("month").toDate();
  const endDate = dayjs(month).endOf("month").toDate();
  return { startDate, endDate };
}

/**
 * Build where clause for base filter
 */
function buildWhereClause(startDate: Date, endDate: Date, clinicId?: string) {
  const where: any = {
    sendDate: { gte: startDate, lte: endDate },
  };

  if (clinicId) {
    where.clinicId = clinicId;
  }

  return where;
}

/**
 * Query previous month for MoM growth
 */
async function getPreviousMonthData(month: string, clinicId?: string) {
  const { startDate, endDate } = getMonthDateRange(month);
  const whereClause = buildWhereClause(startDate, endDate, clinicId);

  const prev = await prisma.laboOrder.aggregate({
    where: whereClause,
    _count: true,
    _sum: { totalCost: true },
  });

  return {
    orders: prev._count || null,
    cost: prev._sum.totalCost || null,
  };
}
