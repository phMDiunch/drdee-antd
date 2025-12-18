// src/shared/components/Kanban/index.ts
// Barrel export for Kanban components

export { KanbanBoard } from "./KanbanBoard";
export { KanbanColumn } from "./KanbanColumn";
export { KanbanCard } from "./KanbanCard";
export { KanbanEmpty } from "./KanbanEmpty";
export { KanbanSkeleton } from "./KanbanSkeleton";

export type {
  KanbanBoardProps,
  KanbanColumn as KanbanColumnType,
  KanbanColumnProps,
  KanbanCardProps,
  ColumnMetadata,
  ValidationResult,
} from "./types";
