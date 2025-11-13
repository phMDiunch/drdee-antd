// src/server/services/treatment-log/_mappers.ts
import type { TreatmentLog } from "@prisma/client";
import type {
  TreatmentLogResponse,
  AppointmentForTreatmentResponse,
} from "@/shared/validation/treatment-log.schema";
import { prisma } from "@/services/prisma/prisma";

/**
 * Type for treatment log with relations (from repo)
 */
type TreatmentLogWithRelations = TreatmentLog & {
  customer: {
    id: string;
    fullName: string;
    customerCode: string | null;
  };
  consultedService: {
    id: string;
    consultedServiceName: string;
    toothPositions: string[];
    serviceConfirmDate: Date | null;
  };
  appointment: {
    id: string;
    appointmentDateTime: Date;
    status: string;
  } | null;
  dentist: {
    id: string;
    fullName: string;
  };
  assistant1: {
    id: string;
    fullName: string;
  } | null;
  assistant2: {
    id: string;
    fullName: string;
  } | null;
  createdBy: {
    id: string;
    fullName: string;
  };
  updatedBy: {
    id: string;
    fullName: string;
  };
};

/**
 * Type for appointment with relations (for checked-in appointments query)
 */
type AppointmentWithRelationsForTreatment = {
  id: string;
  appointmentDateTime: Date;
  status: string;
  checkInTime: Date | null;
  primaryDentist: {
    id: string;
    fullName: string;
  };
  clinic: {
    id: string;
    name: string;
  };
  customer: {
    id: string;
    fullName: string;
    customerCode: string | null;
    consultedServices: {
      id: string;
      consultedServiceName: string;
      toothPositions: string[];
      serviceConfirmDate: Date | null;
      serviceStatus: string;
      treatingDoctor: {
        id: string;
        fullName: string;
      } | null;
    }[];
  };
  treatmentLogs: TreatmentLogWithRelations[];
};

/**
 * Map treatment log from Prisma to API response
 * Fetches clinic separately since it's not a relation
 */
export async function mapTreatmentLogToResponse(
  log: TreatmentLogWithRelations
): Promise<TreatmentLogResponse> {
  // Fetch clinic data separately (clinicId is a field, not a relation)
  const clinic = await prisma.clinic.findUnique({
    where: { id: log.clinicId },
    select: { id: true, name: true },
  });

  if (!clinic) {
    throw new Error(`Clinic not found for treatmentLog ${log.id}`);
  }

  return {
    id: log.id,
    customer: {
      id: log.customer.id,
      fullName: log.customer.fullName,
      customerCode: log.customer.customerCode || null,
    },
    consultedService: {
      id: log.consultedService.id,
      consultedServiceName: log.consultedService.consultedServiceName,
      toothPositions: log.consultedService.toothPositions,
      serviceConfirmDate:
        log.consultedService.serviceConfirmDate?.toISOString() || null,
    },
    appointment: {
      id: log.appointment!.id,
      appointmentDateTime: log.appointment!.appointmentDateTime.toISOString(),
      status: log.appointment!.status,
    },
    treatmentDate: log.treatmentDate.toISOString(),
    treatmentNotes: log.treatmentNotes,
    nextStepNotes: log.nextStepNotes,
    treatmentStatus: log.treatmentStatus as
      | "Chưa điều trị"
      | "Đang điều trị"
      | "Hoàn thành",
    dentist: {
      id: log.dentist.id,
      fullName: log.dentist.fullName,
    },
    assistant1: log.assistant1
      ? {
          id: log.assistant1.id,
          fullName: log.assistant1.fullName,
        }
      : null,
    assistant2: log.assistant2
      ? {
          id: log.assistant2.id,
          fullName: log.assistant2.fullName,
        }
      : null,
    clinic: {
      id: clinic.id,
      name: clinic.name,
    },
    imageUrls: log.imageUrls,
    xrayUrls: log.xrayUrls,
    createdBy: {
      id: log.createdBy.id,
      fullName: log.createdBy.fullName,
    },
    updatedBy: {
      id: log.updatedBy.id,
      fullName: log.updatedBy.fullName,
    },
    createdAt: log.createdAt.toISOString(),
    updatedAt: log.updatedAt.toISOString(),
  };
}

/**
 * Map appointment with treatment logs to API response
 */
export function mapAppointmentForTreatmentToResponse(
  appointment: AppointmentWithRelationsForTreatment,
  mappedLogs: TreatmentLogResponse[]
): AppointmentForTreatmentResponse {
  return {
    id: appointment.id,
    appointmentDateTime: appointment.appointmentDateTime.toISOString(),
    status: appointment.status,
    checkInTime: appointment.checkInTime?.toISOString() || null,
    primaryDentist: {
      id: appointment.primaryDentist.id,
      fullName: appointment.primaryDentist.fullName,
    },
    clinic: {
      id: appointment.clinic.id,
      name: appointment.clinic.name,
    },
    customer: {
      id: appointment.customer.id,
      fullName: appointment.customer.fullName,
      customerCode: appointment.customer.customerCode || null,
      consultedServices: appointment.customer.consultedServices.map(
        (service) => ({
          id: service.id,
          consultedServiceName: service.consultedServiceName,
          toothPositions: service.toothPositions,
          serviceConfirmDate: service.serviceConfirmDate?.toISOString() || null,
          serviceStatus: service.serviceStatus,
          treatingDoctor: service.treatingDoctor
            ? {
                id: service.treatingDoctor.id,
                fullName: service.treatingDoctor.fullName,
              }
            : null,
        })
      ),
    },
    treatmentLogs: mappedLogs,
  };
}
