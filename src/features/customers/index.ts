// src/features/customers/index.ts
// Barrel export - Public API for customers feature

// ===== VIEWS (for app router) =====
export { default as CustomerDailyView } from "./views/CustomerDailyView";
export { default as CustomerDetailView } from "./views/CustomerDetailView";

// ===== COMPONENTS (for external use) =====
export { default as CustomerFormModal } from "./components/CustomerFormModal";
export { default as CustomerTable } from "./components/CustomerTable";
export { default as CustomerStatistics } from "./components/CustomerStatistics";
export { default as CustomerFilters } from "./components/CustomerFilters";
export { default as QuickCheckInButton } from "./components/QuickCheckInButton";
export { default as WalkInModal } from "./components/WalkInModal";
export { default as FinancialSummaryCard } from "./components/FinancialSummaryCard";

// Detail tabs
export { default as CustomerInfoTab } from "./components/detail-tabs/CustomerInfoTab";
export { default as AppointmentsTab } from "./components/detail-tabs/AppointmentsTab";
export { default as ConsultedServicesTab } from "./components/detail-tabs/ConsultedServicesTab";
export { default as TreatmentLogsTab } from "./components/detail-tabs/TreatmentLogsTab";
export { default as TreatmentCareTab } from "./components/detail-tabs/TreatmentCareTab";
export { default as PaymentsTab } from "./components/detail-tabs/PaymentsTab";

// ===== HOOKS (for data fetching) =====
export * from "./hooks/useCustomersDaily";
export * from "./hooks/useCreateCustomer";
export * from "./hooks/useCustomerSearch";
export * from "./hooks/useCustomerDetail";
export * from "./hooks/useUpdateCustomer";

// Form hooks
export * from "./hooks/form-hooks/usePhoneDuplicateCheck";
export * from "./hooks/form-hooks/useCustomerFormOptions";

// ===== CONSTANTS =====
export * from "./constants";

// ===== UTILS =====
export * from "./utils/financialSummary";

// NOTE: API layer không export (internal use only - hooks wrap them)
