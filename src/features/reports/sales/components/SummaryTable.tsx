import React, { useMemo } from "react";
import { Table, Tag, Progress } from "antd";
import { TrophyOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

// Base data interface that all summary data types must implement
interface BaseSummaryData {
  id: string;
  rank?: number; // Optional: for daily data that has pre-calculated ranking
  customersVisited: number;
  consultations: number;
  closed: number;
  revenue: number;
  closingRate: number;
  averagePerService: number;
  revenuePercentage: number;
}

interface SummaryTableProps<T extends BaseSummaryData> {
  data: T[];
  loading?: boolean;
  nameColumn: {
    title: string;
    dataIndex: string;
    width?: number;
  };
  onRowClick?: (record: T) => void;
  scroll?: { x?: number; y?: number };
  pagination?: false | { pageSize?: number };
}

// Ranking tag component
function RankingTag({
  rank,
  percentage,
}: {
  rank: number;
  percentage: number;
}) {
  const colors = ["gold", "cyan", "green"];
  const color = rank <= 3 ? colors[rank - 1] : "default";

  return (
    <div style={{ textAlign: "center" }}>
      <Tag color={color} icon={rank <= 3 ? <TrophyOutlined /> : undefined}>
        #{rank}
      </Tag>
      <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 4 }}>
        {percentage.toFixed(1)}%
      </div>
    </div>
  );
}

export default function SummaryTable<T extends BaseSummaryData>({
  data,
  loading,
  nameColumn,
  onRowClick,
  scroll = { x: 1200 },
  pagination = false, // Changed default to false (no pagination)
}: SummaryTableProps<T>) {
  // Calculate totals
  const totals = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        customersVisited: 0,
        consultations: 0,
        closed: 0,
        revenue: 0,
        closingRate: 0,
        averagePerService: 0,
      };
    }

    const totalCustomers = data.reduce(
      (sum, item) => sum + item.customersVisited,
      0
    );
    const totalConsultations = data.reduce(
      (sum, item) => sum + item.consultations,
      0
    );
    const totalClosed = data.reduce((sum, item) => sum + item.closed, 0);
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    const totalClosingRate =
      totalConsultations > 0
        ? Math.round((totalClosed / totalConsultations) * 1000) / 10
        : 0;
    const totalAveragePerService =
      totalClosed > 0 ? Math.round(totalRevenue / totalClosed) : 0;

    return {
      customersVisited: totalCustomers,
      consultations: totalConsultations,
      closed: totalClosed,
      revenue: totalRevenue,
      closingRate: totalClosingRate,
      averagePerService: totalAveragePerService,
    };
  }, [data]);

  const columns = useMemo<ColumnsType<T>>(
    () => [
      {
        title: "Xếp hạng",
        key: "ranking",
        width: 110,
        align: "center",
        render: (_, record, index) => (
          <RankingTag
            rank={record.rank ?? index + 1}
            percentage={record.revenuePercentage}
          />
        ),
      },
      {
        title: nameColumn.title,
        dataIndex: nameColumn.dataIndex,
        key: nameColumn.dataIndex,
        width: nameColumn.width || 160,
        fixed: "left",
        render: (value) => <span style={{ fontWeight: "bold" }}>{value}</span>,
      },
      {
        title: "Khách đến",
        dataIndex: "customersVisited",
        key: "customersVisited",
        width: 120,
        align: "center",
      },
      {
        title: "DV tư vấn",
        dataIndex: "consultations",
        key: "consultations",
        width: 110,
        align: "center",
      },
      {
        title: "DV chốt",
        dataIndex: "closed",
        key: "closed",
        width: 100,
        align: "center",
        render: (value) => (
          <span style={{ color: "#52c41a", fontWeight: "bold" }}>{value}</span>
        ),
      },
      {
        title: "Doanh số",
        dataIndex: "revenue",
        key: "revenue",
        width: 140,
        align: "right",
        sorter: (a, b) => a.revenue - b.revenue,
        render: (value) => (
          <span style={{ color: "#1890ff", fontWeight: "bold" }}>
            {value.toLocaleString()} ₫
          </span>
        ),
      },
      {
        title: "Tỷ lệ chốt %",
        dataIndex: "closingRate",
        key: "closingRate",
        width: 110,
        align: "center",
        render: (value) => <Progress percent={value} size="small" />,
      },
      {
        title: "TB/dịch vụ",
        dataIndex: "averagePerService",
        key: "averagePerService",
        width: 120,
        align: "right",
        render: (value) => `${value.toLocaleString()} ₫`,
      },
    ],
    [nameColumn]
  );

  return (
    <Table
      size="small"
      bordered
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      scroll={scroll}
      pagination={pagination}
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
          <Table.Summary.Row
            style={{ fontWeight: "bold", backgroundColor: "#fafafa" }}
          >
            <Table.Summary.Cell index={0} align="center">
              {/* Ranking column */}
            </Table.Summary.Cell>
            <Table.Summary.Cell index={1}>
              <span style={{ fontWeight: "bold" }}>Tổng cộng</span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2} align="center">
              {totals.customersVisited}
            </Table.Summary.Cell>
            <Table.Summary.Cell index={3} align="center">
              {totals.consultations}
            </Table.Summary.Cell>
            <Table.Summary.Cell index={4} align="center">
              <span style={{ color: "#52c41a", fontWeight: "bold" }}>
                {totals.closed}
              </span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={5} align="right">
              <span style={{ color: "#1890ff", fontWeight: "bold" }}>
                {totals.revenue.toLocaleString()} ₫
              </span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={6} align="center">
              {totals.closingRate.toFixed(1)}%
            </Table.Summary.Cell>
            <Table.Summary.Cell index={7} align="right">
              {totals.averagePerService.toLocaleString()} ₫
            </Table.Summary.Cell>
          </Table.Summary.Row>
        </Table.Summary>
      )}
    />
  );
}
