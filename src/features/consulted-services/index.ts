// src/features/consulted-services/index.ts
// Barrel export - Public API for consulted-services feature

// ===== VIEWS (for app router) =====
export { default as ConsultedServiceDailyView } from "./views/ConsultedServiceDailyView";

// ===== COMPONENTS (for external use) =====
export { default as ConsultedServiceStatistics } from "./components/ConsultedServiceStatistics";
export { default as ConsultedServiceFilters } from "./components/ConsultedServiceFilters";
export { default as ConsultedServiceTable } from "./components/ConsultedServiceTable";
export { default as ToothSelectorModal } from "./components/ToothSelectorModal";
export { default as CreateConsultedServiceModal } from "./components/CreateConsultedServiceModal";
export { default as UpdateConsultedServiceModal } from "./components/UpdateConsultedServiceModal";

// ===== HOOKS (for data fetching) =====
export * from "./hooks/useConsultedServicesDaily";
export * from "./hooks/useConsultedServices";
export * from "./hooks/useConsultedService";
export * from "./hooks/useConsultedServicesByCustomer";
export * from "./hooks/useCreateConsultedService";
export * from "./hooks/useUpdateConsultedService";
export * from "./hooks/useDeleteConsultedService";
export * from "./hooks/useConfirmConsultedService";
export * from "./hooks/useAssignConsultingSale";

// ===== CONSTANTS =====
export * from "./constants";

// ===== UTILS (Excel export) =====
export { exportConsultedServicesToExcel } from "./utils/exportToExcel";

// NOTE: API layer không export (internal use only - hooks wrap them)
