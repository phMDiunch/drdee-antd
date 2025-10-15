// src/server/repos/dental-service.repo.ts
import { prisma } from "@/services/prisma/prisma";

export type DentalServiceCreateInput = {
  name: string;
  description?: string | null;
  serviceGroup?: string | null;
  department?: string | null;
  tags?: string[];
  unit: string;
  price: number;
  minPrice?: number | null;
  officialWarranty?: string | null;
  clinicWarranty?: string | null;
  origin?: string | null;
  avgTreatmentMinutes?: number | null;
  avgTreatmentSessions?: number | null;
  createdById: string;
  updatedById: string;
};

export type DentalServiceUpdateInput = Omit<
  DentalServiceCreateInput,
  "createdById"
> & {
  archivedAt?: Date | null;
};

export const dentalServiceRepo = {
  async list(includeArchived: boolean) {
    return prisma.dentalService.findMany({
      where: includeArchived ? {} : { archivedAt: null },
      orderBy: [{ name: "asc" }],
    });
  },

  async getById(id: string) {
    return prisma.dentalService.findUnique({ where: { id } });
  },

  async getByName(name: string) {
    return prisma.dentalService.findUnique({ where: { name } });
  },

  async create(data: DentalServiceCreateInput) {
    return prisma.dentalService.create({ data });
  },

  async update(id: string, data: Partial<DentalServiceUpdateInput>) {
    return prisma.dentalService.update({ where: { id }, data });
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
