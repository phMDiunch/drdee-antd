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
  supplierShortName: string | null;
  orderCount: number;
  totalCost: number;
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
  supplierShortName: string | null;
  itemName: string;
  orderCount: number;
  totalCost: number;
  rank: number;
};

export type RawDetailRecord = {
  id: string;
  sentDate: Date;
  returnDate: Date | null;
  customerName: string;
  customerCode: string | null;
  customerId: string;
  doctorName: string;
  serviceName: string | null;
  supplierShortName: string | null;
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
   * Helper: Lấy TẤT CẢ orders trong tháng (1 lần query duy nhất)
   * Với đầy đủ relations cần thiết cho tất cả dimensions
   */
  async queryAllOrders(params: BaseQueryParams) {
    const { startDate, endDate } = getMonthDateRange(params.month);
    const whereClause = buildWhereClause(startDate, endDate, params.clinicId);

    const orders = await prisma.laboOrder.findMany({
      where: whereClause,
      select: {
        returnDate: true,
        totalCost: true,
        supplierId: true,
        doctorId: true,
        laboServiceId: true,
        supplier: {
          select: { shortName: true },
        },
        doctor: {
          select: { fullName: true },
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

    return {
      totalOrders,
      totalCost,
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
   * Get detail records for drill-down panel
   * Base filter: returnDate trong tháng
   * Daily tab: Thêm filter chính xác ngày returnDate
   */
  async getDetailRecords(
    params: DetailQueryParams
  ): Promise<{ records: RawDetailRecord[]; total: number }> {
    const { startDate, endDate } = getMonthDateRange(params.month);
    let whereClause = buildWhereClause(startDate, endDate, params.clinicId);

    // Additional filter by dimension
    if (params.tab === "daily") {
      const targetDate = new Date(params.key);
      // Ghi đè returnDate với ngày cụ thể (thay vì range cả tháng)
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
          sentDate: true,
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
        orderBy: { sentDate: "desc" },
      }),
      prisma.laboOrder.count({ where: whereClause }),
    ]);

    return {
      records: records.map((r) => ({
        id: r.id,
        sentDate: r.sentDate,
        returnDate: r.returnDate,
        customerName: r.customer.fullName,
        customerCode: r.customer.customerCode,
        customerId: r.customer.id,
        doctorName: r.doctor.fullName,
        serviceName: r.laboService?.laboItem.name || null,
        supplierShortName: r.supplier.shortName,
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
