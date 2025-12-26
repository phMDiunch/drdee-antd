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
  Button,
} from "antd";
import {
  UserOutlined,
  IdcardOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { useCustomerDetail, WalkInModal } from "@/features/customers";
import { useConsultedServicesByCustomer } from "@/features/consulted-services";
import { usePaymentVouchers } from "@/features/payments";
import { useLaboOrdersByCustomer } from "@/features/labo-orders";
import CustomerInfoTab from "../components/detail-tabs/CustomerInfoTab";
import AppointmentsTab from "../components/detail-tabs/AppointmentsTab";
import ConsultedServicesTab from "../components/detail-tabs/ConsultedServicesTab";
import TreatmentLogsTab from "../components/detail-tabs/TreatmentLogsTab";
import TreatmentCareTab from "../components/detail-tabs/TreatmentCareTab";
import LaboOrdersTab from "../components/detail-tabs/LaboOrdersTab";
import SalesActivitiesTab from "../components/detail-tabs/SalesActivitiesTab";
import PaymentsTab from "../components/detail-tabs/PaymentsTab";
import FinancialSummaryCard from "../components/FinancialSummaryCard";
import ConvertLeadModal from "../components/ConvertLeadModal";
import { useConvertLead } from "@/features/leads/hooks/useLeadMutations";
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
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);

  const convertLeadMutation = useConvertLead();

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

  // Fetch labo orders for count
  const { data: laboOrdersData } = useLaboOrdersByCustomer(customerId);
  const laboOrdersCount = laboOrdersData?.items?.length || 0;

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

  // Calculate today's appointment (memoized)
  const todayAppointment = useMemo(() => {
    if (!customer?.appointments) return null;

    const today = dayjs().format("YYYY-MM-DD");
    return customer.appointments.find((apt) => {
      const aptDate = dayjs(apt.appointmentDateTime).format("YYYY-MM-DD");
      return aptDate === today;
    });
  }, [customer?.appointments]);

  // Calculate today's check-in info for ConsultedServicesTab (memoized)
  const todayCheckIn = useMemo(() => {
    if (!todayAppointment?.checkInTime) return null;

    return {
      appointmentId: todayAppointment.id,
      checkInTime: todayAppointment.checkInTime,
    };
  }, [todayAppointment]);

  // Calculate today's check-in status for display (memoized)
  const renderCheckInStatus = useMemo(() => {
    // Không có lịch hôm nay → Button Walk-in
    if (!todayAppointment) {
      return (
        <Button
          type="primary"
          size="small"
          icon={<CheckCircleOutlined />}
          onClick={() => setIsWalkInModalOpen(true)}
        >
          Check-in Walk-in
        </Button>
      );
    }

    // Đã check-in
    if (todayAppointment.checkInTime) {
      return (
        <>
          <CheckCircleOutlined />
          <Text type="success">
            Đã check-in lúc{" "}
            {dayjs(todayAppointment.checkInTime).format("HH:mm")}
          </Text>
        </>
      );
    }

    // Có lịch, chưa check-in
    return (
      <>
        <ClockCircleOutlined />
        <Text type="warning">Chưa check-in</Text>
      </>
    );
  }, [todayAppointment]);

  // Filter consulted services for Sales Activities Tab (memoized)
  const consultedServicesForFollowUp = useMemo(() => {
    if (!consultedServicesData?.items) return [];

    return consultedServicesData.items
      .filter(
        (cs) =>
          cs.dentalService?.requiresFollowUp === true &&
          cs.serviceStatus !== "Đã chốt"
      )
      .map((cs) => ({
        id: cs.id,
        consultedServiceName: cs.consultedServiceName,
        consultationDate: cs.consultationDate,
        toothPositions: cs.toothPositions,
        serviceStatus: cs.serviceStatus,
        stage: cs.stage,
      }));
  }, [consultedServicesData?.items]);

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
                {customer.type === "LEAD" && (
                  <>
                    <Tag color="orange">LEAD</Tag>
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => setIsConvertModalOpen(true)}
                    >
                      Chuyển thành Khách hàng
                    </Button>
                  </>
                )}
              </Space>

              <Space>
                <IdcardOutlined />
                <Text>Mã KH: {customer.customerCode || "—"}</Text>
                {customer.clinic && (
                  <Tag
                    icon={<BankOutlined />}
                    color={customer.clinic.colorCode}
                  >
                    {customer.clinic.shortName}
                  </Tag>
                )}
              </Space>

              <Space>
                <PhoneOutlined />
                <Text>{customer.phone || "—"}</Text>
              </Space>

              {/* Quick Check-in */}
              <Space>{renderCheckInStatus}</Space>
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
              key: "salesActivities",
              label: "Sale follow up",
              children: (
                <SalesActivitiesTab
                  customerId={customer.id}
                  customerName={customer.fullName}
                  consultedServices={consultedServicesForFollowUp}
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
              label: `Đơn hàng labo (${laboOrdersCount})`,
              children: (
                <LaboOrdersTab
                  customerId={customerId}
                  customerCode={customer.customerCode ?? ""}
                  customerName={customer.fullName}
                  clinicId={customer.clinicId ?? ""}
                  onDataChange={refetch}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* Convert Lead Modal */}
      {customer.type === "LEAD" && (
        <ConvertLeadModal
          open={isConvertModalOpen}
          onCancel={() => setIsConvertModalOpen(false)}
          onSubmit={async (data, leadId) => {
            await convertLeadMutation.mutateAsync({ id: leadId, data });
            setIsConvertModalOpen(false);
            refetch();
          }}
          lead={{
            id: customer.id,
            phone: customer.phone,
            fullName: customer.fullName,
            city: customer.city || null,
            source: customer.source || null,
            sourceEmployee: customer.sourceEmployee,
            sourceCustomer: customer.sourceCustomer,
            serviceOfInterest: customer.serviceOfInterest || null,
            sourceNotes: customer.sourceNotes || null,
          }}
        />
      )}

      {/* Walk-in Modal */}
      <WalkInModal
        open={isWalkInModalOpen}
        customer={{
          ...customer,
          clinicId: customer.clinicId || "",
          todayAppointment: null,
        }}
        date={dayjs().format("YYYY-MM-DD")}
        onClose={() => {
          setIsWalkInModalOpen(false);
          refetch();
        }}
      />
    </Space>
  );
}
