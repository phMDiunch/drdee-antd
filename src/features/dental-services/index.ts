// src/features/dental-services/index.ts
// Barrel export - Public API for dental-services feature

// ===== VIEWS (for app router) =====
export { default as DentalServicesPageView } from "./views/DentalServicesPageView";

// ===== COMPONENTS (for external use) =====
export { default as DentalServiceFormModal } from "./components/DentalServiceFormModal";
export { default as DentalServiceTable } from "./components/DentalServiceTable";

// ===== HOOKS (for data fetching) =====
export * from "./hooks/queries";
export * from "./hooks/mutations";

// ===== CONSTANTS =====
export * from "./constants";

// NOTE: API layer không export (internal use only - hooks wrap them)
