"use client";
import React from "react";
import dayjs from "dayjs";
import { Col, DatePicker, Row, Select, Typography } from "antd";
import { CalendarOutlined } from "@ant-design/icons";

const { Title } = Typography;

interface PageHeaderWithMonthNavProps {
  title: string;
  selectedMonth: dayjs.Dayjs;
  onMonthChange: (date: dayjs.Dayjs | null) => void;
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
  clinics = [],
  selectedClinicId,
  onClinicChange,
  showClinicFilter = true,
  loading = false,
  subtitle,
}: PageHeaderWithMonthNavProps) {
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
    return selectedMonth.format("Tháng MM/YYYY");
  };

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
            />
          </Col>
        </Row>
      </Col>
    </Row>
  );
}
