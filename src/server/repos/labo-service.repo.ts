// src/server/repos/labo-service.repo.ts
import { prisma } from "@/services/prisma/prisma";
import type { CreateLaboServiceRequest } from "@/shared/validation/labo-service.schema";
import { Prisma } from "@prisma/client";

export type LaboServiceCreateInput = CreateLaboServiceRequest & {
  createdById: string; // 🔒 Server-controlled: từ currentUser.employeeId
  updatedById: string; // 🔒 Server-controlled: từ currentUser.employeeId
};

export type LaboServiceUpdateInput = {
  price?: number;
  warranty?: string;
  updatedById?: string; // 🔒 Server-controlled: track who made the update
};

export const laboServiceRepo = {
  async list(params?: {
    sortBy?: string;
    sortOrder?: string;
    supplierId?: string;
  }) {
    const orderBy: Prisma.LaboServiceOrderByWithRelationInput[] = [];

    if (params?.sortBy === "price") {
      orderBy.push({ price: params.sortOrder === "desc" ? "desc" : "asc" });
    } else if (params?.sortBy === "name") {
      orderBy.push({
        laboItem: { name: params.sortOrder === "desc" ? "desc" : "asc" },
      });
    } else {
      // Default: sort by supplier name, then laboItem name
      orderBy.push(
        { supplier: { name: "asc" } },
        { laboItem: { name: "asc" } }
      );
    }

    return prisma.laboService.findMany({
      where: params?.supplierId ? { supplierId: params.supplierId } : {},
      orderBy,
      include: {
        supplier: {
          select: { id: true, name: true },
        },
        laboItem: {
          select: { id: true, name: true, serviceGroup: true, unit: true },
        },
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  async getById(id: string) {
    return prisma.laboService.findUnique({
      where: { id },
      include: {
        supplier: {
          select: { id: true, name: true },
        },
        laboItem: {
          select: { id: true, name: true, serviceGroup: true, unit: true },
        },
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  async getBySupplierAndLaboItem(supplierId: string, laboItemId: string) {
    return prisma.laboService.findUnique({
      where: {
        supplierId_laboItemId: {
          supplierId,
          laboItemId,
        },
      },
    });
  },

  async create(data: LaboServiceCreateInput) {
    return prisma.laboService.create({
      data: {
        supplierId: data.supplierId,
        laboItemId: data.laboItemId,
        price: data.price,
        warranty: data.warranty,
        createdById: data.createdById,
        updatedById: data.updatedById,
      },
      include: {
        supplier: {
          select: { id: true, name: true },
        },
        laboItem: {
          select: { id: true, name: true, serviceGroup: true, unit: true },
        },
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  async update(id: string, data: LaboServiceUpdateInput) {
    return prisma.laboService.update({
      where: { id },
      data,
      include: {
        supplier: {
          select: { id: true, name: true },
        },
        laboItem: {
          select: { id: true, name: true, serviceGroup: true, unit: true },
        },
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  async delete(id: string) {
    return prisma.laboService.delete({ where: { id } });
  },

  // ===== Bảo vệ Delete =====
  async countLinked(priceId: string) {
    // TODO: Implement when LaboOrder model is added
    // const orders = await prisma.laboOrder.count({
    //   where: { laboServiceId: priceId },
    // });
    // return orders;

    // For now, return 0 (no linked data yet)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _used = priceId; // Placeholder to avoid unused warning
    return 0;
  },
};
