// src/features/suppliers/index.ts

// API & Constants
export * from "./api";
export * from "./constants";

// Hooks
export * from "./hooks/useSuppliers";
export * from "./hooks/useSupplierById";
export * from "./hooks/useCreateSupplier";
export * from "./hooks/useUpdateSupplier";
export * from "./hooks/useDeleteSupplier";
export * from "./hooks/useArchiveSupplier";
export * from "./hooks/useUnarchiveSupplier";

// Components
export { default as SupplierTable } from "./components/SupplierTable";
export { default as SupplierFormModal } from "./components/SupplierFormModal";

// Views
export { default as SuppliersPageView } from "./views/SuppliersPageView";
