// src/features/sales-pipeline/components/AnalyticsDashboard.tsx
"use client";

import React, { useState } from "react";
import { Row, Col, DatePicker, Space, Button, Select, Alert } from "antd";
import dayjs, { Dayjs } from "dayjs";
import ConversionFunnelChart from "./ConversionFunnelChart";
import SalePerformanceTable from "./SalePerformanceTable";
import LostAnalysisCard from "./LostAnalysisCard";
import TimePerStageChart from "./TimePerStageChart";
import ServiceWinRateTable from "./ServiceWinRateTable";
import {
  useConversionFunnel,
  useSalePerformance,
  useLostAnalysis,
  useAvgTimePerStage,
  useServiceWinRate,
} from "../hooks/useSalesAnalytics";
import { useClinics } from "@/features/clinics/hooks/useClinics";
import type { UserCore } from "@/shared/types/user";

const { RangePicker } = DatePicker;

interface AnalyticsDashboardProps {
  user: UserCore;
}

/**
 * Sales Pipeline Analytics Dashboard
 * Provides comprehensive analytics and insights
 */
export default function AnalyticsDashboard({ user }: AnalyticsDashboardProps) {
  // Default to last 30 days
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, "days"),
    dayjs(),
  ]);

  // Clinic filter (only for admin)
  const [selectedClinicId, setSelectedClinicId] = useState<string | undefined>(
    user.role === "employee" ? user.clinicId || undefined : undefined
  );

  const { data: clinics } = useClinics();

  // Analytics query params
  const analyticsParams = {
    clinicId: selectedClinicId,
    dateStart: dateRange[0].format("YYYY-MM-DD"),
    dateEnd: dateRange[1].format("YYYY-MM-DD"),
  };

  // Fetch all analytics data
  const {
    data: funnelData,
    isLoading: loadingFunnel,
    error: funnelError,
  } = useConversionFunnel(analyticsParams);

  const {
    data: performanceData,
    isLoading: loadingPerformance,
    error: performanceError,
  } = useSalePerformance(analyticsParams);

  const {
    data: lostData,
    isLoading: loadingLost,
    error: lostError,
  } = useLostAnalysis(analyticsParams);

  const {
    data: timeData,
    isLoading: loadingTime,
    error: timeError,
  } = useAvgTimePerStage(analyticsParams);

  const {
    data: serviceData,
    isLoading: loadingService,
    error: serviceError,
  } = useServiceWinRate(analyticsParams);

  const handleDateRangeChange = (
    dates: null | [Dayjs | null, Dayjs | null]
  ) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  const handlePresetRange = (days: number) => {
    setDateRange([dayjs().subtract(days, "days"), dayjs()]);
  };

  const errors = [
    funnelError,
    performanceError,
    lostError,
    timeError,
    serviceError,
  ].filter(Boolean);

  return (
    <Space
      direction="vertical"
      size="large"
      style={{ width: "100%", padding: 24 }}
    >
      {/* Filters */}
      <Row gutter={16} align="middle">
        <Col>
          <Space>
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              format="DD/MM/YYYY"
              allowClear={false}
            />
            <Button onClick={() => handlePresetRange(7)}>7 ngày</Button>
            <Button onClick={() => handlePresetRange(30)}>30 ngày</Button>
            <Button onClick={() => handlePresetRange(90)}>90 ngày</Button>
          </Space>
        </Col>

        {/* Clinic filter (admin only) */}
        {user.role === "admin" && (
          <Col flex="auto" style={{ textAlign: "right" }}>
            <Select
              placeholder="Tất cả phòng khám"
              style={{ width: 200 }}
              value={selectedClinicId}
              onChange={setSelectedClinicId}
              allowClear
              options={[
                { label: "Tất cả phòng khám", value: undefined },
                ...(clinics?.map((c: { id: string; name: string }) => ({
                  label: c.name,
                  value: c.id,
                })) || []),
              ]}
            />
          </Col>
        )}
      </Row>

      {/* Error Alert */}
      {errors.length > 0 && (
        <Alert
          message="Lỗi tải dữ liệu"
          description="Một số dữ liệu không thể tải được. Vui lòng thử lại sau."
          type="error"
          showIcon
          closable
        />
      )}

      {/* Row 1: Funnel + Performance */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <ConversionFunnelChart
            data={funnelData?.funnel || []}
            loading={loadingFunnel}
          />
        </Col>
        <Col xs={24} lg={12}>
          <SalePerformanceTable
            data={performanceData?.performance || []}
            loading={loadingPerformance}
          />
        </Col>
      </Row>

      {/* Row 2: Time Per Stage + Service Win Rate */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <TimePerStageChart
            data={timeData?.avgTime || []}
            loading={loadingTime}
          />
        </Col>
        <Col xs={24} lg={12}>
          <ServiceWinRateTable
            data={serviceData?.winRate || []}
            loading={loadingService}
          />
        </Col>
      </Row>

      {/* Row 3: Lost Analysis (full width) */}
      <Row>
        <Col span={24}>
          <LostAnalysisCard
            byStage={lostData?.byStage || []}
            details={lostData?.details || []}
            loading={loadingLost}
          />
        </Col>
      </Row>
    </Space>
  );
}
