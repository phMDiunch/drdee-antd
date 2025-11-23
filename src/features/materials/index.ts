// src/features/materials/index.ts

// API & Constants
export * from "./api";
export * from "./constants";

// Hooks
export * from "./hooks/useMaterials";
export * from "./hooks/useMaterialById";
export * from "./hooks/useCreateMaterial";
export * from "./hooks/useUpdateMaterial";
export * from "./hooks/useDeleteMaterial";
export * from "./hooks/useArchiveMaterial";
export * from "./hooks/useUnarchiveMaterial";

// Components
export { default as MaterialTable } from "./components/MaterialTable";
export { default as MaterialFormModal } from "./components/MaterialFormModal";

// Views
export { default as MaterialsPageView } from "./views/MaterialsPageView";
