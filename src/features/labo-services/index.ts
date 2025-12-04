// src/features/labo-services/index.ts
export { default } from "./views/LaboServicesView";
export { default as LaboPriceTable } from "./components/LaboPriceTable";
export { default as LaboPriceFormModal } from "./components/LaboPriceFormModal";
export { useLaboServices } from "./hooks/useLaboServices";
export { useLaboServiceById } from "./hooks/useLaboServiceById";
export { useCreateLaboService } from "./hooks/useCreateLaboService";
export { useUpdateLaboService } from "./hooks/useUpdateLaboService";
export { useDeleteLaboService } from "./hooks/useDeleteLaboService";
export * from "./constants";
