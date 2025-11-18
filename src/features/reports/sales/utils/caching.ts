import dayjs from "dayjs";

/**
 * Calculate stale time based on month
 * Current month: 2 min (data changes frequently)
 * Past months: 2 hours (historical data rarely changes)
 */
export function calculateStaleTime(month: string): number {
  const selected = dayjs(month, "YYYY-MM");
  const current = dayjs().startOf("month");

  if (selected.isSame(current, "month")) {
    return 2 * 60 * 1000; // 2 minutes
  }
  return 2 * 60 * 60 * 1000; // 2 hours
}
