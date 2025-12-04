// src/server/repos/labo-item.repo.ts
import { prisma } from "@/services/prisma/prisma";
import type {
  CreateLaboItemRequest,
  UpdateLaboItemRequest,
} from "@/shared/validation/labo-item.schema";

export type LaboItemCreateInput = CreateLaboItemRequest & {
  createdById: string; // 🔒 Server-controlled: từ currentUser.employeeId
  updatedById: string; // 🔒 Server-controlled: từ currentUser.employeeId
};

export type LaboItemUpdateInput = Partial<Omit<UpdateLaboItemRequest, "id">> & {
  updatedById?: string; // 🔒 Server-controlled: track who made the update
  archivedAt?: Date | null; // 🔒 Server-controlled: archive timestamp
};

export const laboItemRepo = {
  async list(includeArchived: boolean) {
    return prisma.laboItem.findMany({
      where: includeArchived ? {} : { archivedAt: null },
      orderBy: [{ name: "asc" }],
      include: {
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  async getById(id: string) {
    return prisma.laboItem.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  async getByName(name: string) {
    return prisma.laboItem.findUnique({ where: { name } });
  },

  async create(data: LaboItemCreateInput) {
    return prisma.laboItem.create({
      data,
      include: {
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  async update(id: string, data: Partial<LaboItemUpdateInput>) {
    return prisma.laboItem.update({
      where: { id },
      data,
      include: {
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  async archive(id: string, archivedAt: Date = new Date()) {
    return prisma.laboItem.update({ where: { id }, data: { archivedAt } });
  },

  async unarchive(id: string) {
    return prisma.laboItem.update({
      where: { id },
      data: { archivedAt: null },
    });
  },

  async delete(id: string) {
    return prisma.laboItem.delete({ where: { id } });
  },

  // ===== liên kết để bảo vệ Delete =====
  async countLinked(laboItemId: string) {
    // TODO: Add counts for LaboService and LaboOrder when implemented
    // const supplierPrices = await prisma.laboService.count({
    //   where: { laboItemId },
    // });
    // const orders = await prisma.laboOrder.count({
    //   where: { laboItemId },
    // });
    // return { supplierPrices, orders, total: supplierPrices + orders };

    // For now, return 0 (no linked data yet)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _used = laboItemId; // Placeholder to avoid unused warning
    return { total: 0 };
  },
};
