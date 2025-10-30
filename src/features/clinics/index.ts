// src/features/clinics/index.ts
// Barrel export - Public API for clinics feature

// ===== VIEWS (for app router) =====
export { default as ClinicsPageView } from "./views/ClinicsPageView";

// ===== COMPONENTS (for external use) =====
export { default as ClinicFormModal } from "./components/ClinicFormModal";
export { default as ClinicTable } from "./components/ClinicTable";

// ===== HOOKS (for data fetching) =====
export * from "./hooks/useClinics";
export * from "./hooks/useClinicById";
export * from "./hooks/useCreateClinic";
export * from "./hooks/useUpdateClinic";
export * from "./hooks/useDeleteClinic";
export * from "./hooks/useArchiveClinic";
export * from "./hooks/useUnarchiveClinic";

// ===== CONSTANTS =====
export * from "./constants";

// NOTE: API layer không export (internal use only - hooks wrap them)
