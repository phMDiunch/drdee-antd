"use server";

import { getSessionUser } from "@/server/utils/sessionCache";
import { appointmentService } from "@/server/services/appointment.service";
import type {
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
} from "@/shared/validation/appointment.schema";

/**
 * Server Action: Create new appointment
 * Usage: const result = await createAppointmentAction(data);
 */
export async function createAppointmentAction(data: CreateAppointmentRequest) {
  const user = await getSessionUser();
  return await appointmentService.create(user, data);
}

/**
 * Server Action: Update appointment (includes check-in, check-out, status changes)
 * Usage: const result = await updateAppointmentAction(id, data);
 */
export async function updateAppointmentAction(
  appointmentId: string,
  data: UpdateAppointmentRequest
) {
  const user = await getSessionUser();
  return await appointmentService.update(user, appointmentId, data);
}

/**
 * Server Action: Check-in appointment
 * Usage: const result = await checkInAppointmentAction(id);
 */
export async function checkInAppointmentAction(appointmentId: string) {
  const user = await getSessionUser();
  const checkInTime = new Date();
  return await appointmentService.update(user, appointmentId, {
    checkInTime,
  });
}

/**
 * Server Action: Check-out appointment
 * Usage: const result = await checkOutAppointmentAction(id);
 */
export async function checkOutAppointmentAction(appointmentId: string) {
  const user = await getSessionUser();
  const checkOutTime = new Date();
  return await appointmentService.update(user, appointmentId, {
    checkOutTime,
  });
}

/**
 * Server Action: Delete appointment
 * Usage: await deleteAppointmentAction(id);
 */
export async function deleteAppointmentAction(appointmentId: string) {
  const user = await getSessionUser();
  return await appointmentService.delete(user, appointmentId);
}
