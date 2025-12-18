// src/server/repos/stage-history.repo.ts
import { prisma } from "@/services/prisma/prisma";
import type { SalesStage } from "@/shared/validation/consulted-service.schema";

/**
 * Stage History Repository
 * Data access layer for stage transitions tracking
 */

export interface StageHistoryCreateInput {
  consultedServiceId: string;
  fromStage: SalesStage | null;
  toStage: SalesStage;
  reason?: string | null;
  changedById: string;
}

export const stageHistoryRepo = {
  /**
   * Create a new stage history record
   */
  async create(data: StageHistoryCreateInput) {
    return prisma.stageHistory.create({
      data: {
        consultedServiceId: data.consultedServiceId,
        fromStage: data.fromStage,
        toStage: data.toStage,
        reason: data.reason,
        changedById: data.changedById,
      },
      include: {
        changedBy: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  },

  /**
   * Get stage history for a consulted service
   */
  async listByConsultedServiceId(consultedServiceId: string) {
    return prisma.stageHistory.findMany({
      where: { consultedServiceId },
      orderBy: { changedAt: "desc" },
      include: {
        changedBy: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  },

  /**
   * Get latest stage transition for a consulted service
   */
  async getLatest(consultedServiceId: string) {
    return prisma.stageHistory.findFirst({
      where: { consultedServiceId },
      orderBy: { changedAt: "desc" },
      include: {
        changedBy: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  },
};
