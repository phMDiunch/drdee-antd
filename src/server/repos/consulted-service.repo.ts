// src/server/repos/consulted-service.repo.ts
import { prisma } from "@/services/prisma/prisma";
import type { Prisma } from "@prisma/client";
import type {
  CreateConsultedServiceRequest,
  UpdateConsultedServiceRequest,
  ServiceStatus,
  TreatmentStatus,
} from "@/shared/validation/consulted-service.schema";

/**
 * Complex Pattern: API Schema + Server Fields
 * Following appointment.repo.ts gold standard
 */
export type ConsultedServiceCreateInput = CreateConsultedServiceRequest & {
  appointmentId: string; // 🔒 Server-controlled: từ check-in lookup
  consultedServiceName: string; // 🔒 Denormalized: từ DentalService
  consultedServiceUnit: string; // 🔒 Denormalized: từ DentalService
  price: number; // 🔒 Denormalized: từ DentalService
  finalPrice: number; // 🔒 Calculated: preferentialPrice * quantity
  debt: number; // 🔒 Calculated: finalPrice - amountPaid (only when serviceStatus = "Đã chốt")
  createdById: string; // 🔒 Server-controlled: từ currentUser.employeeId
  updatedById: string; // 🔒 Server-controlled: từ currentUser.employeeId
};

export type ConsultedServiceUpdateInput = Partial<
  Omit<
    UpdateConsultedServiceRequest,
    "id" | "customerId" | "clinicId" | "dentalServiceId"
  >
> & {
  finalPrice?: number; // 🔒 Recalculated if quantity or preferentialPrice changes
  debt?: number; // 🔒 Recalculated if finalPrice or amountPaid changes (only for confirmed services)
  updatedById?: string; // 🔒 Server-controlled: track who made the update
};

/**
 * Prisma include for full relations
 */
