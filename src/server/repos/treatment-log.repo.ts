// src/server/repos/treatment-log.repo.ts
import { prisma } from "@/services/prisma/prisma";
import type { Prisma } from "@prisma/client";
import type {
  CreateTreatmentLogRequest,
  UpdateTreatmentLogRequest,
} from "@/shared/validation/treatment-log.schema";

/**
 * Complex Pattern: API Schema + Server Fields
 * Following appointment.repo.ts and customer.repo.ts patterns
 */
export type TreatmentLogCreateInput = CreateTreatmentLogRequest & {
  customerId: string; // 🔒 Server-derived: từ consultedService.customerId
  treatmentDate: Date; // 🔒 Server-derived: từ appointment.appointmentDateTime hoặc now()
  createdById: string; // 🔒 Server-controlled: từ currentUser.employeeId
  updatedById: string; // 🔒 Server-controlled: từ currentUser.employeeId
  imageUrls: string[]; // 🔒 Server-controlled: default []
  xrayUrls: string[]; // 🔒 Server-controlled: default []
};

export type TreatmentLogUpdateInput = Partial<
  Omit<
    UpdateTreatmentLogRequest,
    "consultedServiceId" | "appointmentId" | "customerId" | "treatmentDate"
  >
> & {
  updatedById?: string; // 🔒 Server-controlled: track who made the update
};

/**
 * Include pattern for treatment log queries
 * Note: clinicId is a field, not a relation - will be fetched separately
 */
const treatmentLogInclude = {
  customer: {
    select: {
      id: true,
      fullName: true,
      customerCode: true,
      dob: true,
    },
  },
  consultedService: {
    select: {
      id: true,
      consultedServiceName: true,
      toothPositions: true,
      serviceConfirmDate: true,
    },
  },
  appointment: {
    select: {
      id: true,
      appointmentDateTime: true,
      status: true,
    },
  },
  dentist: {
    select: {
      id: true,
      fullName: true,
    },
  },
  assistant1: {
    select: {
      id: true,
      fullName: true,
    },
  },
  assistant2: {
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
} as const;

/**
 * Treatment Log Repository
 * Implements Complex + Server Fields pattern for audit trail
 */
export const treatmentLogRepo = {
  /**
   * Create new treatment log
   */
  async create(data: TreatmentLogCreateInput) {
    return await prisma.treatmentLog.create({
      data,
      include: treatmentLogInclude,
    });
  },

  /**
   * Find treatment log by ID with full relations
   */
  async findById(id: string) {
    return await prisma.treatmentLog.findUnique({
      where: { id },
      include: treatmentLogInclude,
    });
  },

  /**
   * List treatment logs with filters
   */
  async list(params: { customerId?: string; appointmentId?: string }) {
    const { customerId, appointmentId } = params;

    const where: Prisma.TreatmentLogWhereInput = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (appointmentId) {
      where.appointmentId = appointmentId;
    }

    return await prisma.treatmentLog.findMany({
      where,
      include: treatmentLogInclude,
      orderBy: {
        createdAt: "asc",
      },
    });
  },

  /**
   * Update treatment log
   */
  async update(id: string, data: TreatmentLogUpdateInput) {
    return await prisma.treatmentLog.update({
      where: { id },
      data,
      include: treatmentLogInclude,
    });
  },

  /**
   * Delete treatment log (hard delete)
   */
  async delete(id: string) {
    return await prisma.treatmentLog.delete({
      where: { id },
    });
  },

  /**
   * Find all treatment logs by consulted service
   * Used for auto-updating ConsultedService.treatmentStatus
   * Returns logs ordered by treatmentDate DESC (newest first)
   */
  async findByConsultedService(consultedServiceId: string) {
    return await prisma.treatmentLog.findMany({
      where: { consultedServiceId },
      select: {
        id: true,
        treatmentStatus: true,
        treatmentDate: true,
      },
      orderBy: {
        treatmentDate: "desc",
      },
    });
  },

  /**
   * Find checked-in appointments with consulted services and treatment logs
   * Used for Customer Detail Treatment Log Tab
   */
  async findCheckedInAppointmentsForTreatment(customerId: string) {
    return await prisma.appointment.findMany({
      where: {
        customerId,
        status: {
          in: ["Đã đến", "Đến đột xuất"],
        },
        checkInTime: {
          not: null,
        },
      },
      include: {
        primaryDentist: {
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
        customer: {
          select: {
            id: true,
            fullName: true,
            customerCode: true,
            dob: true,
            consultedServices: {
              where: {
                serviceStatus: "Đã chốt",
              },
              select: {
                id: true,
                consultedServiceName: true,
                toothPositions: true,
                serviceConfirmDate: true,
                serviceStatus: true,
                treatingDoctor: {
                  select: {
                    id: true,
                    fullName: true,
                  },
                },
              },
            },
          },
        },
        treatmentLogs: {
          include: treatmentLogInclude,
          orderBy: {
            treatmentDate: "asc",
          },
        },
      },
      orderBy: {
        appointmentDateTime: "desc",
      },
    });
  },

  /**
   * List treatment logs for daily view with statistics
   * Used for Daily View page
   * Returns: { items, totalCheckedInCustomers, totalTreatedCustomers }
   */
  async listDaily(params: { date: string; clinicId: string }) {
    const { date, clinicId } = params;

    // Parse date string (YYYY-MM-DD) to Date range
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);

    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    // Fetch treatment logs for the day
    const items = await prisma.treatmentLog.findMany({
      where: {
        treatmentDate: {
          gte: dateStart,
          lte: dateEnd,
        },
        clinicId,
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            customerCode: true,
            dob: true, // Need for age calculation
          },
        },
        consultedService: {
          select: {
            id: true,
            consultedServiceName: true,
            toothPositions: true,
            serviceConfirmDate: true,
          },
        },
        appointment: {
          select: {
            id: true,
            appointmentDateTime: true,
            status: true,
          },
        },
        dentist: {
          select: {
            id: true,
            fullName: true,
          },
        },
        assistant1: {
          select: {
            id: true,
            fullName: true,
          },
        },
        assistant2: {
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
      },
      orderBy: {
        customer: {
          customerCode: "asc", // Sort by customer code A-Z (nullable last)
        },
      },
    });

    // Count distinct customers who checked in today
    const checkedInCustomers = await prisma.appointment.findMany({
      where: {
        checkInTime: {
          gte: dateStart,
          lte: dateEnd,
        },
        clinicId,
        status: {
          in: ["Đã đến", "Đến đột xuất"],
        },
      },
      select: {
        customerId: true,
      },
      distinct: ["customerId"],
    });

    // Count distinct customers who were treated today (from treatment logs)
    const treatedCustomers = await prisma.treatmentLog.findMany({
      where: {
        treatmentDate: {
          gte: dateStart,
          lte: dateEnd,
        },
        clinicId,
      },
      select: {
        customerId: true,
      },
      distinct: ["customerId"],
    });

    return {
      items,
      totalCheckedInCustomers: checkedInCustomers.length,
      totalTreatedCustomers: treatedCustomers.length,
    };
  },
};
