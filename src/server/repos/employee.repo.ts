// src/server/repos/employee.repo.ts
import { prisma } from "@/services/prisma/prisma";
import type { Prisma } from "@prisma/client";
import type {
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
} from "@/shared/validation/employee.schema";

export type EmployeeCreateInput = Omit<CreateEmployeeRequest, "clinicId"> & {
  clinic: { connect: { id: string } }; // 🔗 Prisma relation thay vì clinicId
  createdBy: { connect: { id: string } }; // 🔗 Prisma relation cho audit trail
  updatedBy?: { connect: { id: string } }; // 🔗 Optional relation
};

export type EmployeeUpdateInput = Partial<
  Omit<UpdateEmployeeRequest, "id" | "clinicId">
> & {
  uid?: string | null; // 🔗 Supabase user ID
  clinic?: { connect: { id: string } }; // 🔗 Optional clinic change
  updatedBy?: { connect: { id: string } }; // 🔗 Track who updated
};

export const employeeRepo = {
  async list(params: { search?: string }) {
    const { search } = params;
    const where: Prisma.EmployeeWhereInput = {};

    if (search) {
      // Nếu có search, tìm theo fullName
      where.fullName = {
        contains: search,
        mode: "insensitive",
      };
    } else {
      // Nếu không có search, chỉ trả về employees có status WORKING
      where.employeeStatus = "WORKING";
    }

    return prisma.employee.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { clinic: true },
    });
  },

  async listWorking() {
    return prisma.employee.findMany({
      where: {
        employeeStatus: "WORKING",
      },
      select: {
        id: true,
        fullName: true,
        employeeCode: true,
        jobTitle: true,
        role: true,
        department: true,
        clinic: {
          select: { id: true, clinicCode: true, name: true, shortName: true, colorCode: true },
        },
      },
      orderBy: { fullName: "asc" },
    });
  },

  async findById(id: string) {
    return prisma.employee.findUnique({
      where: { id },
      include: {
        clinic: true,
        createdBy: true,
        updatedBy: true,
      },
    });
  },

  async findByEmail(email: string) {
    return prisma.employee.findUnique({ where: { email } });
  },

  async findByPhone(phone: string) {
    return prisma.employee.findUnique({ where: { phone } });
  },

  async findByEmployeeCode(employeeCode: string) {
    return prisma.employee.findUnique({ where: { employeeCode } });
  },

  async findByNationalId(nationalId: string) {
    return prisma.employee.findUnique({ where: { nationalId } });
  },

  async findByTaxId(taxId: string) {
    return prisma.employee.findUnique({ where: { taxId } });
  },

  async findByInsuranceNumber(insuranceNumber: string) {
    return prisma.employee.findUnique({ where: { insuranceNumber } });
  },

  async create(data: EmployeeCreateInput) {
    return prisma.employee.create({ data });
  },

  async update(id: string, data: EmployeeUpdateInput) {
    return prisma.employee.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.employee.delete({ where: { id } });
  },

  async countLinked(employeeId: string) {
    const primaryAppointments = await prisma.appointment.count({
      where: { primaryDentistId: employeeId },
    });

    const total = primaryAppointments;
    return { primaryAppointments, total };
  },
};
