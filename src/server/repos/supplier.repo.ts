// src/server/repos/supplier.repo.ts
import { prisma } from "@/services/prisma/prisma";
import type {
  CreateSupplierRequest,
  UpdateSupplierRequest,
} from "@/shared/validation/supplier.schema";

export type SupplierCreateInput = CreateSupplierRequest & {
  createdById: string; // 🔒 Server-controlled: từ currentUser.employeeId
  updatedById: string; // 🔒 Server-controlled: từ currentUser.employeeId
};

export type SupplierUpdateInput = Partial<Omit<UpdateSupplierRequest, "id">> & {
  updatedById?: string; // 🔒 Server-controlled: track who made the update
  archivedAt?: Date | null; // 🔒 Server-controlled: archive timestamp
};

export const supplierRepo = {
  async list(includeArchived: boolean) {
    return prisma.supplier.findMany({
      where: includeArchived ? {} : { archivedAt: null },
      orderBy: [{ name: "asc" }],
      include: {
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  async getById(id: string) {
    return prisma.supplier.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  async getByName(name: string) {
    return prisma.supplier.findUnique({ where: { name } });
  },

  async create(data: SupplierCreateInput) {
    return prisma.supplier.create({
      data,
      include: {
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  async update(id: string, data: Partial<SupplierUpdateInput>) {
    return prisma.supplier.update({
      where: { id },
      data,
      include: {
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  async archive(id: string, archivedAt: Date = new Date()) {
    return prisma.supplier.update({ where: { id }, data: { archivedAt } });
  },

  async unarchive(id: string) {
    return prisma.supplier.update({
      where: { id },
      data: { archivedAt: null },
    });
  },

  async delete(id: string) {
    return prisma.supplier.delete({ where: { id } });
  },

  // ===== liên kết để bảo vệ Delete =====
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async countLinked(supplierId: string) {
    // TODO: Uncomment when GoodsReceipt model is implemented
    // const goodsReceipts = await prisma.goodsReceipt.count({
    //   where: { supplierId },
    // });
    // return { goodsReceipts, total: goodsReceipts };

    // Temporarily return 0 until GoodsReceipt is implemented
    return { goodsReceipts: 0, total: 0 };
  },
};
