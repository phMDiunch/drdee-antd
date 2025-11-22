// src/features/master-data/index.ts
// Barrel export - Public API for master-data feature

// ===== VIEWS (for app router) =====
export { default as MasterDataPageView } from "./views/MasterDataPageView";

// ===== COMPONENTS (for external use) =====
export { default as MasterDataFormModal } from "./components/MasterDataFormModal";
export { default as MasterDataTree } from "./components/MasterDataTree";

// ===== HOOKS (for data fetching) =====
export * from "./hooks/useMasterDataList";
export * from "./hooks/useMasterDataById";
export * from "./hooks/useCreateMasterData";
export * from "./hooks/useUpdateMasterData";
export * from "./hooks/useDeleteMasterData";

// ===== CONSTANTS =====
export * from "./constants";

// NOTE: API layer không export (internal use only - hooks wrap them)
