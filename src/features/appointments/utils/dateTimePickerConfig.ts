/**
 * Configuration for appointment date/time pickers
 * Business constraints:
 * - Working hours: 6:00 - 21:00
 * - Minute intervals: 5 minutes (00, 05, 10, 15, etc.)
 */

/**
 * Returns an array of disabled hours based on working hours
 * @param workingHoursStart - Starting hour (inclusive, default: 6)
 * @param workingHoursEnd - Ending hour (exclusive, default: 22, meaning until 21:59)
 * @returns Array of disabled hours
 */
export function getDisabledHours(
  workingHoursStart: number = 6,
  workingHoursEnd: number = 22
): number[] {
  // Hours outside working hours (0-5 and 22-23)
  const beforeWorkingHours = Array.from(
    { length: workingHoursStart },
    (_, i) => i
  );
  const afterWorkingHours = Array.from(
    { length: 24 - workingHoursEnd },
    (_, i) => i + workingHoursEnd
  );
  return [...beforeWorkingHours, ...afterWorkingHours];
}

/**
 * Returns the complete showTime configuration for appointment DatePickers
 * @param workingHoursStart - Starting hour (default: 6)
 * @param workingHoursEnd - Ending hour (default: 22)
 * @returns showTime configuration object for Ant Design DatePicker
 */
export function getAppointmentDateTimePickerConfig(
  workingHoursStart?: number,
  workingHoursEnd?: number
) {
  return {
    format: "HH:mm",
    minuteStep: 5 as const,
    hideDisabledOptions: true,
    disabledHours: () => getDisabledHours(workingHoursStart, workingHoursEnd),
  };
}
