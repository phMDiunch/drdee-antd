// src/server/repos/clinic.repo.ts
import { prisma } from "@/services/prisma/prisma";
import type {
  CreateClinicRequest,
  UpdateClinicRequest,
} from "@/shared/validation/clinic.schema";

export const clinicRepo = {
  async list(includeArchived: boolean) {
    return prisma.clinic.findMany({
      where: includeArchived ? {} : { archivedAt: null },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string) {
    return prisma.clinic.findUnique({ where: { id } });
  },

  async getByClinicCode(clinicCode: string) {
    return prisma.clinic.findUnique({ where: { clinicCode } });
  },

  async getByName(name: string) {
    return prisma.clinic.findUnique({ where: { name } });
  },

  async create(data: CreateClinicRequest) {
    return prisma.clinic.create({ data });
  },

  async update(
    id: string,
    data: Partial<Omit<UpdateClinicRequest, "id">> & {
      archivedAt?: Date | null;
    }
  ) {
    return prisma.clinic.update({ where: { id }, data });
  },

  async archive(id: string, archivedAt: Date = new Date()) {
    return prisma.clinic.update({ where: { id }, data: { archivedAt } });
  },

  async unarchive(id: string) {
    return prisma.clinic.update({ where: { id }, data: { archivedAt: null } });
  },

  async delete(id: string) {
    return prisma.clinic.delete({ where: { id } });
  },

  // ===== liên kết để bảo vệ Delete =====
  async countLinked(clinicId: string) {
    const employees = await prisma.employee.count({ where: { clinicId } });
    // Có thể bổ sung các liên kết khác trong tương lai
    return { employees, total: employees };
  },
};
