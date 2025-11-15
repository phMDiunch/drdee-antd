"use client";

import React from "react";
import { DatePicker, Select, Space } from "antd";
import dayjs from "dayjs";
import type { DashboardFilters } from "../types";

const { Option } = Select;

interface FilterBarProps {
  filters: DashboardFilters;
  onChange: (filters: Partial<DashboardFilters>) => void;
}

// Mock data
const mockClinics = [
  { id: "clinic-1", name: "Chi nhánh Hà Nội" },
  { id: "clinic-2", name: "Chi nhánh TP.HCM" },
  { id: "clinic-3", name: "Chi nhánh Đà Nẵng" },
];

const mockSales = [
  { id: "sale-1", name: "Nguyễn Văn A" },
  { id: "sale-2", name: "Trần Thị B" },
  { id: "sale-3", name: "Lê Văn C" },
];

const mockDoctors = [
  { id: "doctor-1", name: "BS. Nguyễn Minh D" },
  { id: "doctor-2", name: "BS. Trần Văn E" },
  { id: "doctor-3", name: "BS. Lê Thị F" },
];

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  return (
    <Space size="middle" wrap style={{ width: "100%" }}>
      <div>
        <label
          style={{
            display: "block",
            marginBottom: "4px",
            fontSize: "12px",
            color: "#666",
          }}
        >
          Tháng
        </label>
        <DatePicker
          picker="month"
          value={filters.month ? dayjs(filters.month, "YYYY-MM") : null}
          onChange={(date) =>
            onChange({ month: date?.format("YYYY-MM") || null })
          }
          format="MM/YYYY"
          placeholder="Chọn tháng"
          style={{ width: 150 }}
        />
      </div>

      <div>
        <label
          style={{
            display: "block",
            marginBottom: "4px",
            fontSize: "12px",
            color: "#666",
          }}
        >
          Chi nhánh
        </label>
        <Select
          value={filters.clinicId}
          onChange={(value) => onChange({ clinicId: value })}
          placeholder="Tất cả chi nhánh"
          allowClear
          style={{ width: 180 }}
        >
          {mockClinics.map((clinic) => (
            <Option key={clinic.id} value={clinic.id}>
              {clinic.name}
            </Option>
          ))}
        </Select>
      </div>

      <div>
        <label
          style={{
            display: "block",
            marginBottom: "4px",
            fontSize: "12px",
            color: "#666",
          }}
        >
          Sale tư vấn
        </label>
        <Select
          value={filters.saleId}
          onChange={(value) => onChange({ saleId: value })}
          placeholder="Tất cả sale"
          allowClear
          style={{ width: 180 }}
        >
          {mockSales.map((sale) => (
            <Option key={sale.id} value={sale.id}>
              {sale.name}
            </Option>
          ))}
        </Select>
      </div>

      <div>
        <label
          style={{
            display: "block",
            marginBottom: "4px",
            fontSize: "12px",
            color: "#666",
          }}
        >
          Bác sĩ tư vấn
        </label>
        <Select
          value={filters.doctorId}
          onChange={(value) => onChange({ doctorId: value })}
          placeholder="Tất cả bác sĩ"
          allowClear
          style={{ width: 180 }}
        >
          {mockDoctors.map((doctor) => (
            <Option key={doctor.id} value={doctor.id}>
              {doctor.name}
            </Option>
          ))}
        </Select>
      </div>
    </Space>
  );
}
