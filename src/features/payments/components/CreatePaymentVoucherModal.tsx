// src/features/payments/components/CreatePaymentVoucherModal.tsx
"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Modal,
  Form,
  Select,
  InputNumber,
  Row,
  Col,
  Input,
  Typography,
  Alert,
  Table,
  Spin,
} from "antd";
import dayjs from "dayjs";
import { DollarOutlined } from "@ant-design/icons";
import { formatCurrency } from "@/shared/utils/date";
import { useCurrentUser } from "@/shared/providers";
import { useCustomersSearch } from "@/features/customers";
import { useUnpaidServices } from "@/features/payments";
import { PAYMENT_METHODS } from "../constants";
import type { CreatePaymentVoucherRequest } from "@/shared/validation/payment-voucher.schema";

const { TextArea } = Input;
const { Title, Text } = Typography;

interface UnpaidService {
  id: string;
  consultedServiceName: string;
  debt: number;
  finalPrice: number;
  totalPaid?: number;
  amountPaid?: number;
  serviceStatus?: string;
}

interface SelectedService {
  consultedServiceId: string;
  serviceName: string;
  remainingDebt?: number;
  finalPrice?: number;
  amount: number;
  paymentMethod: string;
}

type Props = {
  open: boolean;
  confirmLoading?: boolean;
  customerId?: string;
  currentCustomer?: { id: string; fullName: string; phone: string };
  onCancel: () => void;
  onSubmit: (payload: CreatePaymentVoucherRequest) => void;
};

