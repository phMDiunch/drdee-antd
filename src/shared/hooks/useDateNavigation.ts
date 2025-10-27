import { useState, useCallback } from "react";
import dayjs from "dayjs";

export interface UseDateNavigationReturn {
  selectedDate: dayjs.Dayjs;
  setSelectedDate: (date: dayjs.Dayjs) => void;
  goToPreviousDay: () => void;
  goToToday: () => void;
  goToNextDay: () => void;
  handleDateChange: (date: dayjs.Dayjs | null) => void;
}

export function useDateNavigation(
  initialDate: dayjs.Dayjs = dayjs()
): UseDateNavigationReturn {
  const [selectedDate, setSelectedDate] = useState(initialDate);

  const goToPreviousDay = useCallback(() => {
    setSelectedDate((d) => d.subtract(1, "day"));
  }, []);

  const goToToday = useCallback(() => {
    setSelectedDate(dayjs());
  }, []);

  const goToNextDay = useCallback(() => {
    setSelectedDate((d) => d.add(1, "day"));
  }, []);

  const handleDateChange = useCallback((date: dayjs.Dayjs | null) => {
    if (date) {
      setSelectedDate(date);
    }
  }, []);

  return {
    selectedDate,
    setSelectedDate,
    goToPreviousDay,
    goToToday,
    goToNextDay,
    handleDateChange,
  };
}
