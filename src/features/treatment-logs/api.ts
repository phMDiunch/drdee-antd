// src/features/treatment-logs/api.ts

/**
 * Get checked-in appointments with consulted services and treatment logs for Customer Detail
 */
export async function getCheckedInAppointmentsApi(customerId: string) {
  const query = new URLSearchParams({ customerId });
  const res = await fetch(`/api/v1/appointments/checked-in?${query}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * Get treatment logs with optional filters
 */
export async function getTreatmentLogsApi(params?: {
  customerId?: string;
  appointmentId?: string;
}) {
  const query = new URLSearchParams(params as Record<string, string>);
  const res = await fetch(`/api/v1/treatment-logs?${query}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * Get single treatment log by ID
 */
export async function getTreatmentLogDetailApi(id: string) {
  const res = await fetch(`/api/v1/treatment-logs/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
