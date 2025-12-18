// src/server/repos/sales-analytics.repo.ts
import { prisma } from "@/services/prisma/prisma";

/**
 * Sales Analytics Repository
 * Queries for conversion funnel, performance metrics, and lost analysis
 */
export const salesAnalyticsRepo = {
  /**
   * Get conversion funnel data
   * Returns count of services at each stage with conversion rates
   */
  async getConversionFunnel(params: {
    clinicId?: string;
    dateStart: Date;
    dateEnd: Date;
  }) {
    const { clinicId, dateStart, dateEnd } = params;

    // Get all services in date range with their current stage
    const services = await prisma.consultedService.findMany({
      where: {
        ...(clinicId && { clinicId }),
        consultationDate: {
          gte: dateStart,
          lte: dateEnd,
        },
        dentalService: {
          requiresFollowUp: true,
        },
      },
      select: {
        id: true,
        stage: true,
      },
    });

    // Count by stage
    const stageCounts = services.reduce((acc, service) => {
      const stage = service.stage || "ARRIVED";
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return stageCounts;
  },

  /**
   * Get sale performance metrics
   * Returns stats for each sale: total deals, win rate, avg time
   */
  async getSalePerformance(params: {
    clinicId?: string;
    dateStart: Date;
    dateEnd: Date;
  }) {
    const { clinicId, dateStart, dateEnd } = params;

    const salesData = await prisma.consultedService.groupBy({
      by: ["consultingSaleId"],
      where: {
        ...(clinicId && { clinicId }),
        consultationDate: {
          gte: dateStart,
          lte: dateEnd,
        },
        dentalService: {
          requiresFollowUp: true,
        },
        consultingSaleId: {
          not: null,
        },
      },
      _count: true,
    });

    // Get won and lost counts per sale
    const results = await Promise.all(
      salesData.map(async (sale) => {
        if (!sale.consultingSaleId) return null;

        const [wonCount, lostCount, employee] = await Promise.all([
          prisma.consultedService.count({
            where: {
              consultingSaleId: sale.consultingSaleId,
              stage: "TREATING",
              consultationDate: {
                gte: dateStart,
                lte: dateEnd,
              },
            },
          }),
          prisma.consultedService.count({
            where: {
              consultingSaleId: sale.consultingSaleId,
              stage: "LOST",
              consultationDate: {
                gte: dateStart,
                lte: dateEnd,
              },
            },
          }),
          prisma.employee.findUnique({
            where: { id: sale.consultingSaleId },
            select: {
              id: true,
              fullName: true,
              employeeCode: true,
            },
          }),
        ]);

        const totalDeals = sale._count;
        const winRate =
          totalDeals > 0 ? ((wonCount / totalDeals) * 100).toFixed(1) : "0";

        return {
          saleId: sale.consultingSaleId,
          saleName: employee?.fullName || "Unknown",
          employeeCode: employee?.employeeCode || "",
          totalDeals,
          wonCount,
          lostCount,
          winRate: parseFloat(winRate),
        };
      })
    );

    return results.filter((r) => r !== null);
  },

  /**
   * Get lost analysis
   * Returns breakdown of lost services by stage and reason
   */
  async getLostAnalysis(params: {
    clinicId?: string;
    dateStart: Date;
    dateEnd: Date;
  }) {
    const { clinicId, dateStart, dateEnd } = params;

    // Get all transitions to LOST stage with reasons
    const lostTransitions = await prisma.stageHistory.findMany({
      where: {
        toStage: "LOST",
        changedAt: {
          gte: dateStart,
          lte: dateEnd,
        },
        consultedService: {
          ...(clinicId && { clinicId }),
        },
      },
      select: {
        id: true,
        fromStage: true,
        reason: true,
        changedAt: true,
        consultedService: {
          select: {
            id: true,
            consultedServiceName: true,
            customer: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        changedAt: "desc",
      },
    });

    // Group by fromStage
    const byStage = lostTransitions.reduce(
      (acc, transition) => {
        const stage = transition.fromStage || "UNKNOWN";
        if (!acc[stage]) {
          acc[stage] = {
            stage,
            count: 0,
            reasons: {},
          };
        }
        acc[stage].count++;

        // Count reasons
        const reason = transition.reason || "Không có lý do";
        acc[stage].reasons[reason] = (acc[stage].reasons[reason] || 0) + 1;

        return acc;
      },
      {} as Record<
        string,
        {
          stage: string;
          count: number;
          reasons: Record<string, number>;
        }
      >
    );

    return {
      byStage: Object.values(byStage),
      details: lostTransitions.map((t) => ({
        id: t.id,
        fromStage: t.fromStage,
        reason: t.reason,
        changedAt: t.changedAt,
        serviceName: t.consultedService.consultedServiceName,
        customerName: t.consultedService.customer.fullName,
      })),
    };
  },

  /**
   * Get average time spent in each stage
   */
  async getAvgTimePerStage(params: {
    clinicId?: string;
    dateStart: Date;
    dateEnd: Date;
  }) {
    const { clinicId, dateStart, dateEnd } = params;

    // Get all stage transitions in date range
    const transitions = await prisma.stageHistory.findMany({
      where: {
        changedAt: {
          gte: dateStart,
          lte: dateEnd,
        },
        consultedService: {
          ...(clinicId && { clinicId }),
        },
      },
      select: {
        consultedServiceId: true,
        fromStage: true,
        toStage: true,
        changedAt: true,
      },
      orderBy: [{ consultedServiceId: "asc" }, { changedAt: "asc" }],
    });

    // Calculate time between transitions
    const stageDurations: Record<string, number[]> = {};

    let currentServiceId: string | null = null;
    let lastTransition: (typeof transitions)[0] | null = null;

    for (const transition of transitions) {
      if (transition.consultedServiceId !== currentServiceId) {
        currentServiceId = transition.consultedServiceId;
        lastTransition = transition;
        continue;
      }

      if (lastTransition && lastTransition.fromStage) {
        const stage = lastTransition.toStage;
        const duration =
          transition.changedAt.getTime() - lastTransition.changedAt.getTime();
        const durationInDays = duration / (1000 * 60 * 60 * 24);

        if (!stageDurations[stage]) {
          stageDurations[stage] = [];
        }
        stageDurations[stage].push(durationInDays);
      }

      lastTransition = transition;
    }

    // Calculate averages
    const avgTimePerStage = Object.entries(stageDurations).map(
      ([stage, durations]) => {
        const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        return {
          stage,
          avgDays: parseFloat(avg.toFixed(1)),
          count: durations.length,
        };
      }
    );

    return avgTimePerStage;
  },

  /**
   * Get service type win rate analysis
   */
  async getServiceWinRate(params: {
    clinicId?: string;
    dateStart: Date;
    dateEnd: Date;
  }) {
    const { clinicId, dateStart, dateEnd } = params;

    const services = await prisma.consultedService.groupBy({
      by: ["dentalServiceId"],
      where: {
        ...(clinicId && { clinicId }),
        consultationDate: {
          gte: dateStart,
          lte: dateEnd,
        },
        dentalService: {
          requiresFollowUp: true,
        },
      },
      _count: true,
    });

    const results = await Promise.all(
      services.map(async (service) => {
        const [wonCount, dentalService] = await Promise.all([
          prisma.consultedService.count({
            where: {
              dentalServiceId: service.dentalServiceId,
              stage: "TREATING",
              consultationDate: {
                gte: dateStart,
                lte: dateEnd,
              },
            },
          }),
          prisma.dentalService.findUnique({
            where: { id: service.dentalServiceId },
            select: {
              id: true,
              name: true,
            },
          }),
        ]);

        const totalCount = service._count;
        const winRate =
          totalCount > 0 ? ((wonCount / totalCount) * 100).toFixed(1) : "0";

        return {
          serviceId: service.dentalServiceId,
          serviceName: dentalService?.name || "Unknown",
          totalCount,
          wonCount,
          winRate: parseFloat(winRate),
        };
      })
    );

    return results.sort((a, b) => b.totalCount - a.totalCount);
  },
};
