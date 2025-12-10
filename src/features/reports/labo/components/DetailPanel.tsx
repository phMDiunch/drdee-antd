import React, { useMemo } from "react";
import Link from "next/link";
import { Card, Table, Typography, Space, Tag, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { LaboOrderDetailRecord } from "@/shared/validation/labo-report.schema";
import dayjs from "dayjs";

const { Text } = Typography;

// Helper function - stable reference, tránh recreate trong render
const getOrderTypeColor = (orderType: string): string => {
  if (orderType === "Làm mới") return "blue";
  if (orderType === "Bảo hành") return "green";
  return "default";
};

interface DetailPanelProps {
  activeTab?: "daily" | "supplier" | "doctor" | "service" | null;
  selectedRowLabel?: string;
  data?: {
    records: LaboOrderDetailRecord[];
    totalRecords: number;
    totalCost: number;
  } | null;
  loading?: boolean;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
}

export default function DetailPanel({
  activeTab,
  selectedRowLabel,
  data,
  loading,
  currentPage = 1,
  pageSize = 20,
  onPageChange,
}: DetailPanelProps) {
  // Fixed columns for detail table
  const columns = useMemo<ColumnsType<LaboOrderDetailRecord>>(() => {
    return [
      {
        title: "Ngày gửi",
        dataIndex: "sentDate",
        key: "sentDate",
        width: 110,
        fixed: "left",
        render: (value) => dayjs(value).format("DD/MM/YYYY"),
      },
      {
        title: "Khách hàng",
        key: "customer",
        width: 180,
        render: (_, record) => (
          <Space direction="vertical" size={2}>
            <Link href={`/customers/${record.customerId}`}>
              <Text strong style={{ color: "#1890ff", cursor: "pointer" }}>
                {record.customerName}
              </Text>
            </Link>
            {record.customerCode && (
              <Tag style={{ marginTop: 2 }}>{record.customerCode}</Tag>
            )}
          </Space>
        ),
      },
      {
        title: "Bác sĩ",
        dataIndex: "doctorName",
        key: "doctorName",
        width: 140,
      },
      {
        title: "Xưởng",
        dataIndex: "supplierShortName",
        key: "supplierShortName",
        width: 120,
      },
      {
        title: "Dịch vụ",
        dataIndex: "serviceName",
        key: "serviceName",
        width: 200,
      },
      {
        title: "Loại đơn hàng",
        dataIndex: "orderType",
        key: "orderType",
        width: 130,
        render: (value: string) => (
          <Tag color={getOrderTypeColor(value)}>{value}</Tag>
        ),
      },
      {
        title: "Số lượng",
        dataIndex: "quantity",
        key: "quantity",
        width: 100,
        align: "right",
        render: (value) => <Text>{value}</Text>,
      },
      {
        title: "Giá",
        dataIndex: "totalCost",
        key: "totalCost",
        width: 120,
        align: "right",
        render: (value) => (
          <Text strong style={{ color: "#1890ff" }}>
            {value.toLocaleString()} ₫
          </Text>
        ),
      },
    ];
  }, []);

  const tabLabels = {
    daily: "ngày",
    supplier: "xưởng",
    doctor: "bác sĩ",
    service: "dịch vụ",
  };

  // Show empty state when no data selected
  const showEmptyState = !activeTab || !selectedRowLabel;

  return (
    <Card
      variant="borderless"
      title={
        <Text strong>
          {showEmptyState
            ? "Chi tiết đơn hàng"
            : `Chi tiết ${tabLabels[activeTab]}: ${selectedRowLabel}`}
        </Text>
      }
    >
      {!showEmptyState && (
        <div style={{ marginBottom: 16 }}>
          <Space size="large">
            <Text>
              <Text type="secondary">Tổng số:</Text>{" "}
              <Text strong>{data?.totalRecords || 0}</Text> đơn hàng
            </Text>
            <Text>
              <Text type="secondary">Tổng chi phí:</Text>{" "}
              <Text strong style={{ color: "#1890ff" }}>
                {(data?.totalCost || 0).toLocaleString()} ₫
              </Text>
            </Text>
          </Space>
        </div>
      )}

      <Table
        columns={columns}
        dataSource={data?.records || []}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}
        pagination={
          showEmptyState
            ? false
            : {
                current: currentPage,
                pageSize: pageSize,
                total: data?.totalRecords || 0,
                showSizeChanger: false,
                showTotal: (total) => `Tổng ${total} đơn hàng`,
                onChange: onPageChange,
              }
        }
        size="small"
        bordered
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Space direction="vertical" size="small">
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Chưa có dữ liệu chi tiết
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Vui lòng chọn một dòng trong bảng tổng hợp bên trên để xem
                    chi tiết
                  </Text>
                </Space>
              }
            />
          ),
        }}
      />
    </Card>
  );
}
