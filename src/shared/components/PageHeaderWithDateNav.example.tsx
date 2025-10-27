/**
 * Ví dụ sử dụng PageHeaderWithDateNav và useDateNavigation trong feature khác
 */

"use client";
import React from "react";
import PageHeaderWithDateNav from "@/shared/components/PageHeaderWithDateNav";
import { useDateNavigation } from "@/shared/hooks/useDateNavigation";

export default function EmployeeDailyView() {
  const {
    selectedDate,
    goToPreviousDay,
    goToToday,
    goToNextDay,
    handleDateChange,
  } = useDateNavigation();

  // Giả sử có API call để lấy data nhân viên theo ngày
  const isLoading = false; // từ API hook

  return (
    <div>
      <PageHeaderWithDateNav
        title="Danh sách nhân viên làm việc"
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        onPreviousDay={goToPreviousDay}
        onToday={goToToday}
        onNextDay={goToNextDay}
        loading={isLoading}
        subtitle={
          <span style={{ color: "#666", fontSize: 14 }}>
            Ca làm việc và lịch trình
          </span>
        }
      />

      {/* Nội dung khác của Employee view */}
      <div>{/* Employee content here */}</div>
    </div>
  );
}

export function AppointmentDailyView() {
  const {
    selectedDate,
    goToPreviousDay,
    goToToday,
    goToNextDay,
    handleDateChange,
  } = useDateNavigation();

  const isLoading = false; // từ API hook

  return (
    <div>
      <PageHeaderWithDateNav
        title="Lịch hẹn"
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        onPreviousDay={goToPreviousDay}
        onToday={goToToday}
        onNextDay={goToNextDay}
        loading={isLoading}
      />

      {/* Nội dung khác của Appointment view */}
      <div>{/* Appointment content here */}</div>
    </div>
  );
}
