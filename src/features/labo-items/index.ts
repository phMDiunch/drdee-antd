// src/features/labo-items/index.ts
// Barrel export - Public API for labo-items feature

// ===== VIEWS (for app router) =====
export { default as LaboItemsPageView } from "./views/LaboItemsPageView";

// ===== COMPONENTS (for external use) =====
export { default as LaboItemFormModal } from "./components/LaboItemFormModal";
export { default as LaboItemTable } from "./components/LaboItemTable";

// ===== HOOKS (for data fetching) =====
export * from "./hooks/useLaboItems";
export * from "./hooks/useLaboItemById";
export * from "./hooks/useCreateLaboItem";
export * from "./hooks/useUpdateLaboItem";
export * from "./hooks/useDeleteLaboItem";
export * from "./hooks/useArchiveLaboItem";
export * from "./hooks/useUnarchiveLaboItem";

// ===== CONSTANTS =====
export * from "./constants";

// NOTE: API layer không export (internal use only - hooks wrap them)
