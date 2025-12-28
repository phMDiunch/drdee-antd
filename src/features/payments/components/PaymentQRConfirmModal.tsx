// src/features/payments/components/PaymentQRConfirmModal.tsx
"use client";

import React from "react";
import {
  Modal,
  Space,
  Tag,
  Alert,
  Card,
  Descriptions,
  Typography,
  Button,
} from "antd";
import { QrcodeOutlined, CheckCircleOutlined } from "@ant-design/icons";
import QRPayment from "@/shared/components/QRPayment";
import { formatCurrency } from "@/shared/utils/date";
import { clinicToBankConfig } from "@/shared/constants/payment";
import type { CreatePaymentVoucherRequest } from "@/shared/validation/payment-voucher.schema";

const { Text } = Typography;

interface SelectedService {
  consultedServiceId: string;
  serviceName: string;
  amount: number;
  paymentMethod: string;
  paymentAccountType?: "COMPANY" | "PERSONAL";
}

interface PaymentDraft {
  customerId: string;
  customerName: string;
  totalAmount: number;
  details: SelectedService[];
  notes?: string;
  tempCode: string;
  accountType: "COMPANY" | "PERSONAL";
}

interface Props {
  open: boolean;
  draft: PaymentDraft | null;
  clinic: {
    companyBankName?: string | null;
    companyBankAccountNo?: string | null;
    companyBankAccountName?: string | null;
    personalBankName?: string | null;
    personalBankAccountNo?: string | null;
    personalBankAccountName?: string | null;
  } | null;
  confirmLoading?: boolean;
  onCancel: () => void;
  onConfirm: (
    payload: CreatePaymentVoucherRequest,
    accountType: "COMPANY" | "PERSONAL"
  ) => void;
}

export default function PaymentQRConfirmModal({
  open,
  draft,
  clinic,
  confirmLoading,
  onCancel,
  onConfirm,
}: Props) {
  if (!draft || !clinic) return null;

  // Get bank config based on account type
  const bankConfig = clinicToBankConfig(clinic, draft.accountType);

  const handleConfirm = () => {
    const payload: CreatePaymentVoucherRequest = {
      customerId: draft.customerId,
      details: draft.details.map((d) => ({
        consultedServiceId: d.consultedServiceId,
        amount: d.amount,
        paymentMethod: d.paymentMethod as
          | "Tiền mặt"
          | "Quẹt thẻ thường"
          | "Quẹt thẻ Visa"
          | "Chuyển khoản",
      })),
      notes: draft.notes || null,
    };

    onConfirm(payload, draft.accountType);
  };

  return (
    <Modal
      open={open}
      width={{ xs: "90%", lg: "65%" }}
      title={
        <Space>
          <QrcodeOutlined />
          Quét mã thanh toán
          <Tag color={draft.accountType === "COMPANY" ? "gold" : "blue"}>
            {draft.accountType === "COMPANY" ? "🏢" : "👤"}
          </Tag>
        </Space>
      }
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy thanh toán
        </Button>,
        <Button
          key="confirm"
          type="primary"
          icon={<CheckCircleOutlined />}
          loading={confirmLoading}
          onClick={handleConfirm}
        >
          Xác nhận đã nhận tiền
        </Button>,
      ]}
      onCancel={onCancel}
      maskClosable={false}
      destroyOnHidden
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* QR Code and Bank Info Side by Side */}
        {bankConfig ? (
          <div style={{ display: "flex", gap: 16 }}>
            {/* Left: QR Code */}
            <div
              style={{
                flex: 1,
                textAlign: "center",
                padding: 24,
                background: "#fafafa",
                borderRadius: 8,
              }}
            >
              <QRPayment
                amount={draft.totalAmount}
                voucherCode={draft.tempCode}
                bankConfig={bankConfig}
                accountType={draft.accountType}
                size={200}
              />
            </div>

            {/* Right: Bank Info */}
            <div style={{ flex: 1 }}>
              <Card size="small" title="📱 Thông tin chuyển khoản">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Ngân hàng">
                    {bankConfig.bankName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số TK">
                    <Text copyable>{bankConfig.accountNumber}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Chủ TK">
                    {bankConfig.accountName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số tiền">
                    <Text strong style={{ fontSize: 18, color: "#1890ff" }}>
                      {formatCurrency(draft.totalAmount)}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Nội dung">
                    <Text code>{draft.tempCode}</Text>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </div>
          </div>
        ) : (
          <Alert
            type="error"
            showIcon
            message="Thiếu thông tin tài khoản"
            description={`Cơ sở chưa cấu hình tài khoản ${
              draft.accountType === "COMPANY" ? "công ty" : "cá nhân"
            } cần thiết.`}
          />
        )}

        {/* Payment Summary */}
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <Text strong>{draft.customerName}</Text>
          {draft.details.map((detail, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingLeft: 8,
              }}
            >
              <span>
                {detail.paymentAccountType && (
                  <Tag
                    color={
                      detail.paymentAccountType === "COMPANY" ? "gold" : "blue"
                    }
                    style={{ fontSize: 10, marginRight: 4 }}
                  >
                    {detail.paymentAccountType === "COMPANY" ? "🏢" : "👤"}
                  </Tag>
                )}
                {detail.serviceName}
              </span>
              <Text type="secondary">{formatCurrency(detail.amount)}</Text>
            </div>
          ))}
        </Space>

        {/* Warning */}
        <Alert
          type="warning"
          showIcon
          message="Lưu ý quan trọng"
          description="Chụp ảnh giao dịch thành công trước khi nhấn nút Xác nhận. Sau khi xác nhận, phiếu thu sẽ được tạo và đồng bộ công nợ."
        />
      </Space>
    </Modal>
  );
}
