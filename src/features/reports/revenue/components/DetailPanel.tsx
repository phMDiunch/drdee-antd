import React, { useMemo, useCallback } from "react";
import Link from "next/link";
import { Card, Table, Typography, Space, Tag, Empty, Button } from "antd";
import { InfoCircleOutlined, FileExcelOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { PaymentDetailRecord } from "@/shared/validation/revenue-report.schema";
import type { TabType } from "../hooks/useRevenueDetail";
import { exportRevenueDetailToExcel } from "../utils/exportToExcel";
import { useNotify } from "@/shared/hooks/useNotify";
import dayjs from "dayjs";

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
  filters?: {
    month: string;
    clinicId?: string;
  };
}

export default function DetailPanel({
  activeTab,
  selectedRowLabel,
  data,
  loading,
  filters,
}: DetailPanelProps) {
  const notify = useNotify();

  const handleExportExcel = useCallback(async () => {
    if (!data || !data.records.length) {
      notify.warning("Không có dữ liệu để xuất");
      return;
    }

    try {
      const filename = `bao-cao-doanh-thu-chi-tiet-${
        filters?.month || dayjs().format("YYYY-MM")
      }.xlsx`;

      await exportRevenueDetailToExcel(data.records, filename);

      notify.success("Xuất Excel thành công");
    } catch (error) {
      console.error("Export error:", error);
      notify.error(error, { fallback: "Xuất Excel thất bại" });
    }
  }, [data, filters, notify]);

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
        title: "Vị trí răng",
        dataIndex: "toothPositions",
        key: "toothPositions",
        width: 120,
        render: (value: string[] | null) => {
          if (!value || value.length === 0) return "-";
          return value.join(", ");
        },
      },
      {
        title: "Số lượng",
        dataIndex: "quantity",
        key: "quantity",
        width: 90,
        align: "center",
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
        width: 120,
        align: "center",
        render: (_, record) => {
          const isComplete = record.paymentPercentage >= 100;
          const color = isComplete ? "green" : "blue";
          return (
            <Tag color={color}>{record.paymentPercentage.toFixed(1)}%</Tag>
          );
        },
      },
    ];
  }, []);

  const tabLabels: Record<TabType, string> = {
    daily: "ngày",
    source: "nguồn",
    department: "bộ môn",
    serviceGroup: "nhóm dịch vụ",
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
      extra={
        !showEmptyState && data?.records.length ? (
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={handleExportExcel}
            loading={loading}
          >
            Xuất Excel
          </Button>
        ) : null
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
            scroll={{ x: 1300 }}
            pagination={{
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} giao dịch`,
              pageSizeOptions: [10, 20, 50, 100],
            }}
          />
        </>
      )}
    </Card>
  );
}
