// src/features/labo-services/index.ts
export { default } from "./views/LaboServicesPageView";
export { default as LaboServiceTable } from "./components/LaboServiceTable";
export { default as LaboServiceFormModal } from "./components/LaboServiceFormModal";
export { useLaboServices } from "./hooks/useLaboServices";
export { useLaboServiceById } from "./hooks/useLaboServiceById";
export { useCreateLaboService } from "./hooks/useCreateLaboService";
export { useUpdateLaboService } from "./hooks/useUpdateLaboService";
export { useDeleteLaboService } from "./hooks/useDeleteLaboService";
export { useArchiveLaboService } from "./hooks/useArchiveLaboService";
export { useUnarchiveLaboService } from "./hooks/useUnarchiveLaboService";
export * from "./constants";
