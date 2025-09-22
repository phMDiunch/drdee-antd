// src/server/repos/clinic.repo.ts
import { prisma } from "@/services/prisma/prisma";

export type ClinicCreateInput = {
  clinicCode: string;
  name: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  colorCode: string;
};

export type ClinicUpdateInput = ClinicCreateInput & {
  archivedAt?: Date | null;
};

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

  async create(data: ClinicCreateInput) {
    return prisma.clinic.create({ data });
  },

  async update(id: string, data: Partial<ClinicUpdateInput>) {
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
    // Giả định đã có model Employee với field clinicId
    const employees = await prisma.employee.count({ where: { clinicId } });
    // Sau này có Appointment/Payments... gom thêm ở đây
    return { employees, total: employees };
  },
};
