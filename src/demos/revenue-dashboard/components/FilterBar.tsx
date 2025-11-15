"use client";

import { Card, DatePicker, Select, Button, Space, Row, Col } from "antd";
import { ReloadOutlined, DownloadOutlined } from "@ant-design/icons";
import type { DashboardFilters, CustomerSource } from "../types";
import dayjs, { Dayjs } from "dayjs";

const { Option } = Select;

interface FilterBarProps {
  filters: DashboardFilters;
  onFilterChange: (filters: DashboardFilters) => void;
  onRefresh: () => void;
  onExport: () => void;
}

// Mock data for selects
const mockClinics = [
  { id: "clinic1", name: "Chi nhánh Quận 1" },
  { id: "clinic2", name: "Chi nhánh Quận 7" },
  { id: "clinic3", name: "Chi nhánh Thủ Đức" },
];

const mockDoctors = [
  { id: "d1", name: "BS. Nguyễn Văn A" },
  { id: "d2", name: "BS. Trần Thị B" },
  { id: "d3", name: "BS. Lê Văn C" },
  { id: "d4", name: "BS. Phạm Thị D" },
  { id: "d5", name: "BS. Hoàng Văn E" },
];

const mockSales = [
  { id: "sale1", name: "Sale Nguyễn F" },
  { id: "sale2", name: "Sale Trần G" },
  { id: "sale3", name: "Sale Lê H" },
];

const sourceOptions: { value: CustomerSource; label: string }[] = [
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "referral", label: "Giới thiệu" },
  { value: "walkin", label: "Walk-in" },
  { value: "online", label: "Sale Online" },
];

export default function FilterBar({
  filters,
  onFilterChange,
  onRefresh,
  onExport,
}: FilterBarProps) {
  const handleMonthChange = (date: Dayjs | null) => {
    if (date) {
      onFilterChange({
        ...filters,
        month: date.format("YYYY-MM"),
      });
    }
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]} align="middle">
        {/* Month Picker */}
        <Col xs={24} sm={12} md={6} lg={4}>
          <DatePicker
            picker="month"
            value={dayjs(filters.month)}
            onChange={handleMonthChange}
            format="MM/YYYY"
            placeholder="Chọn tháng"
            style={{ width: "100%" }}
          />
        </Col>

        {/* Clinic Select */}
        <Col xs={24} sm={12} md={6} lg={4}>
          <Select
            placeholder="Chi nhánh"
            value={filters.clinicId}
            onChange={(value) =>
              onFilterChange({ ...filters, clinicId: value })
            }
            allowClear
            style={{ width: "100%" }}
          >
            {mockClinics.map((clinic) => (
              <Option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </Option>
            ))}
          </Select>
        </Col>

        {/* Source Multi-Select */}
        <Col xs={24} sm={12} md={6} lg={4}>
          <Select
            mode="multiple"
            placeholder="Nguồn khách"
            value={filters.sources}
            onChange={(value) => onFilterChange({ ...filters, sources: value })}
            allowClear
            maxTagCount="responsive"
            style={{ width: "100%" }}
          >
            {sourceOptions.map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        </Col>

        {/* Sale Select */}
        <Col xs={24} sm={12} md={6} lg={3}>
          <Select
            placeholder="Sale tư vấn"
            value={filters.saleId}
            onChange={(value) => onFilterChange({ ...filters, saleId: value })}
            allowClear
            style={{ width: "100%" }}
          >
            {mockSales.map((sale) => (
              <Option key={sale.id} value={sale.id}>
                {sale.name}
              </Option>
            ))}
          </Select>
        </Col>

        {/* Doctor Select */}
        <Col xs={24} sm={12} md={6} lg={3}>
          <Select
            placeholder="Bác sĩ điều trị"
            value={filters.doctorId}
            onChange={(value) =>
              onFilterChange({ ...filters, doctorId: value })
            }
            allowClear
            style={{ width: "100%" }}
          >
            {mockDoctors.map((doctor) => (
              <Option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </Option>
            ))}
          </Select>
        </Col>

        {/* Action Buttons */}
        <Col xs={24} sm={24} md={12} lg={6}>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button icon={<ReloadOutlined />} onClick={onRefresh}>
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={onExport}
            >
              Xuất Excel
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );
}
