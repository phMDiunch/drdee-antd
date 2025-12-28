// src/server/repos/customer.repo.ts
import { prisma } from "@/services/prisma/prisma";
import type { Prisma } from "@prisma/client";
import type {
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from "@/shared/validation/customer.schema";

export type CustomerCreateInput = CreateCustomerRequest & {
  type: string; // 🔒 Server-controlled: "LEAD" | "CUSTOMER"
  firstVisitDate: Date; // 🔒 Server-controlled: Set to now() for new CUSTOMER
  createdById: string; // 🔒 Server-controlled: từ currentUser.employeeId
  updatedById: string; // 🔒 Server-controlled: từ currentUser.employeeId
  customerCode: string; // 🔒 Server-generated: theo quy tắc ${prefix}-${YY}${MM}-${NNN}
};

export type CustomerUpdateInput = Partial<Omit<UpdateCustomerRequest, "id">> & {
  updatedById?: string; // 🔒 Server-controlled: track who made the update
};

/**
 * Customer Repository
 * Implements patterns for customer management with proper audit trail
 */
export const customerRepo = {
  /**
   * List customers with pagination and filters
   */
  async list(params: {
    search?: string;
    page: number;
    pageSize: number;
    clinicId?: string;
    source?: string;
    serviceOfInterest?: string;
    sortField: string;
    sortDirection: "asc" | "desc";
  }) {
    const {
      search,
      page,
      pageSize,
      clinicId,
      source,
      serviceOfInterest,
      sortField,
      sortDirection,
    } = params;
    const skip = (page - 1) * pageSize;

    // Build where conditions
    const where: Prisma.CustomerWhereInput = {
      type: "CUSTOMER", // ⭐ Only CUSTOMER type (not LEAD)
    };

    if (clinicId) {
      where.clinicId = clinicId;
    }

    if (source) {
      where.source = source;
    }

    if (serviceOfInterest) {
      where.serviceOfInterest = serviceOfInterest;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { customerCode: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Build orderBy
    const orderBy: Prisma.CustomerOrderByWithRelationInput = {
      [sortField]: sortDirection,
    };

    const [items, count] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          clinic: {
            select: {
              id: true,
              clinicCode: true,
              name: true,
              shortName: true,
              colorCode: true,
            },
          },
          primaryContact: { select: { id: true, fullName: true, phone: true } },
          createdBy: { select: { id: true, fullName: true } },
          updatedBy: { select: { id: true, fullName: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);
    return { items, count };
  },

  /**
   * Get customers created on a specific date for a clinic
   */
  async listDaily(params: {
    clinicId: string;
    dateStart: Date;
    dateEnd: Date;
    includeAppointments?: boolean;
    appointmentDateStart?: Date;
    appointmentDateEnd?: Date;
  }) {
    const {
      clinicId,
      dateStart,
      dateEnd,
      includeAppointments,
      appointmentDateStart,
      appointmentDateEnd,
    } = params;

    // Build include object conditionally
    const include: Prisma.CustomerInclude = {
      clinic: {
        select: {
          id: true,
          clinicCode: true,
          name: true,
          shortName: true,
          colorCode: true,
        },
      },
      primaryContact: { select: { id: true, fullName: true, phone: true } },
      createdBy: { select: { id: true, fullName: true } },
      updatedBy: { select: { id: true, fullName: true } },
    };

    // Add appointments if requested
    if (includeAppointments && appointmentDateStart && appointmentDateEnd) {
      include.appointments = {
        where: {
          appointmentDateTime: {
            gte: appointmentDateStart,
            lt: appointmentDateEnd,
          },
        },
        orderBy: { appointmentDateTime: "asc" },
        include: {
          primaryDentist: {
            select: { id: true, fullName: true },
          },
        },
      };
    }

    const items = await prisma.customer.findMany({
      where: {
        type: "CUSTOMER", // ⭐ Only CUSTOMER type (not LEAD)
        clinicId,
        firstVisitDate: { gte: dateStart, lt: dateEnd },
      },
      orderBy: { firstVisitDate: "desc" },
      include,
    });

    // Transform appointments[0] → todayAppointment if includeAppointments
    const transformedItems = includeAppointments
      ? items.map((item) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { appointments, ...rest } = item as any;
          return {
            ...rest,
            todayAppointment: appointments?.[0] ?? null,
          };
        })
      : items;

    return { items: transformedItems, count: transformedItems.length };
  },

  /**
   * Create customer with validated data + server metadata
   */
  async create(data: CustomerCreateInput) {
    return prisma.customer.create({
      data,
      include: {
        clinic: {
          select: {
            id: true,
            clinicCode: true,
            name: true,
            shortName: true,
            colorCode: true,
          },
        },
        primaryContact: { select: { id: true, fullName: true, phone: true } },
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  /**
   * Update customer with validated data + updated metadata
   */
  async update(id: string, data: CustomerUpdateInput) {
    return prisma.customer.update({
      where: { id },
      data,
      include: {
        clinic: {
          select: {
            id: true,
            clinicCode: true,
            name: true,
            shortName: true,
            colorCode: true,
          },
        },
        primaryContact: { select: { id: true, fullName: true, phone: true } },
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  /**
   * Find customer by ID with full relations
   * Includes: clinic, primaryContact, createdBy, updatedBy
   * Note: sourceEmployee and sourceCustomer need to be populated in service layer
   * based on sourceNotes field parsing
   */
  async findById(id: string) {
    return prisma.customer.findFirst({
      where: {
        id,
        // type: "CUSTOMER", // ⭐ Only CUSTOMER type (not LEAD)
      },
      include: {
        clinic: {
          select: {
            id: true,
            clinicCode: true,
            name: true,
            shortName: true,
            colorCode: true,
          },
        },
        primaryContact: {
          select: {
            id: true,
            customerCode: true,
            fullName: true,
            phone: true,
          },
        },
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
        // Appointments relation (for Customer Detail - check-in status + tab count)
        appointments: {
          select: {
            id: true,
            appointmentDateTime: true,
            checkInTime: true,
            checkOutTime: true,
            status: true,
          },
          orderBy: { appointmentDateTime: "desc" },
        },
      },
    });
  },

  /**
   * Find customer by phone (for lookup/duplicate check)
   * Searches both CUSTOMER and LEAD types
   */
  async findByPhone(phone: string) {
    return prisma.customer.findFirst({
      where: {
        phone,
      },
      select: {
        id: true,
        customerCode: true,
        fullName: true,
        phone: true,
        type: true,
      },
    });
  },

  /**
   * Find customer by email (for duplicate check)
   */
  async findByEmail(email: string) {
    return prisma.customer.findFirst({
      where: {
        email,
        type: "CUSTOMER", // ⭐ Only CUSTOMER type (not LEAD)
      },
      select: { id: true, customerCode: true, fullName: true, email: true },
    });
  },

  /**
   * Find last customer code by clinic prefix for auto-generation
   */
  async findLastCustomerCodeByClinic(
    clinicId: string,
    prefix: string,
    yearMonth: string
  ) {
    return prisma.customer.findFirst({
      where: {
        type: "CUSTOMER", // ⭐ Only CUSTOMER type (not LEAD)
        clinicId,
        customerCode: {
          startsWith: `${prefix}-${yearMonth}`,
        },
      },
      orderBy: { customerCode: "desc" },
      select: { customerCode: true },
    });
  },

  /**
   * Search customers globally by customerCode, fullName, or phone
   * - requirePhone: only return customers with phone
   * - Includes both LEAD and CUSTOMER types for phone duplicate checking
   */
  async searchCustomers(params: {
    q: string;
    limit: number;
    requirePhone?: boolean;
  }) {
    const { q, limit, requirePhone } = params;

    const where: Prisma.CustomerWhereInput = {
      OR: [
        { customerCode: { contains: q, mode: "insensitive" } },
        { fullName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ],
    };

    if (requirePhone) {
      where.phone = { not: null };
    }

    return prisma.customer.findMany({
      where,
      select: {
        id: true,
        customerCode: true,
        fullName: true,
        phone: true,
        type: true,
      },
      orderBy: { fullName: "asc" },
      take: limit,
    });
  },
};
