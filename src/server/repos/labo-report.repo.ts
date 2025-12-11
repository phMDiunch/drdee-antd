import { prisma } from "@/services/prisma/prisma";

// ================================
// Types for Raw Data (from Prisma)
// ================================

export interface RawKpiData {
  totalOrders: number;
  totalCost: number;
  totalOrdersGrowthMoM: number | null;
  totalCostGrowthMoM: number | null;
  previousMonthOrders: number | null;
  previousMonthCost: number | null;
}

export interface RawDailyData {
  date: Date;
  orderCount: number;
  totalCost: number;
}

export interface RawSupplierData {
  supplierId: string;
  supplierShortName: string | null;
  orderCount: number;
  totalCost: number;
  rank: number;
}

export interface RawDoctorData {
  doctorId: string;
  doctorName: string;
  orderCount: number;
  totalCost: number;
  rank: number;
}

export interface RawServiceData {
  serviceId: string;
  serviceName: string;
  supplierShortName: string | null;
  itemName: string;
  orderCount: number;
  totalCost: number;
  rank: number;
}

// ================================
// Query Parameters
// ================================

type BaseQueryParams = {
  month: string; // YYYY-MM
  clinicId?: string;
};

// ================================
// Repository
// ================================

export const laboReportRepo = {
  /**
   * Query TẤT CẢ orders trong tháng (1 lần query duy nhất)
   * Với đầy đủ relations cần thiết cho tất cả dimensions
   */
  async queryAllOrders(params: BaseQueryParams) {
    const { startDate, endDate } = this.getMonthDateRange(params.month);
    const whereClause = buildWhereClause(startDate, endDate, params.clinicId);

    const orders = await prisma.laboOrder.findMany({
      where: whereClause,
      select: {
        id: true,
        sentDate: true,
        returnDate: true,
        orderType: true,
        quantity: true,
        unitPrice: true,
        totalCost: true,
        treatmentDate: true,
        supplierId: true,
        doctorId: true,
        laboServiceId: true,
        customer: {
          select: {
            id: true,
            fullName: true,
            customerCode: true,
          },
        },
        supplier: {
          select: { shortName: true },
        },
        doctor: {
          select: { fullName: true },
        },
        laboItem: {
          select: { name: true },
        },
        laboService: {
          select: {
            supplier: { select: { shortName: true } },
            laboItem: { select: { name: true } },
          },
        },
      },
    });

    return orders;
  },

  /**
   * Get KPI data với data có sẵn (không query DB)
   */
  computeKpiData(
    orders: Awaited<ReturnType<typeof this.queryAllOrders>>,
    previousMonthOrders: number | null,
    previousMonthCost: number | null
  ): RawKpiData {
    const totalOrders = orders.length;
    const totalCost = orders.reduce((sum, o) => sum + o.totalCost, 0);

    // Calculate growth
    const totalOrdersGrowthMoM =
      previousMonthOrders && previousMonthOrders > 0
        ? ((totalOrders - previousMonthOrders) / previousMonthOrders) * 100
        : null;

    const totalCostGrowthMoM =
      previousMonthCost && previousMonthCost > 0
        ? ((totalCost - previousMonthCost) / previousMonthCost) * 100
        : null;

    return {
      totalOrders,
      totalCost,
      totalOrdersGrowthMoM,
      totalCostGrowthMoM,
      previousMonthOrders,
      previousMonthCost,
    };
  },

  /**
   * Get daily breakdown với data có sẵn (không query DB)
   * Sort ASC chronological, no rank
   */
  computeDailyData(
    orders: Awaited<ReturnType<typeof this.queryAllOrders>>
  ): RawDailyData[] {
    // Group by returnDate
    const grouped = new Map<string, { count: number; cost: number }>();

    for (const order of orders) {
      if (!order.returnDate) continue; // Skip orders chưa nhận mẫu

      const dateKey = order.returnDate.toISOString().split("T")[0];
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
   * Get supplier breakdown với data có sẵn (không query DB)
   * Sort DESC by totalCost, assign rank
   */
  computeSupplierData(
    orders: Awaited<ReturnType<typeof this.queryAllOrders>>
  ): RawSupplierData[] {
    // Group by supplierId
    const grouped = new Map<
      string,
      { name: string | null; count: number; cost: number }
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
        supplierShortName: data.name,
        orderCount: data.count,
        totalCost: data.cost,
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
   * Get doctor breakdown với data có sẵn (không query DB)
   * Sort DESC by totalCost, assign rank
   */
  computeDoctorData(
    orders: Awaited<ReturnType<typeof this.queryAllOrders>>
  ): RawDoctorData[] {
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
   * Get service breakdown với data có sẵn (không query DB)
   * Sort DESC by totalCost, assign rank
   */
  computeServiceData(
    orders: Awaited<ReturnType<typeof this.queryAllOrders>>
  ): RawServiceData[] {
    // Group by laboServiceId
    const grouped = new Map<
      string,
      {
        name: string;
        supplierShortName: string | null;
        itemName: string;
        count: number;
        cost: number;
      }
    >();

    for (const order of orders) {
      if (!order.laboServiceId || !order.laboService) continue;

      const existing = grouped.get(order.laboServiceId) || {
        name: order.laboService.laboItem.name, // Service name is actually the laboItem name
        supplierShortName: order.laboService.supplier.shortName,
        itemName: order.laboService.laboItem.name,
        count: 0,
        cost: 0,
      };
      grouped.set(order.laboServiceId, {
        name: existing.name,
        supplierShortName: existing.supplierShortName,
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
        supplierShortName: data.supplierShortName,
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
   * Filter detail records by tab/key từ data có sẵn (không query DB)
   */
  filterDetailsByTabAndKey(
    orders: Awaited<ReturnType<typeof this.queryAllOrders>>,
    tab: string,
    key: string
  ) {
    switch (tab) {
      case "daily": {
        const targetDate = new Date(key).toISOString().split("T")[0];
        return orders.filter((order) => {
          if (!order.returnDate) return false;
          return order.returnDate.toISOString().split("T")[0] === targetDate;
        });
      }

      case "supplier":
        return orders.filter((order) => order.supplierId === key);

      case "doctor":
        return orders.filter((order) => order.doctorId === key);

      case "service":
        return orders.filter(
          (order) => order.laboServiceId === key && order.laboServiceId !== null
        );

      default:
        return [];
    }
  },

  /**
   * Helper: Get date range for a given month
   */
  getMonthDateRange(month: string) {
    const [year, monthNum] = month.split("-").map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    return { startDate, endDate };
  },
};

/**
 * Build where clause for base filter
 * NOTE: Báo cáo labo filter theo returnDate (ngày nhận mẫu từ xưởng), không phải sentDate
 */
function buildWhereClause(startDate: Date, endDate: Date, clinicId?: string) {
  const where: {
    returnDate: { gte: Date; lte: Date };
    clinicId?: string;
    supplierId?: string;
    doctorId?: string;
    laboServiceId?: string;
  } = {
    returnDate: { gte: startDate, lte: endDate },
  };

  if (clinicId) {
    where.clinicId = clinicId;
  }

  return where;
}