export default function CreatePaymentVoucherModal({
  open,
  confirmLoading,
  customerId,
  currentCustomer,
  onCancel,
  onSubmit,
}: Props) {
  const [form] = Form.useForm();
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>(
    []
  );
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const { user: currentUser } = useCurrentUser();

  // Search customers with debounced query
  const { data: customers = [], isFetching: customersFetching } =
    useCustomersSearch({ q: customerSearchQuery });

  // Unpaid services for selected customer
  const selectedCustomerId = Form.useWatch("customerId", form);
  const { data: unpaidData, isLoading: unpaidLoading } =
    useUnpaidServices(selectedCustomerId);

  const unpaidServices = useMemo(() => unpaidData?.items || [], [unpaidData]);

  // SAFE MAPPING với fallback - combine customers từ search và currentCustomer
  const allCustomers = useMemo(() => {
    const searchCustomers = customers || [];
    const customersToAdd = [];

    // Add currentCustomer if not exists
    if (
      currentCustomer &&
      !searchCustomers.find((c) => c.id === currentCustomer.id)
    ) {
      customersToAdd.push(currentCustomer);
    }

    return [...customersToAdd, ...searchCustomers];
  }, [customers, currentCustomer]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      form.resetFields();
      setSelectedServices([]);
      setCustomerSearchQuery("");

      // Set initial values immediately (only once when modal opens)
      const initialValues: { paymentDate: dayjs.Dayjs; customerId?: string } = {
        paymentDate: dayjs(),
      };

      // Auto-set customer if provided
      if (customerId) {
        initialValues.customerId = customerId;
      }

      form.setFieldsValue(initialValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]); // Only depend on 'open' to run once when modal opens

  // Handler to remove unpaid service from selection
  const handleRemoveUnpaidService = useCallback((serviceId: string) => {
    setSelectedServices((prev) =>
      prev.filter((service) => service.consultedServiceId !== serviceId)
    );
  }, []);

  // Handlers for table-based form
  const handleServiceToggle = useCallback(
    (service: UnpaidService, checked: boolean) => {
      if (checked) {
        // Add service to selection with default values
        const newService = {
          consultedServiceId: service.id,
          serviceName: service.consultedServiceName,
          remainingDebt: service.debt,
          amount: service.debt, // Default to full debt amount
          paymentMethod: PAYMENT_METHODS[0].value,
        };

        setSelectedServices((prev) => [...prev, newService]);

        // Set initial form value for amount field
        form.setFields([
          {
            name: `amount_${service.id}`,
            value: service.debt,
          },
        ]);
      } else {
        // Remove service from selection
        handleRemoveUnpaidService(service.id);

        // Clear form value
        form.setFields([
          {
            name: `amount_${service.id}`,
            value: undefined,
          },
        ]);
      }
    },
    [form, handleRemoveUnpaidService]
  );

  const handlePaymentMethodChange = useCallback(
    (serviceId: string, paymentMethod: string) => {
      setSelectedServices((prev) =>
        prev.map((service) =>
          service.consultedServiceId === serviceId
            ? { ...service, paymentMethod }
            : service
        )
      );
    },
    []
  );

  // Watch all form values for reactive totalAmount calculation
  const formValues = Form.useWatch([], form);
  const totalAmount = useMemo(() => {
    return selectedServices.reduce((sum, service) => {
      const amount = formValues?.[
        `amount_${service.consultedServiceId}`
      ] as number;
      return sum + (amount || 0);
    }, 0);
  }, [formValues, selectedServices]);

  const handleFinish = (values: Record<string, unknown>) => {
    // Validate that we have selected services
    if (selectedServices.length === 0) {
      return;
    }

    // Filter chỉ lấy các field hợp lệ, loại bỏ amount_${serviceId}
    const validFields = Object.keys(values).filter(
      (key) => !key.startsWith("amount_")
    );
    const cleanValues = validFields.reduce((obj, key) => {
      let value = values[key];

      // Convert dayjs objects to ISO strings for server compatibility
      if (key === "paymentDate" && value) {
        const dayjsValue = dayjs(value as string | Date);
        if (dayjsValue.isValid()) {
          value = dayjsValue.toISOString();
        }
      }

      obj[key] = value;
      return obj;
    }, {} as Record<string, unknown>);

    const payload: CreatePaymentVoucherRequest = {
      customerId: cleanValues.customerId as string,
      notes: (cleanValues.notes as string) || null,
      details: selectedServices.map((service) => ({
        consultedServiceId: service.consultedServiceId,
        amount: service.amount,
        paymentMethod: service.paymentMethod as
          | "Tiền mặt"
          | "Quẹt thẻ thường"
          | "Quẹt thẻ Visa"
          | "Chuyển khoản",
      })),
    };

    onSubmit(payload);
  };

  const customerOptions = allCustomers.map((customer) => ({
    value: customer.id,
    label: `${customer.fullName} - ${customer.phone}`,
  }));

  return (
    <Modal
      title="Tạo phiếu thu mới"
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={confirmLoading}
      okText="Tạo phiếu thu"
      cancelText="Hủy"
      width="65%"
      styles={{
        body: { maxHeight: "70vh", overflowY: "auto", paddingInline: 16 },
      }}
      destroyOnHidden
      maskClosable={false}
      okButtonProps={{
        disabled: selectedServices.length === 0 || totalAmount <= 0,
      }}
    >
      {/* Header - Compact Info */}
      <Alert
        message={`Thu ngân: ${
          currentUser?.fullName || "N/A"
        } | ${new Date().toLocaleDateString("vi-VN")}`}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Main Form */}
      <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark>
        {/* Hidden paymentDate field - auto set to current time via useEffect */}
        <Form.Item name="paymentDate" hidden>
          <Input />
        </Form.Item>

        {/* Customer Selection */}
        <Form.Item
          name="customerId"
          label="Khách hàng"
          required
          rules={[{ required: true, message: "Vui lòng chọn khách hàng" }]}
        >
          <Select
            placeholder="Chọn khách hàng"
            showSearch
            loading={customersFetching}
            onSearch={setCustomerSearchQuery}
            filterOption={false}
            options={customerOptions}
            disabled={!!customerId}
            onChange={(value) => {
              if (value) {
                // Clear selected services when customer changes
                setSelectedServices([]);
              }
            }}
          />
        </Form.Item>

        {/* Unpaid Services - Table Format with Form Controls */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text strong>Dịch vụ cần thu tiền</Text>
            <Text type="secondary">
              {unpaidServices.length > 0
                ? `${unpaidServices.length} dịch vụ còn nợ`
                : "Không có dịch vụ nào còn nợ"}
            </Text>
          </div>

          {unpaidLoading ? (
            <div
              style={{ textAlign: "center", padding: "20px", color: "#999" }}
            >
              <Spin /> Đang tải dịch vụ...
            </div>
          ) : unpaidServices.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "20px",
                color: "#999",
                backgroundColor: "#fafafa",
                borderRadius: "8px",
              }}
            >
              Khách hàng này không có dịch vụ nào còn nợ
            </div>
          ) : (
            <Table
              size="small"
              dataSource={unpaidServices}
              rowKey="id"
              pagination={false}
              bordered
              scroll={{ x: true }}
              columns={[
                {
                  title: "Chọn",
                  dataIndex: "selected",
                  width: 60,
                  align: "center" as const,
                  render: (_, service: UnpaidService) => {
                    const isSelected = selectedServices.some(
                      (s) => s.consultedServiceId === service.id
                    );
                    return (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) =>
                          handleServiceToggle(service, e.target.checked)
                        }
                        style={{ transform: "scale(1.2)" }}
                      />
                    );
                  },
                },
                {
                  title: "Dịch vụ",
                  dataIndex: "consultedServiceName",
                  ellipsis: true,
                  render: (name: string, service: UnpaidService) => (
                    <div>
                      <div style={{ fontWeight: 500 }}>{name}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Tổng: {formatCurrency(service.finalPrice)} • Đã thu:{" "}
                        {formatCurrency(
                          service.totalPaid || service.amountPaid || 0
                        )}
                      </Text>
                    </div>
                  ),
                },
                {
                  title: "Còn nợ",
                  dataIndex: "debt",
                  width: 120,
                  align: "right" as const,
                  render: (amount: number) => (
                    <Text type="danger" strong style={{ fontSize: 14 }}>
                      {formatCurrency(amount)}
                    </Text>
                  ),
                },
                {
                  title: "Số tiền thu",
                  dataIndex: "amount",
                  width: 140,
                  render: (_, service: UnpaidService) => {
                    const isSelected = selectedServices.some(
                      (s) => s.consultedServiceId === service.id
                    );

                    return (
                      <Form.Item
                        name={`amount_${service.id}`}
                        style={{ margin: 0 }}
                        rules={
                          isSelected
                            ? [
                                {
                                  required: true,
                                  message: "Vui lòng nhập số tiền",
                                },
                                {
                                  type: "number",
                                  min: 1,
                                  message: "Số tiền phải lớn hơn 0",
                                },
                                {
                                  type: "number",
                                  max: service.debt,
                                  message: `Số tiền không được vượt quá ${formatCurrency(
                                    service.debt
                                  )}`,
                                },
                              ]
                            : []
                        }
                      >
                        <InputNumber
                          min={1}
                          max={service.debt}
                          style={{ width: "100%" }}
                          placeholder="Nhập số tiền"
                          disabled={!isSelected}
                          formatter={(value) =>
                            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                          }
                          parser={(value) =>
                            Number(value!.replace(/\$\s?|(,*)/g, ""))
                          }
                        />
                      </Form.Item>
                    );
                  },
                },
                {
                  title: "Phương thức",
                  dataIndex: "paymentMethod",
                  width: 140,
                  render: (_, service: UnpaidService) => {
                    const selectedService = selectedServices.find(
                      (s) => s.consultedServiceId === service.id
                    );
                    return (
                      <Select
                        value={
                          selectedService?.paymentMethod ||
                          PAYMENT_METHODS[0].value
                        }
                        style={{ width: "100%" }}
                        disabled={
                          !selectedServices.some(
                            (s) => s.consultedServiceId === service.id
                          )
                        }
                        onChange={(value) =>
                          handlePaymentMethodChange(service.id, value)
                        }
                        options={PAYMENT_METHODS.map((method) => ({
                          label: method.label,
                          value: method.value,
                        }))}
                      />
                    );
                  },
                },
              ]}
            />
          )}
        </div>

        {/* Total & Notes */}
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item label="Ghi chú" name="notes">
              <TextArea rows={2} placeholder="Ghi chú (không bắt buộc)..." />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Tổng cộng">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  backgroundColor: "#f0f9ff",
                  padding: "16px 8px",
                  borderRadius: "8px",
                  border: "1px solid #d9d9d9",
                }}
              >
                <DollarOutlined style={{ fontSize: 24, color: "#1890ff" }} />
                <Title level={3} style={{ color: "#1890ff", margin: 0 }}>
                  {formatCurrency(totalAmount)}
                </Title>
              </div>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
