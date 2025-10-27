"use client";
import React from "react";
import dayjs from "dayjs";
import { Button, Col, DatePicker, Row, Space, Typography } from "antd";
import {
  CalendarOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

interface PageHeaderWithDateNavProps {
  title: string;
  selectedDate: dayjs.Dayjs;
  onDateChange: (date: dayjs.Dayjs | null) => void;
  onPreviousDay: () => void;
  onToday: () => void;
  onNextDay: () => void;
  loading?: boolean;
  subtitle?: React.ReactNode;
}

export default function PageHeaderWithDateNav({
  title,
  selectedDate,
  onDateChange,
  onPreviousDay,
  onToday,
  onNextDay,
  loading = false,
  subtitle,
}: PageHeaderWithDateNavProps) {
  // ✅ Kiểm tra có phải hôm nay không
  const isToday = selectedDate.isSame(dayjs(), "day");
  const isYesterday = selectedDate.isSame(dayjs().subtract(1, "day"), "day");
  const isTomorrow = selectedDate.isSame(dayjs().add(1, "day"), "day");

  // ✅ Hiển thị label cho ngày
  const getDateLabel = () => {
    if (isToday) return "Hôm nay";
    if (isYesterday) return "Hôm qua";
    if (isTomorrow) return "Ngày mai";
    return selectedDate.format("dddd, DD/MM/YYYY");
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
            {title} - {getDateLabel()}
          </span>
          {loading && (
            <span style={{ fontSize: 12, color: "#999" }}>Đang cập nhật…</span>
          )}
        </Title>
        {subtitle && <div style={{ marginTop: 4 }}>{subtitle}</div>}
      </Col>

      <Col>
        <Row gutter={8} align="middle" wrap={false}>
          {/* Date Picker */}
          <Col>
            <DatePicker
              value={selectedDate}
              onChange={onDateChange}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày"
              suffixIcon={<CalendarOutlined />}
              disabled={loading}
            />
          </Col>

          {/* Navigation Buttons */}
          <Col>
            <Space>
              <Button
                icon={<LeftOutlined />}
                title="Ngày trước"
                onClick={onPreviousDay}
                disabled={loading}
              />
              <Button
                title="Hôm nay"
                type={isToday ? "primary" : "default"}
                onClick={onToday}
                disabled={loading}
              >
                Hôm nay
              </Button>
              <Button
                icon={<RightOutlined />}
                title="Ngày sau"
                onClick={onNextDay}
                disabled={loading}
              />
            </Space>
          </Col>
        </Row>
      </Col>
    </Row>
  );
}
