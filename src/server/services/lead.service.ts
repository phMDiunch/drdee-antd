// src/server/services/lead.service.ts
import { ServiceError } from "./errors";
import {
  CreateLeadRequestSchema,
  UpdateLeadRequestSchema,
  ConvertLeadRequestSchema,
  LeadsListResponseSchema,
} from "@/shared/validation/lead.schema";
import type { UserCore } from "@/shared/types/user";
import { leadRepo } from "@/server/repos/lead.repo";
import { customerRepo } from "@/server/repos/customer.repo";
import { employeeRepo } from "@/server/repos/employee.repo";
import { prisma } from "@/services/prisma/prisma";
import { mapCustomerToResponse } from "./customer/_mappers";
import { clinicRepo } from "@/server/repos/clinic.repo";

/**
 * Populate source relations (employee or customer) based on source type and sourceNotes
 * Reusable helper for create, update, getById, and list operations
 */
async function populateSourceRelations(lead: {
  source: string | null;
  sourceNotes: string | null;
}) {
  let sourceEmployee = null;
  let sourceCustomer = null;

  // Populate sourceEmployee if source = 'employee_referral'
  if (lead.source === "employee_referral" && lead.sourceNotes) {
    const employeeId = lead.sourceNotes.trim();
    if (employeeId) {
      const employee = await employeeRepo.findById(employeeId);
      if (employee) {
        sourceEmployee = {
          id: employee.id,
          fullName: employee.fullName,
          phone: employee.phone,
        };
      }
    }
  }

  // Populate sourceCustomer if source = 'customer_referral'
  if (lead.source === "customer_referral" && lead.sourceNotes) {
    const sourceCustomerId = lead.sourceNotes.trim();
    if (sourceCustomerId) {
      const sourceCustomerData = await customerRepo.findById(sourceCustomerId);
      if (sourceCustomerData) {
        sourceCustomer = {
          id: sourceCustomerData.id,
          customerCode: sourceCustomerData.customerCode,
          fullName: sourceCustomerData.fullName,
          phone: sourceCustomerData.phone,
        };
      }
    }
  }

  return { sourceEmployee, sourceCustomer };
}

/**
 * Generate customer code according to requirements: ${prefix}-${YY}${MM}-${NNN}
 * prefix ∈ { MK, TDT, DN } (clinic codes)
 */
