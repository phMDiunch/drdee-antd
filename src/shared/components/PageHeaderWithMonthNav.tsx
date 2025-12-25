"use client";
import React, { useMemo } from "react";
import dayjs from "dayjs";
import { Button, Col, DatePicker, Row, Select, Space, Typography } from "antd";
import {
  CalendarOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useCurrentUser } from "@/shared/providers/user-provider";

const { Title } = Typography;

interface PageHeaderWithMonthNavProps {
  title: string;
  selectedMonth: dayjs.Dayjs;
  onMonthChange: (date: dayjs.Dayjs | null) => void;
  onPreviousMonth: () => void;
  onCurrentMonth: () => void;
  onNextMonth: () => void;
  clinics?: Array<{ id: string; clinicCode: string }>;
  selectedClinicId?: string;
  onClinicChange?: (clinicId: string | undefined) => void;
  showClinicFilter?: boolean;
  loading?: boolean;
  subtitle?: React.ReactNode;
}

export default function PageHeaderWithMonthNav({
  title,
  selectedMonth,
  onMonthChange,
  onPreviousMonth,
  onCurrentMonth,
  onNextMonth,
  clinics = [],
  selectedClinicId,
  onClinicChange,
  showClinicFilter = true,
  loading = false,
  subtitle,
}: PageHeaderWithMonthNavProps) {
  const { user } = useCurrentUser();

  /**
   * [OPTIONAL FEATURE - CAN BE REMOVED]
   * Giới hạn chọn tháng cho employee: chỉ tháng này và tháng trước
   *
   * Để gỡ bỏ tính năng này:
   * 1. Xóa hook `useCurrentUser` (dòng 33)
   * 2. Xóa toàn bộ block `disabledDate` này (dòng 35-50)
   * 3. Xóa prop `disabledDate={disabledDate}` trong DatePicker (dòng 116)
   * 4. Xóa import `useCurrentUser` và `useMemo` nếu không dùng nữa
   */
  const disabledDate = useMemo(() => {
    if (user?.role !== "employee") return undefined;

    return (current: dayjs.Dayjs) => {
      const now = dayjs();
      const currentMonth = now.startOf("month");
      const previousMonth = now.subtract(1, "month").startOf("month");

      return (
        current &&
        (current.isBefore(previousMonth, "month") ||
          current.isAfter(currentMonth, "month"))
      );
    };
  }, [user?.role]);

  // Format month label
  const getMonthLabel = () => {
    const now = dayjs();
    const isCurrentMonth = selectedMonth.isSame(now, "month");
    const isPreviousMonth = selectedMonth.isSame(
      now.subtract(1, "month"),
      "month"
    );

    if (isCurrentMonth) return "Tháng này";
    if (isPreviousMonth) return "Tháng trước";
    return `Tháng ${selectedMonth.format("MM/YYYY")}`;
  };

  const isCurrentMonth = selectedMonth.isSame(dayjs(), "month");

  return (
    <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
      <Col>
        <Title
          level={4}
          style={{
            margin: 0,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <span>
            {title} - {getMonthLabel()}
          </span>
          {loading && (
            <span style={{ fontSize: 12, color: "#999" }}>Đang cập nhật…</span>
          )}
        </Title>
        {subtitle && <div style={{ marginTop: 4 }}>{subtitle}</div>}
      </Col>

      <Col>
        <Row gutter={8} align="middle" wrap={false}>
          {/* Clinic Filter */}
          {showClinicFilter && clinics.length > 0 && (
            <Col>
              <Select
                style={{ width: 200 }}
                placeholder="Tất cả chi nhánh"
                value={selectedClinicId}
                onChange={onClinicChange}
                allowClear
                disabled={loading}
                options={[
                  ...clinics.map((clinic) => ({
                    label: clinic.clinicCode,
                    value: clinic.id,
                  })),
                ]}
              />
            </Col>
          )}

          {/* Month Picker */}
          <Col>
            <DatePicker
              value={selectedMonth}
              onChange={onMonthChange}
              format="MM/YYYY"
              placeholder="Chọn tháng"
              picker="month"
              suffixIcon={<CalendarOutlined />}
              disabled={loading}
              disabledDate={disabledDate}
            />
          </Col>

          {/* Navigation Buttons */}
          <Col>
            <Space>
              <Button
                icon={<LeftOutlined />}
                title="Tháng trước"
                onClick={onPreviousMonth}
                disabled={loading}
              />
              <Button
                title="Tháng này"
                type={isCurrentMonth ? "primary" : "default"}
                onClick={onCurrentMonth}
                disabled={loading}
              >
                Tháng này
              </Button>
              <Button
                icon={<RightOutlined />}
                title="Tháng sau"
                onClick={onNextMonth}
                disabled={loading}
              />
            </Space>
          </Col>
        </Row>
      </Col>
    </Row>
  );
}
