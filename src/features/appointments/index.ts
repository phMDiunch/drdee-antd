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
export * from "./hooks/queries";
export * from "./hooks/mutations";

// ===== CONSTANTS =====
export * from "./constants";

// ===== UTILS =====
export { exportAppointmentsToExcel } from "./utils/exportToExcel";

// NOTE: API layer không export (internal use only - hooks wrap them)
