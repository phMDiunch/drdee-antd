// src/features/sales-activities/index.ts
/**
 * Sales Activities Feature - Public API
 * Barrel export for sales activity components, hooks, and constants
 */

// Views
export { default as SalesActivityDailyView } from "./views/SalesActivityDailyView";

// Components
export { default as SalesActivityTable } from "./components/SalesActivityTable";
export { default as SalesActivityModal } from "./components/SalesActivityModal";
export { default as SalesActivityStatistics } from "./components/SalesActivityStatistics";
export { default as SalesActivityFilters } from "./components/SalesActivityFilters";

// Hooks
export * from "./hooks/useSalesActivities";
export * from "./hooks/useCreateSalesActivity";
export * from "./hooks/useUpdateSalesActivity";
export * from "./hooks/useDeleteSalesActivity";
export * from "./hooks/useDailySalesActivities";

// Constants
export * from "./constants";
