// src/features/payments/components/UpdatePaymentVoucherModal.tsx
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
  Descriptions,
  DatePicker,
  Divider,
} from "antd";
import dayjs from "dayjs";
import { DollarOutlined } from "@ant-design/icons";
import { formatCurrency } from "@/shared/utils/date";
import { useCurrentUser } from "@/shared/providers";
import { useUnpaidServices } from "@/features/payments";
import { useWorkingEmployees } from "@/features/employees/hooks/useWorkingEmployees";
import { PAYMENT_METHODS } from "../constants";
import type {
  PaymentVoucherResponse,
  UpdatePaymentVoucherRequest,
} from "@/shared/validation/payment-voucher.schema";

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
  dentalService: {
    id: string;
    name: string;
    paymentAccountType: "COMPANY" | "PERSONAL";
  };
  // For edit mode - additional fields
  currentDebt?: number;
  previousAmount?: number;
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
  voucher: PaymentVoucherResponse;
  onCancel: () => void;
  onSubmit: (id: string, payload: UpdatePaymentVoucherRequest) => void;
};

export default function UpdatePaymentVoucherModal({
  open,
  confirmLoading,
  voucher,
  onCancel,
  onSubmit,
}: Props) {
  const [form] = Form.useForm();
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>(
    []
  );
  const { user: currentUser } = useCurrentUser();
  const { data: employees = [] } = useWorkingEmployees();

  // Unpaid services for this customer
  const { data: unpaidData, isLoading: unpaidLoading } = useUnpaidServices(
    voucher.customer.id
  );

  const unpaidServices = useMemo(() => unpaidData?.items || [], [unpaidData]);

  // Permission calculations
  const isAdmin = currentUser?.role === "admin";
  const isEditingTodayVoucher = dayjs(voucher.paymentDate).isSame(
    dayjs(),
    "day"
  );
  const canEditAmounts = isAdmin;
  const canOnlyEditNotesAndMethods = !isAdmin && isEditingTodayVoucher;

  // Reset and populate form when modal opens
  useEffect(() => {
    if (open && voucher) {
      form.resetFields();

      setTimeout(() => {
        form.setFieldsValue({
          customerId: voucher.customer.id,
          notes: voucher.notes,
          paymentDate: dayjs(voucher.paymentDate),
          cashierId: voucher.cashier?.id,
        });

        // Set selected services from existing details
        if (voucher.details && voucher.details.length > 0) {
          const services = voucher.details.map((detail) => {
            // Try to get service name from multiple possible sources
            let serviceName = "Unknown Service";

            if (detail.consultedServiceName) {
              serviceName = detail.consultedServiceName;
            }

            // Get finalPrice
            let finalPrice = 0;
            if (detail.consultedServiceFinalPrice) {
              finalPrice = detail.consultedServiceFinalPrice;
            }

            return {
              consultedServiceId: detail.consultedServiceId,
              serviceName,
              finalPrice,
              amount: detail.amount,
              paymentMethod: detail.paymentMethod || PAYMENT_METHODS[0].value,
            };
          });

          setSelectedServices(services);

          // Set form values for each service amount
          const formValues: Record<string, unknown> = {};
          voucher.details.forEach((detail) => {
            formValues[`amount_${detail.consultedServiceId}`] = detail.amount;
            formValues[`paymentMethod_${detail.consultedServiceId}`] =
              detail.paymentMethod || PAYMENT_METHODS[0].value;
          });

          form.setFieldsValue(formValues);
        }
      }, 200);
    }
  }, [open, voucher, form]);

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

  // Calculate total amount from form values
  const formValues = Form.useWatch([], form);
  const totalAmount = useMemo(() => {
    if (!formValues) return 0;

    return selectedServices.reduce((sum, service) => {
      const amount = formValues[
        `amount_${service.consultedServiceId}`
      ] as number;
      return sum + (amount || 0);
    }, 0);
  }, [formValues, selectedServices]);

  // Create dataSource for table based on edit mode logic
  const tableDataSource = useMemo(() => {
    return selectedServices.map((service) => {
      // Find the service in unpaid list to get current debt from DB
      const unpaidService = unpaidServices.find(
        (s) => s.id === service.consultedServiceId
      );

      // Calculate available debt = current debt + previous amount
      const currentDebt = unpaidService?.debt || 0;
      const previousAmount =
        voucher.details?.find(
          (d) => d.consultedServiceId === service.consultedServiceId
        )?.amount || 0;
      const availableDebt = currentDebt + previousAmount;

      // Calculate total paid = finalPrice - currentDebt (before adding back previousAmount)
      const totalPaid = service.finalPrice
        ? service.finalPrice - currentDebt
        : 0;

      return {
        id: service.consultedServiceId,
        consultedServiceName: service.serviceName,
        debt: availableDebt, // Use available debt for validation
        currentDebt, // Store for display
        previousAmount, // Store for display
        finalPrice: service.finalPrice || 0,
        totalPaid, // Calculated from finalPrice - currentDebt
        dentalService: unpaidService?.dentalService || {
          id: "",
          name: service.serviceName,
          paymentAccountType: "COMPANY" as const,
        },
      };
    });
  }, [selectedServices, unpaidServices, voucher.details]);

  const handleFinish = (values: Record<string, unknown>) => {
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

    // Filter cleanValues for non-admin users
    let finalCleanValues = cleanValues;
    if (!isAdmin) {
      const allowedVoucherFields = ["notes"];
      finalCleanValues = Object.keys(cleanValues).reduce((obj, key) => {
        if (allowedVoucherFields.includes(key)) {
          obj[key] = cleanValues[key];
        }
        return obj;
      }, {} as Record<string, unknown>);
    }

    const processedData: UpdatePaymentVoucherRequest = {
      notes: finalCleanValues.notes as string | null | undefined,
      ...(isAdmin && {
        cashierId: finalCleanValues.cashierId as string | undefined,
        paymentDate: finalCleanValues.paymentDate as string | undefined,
      }),
      details: selectedServices.map((service) => {
        const originalDetail = voucher.details?.find(
          (d) => d.consultedServiceId === service.consultedServiceId
        );

        // Get amount from form values instead of selectedServices state
        const formAmount = values[
          `amount_${service.consultedServiceId}`
        ] as number;

        // Fallback to original amount if form amount is not available
        const finalAmount =
          formAmount ?? originalDetail?.amount ?? service.amount;

        if (!isAdmin) {
          // Non-admin: only allow payment method changes
          return {
            id: originalDetail?.id,
            consultedServiceId: service.consultedServiceId,
            amount: originalDetail?.amount || finalAmount, // Keep original amount
            paymentMethod: service.paymentMethod as
              | "Tiền mặt"
              | "Quẹt thẻ thường"
              | "Quẹt thẻ Visa"
              | "Chuyển khoản",
          };
        } else {
          // Admin: allow all changes
          return {
            id: originalDetail?.id,
            consultedServiceId: service.consultedServiceId,
            amount: finalAmount,
            paymentMethod: service.paymentMethod as
              | "Tiền mặt"
              | "Quẹt thẻ thường"
              | "Quẹt thẻ Visa"
              | "Chuyển khoản",
          };
        }
      }),
    };

    onSubmit(voucher.id, processedData);
  };

  return (
    <Modal
      title="Sửa phiếu thu"
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={confirmLoading}
      okText="Cập nhật"
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
      {/* Main Form */}
      <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark>
        {/* Customer (read-only) */}
        <Alert
          message={`Khách hàng: ${voucher.customer.code || ""} - ${
            voucher.customer.fullName
          }`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* Services in voucher - Table Format */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text strong>Dịch vụ trong phiếu thu</Text>
            <Text type="secondary">{selectedServices.length} dịch vụ</Text>
          </div>

          {unpaidLoading ? (
            <div
              style={{ textAlign: "center", padding: "20px", color: "#999" }}
            >
              <Spin /> Đang tải dịch vụ...
            </div>
          ) : selectedServices.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "20px",
                color: "#999",
                backgroundColor: "#fafafa",
                borderRadius: "8px",
              }}
            >
              Phiếu thu này không có dịch vụ nào
            </div>
          ) : (
            <Table
              size="small"
              dataSource={tableDataSource}
              rowKey="id"
              pagination={false}
              bordered
              scroll={{ x: true }}
              columns={[
                {
                  title: "Dịch vụ",
                  dataIndex: "consultedServiceName",
                  ellipsis: true,
                  render: (name: string, service: UnpaidService) => (
                    <div>
                      <div style={{ fontWeight: 500 }}>{name}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Tổng: {formatCurrency(service.finalPrice)} • Đã thu:{" "}
                        {formatCurrency(service.totalPaid || 0)}
                      </Text>
                      {/* Show edit mode breakdown */}
                      {service.previousAmount && (
                        <div style={{ marginTop: 4, fontSize: 11 }}>
                          <span style={{ color: "#1890ff" }}>
                            ℹ️ Công nợ DB:{" "}
                            <strong>
                              {formatCurrency(service.currentDebt || 0)}
                            </strong>
                          </span>
                          <span style={{ color: "#666" }}> + </span>
                          <span style={{ color: "#fa8c16" }}>
                            Phiếu này cũ:{" "}
                            <strong>
                              {formatCurrency(service.previousAmount)}
                            </strong>
                          </span>
                          <span style={{ color: "#666" }}> = </span>
                          <span style={{ color: "#52c41a" }}>
                            Có thể thu:{" "}
                            <strong>{formatCurrency(service.debt)}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  title: "Còn nợ",
                  dataIndex: "debt",
                  width: 120,
                  align: "right" as const,
                  render: (amount: number) => (
                    <div>
                      <Text type="danger" strong style={{ fontSize: 14 }}>
                        {formatCurrency(amount)}
                      </Text>
                    </div>
                  ),
                },
                {
                  title: "Số tiền thu",
                  dataIndex: "amount",
                  width: 140,
                  render: (_, service: UnpaidService) => {
                    return (
                      <Form.Item
                        name={`amount_${service.id}`}
                        style={{ margin: 0 }}
                        rules={[
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
                        ]}
                      >
                        <InputNumber
                          min={1}
                          max={service.debt}
                          style={{ width: "100%" }}
                          placeholder="Nhập số tiền"
                          disabled={!canEditAmounts}
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

        {/* Admin Advanced Edit Fields */}
        {isAdmin && (
          <>
            <Divider orientation="left">Chỉnh sửa nâng cao (Admin)</Divider>
            <Row gutter={12}>
              <Col xs={24} lg={12}>
                <Form.Item label="Thu ngân" name="cashierId">
                  <Select
                    placeholder="Chọn thu ngân"
                    options={employees.map((e) => ({
                      label: e.fullName,
                      value: e.id,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} lg={12}>
                <Form.Item label="Ngày thu" name="paymentDate">
                  <DatePicker
                    showTime={{ format: "HH:mm" }}
                    format="DD/MM/YYYY HH:mm"
                    style={{ width: "100%" }}
                    placeholder="Chọn ngày và giờ thu"
                  />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        {/* Warning for non-admin users */}
        {canOnlyEditNotesAndMethods && (
          <Alert
            message="Lưu ý: Bạn chỉ có thể sửa ghi chú và phương thức thanh toán của phiếu thu trong ngày"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Metadata */}
        <Descriptions bordered size="small" column={2} style={{ marginTop: 8 }}>
          <Descriptions.Item label="Tạo bởi">
            {voucher.createdBy?.fullName || "System"}
          </Descriptions.Item>
          <Descriptions.Item label="Tạo lúc">
            {dayjs(voucher.createdAt).format("DD/MM/YYYY HH:mm")}
          </Descriptions.Item>
          <Descriptions.Item label="Cập nhật bởi">
            {voucher.updatedBy?.fullName || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Cập nhật lúc">
            {voucher.updatedAt
              ? dayjs(voucher.updatedAt).format("DD/MM/YYYY HH:mm")
              : "—"}
          </Descriptions.Item>
        </Descriptions>
      </Form>
    </Modal>
  );
}
