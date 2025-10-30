// src/features/appointments/index.ts
// Barrel export - Public API for appointments feature

// ===== VIEWS (for app router) =====
export { default as AppointmentDailyView } from "./views/AppointmentDailyView";

// ===== COMPONENTS (for external use) =====
export { default as CreateAppointmentModal } from "./components/CreateAppointmentModal";
export { default as UpdateAppointmentModal } from "./components/UpdateAppointmentModal";
export { default as AppointmentStatistics } from "./components/AppointmentStatistics";
export { default as AppointmentFilters } from "./components/AppointmentFilters";
export { default as AppointmentTable } from "./components/AppointmentTable";

// ===== HOOKS (for data fetching) =====
export * from "./hooks/useAppointments";
export * from "./hooks/useAppointmentsDaily";
export * from "./hooks/useAppointment";
export * from "./hooks/useCreateAppointment";
export * from "./hooks/useUpdateAppointment";
export * from "./hooks/useDeleteAppointment";
export * from "./hooks/useDentistAvailability";

// ===== CONSTANTS =====
export * from "./constants";

// NOTE: API layer không export (internal use only - hooks wrap them)
