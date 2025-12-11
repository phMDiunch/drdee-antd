import React, { useMemo, useCallback } from "react";
import Link from "next/link";
import { Card, Table, Typography, Space, Tag, Empty, Button } from "antd";
import { InfoCircleOutlined, FileExcelOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { LaboOrderDetailRecord } from "@/shared/validation/labo-report.schema";
import type { TabType } from "../hooks/useLaboReportDetail";
import { exportLaboDetailToExcel } from "../utils/exportToExcel";
import { useNotify } from "@/shared/hooks/useNotify";
import dayjs from "dayjs";

const { Text } = Typography;

// Helper function - stable reference, tránh recreate trong render
const getOrderTypeColor = (orderType: string): string => {
  if (orderType === "Làm mới") return "blue";
  if (orderType === "Bảo hành") return "green";
  return "default";
};

interface DetailPanelProps {
  activeTab?: TabType | null;
  selectedRowLabel?: string;
  data?: {
    records: LaboOrderDetailRecord[];
    totalRecords: number;
    totalCost: number;
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
      const filename = `bao-cao-labo-chi-tiet-${
        filters?.month || dayjs().format("YYYY-MM")
      }.xlsx`;

      await exportLaboDetailToExcel(data.records, filename);

      notify.success("Xuất Excel thành công");
    } catch (error) {
      console.error("Export error:", error);
      notify.error(error, { fallback: "Xuất Excel thất bại" });
    }
  }, [data, filters, notify]);

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
        title: "Đơn giá",
        dataIndex: "unitPrice",
        key: "unitPrice",
        width: 120,
        align: "right",
        render: (value) => <Text>{value.toLocaleString()} ₫</Text>,
      },
      {
        title: "Thành tiền",
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

  const tabLabels: Record<TabType, string> = {
    daily: "ngày",
    supplier: "xưởng",
    doctor: "bác sĩ",
    service: "dịch vụ",
  };

  const showEmptyState = !activeTab || !selectedRowLabel;

  return (
    <Card
      variant="borderless"
      title={
        <Space>
          <Text strong>
            {showEmptyState
              ? "Chi tiết đơn hàng"
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
              showTotal: (total) => `Tổng ${total} đơn hàng`,
              pageSizeOptions: [10, 20, 50, 100],
            }}
          />
        </>
      )}
    </Card>
  );
}
