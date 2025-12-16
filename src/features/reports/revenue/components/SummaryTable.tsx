import React, { useMemo } from "react";
import { Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type {
  DailyRevenueData,
  SourceRevenueData,
  DepartmentRevenueData,
  ServiceGroupRevenueData,
  ServiceRevenueData,
  DoctorRevenueData,
} from "@/shared/validation/revenue-report.schema";

const { Text } = Typography;

// Union type for all possible dimension data
type DimensionData =
  | DailyRevenueData
  | SourceRevenueData
  | DepartmentRevenueData
  | ServiceGroupRevenueData
  | ServiceRevenueData
  | DoctorRevenueData;

interface SummaryTableProps<T extends DimensionData> {
  dataSource: T[];
  loading?: boolean;
  onRowClick?: (record: T) => void;
  dimension:
    | "daily"
    | "source"
    | "department"
    | "serviceGroup"
    | "service"
    | "doctor";
}

export default function SummaryTable<T extends DimensionData>({
  dataSource,
  loading,
  onRowClick,
  dimension,
}: SummaryTableProps<T>) {
  // Calculate totals based on dimension
  const totals = useMemo(() => {
    if (dataSource.length === 0) {
      return {
        totalRevenue: 0,
        cash: 0,
        cardRegular: 0,
        cardVisa: 0,
        transfer: 0,
        companyRevenue: 0,
        voucherCount: 0,
        customerCount: 0,
        totalPaid: 0,
        totalFinalPrice: 0,
      };
    }

    const result: {
      totalRevenue: number;
      cash?: number;
      cardRegular?: number;
      cardVisa?: number;
      transfer?: number;
      companyRevenue?: number;
      voucherCount?: number;
      customerCount?: number;
      totalPaid?: number;
      totalFinalPrice?: number;
    } = {
      totalRevenue: dataSource.reduce(
        (sum, item) => sum + (item.totalRevenue || 0),
        0
      ),
    };

    // Daily dimension
    if (dimension === "daily") {
      const dailyData = dataSource as DailyRevenueData[];
      result.cash = dailyData.reduce((sum, item) => sum + item.cash, 0);
      result.cardRegular = dailyData.reduce(
        (sum, item) => sum + item.cardRegular,
        0
      );
      result.cardVisa = dailyData.reduce((sum, item) => sum + item.cardVisa, 0);
      result.transfer = dailyData.reduce((sum, item) => sum + item.transfer, 0);
      result.companyRevenue = dailyData.reduce(
        (sum, item) => sum + item.companyRevenue,
        0
      );
    }

    // Source dimension
    if (dimension === "source") {
      const sourceData = dataSource as SourceRevenueData[];
      result.voucherCount = sourceData.reduce(
        (sum, item) => sum + item.voucherCount,
        0
      );
      result.customerCount = sourceData.reduce(
        (sum, item) => sum + item.customerCount,
        0
      );
    }

    // Department, ServiceGroup, Service dimensions
    if (
      dimension === "department" ||
      dimension === "serviceGroup" ||
      dimension === "service"
    ) {
      const paymentData = dataSource as (
        | DepartmentRevenueData
        | ServiceGroupRevenueData
        | ServiceRevenueData
      )[];
      result.totalPaid = paymentData.reduce(
        (sum, item) => sum + item.totalPaid,
        0
      );
      result.totalFinalPrice = paymentData.reduce(
        (sum, item) => sum + item.totalFinalPrice,
        0
      );
    }

    return result;
  }, [dataSource, dimension]);

  const totalPaymentPercentage = useMemo(() => {
    if (
      !totals.totalFinalPrice ||
      totals.totalFinalPrice === 0 ||
      !totals.totalPaid
    )
      return 0;
    return Math.round((totals.totalPaid / totals.totalFinalPrice) * 1000) / 10;
  }, [totals]);

  // Column configuration per dimension
  const columns = useMemo<ColumnsType<T>>(() => {
    const cols: ColumnsType<T> = [];

    // Name column (varies per dimension)
    if (dimension === "daily") {
      cols.push({
        title: "Ngày",
        dataIndex: "date",
        key: "date",
        width: 120,
        fixed: "left",
        render: (value: string) => <Text strong>{value}</Text>,
      });
    } else if (dimension === "source") {
      cols.push({
        title: "Nguồn",
        dataIndex: "source",
        key: "source",
        width: 200,
        fixed: "left",
        render: (value: string) => <Text strong>{value}</Text>,
      });
    } else if (dimension === "department") {
      cols.push({
        title: "Bộ môn",
        dataIndex: "department",
        key: "department",
        width: 250,
        fixed: "left",
        render: (value: string) => <Text strong>{value}</Text>,
      });
    } else if (dimension === "serviceGroup") {
      cols.push({
        title: "Nhóm dịch vụ",
        dataIndex: "serviceGroup",
        key: "serviceGroup",
        width: 250,
        fixed: "left",
        render: (value: string) => <Text strong>{value}</Text>,
      });
    } else if (dimension === "service") {
      cols.push({
        title: "Dịch vụ",
        dataIndex: "serviceName",
        key: "serviceName",
        width: 250,
        fixed: "left",
        render: (value: string) => <Text strong>{value}</Text>,
      });
    } else if (dimension === "doctor") {
      cols.push({
        title: "Bác sĩ điều trị",
        dataIndex: "doctorName",
        key: "doctorName",
        width: 200,
        fixed: "left",
        render: (value: string) => <Text strong>{value}</Text>,
      });
    }

    // Dimension-specific columns
    if (dimension === "daily") {
      cols.push(
        {
          title: "Doanh thu",
          dataIndex: "totalRevenue",
          key: "totalRevenue",
          width: 160,
          align: "right",
          sorter: (a, b) => a.totalRevenue - b.totalRevenue,
          render: (value: number) => (
            <Text strong style={{ color: "#1890ff" }}>
              {value.toLocaleString()} ₫
            </Text>
          ),
        },
        {
          title: "Tiền mặt",
          dataIndex: "cash",
          key: "cash",
          width: 140,
          align: "right",
          render: (value: number) => (
            <Text style={{ color: "#52c41a" }}>{value.toLocaleString()} ₫</Text>
          ),
        },
        {
          title: "Quẹt thẻ thường",
          dataIndex: "cardRegular",
          key: "cardRegular",
          width: 160,
          align: "right",
          render: (value: number) => (
            <Text style={{ color: "#fa8c16" }}>{value.toLocaleString()} ₫</Text>
          ),
        },
        {
          title: "Quẹt thẻ Visa",
          dataIndex: "cardVisa",
          key: "cardVisa",
          width: 150,
          align: "right",
          render: (value: number) => (
            <Text style={{ color: "#722ed1" }}>{value.toLocaleString()} ₫</Text>
          ),
        },
        {
          title: "Chuyển khoản",
          dataIndex: "transfer",
          key: "transfer",
          width: 150,
          align: "right",
          render: (value: number) => (
            <Text style={{ color: "#13c2c2" }}>{value.toLocaleString()} ₫</Text>
          ),
        },
        {
          title: "DT TK Công ty",
          dataIndex: "companyRevenue",
          key: "companyRevenue",
          width: 150,
          align: "right",
          render: (value: number) => (
            <Text style={{ color: "#eb2f96" }}>{value.toLocaleString()} ₫</Text>
          ),
        },
        {
          title: "%",
          dataIndex: "percentage",
          key: "percentage",
          width: 90,
          align: "center",
          render: (value: number) => `${value.toFixed(1)}%`,
        }
      );
    } else if (dimension === "source") {
      cols.push(
        {
          title: "Số phiếu thu",
          dataIndex: "voucherCount",
          key: "voucherCount",
          width: 130,
          align: "center",
          render: (value: number) => <Text>{value.toLocaleString()}</Text>,
        },
        {
          title: "Số KH thanh toán",
          dataIndex: "customerCount",
          key: "customerCount",
          width: 160,
          align: "center",
          render: (value: number) => <Text>{value.toLocaleString()}</Text>,
        },
        {
          title: "Doanh thu",
          dataIndex: "totalRevenue",
          key: "totalRevenue",
          width: 160,
          align: "right",
          sorter: (a, b) => a.totalRevenue - b.totalRevenue,
          render: (value: number) => (
            <Text strong style={{ color: "#1890ff" }}>
              {value.toLocaleString()} ₫
            </Text>
          ),
        },
        {
          title: "%",
          dataIndex: "percentage",
          key: "percentage",
          width: 90,
          align: "center",
          render: (value: number) => `${value.toFixed(1)}%`,
        }
      );
    } else if (
      dimension === "department" ||
      dimension === "serviceGroup" ||
      dimension === "service"
    ) {
      cols.push(
        {
          title: "Doanh thu",
          dataIndex: "totalRevenue",
          key: "totalRevenue",
          width: 160,
          align: "right",
          sorter: (a, b) => a.totalRevenue - b.totalRevenue,
          render: (value: number) => (
            <Text strong style={{ color: "#1890ff" }}>
              {value.toLocaleString()} ₫
            </Text>
          ),
        },
        {
          title: "% tổng DT",
          dataIndex: "percentageOfTotal",
          key: "percentageOfTotal",
          width: 110,
          align: "center",
          render: (value: number) => `${value.toFixed(1)}%`,
        },
        {
          title: "% thanh toán",
          dataIndex: "paymentPercentage",
          key: "paymentPercentage",
          width: 120,
          align: "center",
          render: (value: number) => {
            const isComplete = value >= 100;
            const color = isComplete ? "green" : "blue";
            return <Tag color={color}>{value.toFixed(1)}%</Tag>;
          },
        }
      );
    } else if (dimension === "doctor") {
      cols.push(
        {
          title: "Doanh thu",
          dataIndex: "totalRevenue",
          key: "totalRevenue",
          width: 160,
          align: "right",
          sorter: (a, b) => a.totalRevenue - b.totalRevenue,
          render: (value: number) => (
            <Text strong style={{ color: "#1890ff" }}>
              {value.toLocaleString()} ₫
            </Text>
          ),
        },
        {
          title: "%",
          dataIndex: "percentage",
          key: "percentage",
          width: 90,
          align: "center",
          render: (value: number) => `${value.toFixed(1)}%`,
        }
      );
    }

    return cols;
  }, [dimension]);

  // Summary row
  const summaryRow = useMemo(() => {
    if (dataSource.length === 0) return null;

    const row: Record<string, React.ReactNode> = {};

    // First column label
    const firstColKey = columns[0]?.key as string;
    row[firstColKey] = <Text strong>TỔNG</Text>;

    if (dimension === "daily") {
      row.totalRevenue = (
        <Text strong style={{ color: "#1890ff", fontSize: 16 }}>
          {totals.totalRevenue.toLocaleString()} ₫
        </Text>
      );
      row.cash = (
        <Text strong style={{ color: "#52c41a" }}>
          {(totals.cash || 0).toLocaleString()} ₫
        </Text>
      );
      row.cardRegular = (
        <Text strong style={{ color: "#fa8c16" }}>
          {(totals.cardRegular || 0).toLocaleString()} ₫
        </Text>
      );
      row.cardVisa = (
        <Text strong style={{ color: "#722ed1" }}>
          {(totals.cardVisa || 0).toLocaleString()} ₫
        </Text>
      );
      row.transfer = (
        <Text strong style={{ color: "#13c2c2" }}>
          {(totals.transfer || 0).toLocaleString()} ₫
        </Text>
      );
      row.companyRevenue = (
        <Text strong style={{ color: "#eb2f96" }}>
          {(totals.companyRevenue || 0).toLocaleString()} ₫
        </Text>
      );
      row.percentage = <Text strong>100%</Text>;
    } else if (dimension === "source") {
      row.voucherCount = <Text strong>{totals.voucherCount || 0}</Text>;
      row.customerCount = <Text strong>{totals.customerCount || 0}</Text>;
      row.totalRevenue = (
        <Text strong style={{ color: "#1890ff", fontSize: 16 }}>
          {totals.totalRevenue.toLocaleString()} ₫
        </Text>
      );
      row.percentage = <Text strong>100%</Text>;
    } else if (
      dimension === "department" ||
      dimension === "serviceGroup" ||
      dimension === "service"
    ) {
      row.totalRevenue = (
        <Text strong style={{ color: "#1890ff", fontSize: 16 }}>
          {totals.totalRevenue.toLocaleString()} ₫
        </Text>
      );
      row.percentageOfTotal = <Text strong>100%</Text>;
      row.paymentPercentage = (
        <Tag color={totalPaymentPercentage >= 100 ? "green" : "blue"}>
          <Text strong>{totalPaymentPercentage.toFixed(1)}%</Text>
        </Tag>
      );
    } else if (dimension === "doctor") {
      row.totalRevenue = (
        <Text strong style={{ color: "#1890ff", fontSize: 16 }}>
          {totals.totalRevenue.toLocaleString()} ₫
        </Text>
      );
      row.percentage = <Text strong>100%</Text>;
    }

    return row;
  }, [dataSource, dimension, columns, totals, totalPaymentPercentage]);

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      rowKey={(record) => {
        if (
          dimension === "daily" ||
          dimension === "source" ||
          dimension === "department" ||
          dimension === "serviceGroup"
        ) {
          return record.id;
        } else if (dimension === "service") {
          return (record as ServiceRevenueData).serviceId;
        } else {
          return (record as DoctorRevenueData).doctorId;
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
