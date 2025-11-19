import React, { useMemo } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { DailyRevenueData } from "@/shared/validation/revenue-report.schema";

interface DailyRevenueTableProps {
  data: DailyRevenueData[];
  loading?: boolean;
  onRowClick?: (record: DailyRevenueData) => void;
}

export default function DailyRevenueTable({
  data,
  loading,
  onRowClick,
}: DailyRevenueTableProps) {
  // Calculate totals
  const totals = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        cash: 0,
        cardRegular: 0,
        cardVisa: 0,
        transfer: 0,
        totalRevenue: 0,
      };
    }

    return {
      cash: data.reduce((sum, item) => sum + item.cash, 0),
      cardRegular: data.reduce((sum, item) => sum + item.cardRegular, 0),
      cardVisa: data.reduce((sum, item) => sum + item.cardVisa, 0),
      transfer: data.reduce((sum, item) => sum + item.transfer, 0),
      totalRevenue: data.reduce((sum, item) => sum + item.totalRevenue, 0),
    };
  }, [data]);

  const columns = useMemo<ColumnsType<DailyRevenueData>>(
    () => [
      {
        title: "Ngày",
        dataIndex: "date",
        key: "date",
        width: 120,
        fixed: "left",
        render: (value) => <span style={{ fontWeight: "bold" }}>{value}</span>,
      },
      {
        title: "Tiền mặt",
        dataIndex: "cash",
        key: "cash",
        width: 140,
        align: "right",
        render: (value) => (
          <span style={{ color: "#52c41a" }}>{value.toLocaleString()} ₫</span>
        ),
      },
      {
        title: "Quẹt thẻ thường",
        dataIndex: "cardRegular",
        key: "cardRegular",
        width: 160,
        align: "right",
        render: (value) => (
          <span style={{ color: "#fa8c16" }}>{value.toLocaleString()} ₫</span>
        ),
      },
      {
        title: "Quẹt thẻ Visa",
        dataIndex: "cardVisa",
        key: "cardVisa",
        width: 150,
        align: "right",
        render: (value) => (
          <span style={{ color: "#722ed1" }}>{value.toLocaleString()} ₫</span>
        ),
      },
      {
        title: "Chuyển khoản",
        dataIndex: "transfer",
        key: "transfer",
        width: 150,
        align: "right",
        render: (value) => (
          <span style={{ color: "#13c2c2" }}>{value.toLocaleString()} ₫</span>
        ),
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
      scroll={{ x: 1000 }}
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
            <Table.Summary.Cell index={1} align="right">
              <strong style={{ color: "#52c41a" }}>
                {totals.cash.toLocaleString()} ₫
              </strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2} align="right">
              <strong style={{ color: "#fa8c16" }}>
                {totals.cardRegular.toLocaleString()} ₫
              </strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={3} align="right">
              <strong style={{ color: "#722ed1" }}>
                {totals.cardVisa.toLocaleString()} ₫
              </strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={4} align="right">
              <strong style={{ color: "#13c2c2" }}>
                {totals.transfer.toLocaleString()} ₫
              </strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={5} align="right">
              <strong style={{ color: "#1890ff", fontSize: 16 }}>
                {totals.totalRevenue.toLocaleString()} ₫
              </strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={6} align="center">
              <strong>100%</strong>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        </Table.Summary>
      )}
    />
  );
}
