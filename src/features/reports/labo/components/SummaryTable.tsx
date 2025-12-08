import React, { useMemo } from "react";
import { Table, Tag, Progress, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type {
  DailyLaboData,
  SupplierLaboData,
  DoctorLaboData,
  ServiceLaboData,
} from "@/shared/validation/labo-report.schema";

const { Text } = Typography;

// Union type for all possible dimension data
type DimensionData =
  | DailyLaboData
  | SupplierLaboData
  | DoctorLaboData
  | ServiceLaboData;

// Ranking tag component for top performers
interface RankingTagProps {
  rank: number;
  percentage: number;
}

function RankingTag({ rank, percentage }: RankingTagProps) {
  // Medals for top 3
  const medals = ["🥇", "🥈", "🥉"];
  const colors = ["gold", "cyan", "green"];

  if (rank <= 3) {
    return (
      <Tag color={colors[rank - 1]}>
        {medals[rank - 1]} #{rank} ({percentage.toFixed(1)}%)
      </Tag>
    );
  }

  return (
    <Tag color="default">
      #{rank} ({percentage.toFixed(1)}%)
    </Tag>
  );
}

interface SummaryTableProps<T extends DimensionData> {
  dataSource: T[];
  loading?: boolean;
  onRowClick?: (record: T) => void;
  dimension: "daily" | "supplier" | "doctor" | "service";
}

export default function SummaryTable<T extends DimensionData>({
  dataSource,
  loading,
  onRowClick,
  dimension,
}: SummaryTableProps<T>) {
  // Determine if this dimension has ranking
  const hasRanking = dimension !== "daily";

  // Calculate totals for summary row
  const totals = useMemo(() => {
    return {
      count: dataSource.reduce((sum, item) => sum + item.orderCount, 0),
      totalCost: dataSource.reduce((sum, item) => sum + item.totalCost, 0),
    };
  }, [dataSource]);

  // Column configuration per dimension
  const columns = useMemo<ColumnsType<T>>(() => {
    const baseColumns: ColumnsType<T> = [];

    // Ranking column (only for supplier, doctor, service)
    if (hasRanking) {
      baseColumns.push({
        title: "Xếp hạng",
        dataIndex: "rank",
        key: "rank",
        width: 130,
        align: "center",
        render: (rank: number, record) => (
          <RankingTag rank={rank} percentage={record.percentage} />
        ),
      });
    }

    // Name column (varies per dimension)
    if (dimension === "daily") {
      baseColumns.push({
        title: "Ngày nhận",
        dataIndex: "date",
        key: "date",
        width: 140,
        render: (value: string) => <Text strong>{value}</Text>,
      });
    } else if (dimension === "supplier") {
      baseColumns.push({
        title: "Xưởng",
        dataIndex: "supplierName",
        key: "supplierName",
        render: (value: string) => <Text strong>{value}</Text>,
      });
    } else if (dimension === "doctor") {
      baseColumns.push({
        title: "Bác sĩ",
        dataIndex: "doctorName",
        key: "doctorName",
        render: (value: string) => <Text strong>{value}</Text>,
      });
    } else if (dimension === "service") {
      baseColumns.push({
        title: "Dịch vụ",
        dataIndex: "serviceName",
        key: "serviceName",
        render: (value: string) => <Text strong>{value}</Text>,
      });
    }

    // Metrics columns
    baseColumns.push(
      {
        title: "Số đơn hàng",
        dataIndex: "orderCount",
        key: "orderCount",
        width: 120,
        align: "right",
        render: (value: number) => (
          <Text style={{ fontWeight: 500 }}>{value.toLocaleString()}</Text>
        ),
      },
      {
        title: "Tổng chi phí",
        dataIndex: "totalCost",
        key: "totalCost",
        width: 150,
        align: "right",
        render: (value: number) => (
          <Text strong style={{ color: "#1890ff" }}>
            {value.toLocaleString()} ₫
          </Text>
        ),
      }
    );

    // Percentage column (only for ranked dimensions)
    if (hasRanking) {
      baseColumns.push({
        title: "Tỷ trọng",
        dataIndex: "percentage",
        key: "percentage",
        width: 200,
        render: (value: number) => (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Progress
              percent={value}
              size="small"
              style={{ flex: 1, marginBottom: 0 }}
              format={(percent) => `${percent?.toFixed(1)}%`}
            />
          </div>
        ),
      });
    }

    return baseColumns;
  }, [dimension, hasRanking]);

  // Summary row
  const summaryRow = useMemo(() => {
    if (dataSource.length === 0) return null;

    const row: Record<string, React.ReactNode> = {};

    if (hasRanking) {
      row.rank = <Text strong>Tổng cộng</Text>;
    }

    if (dimension === "daily") {
      row.date = <Text strong>Tổng cộng</Text>;
    } else if (dimension === "supplier") {
      row.supplierName = <Text strong>Tổng cộng</Text>;
    } else if (dimension === "doctor") {
      row.doctorName = <Text strong>Tổng cộng</Text>;
    } else if (dimension === "service") {
      row.serviceName = <Text strong>Tổng cộng</Text>;
    }

    row.orderCount = (
      <Text strong style={{ fontWeight: 600 }}>
        {totals.count.toLocaleString()}
      </Text>
    );

    row.totalCost = (
      <Text strong style={{ color: "#1890ff", fontWeight: 600 }}>
        {totals.totalCost.toLocaleString()} ₫
      </Text>
    );

    if (hasRanking) {
      row.percentage = (
        <Text strong style={{ fontWeight: 600 }}>
          100%
        </Text>
      );
    }

    return row;
  }, [dataSource, dimension, hasRanking, totals]);

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      rowKey={(record) => {
        if (dimension === "daily") {
          return (record as DailyLaboData).id;
        } else if (dimension === "supplier") {
          return (record as SupplierLaboData).supplierId;
        } else if (dimension === "doctor") {
          return (record as DoctorLaboData).doctorId;
        } else {
          return (record as ServiceLaboData).serviceId;
        }
      }}
      loading={loading}
      pagination={false}
      size="small"
      bordered
      onRow={(record) => ({
        onClick: () => onRowClick?.(record),
        style: { cursor: onRowClick ? "pointer" : "default" },
      })}
      summary={() =>
        summaryRow ? (
          <Table.Summary fixed>
            <Table.Summary.Row style={{ backgroundColor: "#fafafa" }}>
              {columns.map((col) => (
                <Table.Summary.Cell
                  key={col.key as string}
                  index={0}
                  align={(col.align as "left" | "right" | "center") || "left"}
                >
                  {summaryRow[col.key as string]}
                </Table.Summary.Cell>
              ))}
            </Table.Summary.Row>
          </Table.Summary>
        ) : null
      }
    />
  );
}
