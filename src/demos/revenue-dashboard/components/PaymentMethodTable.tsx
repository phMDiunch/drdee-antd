"use client";

import { Card, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { PaymentMethodStats } from "../types";
import { formatCurrency, formatPercentage } from "../utils";

interface PaymentMethodTableProps {
  data: PaymentMethodStats[];
}

export default function PaymentMethodTable({ data }: PaymentMethodTableProps) {
  const columns: ColumnsType<PaymentMethodStats> = [
    {
      title: "Loại giao dịch",
      dataIndex: "label",
      key: "label",
      fixed: "left",
      width: 180,
    },
    {
      title: "Số giao dịch",
      dataIndex: "transactionCount",
      key: "transactionCount",
      align: "right",
      width: 120,
      sorter: (a, b) => a.transactionCount - b.transactionCount,
    },
    {
      title: "Doanh thu (VNĐ)",
      dataIndex: "revenue",
      key: "revenue",
      align: "right",
      width: 180,
      render: (value: number) => formatCurrency(value),
      sorter: (a, b) => a.revenue - b.revenue,
    },
    {
      title: "Tỷ lệ %",
      dataIndex: "percentage",
      key: "percentage",
      align: "right",
      width: 100,
      render: (value: number) => formatPercentage(value),
      sorter: (a, b) => a.percentage - b.percentage,
    },
    {
      title: "Giá trị TB / giao dịch",
      dataIndex: "avgPerTransaction",
      key: "avgPerTransaction",
      align: "right",
      width: 180,
      render: (value: number) => formatCurrency(value),
      sorter: (a, b) => a.avgPerTransaction - b.avgPerTransaction,
    },
  ];

  return (
    <Card title="Doanh thu theo phương thức thanh toán">
      <Table
        columns={columns}
        dataSource={data}
        rowKey="type"
        pagination={false}
        scroll={{ x: 800 }}
        summary={(pageData) => {
          const totalTransactions = pageData.reduce(
            (sum, item) => sum + item.transactionCount,
            0
          );
          const totalRevenue = pageData.reduce(
            (sum, item) => sum + item.revenue,
            0
          );

          return (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ fontWeight: "bold" }}>
                <Table.Summary.Cell index={0}>Tổng cộng</Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  {totalTransactions}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  {formatCurrency(totalRevenue)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  100%
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  -
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          );
        }}
      />
    </Card>
  );
}
