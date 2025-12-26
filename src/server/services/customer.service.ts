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
import { customerPermissions } from "@/shared/permissions/customer.permissions";

/**
 * Populate source relations (employee or customer) based on source type and sourceNotes
 * Reusable helper for getById and listDaily operations
 */
async function populateSourceRelations(customer: {
  source: string | null;
  sourceNotes: string | null;
}) {
  let sourceEmployee = null;
  let sourceCustomer = null;

  // Populate sourceEmployee if source = 'employee_referral'
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
  if (customer.source === "customer_referral" && customer.sourceNotes) {
    const sourceCustomerId = customer.sourceNotes.trim();
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

export const customerService = {
  /**
   * Create customer with business logic and validation
   */
  async create(currentUser: UserCore | null, body: unknown) {
    // ✅ Use shared permission logic
    try {
      customerPermissions.validateCreate(currentUser);
    } catch (error) {
      throw new ServiceError(
        "PERMISSION_DENIED",
        error instanceof Error
          ? error.message
          : "Không có quyền tạo khách hàng",
        403
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

    // Validate clinic access - Employee can only create for their clinic
    if (
      currentUser?.role !== "admin" &&
      data.clinicId !== currentUser?.clinicId
    ) {
      throw new ServiceError(
        "CLINIC_MISMATCH",
        "Nhân viên chỉ có thể tạo khách hàng cho chi nhánh của mình",
        403
      );
    }

    // Validate unique phone if provided
    if (data.phone) {
      const existingPhone = await customerRepo.findByPhone(data.phone);
      if (existingPhone) {
        if (existingPhone.type === "LEAD") {
          throw new ServiceError(
            "PHONE_IS_LEAD",
            "Số điện thoại này đã là Lead. Vui lòng chuyển đổi Lead thành Customer trước",
            409
          );
        }
        throw new ServiceError(
          "PHONE_EXISTS",
          "Số điện thoại đã tồn tại trong danh sách Khách hàng",
          409
        );
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
    // Use data.clinicId (from request) to generate correct clinic-specific code
    const result = await prisma.$transaction(async () => {
      const customerCode = await generateCustomerCode(data.clinicId);

      const customer = await customerRepo.create({
        ...data,
        type: "CUSTOMER", // New customer is always type CUSTOMER (not LEAD)
        customerCode,
        firstVisitDate: new Date(), // ⭐ NEW: Set first visit date
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
    // ✅ Validate authentication
    try {
      customerPermissions.validateCreate(currentUser); // Check basic auth
    } catch (error) {
      throw new ServiceError(
        "PERMISSION_DENIED",
        error instanceof Error ? error.message : "Bạn chưa đăng nhập",
        401
      );
    }

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
    // ✅ Validate authentication
    try {
      customerPermissions.validateCreate(currentUser);
    } catch (error) {
      throw new ServiceError(
        "PERMISSION_DENIED",
        error instanceof Error ? error.message : "Bạn chưa đăng nhập",
        401
      );
    }

    const parsed = GetCustomersDailyQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new ServiceError(
        "VALIDATION_ERROR",
        "Tham số truy vấn không hợp lệ",
        400
      );
    }

    const { date, clinicId, includeAppointments } = parsed.data;

    // Parse date or use today - for CUSTOMER creation date
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

    // Always query TODAY appointments (for check-in), not selectedDate appointments
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0
    );
    const todayEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1,
      0,
      0,
      0
    );

    const result = await customerRepo.listDaily({
      clinicId: effectiveClinicId,
      dateStart,
      dateEnd,
      includeAppointments,
      appointmentDateStart: includeAppointments ? todayStart : undefined,
      appointmentDateEnd: includeAppointments ? todayEnd : undefined,
    });

    // Populate source relations for each customer
    const itemsWithSources = await Promise.all(
      result.items.map(async (customer) => {
        const { sourceEmployee, sourceCustomer } =
          await populateSourceRelations(customer);
        const mapped = includeAppointments
          ? customer // Keep todayAppointment field
          : mapCustomerToResponse(customer);
        return {
          ...mapped,
          sourceEmployee,
          sourceCustomer,
        };
      })
    );

    return {
      items: itemsWithSources,
      count: result.count,
    };
  },

  /**
   * Search customers globally by customerCode, fullName, or phone
   * Supports: phone lookup, primary contact, customer source, global header search
   */
  async searchCustomers(currentUser: UserCore | null, query: unknown) {
    // ✅ Validate authentication
    try {
      customerPermissions.validateCreate(currentUser);
    } catch (error) {
      throw new ServiceError(
        "PERMISSION_DENIED",
        error instanceof Error ? error.message : "Bạn chưa đăng nhập",
        401
      );
    }

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
    const customer = await customerRepo.findById(id);
    if (!customer) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy khách hàng", 404);
    }

    // ✅ Validate view permission
    try {
      customerPermissions.validateView(currentUser, customer);
    } catch (error) {
      throw new ServiceError(
        "PERMISSION_DENIED",
        error instanceof Error
          ? error.message
          : "Không có quyền xem khách hàng",
        403
      );
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
   * - customerCode: Immutable (rejected by schema)
   * - clinicId: Admin-only (validated here)
   */
  async update(currentUser: UserCore | null, id: string, body: unknown) {
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

    // ✅ Validate edit permission
    try {
      customerPermissions.validateEdit(currentUser, existing);
    } catch (error) {
      throw new ServiceError(
        "PERMISSION_DENIED",
        error instanceof Error ? error.message : "Không có quyền chỉnh sửa",
        403
      );
    }

    // ✅ Validate clinicId change: Admin-only
    if (data.clinicId && data.clinicId !== existing.clinicId) {
      if (currentUser?.role !== "admin") {
        throw new ServiceError(
          "PERMISSION_DENIED",
          "Chỉ admin mới có thể chuyển khách hàng sang chi nhánh khác",
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
      updatedById: currentUser!.employeeId!,
    });

    // Use getById to return full detail with populated relations
    return this.getById(currentUser, updated.id);
  },
};
