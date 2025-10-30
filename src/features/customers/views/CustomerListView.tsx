"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Input,
  Select,
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Tag,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { ColumnsType, TableProps } from "antd/es/table";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import dayjs from "dayjs";
import Link from "next/link";

import type {
  CustomerResponse,
  CreateCustomerRequest,
} from "@/shared/validation/customer.schema";
import { CUSTOMER_SOURCES, SERVICES_OF_INTEREST } from "../constants";
import { useCustomers, useCreateCustomer } from "@/features/customers";
import CustomerFormModal from "../components/CustomerFormModal";
import { useNotify } from "@/shared/hooks/useNotify";
import ClinicTabs from "@/shared/components/ClinicTabs";
import { useCurrentUser } from "@/shared/providers/user-provider";

const { Search } = Input;
const { Title } = Typography;

function CustomerListContent() {
  const { user: currentUser } = useCurrentUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const notify = useNotify();

  // Parse URL params
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);
  const sortBy = searchParams.get("sortBy") ?? "createdAt";
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") ?? "desc";

  // State
  const [selectedClinicId, setSelectedClinicId] = useState<string | undefined>(
    searchParams.get("clinicId") ?? undefined
  );
  const [searchValue, setSearchValue] = useState(
    searchParams.get("search") ?? ""
  );
  const [debouncedSearch, setDebouncedSearch] = useState(
    searchParams.get("search") ?? ""
  );
  const [sourceFilter, setSourceFilter] = useState(
    searchParams.get("source") ?? ""
  );
  const [serviceFilter, setServiceFilter] = useState(
    searchParams.get("serviceOfInterest") ?? ""
  );
  const [openCreate, setOpenCreate] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchValue]);

  // API call
  const { data, isLoading, refetch } = useCustomers({
    page,
    pageSize,
    sort: `${sortBy}:${sortOrder}`,
    search: debouncedSearch || undefined,
    source: sourceFilter || undefined,
    serviceOfInterest: serviceFilter || undefined,
    clinicId: selectedClinicId || currentUser?.clinicId || undefined,
  });

  const createMutation = useCreateCustomer();

  // Update URL function
  const updateURL = (params: Record<string, string | undefined>) => {
    const urlParams = new URLSearchParams();

    Object.entries({
      page: page.toString(),
      pageSize: pageSize.toString(),
      sortBy,
      sortOrder,
      search: debouncedSearch,
      source: sourceFilter,
      serviceOfInterest: serviceFilter,
      clinicId: selectedClinicId,
      ...params,
    }).forEach(([key, value]) => {
      if (value && value !== "" && (key !== "page" || value !== "1")) {
        urlParams.set(key, value);
      }
    });

    router.push(`?${urlParams.toString()}`, { scroll: false });
  };

  // Table columns
  const columns: ColumnsType<CustomerResponse> = [
    {
      title: "Mã KH",
      dataIndex: "customerCode",
      key: "customerCode",
      width: 140,
      sorter: true,
    },
    {
      title: "Họ tên",
      dataIndex: "fullName",
      key: "fullName",
      sorter: true,
      render: (fullName, record) => (
        <Link href={`/customers/${record.id}`}>{fullName}</Link>
      ),
    },
    {
      title: "SĐT",
      dataIndex: "phone",
      key: "phone",
      width: 140,
      render: (phone) => phone || "—",
    },
    {
      title: "Người liên hệ chính",
      key: "primaryContact",
      render: (_, record) => {
        const contact = record.primaryContact;
        if (!contact?.fullName && !contact?.phone) return "—";
        return `${contact.fullName ?? ""}${
          contact.fullName && contact.phone ? " — " : ""
        }${contact.phone ?? ""}`;
      },
    },
    {
      title: "Dịch vụ quan tâm",
      dataIndex: "serviceOfInterest",
      key: "serviceOfInterest",
      width: 160,
      render: (value) => {
        const service = SERVICES_OF_INTEREST.find((s) => s.value === value);
        return <Tag color="blue">{service?.label ?? value}</Tag>;
      },
    },
    {
      title: "Nguồn khách",
      dataIndex: "source",
      key: "source",
      width: 160,
      sorter: true,
      render: (value) => {
        const source = CUSTOMER_SOURCES.find((s) => s.value === value);
        return <Tag>{source?.label ?? value}</Tag>;
      },
    },
    {
      title: "Thời gian tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      sorter: true,
      render: (value) => dayjs(value).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      render: () => (
        <Button type="link" size="small">
          Xem chi tiết
        </Button>
      ),
    },
  ];

  const handleTableChange: TableProps<CustomerResponse>["onChange"] = (
    pagination,
    _filters,
    sorter
  ) => {
    const newPage = pagination?.current ?? 1;
    const newPageSize = pagination?.pageSize ?? 20;

    let newSortBy = "createdAt";
    let newSortOrder: "asc" | "desc" = "desc";

    if (Array.isArray(sorter)) {
      const firstSorter = sorter[0];
      if (firstSorter?.field && firstSorter?.order) {
        newSortBy = firstSorter.field as string;
        newSortOrder = firstSorter.order === "ascend" ? "asc" : "desc";
      }
    } else if (sorter?.field && sorter?.order) {
      newSortBy = sorter.field as string;
      newSortOrder = sorter.order === "ascend" ? "asc" : "desc";
    }

    updateURL({
      page: newPage.toString(),
      pageSize: newPageSize.toString(),
      sortBy: newSortBy,
      sortOrder: newSortOrder,
    });
  };

  const handleCreateSuccess = async (payload: CreateCustomerRequest) => {
    try {
      await createMutation.mutateAsync(payload);
      notify.success("Tạo khách hàng thành công");
      setOpenCreate(false);
      refetch();
    } catch (error: unknown) {
      notify.error(error, { fallback: "Không thể tạo khách hàng" });
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4}>Danh sách khách hàng</Title>
      </div>

      {/* Clinic Tabs for Admin */}
      {currentUser?.role === "admin" && (
        <div style={{ marginBottom: 16 }}>
          <ClinicTabs
            value={selectedClinicId}
            onChange={(id: string | undefined) => {
              setSelectedClinicId(id);
              updateURL({ clinicId: id ?? "", page: "1" });
            }}
          />
        </div>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Search
              placeholder="Tìm theo tên, mã KH, SĐT, email..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={(value) => setDebouncedSearch(value)}
              enterButton
              allowClear
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              placeholder="Nguồn khách"
              value={sourceFilter || undefined}
              onChange={(value) => {
                setSourceFilter(value ?? "");
                updateURL({ source: value ?? "", page: "1" });
              }}
              allowClear
              style={{ width: "100%" }}
              options={[
                { label: "Tất cả", value: "" },
                ...CUSTOMER_SOURCES.map((s) => ({
                  label: s.label,
                  value: s.value,
                })),
              ]}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              placeholder="Dịch vụ quan tâm"
              value={serviceFilter || undefined}
              onChange={(value) => {
                setServiceFilter(value ?? "");
                updateURL({ serviceOfInterest: value ?? "", page: "1" });
              }}
              allowClear
              style={{ width: "100%" }}
              options={[
                { label: "Tất cả", value: "" },
                ...SERVICES_OF_INTEREST.map((s) => ({
                  label: s.label,
                  value: s.value,
                })),
              ]}
            />
          </Col>
          <Col xs={24} md={8}>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setOpenCreate(true)}
              >
                Thêm khách hàng
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics */}
      <Card style={{ marginBottom: 16 }}>
        <Typography.Text strong>
          Tổng cộng: {data?.count ?? 0} khách hàng
        </Typography.Text>
      </Card>

      {/* Table */}
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data?.items ?? []}
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: data?.count ?? 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} khách hàng`,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Create Modal */}
      <CustomerFormModal
        open={openCreate}
        onCancel={() => setOpenCreate(false)}
        selectedClinicId={
          selectedClinicId || currentUser?.clinicId || undefined
        }
        onSubmit={handleCreateSuccess}
        confirmLoading={createMutation.isPending}
      />
    </div>
  );
}

export default function CustomerListView() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CustomerListContent />
    </Suspense>
  );
}
