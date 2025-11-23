// src/shared/constants/master-data.ts
// ✅ No hardcoded types - Admin tự định nghĩa categories qua UI

/**
 * Query Keys for React Query
 */
export const MASTER_DATA_QUERY_KEYS = {
  list: (rootId?: string | null, includeInactive?: boolean) =>
    ["master-data", { rootId, includeInactive }] as const,
  byId: (id: string) => ["master-data", id] as const,
} as const;
