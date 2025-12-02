import React, { useMemo, useCallback } from "react";
import Link from "next/link";
import { Card, Table, Typography, Space, Tag, Empty, Button } from "antd";
import { FileExcelOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { ConsultedServiceDetail } from "@/shared/validation/sales-report.schema";
import type { TabType } from "../hooks/useSalesDetail";
import { CUSTOMER_SOURCES } from "@/features/customers/constants";
import { exportSalesDetailToExcel } from "../utils/exportToExcel";
import { useNotify } from "@/shared/hooks/useNotify";
import dayjs from "dayjs";

const { Text } = Typography;

interface DetailPanelProps {
  activeTab?: TabType | null;
  selectedRowLabel?: string;
  data?: {
    records: ConsultedServiceDetail[];
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
      const filename = `bao-cao-doanh-so-chi-tiet-${
        filters?.month || dayjs().format("YYYY-MM")
      }.xlsx`;

      await exportSalesDetailToExcel(data.records, filename);

      notify.success("Xuất Excel thành công");
    } catch (error) {
      console.error("Export error:", error);
      notify.error(error, { fallback: "Xuất Excel thất bại" });
    }
  }, [data, filters, notify]);

  // Fixed columns for detail table
  const columns = useMemo<ColumnsType<ConsultedServiceDetail>>(() => {
    return [
      {
        title: "Ngày tư vấn",
        dataIndex: "consultationDate",
        key: "consultationDate",
        width: 110,
        fixed: "left",
        render: (value) => dayjs(value).format("DD/MM/YYYY"),
      },
      {
        title: "Ngày chốt",
        dataIndex: "serviceConfirmDate",
        key: "serviceConfirmDate",
        width: 110,
        render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : "-"),
      },
      {
        title: "Dịch vụ",
        key: "dentalService",
        width: 200,
        render: (_, record) => record.dentalService.name,
      },
      {
        title: "Khách hàng",
        key: "customer",
        width: 150,
        render: (_, record) => (
          <Link href={`/customers/${record.customer.id}`}>
            <Text strong style={{ color: "#1890ff", cursor: "pointer" }}>
              {record.customer.fullName}
            </Text>
          </Link>
        ),
      },
      {
        title: "Nguồn khách",
        key: "source",
        width: 130,
        render: (_, record) => {
          const sourceValue = record.customer.source;
          if (!sourceValue) return "Không rõ";
          const source = CUSTOMER_SOURCES.find((s) => s.value === sourceValue);
          return source?.label || sourceValue;
        },
      },
      {
        title: "Sale tư vấn",
        key: "consultingSale",
        width: 140,
        render: (_, record) => record.consultingSale?.fullName || "-",
      },
      {
        title: "Bác sĩ tư vấn",
        key: "consultingDoctor",
        width: 140,
        render: (_, record) => record.consultingDoctor?.fullName || "-",
      },
      {
        title: "Giá trị",
        dataIndex: "finalPrice",
        key: "finalPrice",
        width: 130,
        align: "right",
        render: (value) => (
          <span style={{ fontWeight: "bold", color: "#1890ff" }}>
            {value.toLocaleString()} ₫
          </span>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "serviceStatus",
        key: "serviceStatus",
        width: 110,
        render: (value) => (
          <Tag color={value === "Đã chốt" ? "success" : "default"}>{value}</Tag>
        ),
      },
    ];
  }, []);

  const tabLabels = {
    daily: "ngày",
    source: "nguồn",
    service: "dịch vụ",
    sale: "sale",
    doctor: "bác sĩ",
  };

  // Show empty state when no data selected
  const showEmptyState = !activeTab || !selectedRowLabel;

  return (
    <Card
      variant="borderless"
      title={
        <Space>
          <Text strong>
            {showEmptyState
              ? "Chi tiết dịch vụ"
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
      {!showEmptyState && (
        <div style={{ marginBottom: 16 }}>
          <Space size="large">
            <Text>
              <Text type="secondary">Tổng số:</Text>{" "}
              <Text strong>{data?.totalRecords || 0}</Text> dịch vụ
            </Text>
            <Text>
              <Text type="secondary">Tổng doanh số:</Text>{" "}
              <Text strong style={{ color: "#1890ff" }}>
                {(data?.totalRevenue || 0).toLocaleString()} ₫
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
        scroll={{ x: 1200 }}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} dịch vụ`,
          pageSizeOptions: [10, 20, 50, 100],
        }}
        size="small"
        bordered
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Space direction="vertical" size="small">
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Chưa có dữ liệu. Vui lòng chọn một dòng trong bảng tổng hợp
                    bên trên để xem chi tiết
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
