import dayjs from "dayjs";

/**
 * Calculate stale time based on month
 * Current month: 2 minutes (data updating frequently)
 * Past months: 2 hours (rarely change)
 */
export function calculateStaleTime(month: string): number {
  const currentMonth = dayjs().format("YYYY-MM");
  return month === currentMonth ? 2 * 60 * 1000 : 2 * 60 * 60 * 1000;
}
