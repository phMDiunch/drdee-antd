import { prisma } from "@/services/prisma/prisma";

// ================================
// Types for Raw Data (from Prisma)
// ================================

/**
 * KPI metrics with payment method breakdown and growth
 */
export interface RawKpiData {
  totalRevenue: number;
  cash: number;
  cardRegular: number;
  cardVisa: number;
  transfer: number;
  totalRevenueGrowthMoM: number | null;
  cashPercentage: number;
  cardRegularPercentage: number;
  cardVisaPercentage: number;
  transferPercentage: number;
  previousMonthRevenue: number | null;
}

/**
 * Daily revenue breakdown by payment method
 */
export interface RawDailyData {
  date: string;
  cash: number;
  cardRegular: number;
  cardVisa: number;
  transfer: number;
  totalRevenue: number;
}

/**
 * Revenue breakdown by customer source
 */
export interface RawSourceData {
  source: string;
  voucherCount: number;
  customerCount: number;
  totalRevenue: number;
}

/**
 * Revenue breakdown by department with payment percentage
 */
export interface RawDepartmentData {
  department: string;
  totalRevenue: number;
  paymentPercentage: number;
  totalPaid: number;
  totalFinalPrice: number;
}

/**
 * Revenue breakdown by service group with payment percentage
 */
export interface RawServiceGroupData {
  serviceGroup: string;
  totalRevenue: number;
  paymentPercentage: number;
  totalPaid: number;
  totalFinalPrice: number;
}

/**
 * Revenue breakdown by dental service with payment percentage
 */
export interface RawServiceData {
  serviceId: string;
  serviceName: string;
  serviceGroup: string | null;
  totalRevenue: number;
  paymentPercentage: number;
  totalPaid: number;
  totalFinalPrice: number;
}

/**
 * Revenue breakdown by treating doctor
 */
export interface RawDoctorData {
  doctorId: string;
  doctorName: string;
  revenue: number;
}

// ================================
// Repository
// ================================

