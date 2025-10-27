// src/server/services/customer.service.ts
import { ServiceError } from "./errors";
import {
  CreateCustomerRequestSchema,
  UpdateCustomerRequestSchema,
  CustomersListResponseSchema,
  GetCustomersQuerySchema,
  GetCustomersDailyQuerySchema,
  SearchQuerySchema,
  SearchResponseSchema,
} from "@/shared/validation/customer.schema";
import type { UserCore } from "@/shared/types/user";
import { customerRepo } from "@/server/repos/customer.repo";
import { employeeRepo } from "@/server/repos/employee.repo";
import { clinicRepo } from "@/server/repos/clinic.repo";
import { prisma } from "@/services/prisma/prisma";
import {
  mapCustomerToResponse,
  mapCustomerDetailToResponse,
} from "./customer/_mappers";

/**
 * Require authenticated user (not just admin)
 */
function requireAuth(user: UserCore | null | undefined) {
  if (!user) {
    throw new ServiceError("UNAUTHORIZED", "Bạn chưa đăng nhập", 401);
  }
  if (!user.employeeId) {
    throw new ServiceError(
      "MISSING_EMPLOYEE_ID",
      "Tài khoản chưa được liên kết với nhân viên",
      403
    );
  }
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

  const rawCode = clinic.clinicCode.trim();
  const upperCode = rawCode.toUpperCase();

  let prefix: string;

  if (upperCode.includes("450")) {
    prefix = "MK";
  } else if (upperCode.includes("143")) {
    prefix = "TDT";
  } else if (upperCode.includes("153")) {
    prefix = "DN";
  } else {
    // Fallback: derive prefix from letters only
    const lettersOnly = upperCode.replace(/[^A-Z]/g, "");
    prefix = lettersOnly || upperCode;
  }

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

export const customerService = {
  /**
   * Create customer with business logic and validation
   */
  async create(currentUser: UserCore | null, body: unknown) {
    requireAuth(currentUser);

    if (!currentUser?.clinicId || !currentUser?.employeeId) {
      throw new ServiceError(
        "MISSING_CLINIC_OR_EMPLOYEE",
        "User phải thuộc về một chi nhánh và có employeeId",
        400
      );
    }

    const parsed = CreateCustomerRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new ServiceError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
        400
      );
    }
    const data = parsed.data;

    // Validate unique phone if provided
    if (data.phone) {
      const existingPhone = await customerRepo.findByPhone(data.phone);
      if (existingPhone) {
        throw new ServiceError("PHONE_EXISTS", "Số điện thoại đã tồn tại", 409);
      }
    }

    // Validate unique email if provided
    if (data.email) {
      const existingEmail = await customerRepo.findByEmail(data.email);
      if (existingEmail) {
        throw new ServiceError("EMAIL_EXISTS", "Email đã tồn tại", 409);
      }
    }

    // Validate primary contact if provided
    if (data.primaryContactId) {
      const primaryContact = await customerRepo.findById(data.primaryContactId);
      if (!primaryContact) {
        throw new ServiceError(
          "PRIMARY_CONTACT_NOT_FOUND",
          "Người liên hệ chính không tồn tại",
          400
        );
      }
      if (!primaryContact.phone) {
        throw new ServiceError(
          "PRIMARY_CONTACT_NO_PHONE",
          "Người liên hệ chính phải có số điện thoại",
          400
        );
      }
    }

    // Generate customer code in transaction
    const result = await prisma.$transaction(async () => {
      const customerCode = await generateCustomerCode(currentUser.clinicId!);

      const customer = await customerRepo.create({
        ...data,
        customerCode,
        createdById: currentUser.employeeId!,
        updatedById: currentUser.employeeId!,
      });

      return customer;
    });

    return mapCustomerToResponse(result);
  },

  /**
   * List customers with pagination and filters
   */
  async list(currentUser: UserCore | null, query: unknown) {
    requireAuth(currentUser);

    const parsed = GetCustomersQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new ServiceError(
        "VALIDATION_ERROR",
        "Tham số truy vấn không hợp lệ",
        400
      );
    }

    const {
      search,
      page,
      pageSize,
      clinicId,
      source,
      serviceOfInterest,
      sort,
    } = parsed.data;

    // Scope clinic access
    let effectiveClinicId = clinicId;
    if (currentUser?.role !== "admin") {
      effectiveClinicId = currentUser?.clinicId || undefined;
    }

    // Parse sort parameter (format: "field:direction")
    const [sortField = "createdAt", sortDirection = "desc"] = sort.split(":");

    const result = await customerRepo.list({
      search,
      page,
      pageSize,
      clinicId: effectiveClinicId,
      source,
      serviceOfInterest,
      sortField,
      sortDirection: sortDirection as "asc" | "desc",
    });

    const mappedItems = result.items.map(mapCustomerToResponse);

    const finalResult = CustomersListResponseSchema.parse({
      items: mappedItems,
      count: result.count,
      page,
      pageSize,
    });

    return finalResult;
  },

  /**
   * Get daily customers list with KPI stats
   */
  async daily(currentUser: UserCore | null, query: unknown) {
    requireAuth(currentUser);

    const parsed = GetCustomersDailyQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new ServiceError(
        "VALIDATION_ERROR",
        "Tham số truy vấn không hợp lệ",
        400
      );
    }

    const { date, clinicId } = parsed.data;

    // Parse date or use today
    const targetDate = date ? new Date(date) : new Date();
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const day = targetDate.getDate();

    const dateStart = new Date(year, month, day, 0, 0, 0);
    const dateEnd = new Date(year, month, day + 1, 0, 0, 0);

    // Scope clinic access
    let effectiveClinicId = clinicId;
    if (currentUser?.role !== "admin") {
      effectiveClinicId = currentUser?.clinicId || undefined;
    }

    if (!effectiveClinicId) {
      throw new ServiceError("MISSING_CLINIC", "Thiếu thông tin clinic", 400);
    }

    const result = await customerRepo.listDaily({
      clinicId: effectiveClinicId,
      dateStart,
      dateEnd,
    });

    return {
      items: result.items.map(mapCustomerToResponse),
      count: result.count,
    };
  },

  /**
   * Search customers globally by customerCode, fullName, or phone
   * Supports: phone lookup, primary contact, customer source, global header search
   */
  async searchCustomers(currentUser: UserCore | null, query: unknown) {
    requireAuth(currentUser);

    const parsed = SearchQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new ServiceError(
        "VALIDATION_ERROR",
        "Tham số tìm kiếm không hợp lệ",
        400
      );
    }

    const { q, limit, requirePhone } = parsed.data;

    const result = await customerRepo.searchCustomers({
      q,
      limit,
      requirePhone,
    });

    return SearchResponseSchema.parse({ items: result });
  },

  /**
   * Get customer by ID with full detail + source relations
   * Populates sourceEmployee or sourceCustomer based on sourceNotes field parsing
   * Conditional metadata (createdBy, updatedBy) only for admin users
   */
  async getById(currentUser: UserCore | null, id: string) {
    requireAuth(currentUser);

    const customer = await customerRepo.findById(id);
    if (!customer) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy khách hàng", 404);
    }

    // Populate sourceEmployee if source = 'employee_referral'
    let sourceEmployee = null;
    if (customer.source === "employee_referral" && customer.sourceNotes) {
      const employeeId = customer.sourceNotes.trim();
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
    let sourceCustomer = null;
    if (customer.source === "customer_referral" && customer.sourceNotes) {
      const sourceCustomerId = customer.sourceNotes.trim();
      if (sourceCustomerId) {
        const sourceCustomerData = await customerRepo.findById(
          sourceCustomerId
        );
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

    // Use mapper to build response with source relations
    const customerWithSources = {
      ...customer,
      sourceEmployee,
      sourceCustomer,
    };

    return mapCustomerDetailToResponse(customerWithSources);
  },

  /**
   * Update customer with validation and audit trail
   * Immutable fields (customerCode, clinicId) are rejected if present in request
   */
  async update(currentUser: UserCore | null, id: string, body: unknown) {
    requireAuth(currentUser);

    if (!currentUser?.employeeId) {
      throw new ServiceError(
        "MISSING_EMPLOYEE_ID",
        "Tài khoản chưa được liên kết với nhân viên",
        403
      );
    }

    // Validate request body
    const parsed = UpdateCustomerRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new ServiceError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
        400
      );
    }
    const data = parsed.data;

    // Find existing customer
    const existing = await customerRepo.findById(id);
    if (!existing) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy khách hàng", 404);
    }

    // Enforce clinic-based access control (non-admin)
    if (currentUser?.role !== "admin") {
      if (existing.clinicId !== currentUser?.clinicId) {
        throw new ServiceError(
          "FORBIDDEN",
          "Không có quyền cập nhật khách hàng này",
          403
        );
      }
    }

    // Validate unique phone if changed
    if (data.phone && data.phone !== existing.phone) {
      const existingPhone = await customerRepo.findByPhone(data.phone);
      if (existingPhone && existingPhone.id !== id) {
        throw new ServiceError("PHONE_EXISTS", "Số điện thoại đã tồn tại", 409);
      }
    }

    // Validate unique email if changed
    if (data.email && data.email !== existing.email) {
      const existingEmail = await customerRepo.findByEmail(data.email);
      if (existingEmail && existingEmail.id !== id) {
        throw new ServiceError("EMAIL_EXISTS", "Email đã tồn tại", 409);
      }
    }

    // Validate primary contact if provided
    if (data.primaryContactId) {
      const primaryContact = await customerRepo.findById(data.primaryContactId);
      if (!primaryContact) {
        throw new ServiceError(
          "PRIMARY_CONTACT_NOT_FOUND",
          "Người liên hệ chính không tồn tại",
          400
        );
      }
      if (!primaryContact.phone) {
        throw new ServiceError(
          "PRIMARY_CONTACT_NO_PHONE",
          "Người liên hệ chính phải có số điện thoại",
          400
        );
      }
    }

    // Update customer with audit trail
    const updated = await customerRepo.update(id, {
      ...data,
      updatedById: currentUser.employeeId,
    });

    // Use getById to return full detail with populated relations
    return this.getById(currentUser, updated.id);
  },
};
