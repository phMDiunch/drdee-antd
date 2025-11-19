import React, { useMemo } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { DoctorRevenueData } from "@/shared/validation/revenue-report.schema";

interface DoctorRevenueTableProps {
  data: DoctorRevenueData[];
  loading?: boolean;
  onRowClick?: (record: DoctorRevenueData) => void;
}

export default function DoctorRevenueTable({
  data,
  loading,
  onRowClick,
}: DoctorRevenueTableProps) {
  const totals = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalRevenue: 0,
      };
    }

    return {
      totalRevenue: data.reduce((sum, item) => sum + item.totalRevenue, 0),
    };
  }, [data]);

  const columns = useMemo<ColumnsType<DoctorRevenueData>>(
    () => [
      {
        title: "Bác sĩ điều trị",
        dataIndex: "doctorName",
        key: "doctorName",
        width: 200,
        fixed: "left",
        render: (value) => <span style={{ fontWeight: "bold" }}>{value}</span>,
      },
      {
        title: "Doanh thu",
        dataIndex: "totalRevenue",
        key: "totalRevenue",
        width: 160,
        align: "right",
        sorter: (a, b) => a.totalRevenue - b.totalRevenue,
        render: (value) => (
          <span style={{ color: "#1890ff", fontWeight: "bold" }}>
            {value.toLocaleString()} ₫
          </span>
        ),
      },
      {
        title: "%",
        dataIndex: "percentage",
        key: "percentage",
        width: 90,
        align: "center",
        render: (value) => `${value.toFixed(1)}%`,
      },
    ],
    []
  );

  return (
    <Table
      size="small"
      bordered
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      scroll={{ x: 600 }}
      pagination={{ pageSize: 10 }}
      onRow={
        onRowClick
          ? (record) => ({
              onClick: () => onRowClick(record),
              style: { cursor: "pointer" },
            })
          : undefined
      }
      summary={() => (
        <Table.Summary fixed>
          <Table.Summary.Row>
            <Table.Summary.Cell index={0}>
              <strong>TỔNG</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={1} align="right">
              <strong style={{ color: "#1890ff", fontSize: 16 }}>
                {totals.totalRevenue.toLocaleString()} ₫
              </strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2} align="center">
              <strong>100%</strong>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        </Table.Summary>
      )}
    />
  );
}
