// src/server/services/sales-analytics.service.ts
import { ServiceError } from "./errors";
import type { UserCore } from "@/shared/types/user";
import { salesAnalyticsRepo } from "@/server/repos/sales-analytics.repo";
import { z } from "zod";

/**
 * Analytics Query Schema
 */
const AnalyticsQuerySchema = z.object({
  clinicId: z.string().uuid().optional(),
  dateStart: z.string(), // Accept YYYY-MM-DD or ISO datetime
  dateEnd: z.string(), // Accept YYYY-MM-DD or ISO datetime
});

/**
 * Require authenticated user
 */
function requireAuth(user: UserCore | null | undefined) {
  if (!user) {
    throw new ServiceError("UNAUTHORIZED", "Bạn chưa đăng nhập", 401);
  }
  if (!user.employeeId) {
    throw new ServiceError(
      "MISSING_EMPLOYEE_ID",
      "Tài khoản chưa được liên kết với nhân viên",
      403
    );
  }
}

export const salesAnalyticsService = {
  /**
   * Get conversion funnel analytics
   */
  async getConversionFunnel(currentUser: UserCore | null, query: unknown) {
    requireAuth(currentUser);

    const parsed = AnalyticsQuerySchema.parse(query);
    const dateStart = new Date(parsed.dateStart);
    const dateEnd = new Date(parsed.dateEnd);

    // Determine clinic filter based on role
    const isAdmin = currentUser!.role === "admin";
    const clinicId = isAdmin
      ? parsed.clinicId
      : currentUser!.clinicId ?? undefined;

    if (!clinicId && !isAdmin) {
      throw new ServiceError(
        "MISSING_CLINIC",
        "Nhân viên phải thuộc về một chi nhánh",
        403
      );
    }

    const stageCounts = await salesAnalyticsRepo.getConversionFunnel({
      clinicId,
      dateStart,
      dateEnd,
    });

    // Calculate conversion rates
    const stages = [
      "ARRIVED",
      "CONSULTING",
      "QUOTED",
      "DEPOSIT",
      "TREATING",
      "LOST",
    ];

    const funnelData = stages.map((stage, index) => {
      const count = stageCounts[stage] || 0;
      const previousCount =
        index > 0 ? stageCounts[stages[index - 1]] || 0 : count;
      const conversionRate =
        previousCount > 0 ? ((count / previousCount) * 100).toFixed(1) : "0";

      return {
        stage,
        count,
        conversionRate: parseFloat(conversionRate),
      };
    });

    return { funnel: funnelData };
  },

  /**
   * Get sale performance metrics
   */
  async getSalePerformance(currentUser: UserCore | null, query: unknown) {
    requireAuth(currentUser);

    const parsed = AnalyticsQuerySchema.parse(query);
    const dateStart = new Date(parsed.dateStart);
    const dateEnd = new Date(parsed.dateEnd);

    const isAdmin = currentUser!.role === "admin";
    const clinicId = isAdmin
      ? parsed.clinicId
      : currentUser!.clinicId ?? undefined;

    if (!clinicId && !isAdmin) {
      throw new ServiceError(
        "MISSING_CLINIC",
        "Nhân viên phải thuộc về một chi nhánh",
        403
      );
    }

    const performance = await salesAnalyticsRepo.getSalePerformance({
      clinicId,
      dateStart,
      dateEnd,
    });

    return { performance };
  },

  /**
   * Get lost analysis
   */
  async getLostAnalysis(currentUser: UserCore | null, query: unknown) {
    requireAuth(currentUser);

    const parsed = AnalyticsQuerySchema.parse(query);
    const dateStart = new Date(parsed.dateStart);
    const dateEnd = new Date(parsed.dateEnd);

    const isAdmin = currentUser!.role === "admin";
    const clinicId = isAdmin
      ? parsed.clinicId
      : currentUser!.clinicId ?? undefined;

    if (!clinicId && !isAdmin) {
      throw new ServiceError(
        "MISSING_CLINIC",
        "Nhân viên phải thuộc về một chi nhánh",
        403
      );
    }

    const analysis = await salesAnalyticsRepo.getLostAnalysis({
      clinicId,
      dateStart,
      dateEnd,
    });

    return analysis;
  },

  /**
   * Get average time per stage
   */
  async getAvgTimePerStage(currentUser: UserCore | null, query: unknown) {
    requireAuth(currentUser);

    const parsed = AnalyticsQuerySchema.parse(query);
    const dateStart = new Date(parsed.dateStart);
    const dateEnd = new Date(parsed.dateEnd);

    const isAdmin = currentUser!.role === "admin";
    const clinicId = isAdmin
      ? parsed.clinicId
      : currentUser!.clinicId ?? undefined;

    if (!clinicId && !isAdmin) {
      throw new ServiceError(
        "MISSING_CLINIC",
        "Nhân viên phải thuộc về một chi nhánh",
        403
      );
    }

    const avgTime = await salesAnalyticsRepo.getAvgTimePerStage({
      clinicId,
      dateStart,
      dateEnd,
    });

    return { avgTime };
  },

  /**
   * Get service win rate analysis
   */
  async getServiceWinRate(currentUser: UserCore | null, query: unknown) {
    requireAuth(currentUser);

    const parsed = AnalyticsQuerySchema.parse(query);
    const dateStart = new Date(parsed.dateStart);
    const dateEnd = new Date(parsed.dateEnd);

    const isAdmin = currentUser!.role === "admin";
    const clinicId = isAdmin
      ? parsed.clinicId
      : currentUser!.clinicId ?? undefined;

    if (!clinicId && !isAdmin) {
      throw new ServiceError(
        "MISSING_CLINIC",
        "Nhân viên phải thuộc về một chi nhánh",
        403
      );
    }

    const winRate = await salesAnalyticsRepo.getServiceWinRate({
      clinicId,
      dateStart,
      dateEnd,
    });

    return { winRate };
  },
};
