import React, { useMemo } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { SourceRevenueData } from "@/shared/validation/revenue-report.schema";

interface SourceRevenueTableProps {
  data: SourceRevenueData[];
  loading?: boolean;
  onRowClick?: (record: SourceRevenueData) => void;
}

export default function SourceRevenueTable({
  data,
  loading,
  onRowClick,
}: SourceRevenueTableProps) {
  const totals = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        voucherCount: 0,
        customerCount: 0,
        totalRevenue: 0,
      };
    }

    return {
      voucherCount: data.reduce((sum, item) => sum + item.voucherCount, 0),
      customerCount: data.reduce((sum, item) => sum + item.customerCount, 0),
      totalRevenue: data.reduce((sum, item) => sum + item.totalRevenue, 0),
    };
  }, [data]);

  const columns = useMemo<ColumnsType<SourceRevenueData>>(
    () => [
      {
        title: "Nguồn",
        dataIndex: "source",
        key: "source",
        width: 200,
        fixed: "left",
        render: (value) => <span style={{ fontWeight: "bold" }}>{value}</span>,
      },
      {
        title: "Số phiếu thu",
        dataIndex: "voucherCount",
        key: "voucherCount",
        width: 130,
        align: "center",
      },
      {
        title: "Số KH thanh toán",
        dataIndex: "customerCount",
        key: "customerCount",
        width: 160,
        align: "center",
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
      scroll={{ x: 800 }}
      pagination={false}
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
            <Table.Summary.Cell index={1} align="center">
              <strong>{totals.voucherCount}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2} align="center">
              <strong>{totals.customerCount}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={3} align="right">
              <strong style={{ color: "#1890ff", fontSize: 16 }}>
                {totals.totalRevenue.toLocaleString()} ₫
              </strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={4} align="center">
              <strong>100%</strong>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        </Table.Summary>
      )}
    />
  );
}
