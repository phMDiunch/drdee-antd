// src/server/repos/material.repo.ts
import { prisma } from "@/services/prisma/prisma";
import type {
  CreateMaterialRequest,
  UpdateMaterialRequest,
} from "@/shared/validation/material.schema";

export type MaterialCreateInput = CreateMaterialRequest & {
  code: string; // 🔒 Server-generated: MAT0001, MAT0002...
  createdById: string; // 🔒 Server-controlled: từ currentUser.employeeId
  updatedById: string; // 🔒 Server-controlled: từ currentUser.employeeId
};

export type MaterialUpdateInput = Partial<Omit<UpdateMaterialRequest, "id">> & {
  updatedById?: string; // 🔒 Server-controlled: track who made the update
  archivedAt?: Date | null; // 🔒 Server-controlled: archive timestamp
};

export const materialRepo = {
  async list(includeArchived: boolean) {
    return prisma.material.findMany({
      where: includeArchived ? {} : { archivedAt: null },
      orderBy: [{ code: "asc" }],
      include: {
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  async getById(id: string) {
    return prisma.material.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  async getByName(name: string) {
    return prisma.material.findUnique({ where: { name } });
  },

  async getByCode(code: string) {
    return prisma.material.findUnique({ where: { code } });
  },

  async create(data: MaterialCreateInput) {
    return prisma.material.create({
      data,
      include: {
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  async update(id: string, data: Partial<MaterialUpdateInput>) {
    return prisma.material.update({
      where: { id },
      data,
      include: {
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  async archive(id: string, archivedAt: Date = new Date()) {
    return prisma.material.update({ where: { id }, data: { archivedAt } });
  },

  async unarchive(id: string) {
    return prisma.material.update({
      where: { id },
      data: { archivedAt: null },
    });
  },

  async delete(id: string) {
    return prisma.material.delete({ where: { id } });
  },

  /**
   * Generate next material code
   * Pattern: MAT0001, MAT0002, MAT0003...
   */
  async generateNextCode(): Promise<string> {
    // Get the last material ordered by code descending
    const lastMaterial = await prisma.material.findFirst({
      orderBy: { code: "desc" },
      select: { code: true },
    });

    if (!lastMaterial) {
      return "MAT0001"; // First material
    }

    // Extract number from code (e.g., "MAT0042" -> 42)
    const lastNumber = parseInt(lastMaterial.code.substring(3), 10);
    const nextNumber = lastNumber + 1;

    // Format with leading zeros (e.g., 43 -> "MAT0043")
    return `MAT${nextNumber.toString().padStart(4, "0")}`;
  },

  // ===== liên kết để bảo vệ Delete =====
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async countLinked(materialId: string) {
    // TODO: Uncomment when GoodsReceipt/GoodsIssue models are implemented
    // const receiptDetails = await prisma.goodsReceiptDetail.count({
    //   where: { materialId },
    // });
    // const issueDetails = await prisma.goodsIssueDetail.count({
    //   where: { materialId },
    // });
    // return { receiptDetails, issueDetails, total: receiptDetails + issueDetails };

    // Temporarily return 0 until GoodsReceipt/GoodsIssue are implemented
    return { receiptDetails: 0, issueDetails: 0, total: 0 };
  },
};