export const revenueReportRepo = {
  /**
   * Query TẤT CẢ payment details trong tháng (1 lần duy nhất)
   * Với đầy đủ relations cần thiết cho tất cả dimensions
   */
  async queryAllPaymentDetails(
    startDate: Date,
    endDate: Date,
    clinicId: string | undefined
  ) {
    const paymentDetails = await prisma.paymentVoucherDetail.findMany({
      where: {
        paymentVoucher: {
          paymentDate: { gte: startDate, lte: endDate },
          ...(clinicId && { clinicId }),
        },
      },
      include: {
        paymentVoucher: {
          select: {
            id: true,
            paymentDate: true,
            customerId: true,
          },
        },
        consultedService: {
          select: {
            id: true,
            finalPrice: true,
            toothPositions: true,
            quantity: true,
            customer: {
              select: {
                id: true,
                fullName: true,
                customerCode: true,
                source: true,
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
            treatingDoctor: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        paymentVoucher: { paymentDate: "desc" },
      },
    });

    return paymentDetails;
  },

  /**
   * Compute KPI metrics từ data có sẵn (không query DB)
   */
  computeKpiData(
    paymentDetails: Awaited<ReturnType<typeof this.queryAllPaymentDetails>>,
    previousMonthRevenue: number
  ): RawKpiData {
    let cash = 0;
    let cardRegular = 0;
    let cardVisa = 0;
    let transfer = 0;

    paymentDetails.forEach((detail) => {
      const amount = detail.amount;
      switch (detail.paymentMethod) {
        case "Tiền mặt":
          cash += amount;
          break;
        case "Quẹt thẻ thường":
          cardRegular += amount;
          break;
        case "Quẹt thẻ Visa":
          cardVisa += amount;
          break;
        case "Chuyển khoản":
          transfer += amount;
          break;
      }
    });

    const totalRevenue = cash + cardRegular + cardVisa + transfer;

    // Growth calculation
    const totalRevenueGrowthMoM =
      previousMonthRevenue > 0
        ? ((totalRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
        : null;

    // Percentages
    const cashPercentage = totalRevenue > 0 ? (cash / totalRevenue) * 100 : 0;
    const cardRegularPercentage =
      totalRevenue > 0 ? (cardRegular / totalRevenue) * 100 : 0;
    const cardVisaPercentage =
      totalRevenue > 0 ? (cardVisa / totalRevenue) * 100 : 0;
    const transferPercentage =
      totalRevenue > 0 ? (transfer / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      cash,
      cardRegular,
      cardVisa,
      transfer,
      totalRevenueGrowthMoM,
      cashPercentage,
      cardRegularPercentage,
      cardVisaPercentage,
      transferPercentage,
      previousMonthRevenue,
    };
  },

  /**
   * Compute daily breakdown từ data có sẵn (không query DB)
   */
  computeDailyData(
    paymentDetails: Awaited<ReturnType<typeof this.queryAllPaymentDetails>>
  ): RawDailyData[] {
    const dateMap = new Map<
      string,
      {
        cash: number;
        cardRegular: number;
        cardVisa: number;
        transfer: number;
      }
    >();

    paymentDetails.forEach((detail) => {
      const dateKey = detail.paymentVoucher.paymentDate
        .toISOString()
        .split("T")[0];
      const existing = dateMap.get(dateKey) || {
        cash: 0,
        cardRegular: 0,
        cardVisa: 0,
        transfer: 0,
      };

      switch (detail.paymentMethod) {
        case "Tiền mặt":
          existing.cash += detail.amount;
          break;
        case "Quẹt thẻ thường":
          existing.cardRegular += detail.amount;
          break;
        case "Quẹt thẻ Visa":
          existing.cardVisa += detail.amount;
          break;
        case "Chuyển khoản":
          existing.transfer += detail.amount;
          break;
      }

      dateMap.set(dateKey, existing);
    });

    return Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        ...data,
        totalRevenue:
          data.cash + data.cardRegular + data.cardVisa + data.transfer,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  /**
   * Compute source breakdown từ data có sẵn (không query DB)
   */
  computeSourceData(
    paymentDetails: Awaited<ReturnType<typeof this.queryAllPaymentDetails>>
  ): RawSourceData[] {
    const sourceMap = new Map<
      string,
      {
        voucherIds: Set<string>;
        customerIds: Set<string>;
        revenue: number;
      }
    >();

    paymentDetails.forEach((detail) => {
      // Get source from customer in consultedService
      const sourceValue = detail.consultedService.customer.source;
      const source = sourceValue || "Không rõ nguồn";

      const existing = sourceMap.get(source) || {
        voucherIds: new Set<string>(),
        customerIds: new Set<string>(),
        revenue: 0,
      };

      existing.voucherIds.add(detail.paymentVoucher.id);
      existing.customerIds.add(detail.consultedService.customer.id);
      existing.revenue += detail.amount;

      sourceMap.set(source, existing);
    });

    return Array.from(sourceMap.entries())
      .map(([source, data]) => ({
        source,
        voucherCount: data.voucherIds.size,
        customerCount: data.customerIds.size,
        totalRevenue: data.revenue,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  },

  /**
   * Compute payment aggregations từ data có sẵn (không query DB)
   * Helper for service/department payment percentage
   */
  computePaymentAggregations(
    paymentDetails: Awaited<ReturnType<typeof this.queryAllPaymentDetails>>
  ): Map<string, number> {
    const aggregations = new Map<string, number>();

    paymentDetails.forEach((detail) => {
      const consultedServiceId = detail.consultedServiceId;
      const existing = aggregations.get(consultedServiceId) || 0;
      aggregations.set(consultedServiceId, existing + detail.amount);
    });

    return aggregations;
  },

  /**
   * Compute service breakdown từ data có sẵn (không query DB)
   */
  computeServiceData(
    paymentDetails: Awaited<ReturnType<typeof this.queryAllPaymentDetails>>,
    paymentAggregations: Map<string, number>
  ): RawServiceData[] {
    const serviceMap = new Map<
      string,
      {
        serviceId: string;
        serviceName: string;
        serviceGroup: string | null;
        revenue: number;
        consultedServices: Map<
          string,
          { totalPaid: number; finalPrice: number }
        >;
      }
    >();

    paymentDetails.forEach((detail) => {
      const serviceId = detail.consultedService.dentalService.id;
      const serviceName = detail.consultedService.dentalService.name;
      const serviceGroup = detail.consultedService.dentalService.serviceGroup;
      const consultedServiceId = detail.consultedServiceId;
      const finalPrice = detail.consultedService.finalPrice;

      const existing = serviceMap.get(serviceId) || {
        serviceId,
        serviceName,
        serviceGroup,
        revenue: 0,
        consultedServices: new Map(),
      };

      existing.revenue += detail.amount;

      // Track consulted services for payment percentage
      if (!existing.consultedServices.has(consultedServiceId)) {
        const totalPaid = paymentAggregations.get(consultedServiceId) || 0;
        existing.consultedServices.set(consultedServiceId, {
          totalPaid,
          finalPrice,
        });
      }

      serviceMap.set(serviceId, existing);
    });

    return Array.from(serviceMap.entries())
      .map(([serviceId, data]) => {
        // Calculate aggregate payment percentage
        let totalPaid = 0;
        let totalFinalPrice = 0;

        data.consultedServices.forEach((cs) => {
          totalPaid += cs.totalPaid;
          totalFinalPrice += cs.finalPrice;
        });

        const paymentPercentage =
          totalFinalPrice > 0 ? (totalPaid / totalFinalPrice) * 100 : 0;

        return {
          serviceId,
          serviceName: data.serviceName,
          serviceGroup: data.serviceGroup,
          totalRevenue: data.revenue,
          paymentPercentage: Math.round(paymentPercentage * 10) / 10,
          totalPaid,
          totalFinalPrice,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  },

  /**
   * Compute department breakdown từ data có sẵn (không query DB)
   */
  computeDepartmentData(
    paymentDetails: Awaited<ReturnType<typeof this.queryAllPaymentDetails>>,
    paymentAggregations: Map<string, number>
  ): RawDepartmentData[] {
    const departmentMap = new Map<
      string | null,
      {
        department: string | null;
        revenue: number;
        consultedServices: Map<
          string,
          { totalPaid: number; finalPrice: number }
        >;
      }
    >();

    paymentDetails.forEach((detail) => {
      const department = detail.consultedService.dentalService.department;
      const consultedServiceId = detail.consultedServiceId;
      const finalPrice = detail.consultedService.finalPrice;

      const existing = departmentMap.get(department) || {
        department,
        revenue: 0,
        consultedServices: new Map(),
      };

      existing.revenue += detail.amount;

      // Track consulted services for payment percentage
      if (!existing.consultedServices.has(consultedServiceId)) {
        const totalPaid = paymentAggregations.get(consultedServiceId) || 0;
        existing.consultedServices.set(consultedServiceId, {
          totalPaid,
          finalPrice,
        });
      }

      departmentMap.set(department, existing);
    });

    return Array.from(departmentMap.entries())
      .map(([department, data]) => {
        // Calculate aggregate payment percentage
        let totalPaid = 0;
        let totalFinalPrice = 0;

        data.consultedServices.forEach((cs) => {
          totalPaid += cs.totalPaid;
          totalFinalPrice += cs.finalPrice;
        });

        const paymentPercentage =
          totalFinalPrice > 0 ? (totalPaid / totalFinalPrice) * 100 : 0;

        return {
          department: department || "null",
          totalRevenue: data.revenue,
          paymentPercentage: Math.round(paymentPercentage * 10) / 10,
          totalPaid,
          totalFinalPrice,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  },

  /**
   * Compute service group breakdown từ data có sẵn (không query DB)
   */
  computeServiceGroupData(
    paymentDetails: Awaited<ReturnType<typeof this.queryAllPaymentDetails>>,
    paymentAggregations: Map<string, number>
  ): RawServiceGroupData[] {
    const serviceGroupMap = new Map<
      string | null,
      {
        serviceGroup: string | null;
        revenue: number;
        consultedServices: Map<
          string,
          { totalPaid: number; finalPrice: number }
        >;
      }
    >();

    paymentDetails.forEach((detail) => {
      const serviceGroup = detail.consultedService.dentalService.serviceGroup;
      const consultedServiceId = detail.consultedServiceId;
      const finalPrice = detail.consultedService.finalPrice;

      const existing = serviceGroupMap.get(serviceGroup) || {
        serviceGroup,
        revenue: 0,
        consultedServices: new Map(),
      };

      existing.revenue += detail.amount;

      // Track consulted services for payment percentage
      if (!existing.consultedServices.has(consultedServiceId)) {
        const totalPaid = paymentAggregations.get(consultedServiceId) || 0;
        existing.consultedServices.set(consultedServiceId, {
          totalPaid,
          finalPrice,
        });
      }

      serviceGroupMap.set(serviceGroup, existing);
    });

    return Array.from(serviceGroupMap.entries())
      .map(([serviceGroup, data]) => {
        // Calculate aggregate payment percentage
        let totalPaid = 0;
        let totalFinalPrice = 0;

        data.consultedServices.forEach((cs) => {
          totalPaid += cs.totalPaid;
          totalFinalPrice += cs.finalPrice;
        });

        const paymentPercentage =
          totalFinalPrice > 0 ? (totalPaid / totalFinalPrice) * 100 : 0;

        return {
          serviceGroup: serviceGroup || "Không rõ nhóm",
          totalRevenue: data.revenue,
          paymentPercentage: Math.round(paymentPercentage * 10) / 10,
          totalPaid,
          totalFinalPrice,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  },

  /**
   * Compute doctor breakdown từ data có sẵn (không query DB)
   */
  computeDoctorData(
    paymentDetails: Awaited<ReturnType<typeof this.queryAllPaymentDetails>>
  ): RawDoctorData[] {
    const doctorMap = new Map<
      string,
      {
        doctorId: string;
        doctorName: string;
        revenue: number;
      }
    >();

    paymentDetails.forEach((detail) => {
      const doctor = detail.consultedService.treatingDoctor;
      if (!doctor) return; // Skip if no treating doctor

      const existing = doctorMap.get(doctor.id) || {
        doctorId: doctor.id,
        doctorName: doctor.fullName,
        revenue: 0,
      };

      existing.revenue += detail.amount;
      doctorMap.set(doctor.id, existing);
    });

    return Array.from(doctorMap.values()).sort((a, b) => b.revenue - a.revenue);
  },

  /**
   * Filter detail records by tab/key từ data có sẵn (không query DB)
   */
  filterDetailsByTabAndKey(
    paymentDetails: Awaited<ReturnType<typeof this.queryAllPaymentDetails>>,
    tab: string,
    key: string
  ) {
    switch (tab) {
      case "daily":
        return paymentDetails.filter(
          (detail) =>
            detail.paymentVoucher.paymentDate.toISOString().split("T")[0] ===
            key
        );

      case "source": {
        // Handle "Không rõ nguồn" specially - filter for null source
        if (key === "Không rõ nguồn") {
          return paymentDetails.filter(
            (detail) => detail.consultedService.customer.source === null
          );
        }
        return paymentDetails.filter(
          (detail) => detail.consultedService.customer.source === key
        );
      }

      case "department":
        return paymentDetails.filter((detail) => {
          const dept = detail.consultedService.dentalService.department;
          return key === "null" ? dept === null : dept === key;
        });

      case "serviceGroup":
        return paymentDetails.filter((detail) => {
          const group = detail.consultedService.dentalService.serviceGroup;
          return key === "Không rõ nhóm" ? group === null : group === key;
        });

      case "service":
        return paymentDetails.filter(
          (detail) => detail.consultedService.dentalService.id === key
        );

      case "doctor":
        return paymentDetails.filter(
          (detail) => detail.consultedService.treatingDoctor?.id === key
        );

      default:
        return [];
    }
  },

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

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