const consultedServiceInclude = {
  customer: {
    select: {
      id: true,
      fullName: true,
      customerCode: true,
      dob: true,
      phone: true,
      clinicId: true, // For permission checks after customer clinic transfer
    },
  },
  dentalService: {
    select: {
      id: true,
      name: true,
      unit: true,
      price: true,
      minPrice: true,
      requiresFollowUp: true,
    },
  },
  consultingDoctor: {
    select: {
      id: true,
      fullName: true,
    },
  },
  consultingSale: {
    select: {
      id: true,
      fullName: true,
    },
  },
  treatingDoctor: {
    select: {
      id: true,
      fullName: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      fullName: true,
    },
  },
  updatedBy: {
    select: {
      id: true,
      fullName: true,
    },
  },
  clinic: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.ConsultedServiceInclude;

/**
 * Consulted Service Repository
 * Implements Complex + Server Fields pattern for business data
 */
export const consultedServiceRepo = {
  /**
   * Create new consulted service
   */
  async create(data: ConsultedServiceCreateInput) {
    return prisma.consultedService.create({
      data,
      include: consultedServiceInclude,
    });
  },

  /**
   * Find by ID with full relations
   */
  async findById(id: string) {
    return prisma.consultedService.findUnique({
      where: { id },
      include: consultedServiceInclude,
    });
  },

  /**
   * Update consulted service
   */
  async update(id: string, data: ConsultedServiceUpdateInput) {
    return prisma.consultedService.update({
      where: { id },
      data: data as Prisma.ConsultedServiceUpdateInput,
      include: consultedServiceInclude,
    });
  },

  /**
   * Delete consulted service (hard delete)
   */
  async delete(id: string) {
    return prisma.consultedService.delete({
      where: { id },
    });
  },

  /**
   * List consulted services with pagination and filters
   */
  async list(params: {
    search?: string;
    page: number;
    pageSize: number;
    customerId?: string;
    clinicId?: string;
    serviceStatus?: ServiceStatus;
    treatmentStatus?: TreatmentStatus;
    sortField: string;
    sortDirection: "asc" | "desc";
  }) {
    const {
      search,
      page,
      pageSize,
      customerId,
      clinicId,
      serviceStatus,
      treatmentStatus,
      sortField,
      sortDirection,
    } = params;
    const skip = (page - 1) * pageSize;

    // Build where conditions
    const where: Prisma.ConsultedServiceWhereInput = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (clinicId) {
      where.clinicId = clinicId;
    }

    if (serviceStatus) {
      where.serviceStatus = serviceStatus;
    }

    if (treatmentStatus) {
      where.treatmentStatus = treatmentStatus;
    }

    if (search) {
      where.OR = [
        { customer: { fullName: { contains: search, mode: "insensitive" } } },
        {
          customer: { customerCode: { contains: search, mode: "insensitive" } },
        },
        { customer: { phone: { contains: search, mode: "insensitive" } } },
        {
          consultedServiceName: { contains: search, mode: "insensitive" },
        },
      ];
    }

    // Build orderBy
    const orderBy: Prisma.ConsultedServiceOrderByWithRelationInput = {};

    if (sortField === "consultationDate") {
      orderBy.consultationDate = sortDirection;
    } else if (sortField === "finalPrice") {
      orderBy.finalPrice = sortDirection;
    } else if (sortField === "serviceConfirmDate") {
      orderBy.serviceConfirmDate = sortDirection;
    } else if (sortField === "customerName") {
      orderBy.customer = { fullName: sortDirection };
    } else {
      orderBy.consultationDate = "desc"; // default
    }

    // Execute queries in parallel
    const [items, total] = await Promise.all([
      prisma.consultedService.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: consultedServiceInclude,
      }),
      prisma.consultedService.count({ where }),
    ]);

    return { items, total };
  },

  /**
   * List daily consulted services (date range)
   * Returns items + count + statistics
   */
  async listDaily(params: {
    clinicId: string;
    dateStart: Date;
    dateEnd: Date;
  }) {
    const { clinicId, dateStart, dateEnd } = params;

    const where: Prisma.ConsultedServiceWhereInput = {
      clinicId,
      consultationDate: {
        gte: dateStart,
        lte: dateEnd,
      },
    };

    // Get items with relations
    const items = await prisma.consultedService.findMany({
      where,
      orderBy: { consultationDate: "desc" },
      include: consultedServiceInclude,
    });

    // Calculate statistics
    const total = items.length;
    const confirmed = items.filter((s) => s.serviceStatus === "Đã chốt").length;
    const unconfirmed = items.filter(
      (s) => s.serviceStatus === "Chưa chốt"
    ).length;
    const totalValue = items.reduce((sum, s) => sum + s.finalPrice, 0);
    const confirmedValue = items
      .filter((s) => s.serviceStatus === "Đã chốt")
      .reduce((sum, s) => sum + s.finalPrice, 0);

    return {
      items,
      count: total,
      statistics: {
        total,
        confirmed,
        unconfirmed,
        totalValue,
        confirmedValue,
      },
    };
  },

  /**
   * Find today's checked-in appointment for customer
   * Used to validate check-in requirement when creating consulted service
   */
  async findTodayCheckedInAppointment(params: {
    customerId: string;
    clinicId: string;
  }) {
    const { customerId, clinicId } = params;

    // Today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.appointment.findFirst({
      where: {
        customerId,
        clinicId,
        appointmentDateTime: {
          gte: today,
          lt: tomorrow,
        },
        checkInTime: {
          not: null,
        },
      },
      select: {
        id: true,
        checkInTime: true,
      },
    });
  },

  /**
   * Confirm consulted service (set status to "Đã chốt")
   * Calculate debt when confirming the service
   */
  async confirm(id: string, updatedById: string) {
    // First get the current service to calculate debt
    const existing = await prisma.consultedService.findUnique({
      where: { id },
      select: { finalPrice: true, amountPaid: true },
    });

    if (!existing) {
      throw new Error("Consulted service not found");
    }

    const debt = existing.finalPrice - existing.amountPaid;

    return prisma.consultedService.update({
      where: { id },
      data: {
        serviceStatus: "Đã chốt",
        serviceConfirmDate: new Date(),
        debt, // Calculate debt when confirming
        updatedById,
      },
      include: consultedServiceInclude,
    });
  },
};
