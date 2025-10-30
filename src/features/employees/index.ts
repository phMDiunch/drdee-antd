// src/features/employees/index.ts
// Barrel export - Public API for employees feature

// ===== VIEWS (for app router) =====
export { default as EmployeesListView } from "./views/EmployeesListView";
export { default as EmployeeEditView } from "./views/EmployeeEditView";

// ===== COMPONENTS (for external use) =====
export { default as CreateEmployeeModal } from "./components/CreateEmployeeModal";
export { default as EmployeeTable } from "./components/EmployeeTable";
export { default as EmployeeStats } from "./components/EmployeeStats";
export { default as EmployeeFilters } from "./components/EmployeeFilters";

// ===== HOOKS (for data fetching) =====
export * from "./hooks/useEmployees";
export * from "./hooks/useCreateEmployee";
export * from "./hooks/useEmployeeById";
export * from "./hooks/useEmployeeForProfileCompletion";
export * from "./hooks/useCompleteProfilePublic";
export * from "./hooks/useUpdateEmployee";
export * from "./hooks/useDeleteEmployee";
export * from "./hooks/useSetEmployeeStatus";
export * from "./hooks/useResendEmployeeInvite";
export * from "./hooks/useWorkingEmployees";

// ===== CONSTANTS =====
export * from "./constants";

// NOTE: API layer không export (internal use only - hooks wrap them)
