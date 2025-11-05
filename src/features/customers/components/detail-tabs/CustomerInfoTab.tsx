// src/features/customers/components/detail-tabs/CustomerInfoTab.tsx
"use client";

import { useState } from "react";
import { Space, Row, Typography, Button, Descriptions } from "antd";
import { EditOutlined } from "@ant-design/icons";
import CustomerFormModal from "../CustomerFormModal";
import { CUSTOMER_SOURCES, SERVICES_OF_INTEREST } from "../../constants";
import type {
  CustomerDetailResponse,
  CreateCustomerRequest,
} from "@/shared/validation/customer.schema";
import { useUpdateCustomer } from "@/features/customers";
import dayjs from "dayjs";
import vietnamData from "@/data/vietnamAdministrativeUnits.json";

const { Title } = Typography;

interface CustomerInfoTabProps {
  customer: CustomerDetailResponse;
  onEditSuccess: () => void;
}

/**
 * Customer Info Tab - Display and edit customer information
 * Phase 1: View customer info + Edit button (opens modal)
 */
export default function CustomerInfoTab({
  customer,
  onEditSuccess,
}: CustomerInfoTabProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Mutation hook for updating customer
  const updateCustomerMutation = useUpdateCustomer(customer.id);

  // Handler for edit success
  const handleEditSubmit = (payload: CreateCustomerRequest) => {
    updateCustomerMutation.mutate(payload, {
      onSuccess: () => {
        setEditModalOpen(false);
        onEditSuccess();
      },
    });
  };

  // Helper to get city label
  const getCityLabel = (cityCode: string | null) => {
    if (!cityCode) return "—";
    const city = vietnamData.find((c) => c.name === cityCode);
    return city?.name || cityCode;
  };

  // Helper to get district label
  const getDistrictLabel = (
    cityCode: string | null,
    districtCode: string | null
  ) => {
    if (!cityCode || !districtCode) return "—";
    const city = vietnamData.find((c) => c.name === cityCode);
    const district = city?.districts.find((d) => d.name === districtCode);
    return district?.name || districtCode;
  };

  // Helper to render source notes with populated relations
  const renderSourceNotes = () => {
    const sourceMeta = CUSTOMER_SOURCES.find(
      (s) => s.value === customer.source
    );

    if (!sourceMeta || sourceMeta.noteType === "none") {
      return "—";
    }

    // employee_referral: display sourceEmployee
    if (customer.source === "employee_referral" && customer.sourceEmployee) {
      return `${customer.sourceEmployee.fullName}${
        customer.sourceEmployee.phone
          ? ` — ${customer.sourceEmployee.phone}`
          : ""
      }`;
    }

    // customer_referral: display sourceCustomer
    if (customer.source === "customer_referral" && customer.sourceCustomer) {
      return `${customer.sourceCustomer.fullName}${
        customer.sourceCustomer.phone
          ? ` — ${customer.sourceCustomer.phone}`
          : ""
      } (${customer.sourceCustomer.customerCode || "—"})`;
    }

    // Text input types: display sourceNotes
    return customer.sourceNotes || "—";
  };

  // Helper to get service label
  const getServiceLabel = (value: string | null) => {
    if (!value) return "—";
    const service = SERVICES_OF_INTEREST.find((s) => s.value === value);
    return service?.label || value;
  };

  // Helper to get source label
  const getSourceLabel = (value: string | null) => {
    if (!value) return "—";
    const source = CUSTOMER_SOURCES.find((s) => s.value === value);
    return source?.label || value;
  };

  // Helper to format datetime
  const formatDateTime = (datetime: string) => {
    return dayjs(datetime).format("DD/MM/YYYY HH:mm");
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Title + Edit Button */}
      <Row justify="space-between" align="middle">
        <Title level={5} style={{ margin: 0 }}>
          Thông tin chi tiết
        </Title>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => setEditModalOpen(true)}
        >
          Sửa
        </Button>
      </Row>

      {/* Descriptions */}
      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="Mã khách hàng">
          {customer.customerCode || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Họ và tên">
          {customer.fullName}
        </Descriptions.Item>

        <Descriptions.Item label="Ngày sinh">
          {customer.dob ? dayjs(customer.dob).format("DD/MM/YYYY") : "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Giới tính">
          {customer.gender === "male"
            ? "Nam"
            : customer.gender === "female"
            ? "Nữ"
            : "—"}
        </Descriptions.Item>

        <Descriptions.Item label="Số điện thoại">
          {customer.phone || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Email">
          {customer.email || "—"}
        </Descriptions.Item>

        <Descriptions.Item label="Địa chỉ" span={2}>
          {customer.address || "—"}
        </Descriptions.Item>

        <Descriptions.Item label="Thành phố">
          {getCityLabel(customer.city)}
        </Descriptions.Item>
        <Descriptions.Item label="Quận/Huyện">
          {getDistrictLabel(customer.city, customer.district)}
        </Descriptions.Item>

        <Descriptions.Item label="Nghề nghiệp" span={2}>
          {customer.occupation || "—"}
        </Descriptions.Item>

        <Descriptions.Item label="Dịch vụ quan tâm" span={2}>
          {getServiceLabel(customer.serviceOfInterest)}
        </Descriptions.Item>

        <Descriptions.Item label="Nguồn khách">
          {getSourceLabel(customer.source)}
        </Descriptions.Item>
        <Descriptions.Item label="Ghi chú nguồn">
          {renderSourceNotes()}
        </Descriptions.Item>

        <Descriptions.Item label="Người liên hệ chính" span={2}>
          {customer.primaryContact
            ? `${customer.primaryContact.fullName} — ${
                customer.primaryContact.phone || "—"
              }`
            : "—"}
        </Descriptions.Item>

        <Descriptions.Item label="Phòng khám" span={2}>
          {customer.clinic?.name || "—"}
        </Descriptions.Item>

        {/* Metadata */}
        {customer.createdBy && (
          <Descriptions.Item label="Tạo bởi">
            {customer.createdBy.fullName}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Tạo lúc">
          {formatDateTime(customer.createdAt)}
        </Descriptions.Item>

        {customer.updatedBy && (
          <Descriptions.Item label="Cập nhật bởi">
            {customer.updatedBy.fullName}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Cập nhật lúc">
          {formatDateTime(customer.updatedAt)}
        </Descriptions.Item>
      </Descriptions>

      {/* Edit Modal */}
      <CustomerFormModal
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        confirmLoading={updateCustomerMutation.isPending}
        mode="edit"
        initialData={customer}
      />
    </Space>
  );
}
