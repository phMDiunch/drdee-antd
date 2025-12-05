import React, { useMemo } from "react";
import { Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { DepartmentRevenueData } from "@/shared/validation/revenue-report.schema";

interface DepartmentRevenueTableProps {
  data: DepartmentRevenueData[];
  loading?: boolean;
  onRowClick?: (record: DepartmentRevenueData) => void;
}

export default function DepartmentRevenueTable({
  data,
  loading,
  onRowClick,
}: DepartmentRevenueTableProps) {
  const totals = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalRevenue: 0,
        totalPaid: 0,
        totalFinalPrice: 0,
      };
    }

    return {
      totalRevenue: data.reduce((sum, item) => sum + item.totalRevenue, 0),
      totalPaid: data.reduce((sum, item) => sum + item.totalPaid, 0),
      totalFinalPrice: data.reduce(
        (sum, item) => sum + item.totalFinalPrice,
        0
      ),
    };
  }, [data]);

  const totalPaymentPercentage = useMemo(() => {
    if (totals.totalFinalPrice === 0) return 0;
    return Math.round((totals.totalPaid / totals.totalFinalPrice) * 1000) / 10;
  }, [totals]);

  const columns = useMemo<ColumnsType<DepartmentRevenueData>>(
    () => [
      {
        title: "Bộ môn",
        dataIndex: "department",
        key: "department",
        width: 250,
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
        title: "% tổng DT",
        dataIndex: "percentageOfTotal",
        key: "percentageOfTotal",
        width: 110,
        align: "center",
        render: (value) => `${value.toFixed(1)}%`,
      },
      {
        title: "% thanh toán",
        dataIndex: "paymentPercentage",
        key: "paymentPercentage",
        width: 120,
        align: "center",
        render: (value) => {
          const isComplete = value >= 100;
          const color = isComplete ? "green" : "blue";
          return <Tag color={color}>{value.toFixed(1)}%</Tag>;
        },
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
      scroll={{ x: 800 }}
      pagination={{ pageSize: 20 }}
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
            <Table.Summary.Cell index={3} align="center">
              <Tag color={totalPaymentPercentage >= 100 ? "green" : "blue"}>
                <strong>{totalPaymentPercentage.toFixed(1)}%</strong>
              </Tag>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        </Table.Summary>
      )}
    />
  );
}
