import React, { useMemo } from "react";
import Link from "next/link";
import { Card, Table, Typography, Space, Tag, Empty } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { PaymentDetailRecord } from "@/shared/validation/revenue-report.schema";
import type { TabType } from "../hooks/useRevenueDetail";

const { Text } = Typography;

interface DetailPanelProps {
  activeTab?: TabType | null;
  selectedRowLabel?: string;
  data?: {
    records: PaymentDetailRecord[];
    totalRecords: number;
    totalRevenue: number;
  } | null;
  loading?: boolean;
}

export default function DetailPanel({
  activeTab,
  selectedRowLabel,
  data,
  loading,
}: DetailPanelProps) {
  const columns = useMemo<ColumnsType<PaymentDetailRecord>>(() => {
    return [
      {
        title: "Ngày thu",
        dataIndex: "paymentDateDisplay",
        key: "paymentDateDisplay",
        width: 110,
        fixed: "left",
      },
      {
        title: "Dịch vụ",
        dataIndex: "serviceName",
        key: "serviceName",
        width: 200,
      },
      {
        title: "Khách hàng (Mã)",
        key: "customer",
        width: 180,
        render: (_, record) => (
          <Link href={`/customers/${record.customerId}`}>
            <Text strong style={{ color: "#1890ff", cursor: "pointer" }}>
              {record.customerName} ({record.customerCode})
            </Text>
          </Link>
        ),
      },
      {
        title: "Bác sĩ điều trị",
        dataIndex: "treatingDoctorName",
        key: "treatingDoctorName",
        width: 140,
        render: (value) => value || "-",
      },
      {
        title: "Số tiền thu",
        dataIndex: "amount",
        key: "amount",
        width: 140,
        align: "right",
        render: (value) => (
          <span style={{ fontWeight: "bold", color: "#1890ff" }}>
            {value.toLocaleString()} ₫
          </span>
        ),
      },
      {
        title: "% thanh toán",
        key: "paymentPercentage",
        width: 180,
        render: (_, record) => {
          const isComplete = record.paymentPercentage >= 100;
          const color = isComplete ? "green" : "blue";
          return (
            <Tag color={color}>
              {record.paymentPercentage.toFixed(1)}% (
              {record.totalPaid.toLocaleString()}/
              {record.finalPrice.toLocaleString()})
            </Tag>
          );
        },
      },
    ];
  }, []);

  const tabLabels: Record<TabType, string> = {
    daily: "ngày",
    source: "nguồn",
    service: "dịch vụ",
    doctor: "bác sĩ điều trị",
  };

  const showEmptyState = !activeTab || !selectedRowLabel;

  return (
    <Card
      variant="borderless"
      title={
        <Space>
          <Text strong>
            {showEmptyState
              ? "Chi tiết thanh toán"
              : `Chi tiết ${tabLabels[activeTab]}: ${selectedRowLabel}`}
          </Text>
        </Space>
      }
    >
      {showEmptyState ? (
        <Empty
          image={
            <InfoCircleOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
          }
          description={
            <div style={{ textAlign: "center" }}>
              <Text type="secondary">Chưa có dữ liệu chi tiết</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Vui lòng chọn một dòng trong bảng tổng hợp bên trên
              </Text>
            </div>
          }
        />
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <Space size="large">
              <Text>
                <Text type="secondary">Tổng số:</Text>{" "}
                <Text strong>{data?.totalRecords || 0}</Text> giao dịch
              </Text>
              <Text>
                <Text type="secondary">Tổng doanh thu:</Text>{" "}
                <Text strong style={{ color: "#1890ff" }}>
                  {(data?.totalRevenue || 0).toLocaleString()} ₫
                </Text>
              </Text>
            </Space>
          </div>

          <Table
            size="small"
            bordered
            columns={columns}
            dataSource={data?.records || []}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1100 }}
            pagination={{
              pageSize: 20,
              showSizeChanger: false,
              showTotal: (total) => `Tổng ${total} giao dịch`,
            }}
          />
        </>
      )}
    </Card>
  );
}
