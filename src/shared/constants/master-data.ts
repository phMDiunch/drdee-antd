// src/shared/constants/master-data.ts
// ✅ No hardcoded types - Admin tự định nghĩa categories qua UI

/**
 * Query Keys for React Query
 */
export const MASTER_DATA_QUERY_KEYS = {
  all: () => ["master-data"] as const,
  list: (rootId?: string | null, includeInactive?: boolean) =>
    ["master-data", "list", { rootId, includeInactive }] as const,
  roots: (includeInactive?: boolean) =>
    ["master-data", "roots", { includeInactive }] as const,
  detail: (id: string) => ["master-data", "detail", id] as const,
};