async function generateCustomerCode(clinicId: string): Promise<string> {
  // Lấy thông tin clinic từ table clinics
  const clinic = await clinicRepo.getById(clinicId);
  if (!clinic?.clinicCode) {
    throw new ServiceError("INVALID_CLINIC", "Chi nhánh không hợp lệ", 400);
  }

  const now = new Date();
  const year = now.getFullYear() % 100; // YY format
  const month = String(now.getMonth() + 1).padStart(2, "0"); // MM format
  const yearMonth = `${String(year).padStart(2, "0")}${month}`;

  const prefix = clinic.clinicCode.trim().toUpperCase();

  // Find last customer code with same prefix and year-month
  const lastCustomer = await customerRepo.findLastCustomerCodeByClinic(
    clinicId,
    prefix,
    yearMonth
  );

  let nextNumber = 1;
  if (lastCustomer?.customerCode) {
    const parts = lastCustomer.customerCode.split("-");
    if (parts.length === 3) {
      const lastNumber = parseInt(parts[2], 10);
      nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}-${yearMonth}-${String(nextNumber).padStart(3, "0")}`;
}

export const leadService = {
  /**
   * Create Lead
   */
  async create(currentUser: UserCore | null, body: unknown) {
    if (!currentUser?.employeeId) {
      throw new ServiceError("UNAUTHORIZED", "Unauthorized", 401);
    }

    const parsed = CreateLeadRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new ServiceError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
        400
      );
    }

    const data = parsed.data;

    // Check phone duplicate (both Lead and Customer)
    const [existingLead, existingCustomer] = await Promise.all([
      leadRepo.findByPhone(data.phone),
      customerRepo.findByPhone(data.phone),
    ]);

    if (existingLead) {
      throw new ServiceError(
        "PHONE_EXISTS",
        "Số điện thoại đã tồn tại trong danh sách Lead",
        409
      );
    }

    if (existingCustomer) {
      throw new ServiceError(
        "PHONE_EXISTS",
        "Số điện thoại đã tồn tại trong danh sách Khách hàng",
        409
      );
    }

    // Create Lead
    const lead = await leadRepo.create({
      ...data,
      createdById: currentUser.employeeId,
      updatedById: currentUser.employeeId,
    });

    // Populate source relations and build response
    const { sourceEmployee, sourceCustomer } = await populateSourceRelations(
      lead
    );
    const mapped = mapCustomerToResponse(lead);
    return {
      ...mapped,
      sourceEmployee,
      sourceCustomer,
    };
  },

  /**
   * Get by ID with source relations
   * Populates sourceEmployee or sourceCustomer based on sourceNotes field parsing
   */
  async getById(currentUser: UserCore | null, id: string) {
    const lead = await leadRepo.findById(id);
    if (!lead) {
      throw new ServiceError("NOT_FOUND", "Lead không tồn tại", 404);
    }

    // Populate source relations and build response
    const { sourceEmployee, sourceCustomer } = await populateSourceRelations(
      lead
    );
    const mapped = mapCustomerToResponse(lead);
    return {
      ...mapped,
      sourceEmployee,
      sourceCustomer,
    };
  },

  /**
   * List Leads for daily view
   * Populates sourceEmployee or sourceCustomer based on sourceNotes field parsing
   */
  async listDaily(currentUser: UserCore | null, query: unknown) {
    // Parse query params (date, search, page, pageSize)
    const params = query as {
      date?: string;
      search?: string;
      page?: string;
      pageSize?: string;
      sortField?: string;
      sortDirection?: "asc" | "desc";
    };

    const result = await leadRepo.listDaily({
      date: params.date || new Date().toISOString().split("T")[0], // Default to today
      search: params.search,
      page: params.page ? parseInt(params.page, 10) : 1,
      pageSize: params.pageSize ? parseInt(params.pageSize, 10) : 100,
      sortField: params.sortField,
      sortDirection: params.sortDirection,
    });

    // Populate source relations for each lead
    const itemsWithSources = await Promise.all(
      result.items.map(async (lead) => {
        const { sourceEmployee, sourceCustomer } =
          await populateSourceRelations(lead);
        const mapped = mapCustomerToResponse(lead);
        return {
          ...mapped,
          sourceEmployee,
          sourceCustomer,
        };
      })
    );

    const response = {
      items: itemsWithSources,
      count: result.count,
    };

    const validated = LeadsListResponseSchema.safeParse(response);
    if (!validated.success) {
      throw new ServiceError("VALIDATION_ERROR", "Dữ liệu không hợp lệ", 500);
    }

    return validated.data;
  },

  /**
   * Update Lead
   */
  async update(currentUser: UserCore | null, id: string, body: unknown) {
    if (!currentUser?.employeeId) {
      throw new ServiceError("UNAUTHORIZED", "Unauthorized", 401);
    }

    const parsed = UpdateLeadRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new ServiceError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
        400
      );
    }

    const data = parsed.data;

    const lead = await leadRepo.findById(id);
    if (!lead) {
      throw new ServiceError("NOT_FOUND", "Lead không tồn tại", 404);
    }

    // Check if already converted to CUSTOMER
    if (lead.type === "CUSTOMER") {
      throw new ServiceError(
        "ALREADY_CONVERTED",
        "Lead đã được chuyển thành Khách hàng, không thể sửa",
        400
      );
    }

    // Validate unique phone if changed
    if (data.phone && data.phone !== lead.phone) {
      const [existingLead, existingCustomer] = await Promise.all([
        leadRepo.findByPhone(data.phone),
        customerRepo.findByPhone(data.phone),
      ]);
      if (existingLead && existingLead.id !== id) {
        throw new ServiceError(
          "PHONE_EXISTS",
          "Số điện thoại đã tồn tại trong danh sách Lead",
          409
        );
      }
      if (existingCustomer) {
        throw new ServiceError(
          "PHONE_EXISTS",
          "Số điện thoại đã tồn tại trong danh sách Khách hàng",
          409
        );
      }
    }

    const updated = await leadRepo.update(id, {
      ...data,
      updatedById: currentUser.employeeId,
    });

    // Populate source relations and build response
    const { sourceEmployee, sourceCustomer } = await populateSourceRelations(
      updated
    );
    const mapped = mapCustomerToResponse(updated);
    return {
      ...mapped,
      sourceEmployee,
      sourceCustomer,
    };
  },

  /**
   * Convert Lead to Customer (type: LEAD → CUSTOMER)
   */
  async convertToCustomer(
    currentUser: UserCore | null,
    leadId: string,
    body: unknown
  ) {
    if (!currentUser?.employeeId) {
      throw new ServiceError("UNAUTHORIZED", "Unauthorized", 401);
    }

    const parsed = ConvertLeadRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new ServiceError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
        400
      );
    }

    const lead = await leadRepo.findById(leadId);
    if (!lead) {
      throw new ServiceError("NOT_FOUND", "Lead không tồn tại", 404);
    }

    // Validate clinic access - Employee can only convert for their clinic
    if (
      currentUser?.role !== "admin" &&
      parsed.data.clinicId !== currentUser?.clinicId
    ) {
      throw new ServiceError(
        "CLINIC_MISMATCH",
        "Nhân viên chỉ có thể chuyển đổi Lead cho chi nhánh của mình",
        403
      );
    }

    // ⭐ Generate Customer Code
    const customerCode = await generateCustomerCode(parsed.data.clinicId);

    // ⭐ Update: type LEAD → CUSTOMER
    const customer = await prisma.customer.update({
      where: { id: leadId },
      data: {
        type: "CUSTOMER", // ⭐ Change type
        customerCode, // ⭐ Generate code
        fullName: parsed.data.fullName,
        dob: parsed.data.dob,
        gender: parsed.data.gender,
        phone: parsed.data.phone,
        email: parsed.data.email,
        address: parsed.data.address,
        city: parsed.data.city,
        district: parsed.data.district,
        primaryContactRole: parsed.data.primaryContactRole,
        primaryContactId: parsed.data.primaryContactId,
        clinicId: parsed.data.clinicId,
        occupation: parsed.data.occupation,
        source: parsed.data.source,
        sourceNotes: parsed.data.sourceNotes,
        serviceOfInterest: parsed.data.serviceOfInterest,
        note: parsed.data.note,
        firstVisitDate: new Date(), // ⭐ Set first visit date
        updatedById: currentUser.employeeId,
        updatedAt: new Date(),
      },
      include: {
        clinic: {
          select: { id: true, name: true, clinicCode: true, shortName: true, colorCode: true },
        },
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });

    return mapCustomerToResponse(customer);
  },

  /**
   * Delete Lead
   */
  async delete(currentUser: UserCore | null, id: string) {
    if (!currentUser?.employeeId) {
      throw new ServiceError("UNAUTHORIZED", "Unauthorized", 401);
    }

    const lead = await leadRepo.findById(id);
    if (!lead) {
      throw new ServiceError("NOT_FOUND", "Lead không tồn tại", 404);
    }

    await leadRepo.delete(id);
    return { success: true };
  },
};
