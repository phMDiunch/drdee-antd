// src/features/clinics/index.ts
// Barrel export - Public API for clinics feature

// ===== VIEWS (for app router) =====
export { default as ClinicsPageView } from "./views/ClinicsPageView";

// ===== COMPONENTS (for external use) =====
export { default as ClinicFormModal } from "./components/ClinicFormModal";
export { default as ClinicTable } from "./components/ClinicTable";

// ===== HOOKS (for data fetching) =====
export * from "./hooks/queries";
export * from "./hooks/mutations";

// ===== CONSTANTS =====
export * from "./constants";

// NOTE: API layer không export (internal use only - hooks wrap them)
