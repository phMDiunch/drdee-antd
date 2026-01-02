// src/server/repos/appointment.repo.ts
import { prisma } from "@/services/prisma/prisma";
import type { Prisma } from "@prisma/client";
import type {
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
} from "@/shared/validation/appointment.schema";
import type { AppointmentStatus } from "@/shared/validation/appointment.schema";

/**
 * Complex Pattern: API Schema + Server Fields
 * Following customer.repo.ts gold standard
 */
export type AppointmentCreateInput = CreateAppointmentRequest & {
  createdById: string; // 🔒 Server-controlled: từ currentUser.employeeId
  updatedById: string; // 🔒 Server-controlled: từ currentUser.employeeId
};

export type AppointmentUpdateInput = Partial<
  Omit<UpdateAppointmentRequest, "id">
> & {
  updatedById?: string; // 🔒 Server-controlled: track who made the update
};

/**
 * Appointment Repository
 * Implements Complex + Server Fields pattern for audit trail
 */
export const appointmentRepo = {
  /**
   * List appointments with pagination and filters
   */
  async list(params: {
    search?: string;
    page: number;
    pageSize: number;
    customerId?: string; // Filter by customer (cross-clinic view)
    clinicId?: string;
    status?: AppointmentStatus;
    date?: string; // YYYY-MM-DD format
    sortField: string;
    sortDirection: "asc" | "desc";
  }) {
    const {
      search,
      page,
      pageSize,
      customerId,
      clinicId,
      status,
      date,
      sortField,
      sortDirection,
    } = params;
    const skip = (page - 1) * pageSize;

    // Build where conditions
    const where: Prisma.AppointmentWhereInput = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (clinicId) {
      where.clinicId = clinicId;
    }

    if (status) {
      where.status = status;
    }

    if (date) {
      // Filter by specific date (YYYY-MM-DD)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.appointmentDateTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (search) {
      where.OR = [
        { customer: { fullName: { contains: search, mode: "insensitive" } } },
        {
          customer: { customerCode: { contains: search, mode: "insensitive" } },
        },
        { customer: { phone: { contains: search, mode: "insensitive" } } },
        {
          primaryDentist: {
            fullName: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    // Build orderBy
    const orderBy: Prisma.AppointmentOrderByWithRelationInput = {
      [sortField]: sortDirection,
    };

    const [items, count] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          customer: {
            select: {
              id: true,
              customerCode: true,
              fullName: true,
              phone: true,
              dob: true,
            },
          },
          primaryDentist: {
            select: {
              id: true,
              fullName: true,
              employeeCode: true,
              favoriteColor: true,
            },
          },
          secondaryDentist: {
            select: {
              id: true,
              fullName: true,
              employeeCode: true,
              favoriteColor: true,
            },
          },
          clinic: {
            select: { id: true, clinicCode: true, name: true, shortName: true, colorCode: true },
          },
          createdBy: { select: { id: true, fullName: true } },
          updatedBy: { select: { id: true, fullName: true } },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return { items, count };
  },

  /**
   * Get appointments for a specific date and clinic (Daily View)
   * Optimized: Fixed N+1 query issue by fetching next appointments separately
   * Previously: N+1 queries (1 main + N nested for each customer's next appointment)
   * Now: 2 queries (1 main + 1 batch query for all next appointments)
   */
  async listDaily(params: {
    clinicId: string;
    dateStart: Date;
    dateEnd: Date;
  }) {
    const { clinicId, dateStart, dateEnd } = params;

    // Query 1: Fetch today's appointments without nested next appointments
    const items = await prisma.appointment.findMany({
      where: {
        clinicId,
        appointmentDateTime: {
          gte: dateStart,
          lt: dateEnd,
        },
      },
      orderBy: { appointmentDateTime: "asc" },
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            fullName: true,
            phone: true,
            dob: true,
          },
        },
        primaryDentist: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            favoriteColor: true,
          },
        },
        secondaryDentist: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            favoriteColor: true,
          },
        },
        clinic: {
          select: { id: true, clinicCode: true, name: true, shortName: true, colorCode: true },
        },
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });

    // Query 2: Batch fetch next appointments for all customers
    // Extract unique customer IDs from today's appointments
    const customerIds = [...new Set(items.map((apt) => apt.customerId))];

    if (customerIds.length === 0) {
      return { items: [], count: 0 };
    }

    // Fetch the next appointment for each customer (future appointments after dateEnd)
    const nextAppointments = await prisma.appointment.findMany({
      where: {
        customerId: { in: customerIds },
        appointmentDateTime: { gte: dateEnd },
      },
      select: {
        id: true,
        customerId: true,
        appointmentDateTime: true,
      },
      orderBy: { appointmentDateTime: "asc" },
    });

    // Build a map: customerId -> earliest next appointment
    const nextAppointmentMap = new Map<
      string,
      { id: string; appointmentDateTime: Date }
    >();
    nextAppointments.forEach((apt) => {
      if (!nextAppointmentMap.has(apt.customerId)) {
        nextAppointmentMap.set(apt.customerId, {
          id: apt.id,
          appointmentDateTime: apt.appointmentDateTime,
        });
      }
    });

    // Merge next appointments into customer data (application-layer join)
    const itemsWithNextAppointment = items.map((apt) => ({
      ...apt,
      customer: {
        ...apt.customer,
        appointments: nextAppointmentMap.has(apt.customerId)
          ? [nextAppointmentMap.get(apt.customerId)!]
          : [],
      },
    }));

    return { items: itemsWithNextAppointment, count: itemsWithNextAppointment.length };
  },

  /**
   * Create new appointment
   */
  async create(data: AppointmentCreateInput) {
    return prisma.appointment.create({
      data,
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            fullName: true,
            phone: true,
            dob: true,
          },
        },
        primaryDentist: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            favoriteColor: true,
          },
        },
        secondaryDentist: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            favoriteColor: true,
          },
        },
        clinic: {
          select: { id: true, clinicCode: true, name: true, shortName: true, colorCode: true },
        },
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  /**
   * Update appointment
   */
  async update(id: string, data: AppointmentUpdateInput) {
    return prisma.appointment.update({
      where: { id },
      data,
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            fullName: true,
            phone: true,
            dob: true,
          },
        },
        primaryDentist: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            favoriteColor: true,
          },
        },
        secondaryDentist: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            favoriteColor: true,
          },
        },
        clinic: {
          select: { id: true, clinicCode: true, name: true, shortName: true, colorCode: true },
        },
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  /**
   * Get appointment by ID
   */
  async getById(id: string) {
    return prisma.appointment.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            fullName: true,
            phone: true,
            dob: true,
          },
        },
        primaryDentist: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            favoriteColor: true,
          },
        },
        secondaryDentist: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            favoriteColor: true,
          },
        },
        clinic: {
          select: { id: true, clinicCode: true, name: true, shortName: true, colorCode: true },
        },
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  /**
   * Delete appointment (hard delete)
   */
  async delete(id: string) {
    return prisma.appointment.delete({
      where: { id },
    });
  },

  /**
   * Check if customer has appointment on specific date
   * For conflict prevention (1 customer/1 appointment/day)
   */
  async findCustomerAppointmentOnDate(params: {
    customerId: string;
    date: Date;
    excludeAppointmentId?: string;
  }) {
    const { customerId, date, excludeAppointmentId } = params;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const where: Prisma.AppointmentWhereInput = {
      customerId,
      appointmentDateTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    // Exclude current appointment when editing
    if (excludeAppointmentId) {
      where.id = { not: excludeAppointmentId };
    }

    return prisma.appointment.findFirst({ where });
  },

  /**
   * Check dentist availability (conflicts in time slot)
   * For soft warning
   */
  async findDentistConflicts(params: {
    dentistId: string;
    startTime: Date;
    endTime: Date;
    excludeAppointmentId?: string;
  }) {
    const { dentistId, startTime, endTime, excludeAppointmentId } = params;

    const where: Prisma.AppointmentWhereInput = {
      OR: [{ primaryDentistId: dentistId }, { secondaryDentistId: dentistId }],
      appointmentDateTime: {
        lt: endTime,
      },
      // Check if appointment overlaps by comparing end times
      // appointment.appointmentDateTime + duration must be > startTime
    };

    // Exclude current appointment when editing
    if (excludeAppointmentId) {
      where.id = { not: excludeAppointmentId };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      select: {
        id: true,
        appointmentDateTime: true,
        duration: true,
        customer: {
          select: { fullName: true },
        },
      },
    });

    // Filter overlapping appointments manually
    const conflicts = appointments.filter((apt) => {
      const aptEndTime = new Date(apt.appointmentDateTime);
      aptEndTime.setMinutes(aptEndTime.getMinutes() + apt.duration);
      return aptEndTime > startTime;
    });

    return conflicts;
  },
};
