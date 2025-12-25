// src/shared/hooks/useMonthNavigation.ts
import { useState, useCallback } from "react";
import dayjs from "dayjs";

export interface UseMonthNavigationReturn {
  selectedMonth: dayjs.Dayjs;
  setSelectedMonth: (month: dayjs.Dayjs) => void;
  goToPreviousMonth: () => void;
  goToCurrentMonth: () => void;
  goToNextMonth: () => void;
  handleMonthChange: (month: dayjs.Dayjs | null) => void;
}

export function useMonthNavigation(
  initialMonth: dayjs.Dayjs = dayjs()
): UseMonthNavigationReturn {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);

  const goToPreviousMonth = useCallback(() => {
    setSelectedMonth((m) => m.subtract(1, "month"));
  }, []);

  const goToCurrentMonth = useCallback(() => {
    setSelectedMonth(dayjs());
  }, []);

  const goToNextMonth = useCallback(() => {
    setSelectedMonth((m) => m.add(1, "month"));
  }, []);

  const handleMonthChange = useCallback((month: dayjs.Dayjs | null) => {
    if (month) {
      setSelectedMonth(month);
    }
  }, []);

  return {
    selectedMonth,
    setSelectedMonth,
    goToPreviousMonth,
    goToCurrentMonth,
    goToNextMonth,
    handleMonthChange,
  };
}
