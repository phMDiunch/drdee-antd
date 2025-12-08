// src/features/customers/views/CustomerDetailView.tsx
"use client";

import { useState, useMemo } from "react";
import {
  Row,
  Col,
  Card,
  Tabs,
  Empty,
  Space,
  Typography,
  Spin,
  Tag,
} from "antd";
import {
  UserOutlined,
  IdcardOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { useCustomerDetail } from "@/features/customers";
import { useConsultedServicesByCustomer } from "@/features/consulted-services";
import { usePaymentVouchers } from "@/features/payments";
import CustomerInfoTab from "../components/detail-tabs/CustomerInfoTab";
import AppointmentsTab from "../components/detail-tabs/AppointmentsTab";
import ConsultedServicesTab from "../components/detail-tabs/ConsultedServicesTab";
import TreatmentLogsTab from "../components/detail-tabs/TreatmentLogsTab";
import TreatmentCareTab from "../components/detail-tabs/TreatmentCareTab";
import LaboOrdersTab from "../components/detail-tabs/LaboOrdersTab";
import PaymentsTab from "../components/detail-tabs/PaymentsTab";
import FinancialSummaryCard from "../components/FinancialSummaryCard";
import dayjs from "dayjs";

const { Text } = Typography;

interface CustomerDetailViewProps {
  customerId: string;
}

/**
 * Customer Detail View - Main page component
 * Phase 1: Summary Cards + Tab system with CustomerInfoTab
 * Phase 2+: Populate other tabs when modules are ready
 */
export default function CustomerDetailView({
  customerId,
}: CustomerDetailViewProps) {
  const [activeTab, setActiveTab] = useState<string>("info");

  const {
    data: customer,
    isLoading,
    error,
    refetch,
  } = useCustomerDetail(customerId);

  // Fetch consulted services for count and financial summary
  const { data: consultedServicesData, isLoading: isLoadingConsultedServices } =
    useConsultedServicesByCustomer(customerId);
  const consultedServicesCount = consultedServicesData?.items?.length || 0;

  // Fetch payment vouchers for count
  const { data: paymentVouchersData } = usePaymentVouchers({
    customerId,
    page: 1,
    pageSize: 100, // Load all for count
    sortField: "paymentDate",
    sortDirection: "desc",
  });
  const paymentVouchersCount = paymentVouchersData?.items?.length || 0;

  // Calculate age from dob
  const getAge = (dob: string | null) => {
    if (!dob) return null;
    return dayjs().diff(dayjs(dob), "year");
  };

  // Check if customer has birthday today
  const isBirthdayToday = (dob: string | null) => {
    if (!dob) return false;
    const today = dayjs();
    const birthDate = dayjs(dob);
    return (
      today.month() === birthDate.month() && today.date() === birthDate.date()
    );
  };

  // Calculate today's check-in info (memoized)
  const todayCheckIn = useMemo(() => {
    if (!customer?.appointments) return null;

    const today = dayjs().format("YYYY-MM-DD");
    const todayAppointment = customer.appointments.find((apt) => {
      const aptDate = dayjs(apt.appointmentDateTime).format("YYYY-MM-DD");
      return aptDate === today;
    });

    if (!todayAppointment?.checkInTime) return null;

    return {
      appointmentId: todayAppointment.id,
      checkInTime: todayAppointment.checkInTime,
    };
  }, [customer?.appointments]);

  // Calculate today's check-in status for display (memoized)
  const checkInStatus = useMemo(() => {
    if (!customer?.appointments) {
      return {
        icon: <ClockCircleOutlined />,
        text: "Không có lịch hôm nay",
      };
    }

    const today = dayjs().format("YYYY-MM-DD");
    const todayAppointment = customer.appointments.find((apt) => {
      const aptDate = dayjs(apt.appointmentDateTime).format("YYYY-MM-DD");
      return aptDate === today;
    });

    if (!todayAppointment) {
      return {
        icon: <ClockCircleOutlined />,
        text: "Không có lịch hôm nay",
      };
    }

    if (todayAppointment.checkInTime) {
      return {
        icon: <CheckCircleOutlined />,
        text: `Đã check-in lúc ${dayjs(todayAppointment.checkInTime).format(
          "HH:mm"
        )}`,
        type: "success" as const,
      };
    }

    return {
      icon: <ClockCircleOutlined />,
      text: "Chưa check-in",
      type: "warning" as const,
    };
  }, [customer?.appointments]);

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <Spin size="large">
          <div style={{ paddingTop: 50 }}>Đang tải thông tin khách hàng...</div>
        </Spin>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "50px 0" }}>
        <Empty
          description={
            <Text type="danger">
              {error instanceof Error
                ? error.message
                : "Không thể tải thông tin khách hàng"}
            </Text>
          }
        />
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={{ textAlign: "center", padding: "50px 0" }}>
        <Empty description="Không tìm thấy khách hàng" />
      </div>
    );
  }

  const age = getAge(customer.dob);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Summary Cards */}
      <Row gutter={16}>
        {/* Card 1: Customer Basic Info */}
        <Col xs={24} md={12}>
          <Card>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Space>
                <UserOutlined style={{ fontSize: "20px" }} />
                <Text strong style={{ fontSize: "18px" }}>
                  {customer.fullName}
                  {age !== null && <Text type="secondary"> ({age} tuổi)</Text>}
                  {isBirthdayToday(customer.dob) && (
                    <span style={{ marginLeft: 8, fontSize: "20px" }}>🎂</span>
                  )}
                </Text>
              </Space>

              <Space>
                <IdcardOutlined />
                <Text>Mã KH: {customer.customerCode || "—"}</Text>
                {customer.clinic && (
                  <Tag
                    icon={<BankOutlined />}
                    color={customer.clinic.colorCode}
                  >
                    {customer.clinic.clinicCode}
                  </Tag>
                )}
              </Space>

              <Space>
                <PhoneOutlined />
                <Text>{customer.phone || "—"}</Text>
              </Space>

              {/* Check-in status */}
              <Space>
                {checkInStatus.icon}
                <Text type={checkInStatus.type}>{checkInStatus.text}</Text>
              </Space>
            </Space>
          </Card>
        </Col>

        {/* Card 2: Financial Summary */}
        <Col xs={24} md={12}>
          <FinancialSummaryCard
            consultedServices={consultedServicesData?.items}
            loading={isLoadingConsultedServices}
          />
        </Col>
      </Row>

      {/* Tabs */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "info",
              label: "Thông tin chung",
              children: (
                <CustomerInfoTab
                  customer={customer}
                  onEditSuccess={() => refetch()}
                />
              ),
            },
            {
              key: "appointments",
              label: `Lịch hẹn (${customer.appointments?.length || 0})`,
              children: (
                <AppointmentsTab
                  customerId={customer.id}
                  customerName={customer.fullName}
                  customerCode={customer.customerCode}
                  customerPhone={customer.phone}
                  clinicId={customer.clinicId || ""} // Fallback empty string (shouldn't happen)
                  onAppointmentChange={() => refetch()}
                />
              ),
            },
            {
              key: "consultedServices",
              label: `Dịch vụ tư vấn (${consultedServicesCount})`,
              children: (
                <ConsultedServicesTab
                  customerId={customer.id}
                  customerCode={customer.customerCode || ""}
                  customerName={customer.fullName}
                  clinicId={customer.clinicId || ""}
                  todayCheckIn={todayCheckIn}
                  onDataChange={() => refetch()}
                />
              ),
            },
            {
              key: "payments",
              label: `Phiếu thu (${paymentVouchersCount})`,
              children: (
                <PaymentsTab
                  customerId={customerId}
                  customerCode={customer.customerCode || ""}
                  customerName={customer.fullName}
                  clinicId={customer.clinicId || ""}
                  onDataChange={() => refetch()}
                />
              ),
            },
            {
              key: "treatmentLogs",
              label: "Lịch sử điều trị",
              children: <TreatmentLogsTab customerId={customer.id} />,
            },
            {
              key: "treatmentCare",
              label: "Chăm sóc sau điều trị",
              children: <TreatmentCareTab />,
            },
            {
              key: "laboOrders",
              label: "Đơn hàng labo",
              children: <LaboOrdersTab />,
            },
          ]}
        />
      </Card>
    </Space>
  );
}
