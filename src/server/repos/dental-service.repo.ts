// src/server/repos/dental-service.repo.ts
import { prisma } from "@/services/prisma/prisma";
import type {
  CreateDentalServiceRequest,
  UpdateDentalServiceRequest,
} from "@/shared/validation/dental-service.schema";

export type DentalServiceCreateInput = CreateDentalServiceRequest & {
  createdById: string; // 🔒 Server-controlled: từ currentUser.employeeId
  updatedById: string; // 🔒 Server-controlled: từ currentUser.employeeId
};

export type DentalServiceUpdateInput = Partial<
  Omit<UpdateDentalServiceRequest, "id">
> & {
  updatedById?: string; // 🔒 Server-controlled: track who made the update
  archivedAt?: Date | null; // 🔒 Server-controlled: archive timestamp
};

export const dentalServiceRepo = {
  async list(includeArchived: boolean) {
    return prisma.dentalService.findMany({
      where: includeArchived ? {} : { archivedAt: null },
      orderBy: [{ name: "asc" }],
      include: {
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  async getById(id: string) {
    return prisma.dentalService.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  async getByName(name: string) {
    return prisma.dentalService.findUnique({ where: { name } });
  },

  async create(data: DentalServiceCreateInput) {
    return prisma.dentalService.create({
      data,
      include: {
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  async update(id: string, data: Partial<DentalServiceUpdateInput>) {
    return prisma.dentalService.update({
      where: { id },
      data,
      include: {
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  async archive(id: string, archivedAt: Date = new Date()) {
    return prisma.dentalService.update({ where: { id }, data: { archivedAt } });
  },

  async unarchive(id: string) {
    return prisma.dentalService.update({
      where: { id },
      data: { archivedAt: null },
    });
  },

  async delete(id: string) {
    return prisma.dentalService.delete({ where: { id } });
  },

  // ===== liên kết để bảo vệ Delete =====
  async countLinked(dentalServiceId: string) {
    const consulted = await prisma.consultedService.count({
      where: { dentalServiceId },
    });
    // Có thể bổ sung các liên kết khác trong tương lai
    return { consulted, total: consulted };
  },
};
