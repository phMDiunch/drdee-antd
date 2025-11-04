import { cache } from "react";
import { getSessionUser as getSessionUserOriginal } from "@/server/services/auth.service";

/**
 * Cached version of getSessionUser for Server Actions/Components/API Routes
 *
 * @description
 * Uses React's cache() to deduplicate getSessionUser calls within a single request.
 * This prevents multiple Supabase Auth + DB queries when multiple Server Actions
 * are called in the same request.
 *
 * @performance
 * - First call: Queries Supabase Auth + DB (~20-50ms)
 * - Subsequent calls: Returns from cache (0ms)
 * - Cache lifetime: Single request only (auto cleanup)
 * - Improvement: 50-66% fewer queries per request
 *
 * @security
 * - ✅ Request-scoped: Each request has isolated cache
 * - ✅ No cross-user leakage: Cache destroyed after request ends
 * - ✅ No stale data: Fresh query for each new request
 *
 * @usage
 * ```typescript
 * // Server Action
 * import { getSessionUser } from '@/server/utils/sessionCache';
 *
 * export async function myAction() {
 *   const user = await getSessionUser(); // Auto cached
 *   // ...
 * }
 * ```
 *
 * @see https://react.dev/reference/react/cache
 * @see https://nextjs.org/docs/app/building-your-application/data-fetching/patterns
 */
export const getSessionUser = cache(getSessionUserOriginal);
