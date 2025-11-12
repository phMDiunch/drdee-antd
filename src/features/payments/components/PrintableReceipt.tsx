// src/features/payments/components/PrintableReceipt.tsx
/* eslint-disable @next/next/no-img-element */
"use client";
import { forwardRef } from "react";
import { Table, Typography, Divider } from "antd";
import { formatCurrency, formatDateTimeVN } from "../../../shared/utils/date";
import type { PaymentVoucherResponse } from "@/shared/validation/payment-voucher.schema";
import { getPaymentMethodConfig } from "../constants";
import ClinicLogo from "../../../shared/components/ClinicLogo";

const { Title, Text } = Typography;

interface Props {
  voucher: PaymentVoucherResponse;
  clinicInfo?: {
    name: string;
    address: string;
    phone: string;
    logo?: string;
  };
}

const PrintableReceipt = forwardRef<HTMLDivElement, Props>(
  ({ voucher, clinicInfo }, ref) => {
    const containerStyles: React.CSSProperties = {
      width: "190mm", // A4 content area (210mm - 2*10mm margins)
      minHeight: "auto",
      padding: 0,
      fontSize: 14,
      fontFamily: "Times New Roman, serif",
      lineHeight: 1.2,
      backgroundColor: "white",
      margin: "0 auto",
    };

    const ReceiptBody = ({ copyLabel }: { copyLabel: string }) => (
      <>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {clinicInfo?.logo ? (
              <img src={clinicInfo.logo} alt="Logo" style={{ height: 40 }} />
            ) : (
              <ClinicLogo size={40} />
            )}
            <div>
              <Title
                level={4}
                style={{ margin: 0, fontWeight: 800, lineHeight: 1.1 }}
              >
                {clinicInfo?.name || "PHÒNG KHÁM NHA KHOA"}
              </Title>
              {(clinicInfo?.address || clinicInfo?.phone) && (
                <Text type="secondary" style={{ fontSize: 14 }}>
                  {clinicInfo?.address}
                  {clinicInfo?.address && clinicInfo?.phone ? <br /> : null}
                  {clinicInfo?.phone ? `SDT: ${clinicInfo.phone}` : null}
                </Text>
              )}
            </div>
          </div>
          <div style={{ textAlign: "right", minWidth: 160 }}>
            <Text style={{ color: "#666", fontSize: 14 }}>Số phiếu thu:</Text>
            <br />
            <Text strong style={{ color: "#1890ff", fontSize: 14 }}>
              {voucher.paymentNumber}
            </Text>
            <div>
              <Text type="secondary" style={{ fontSize: 14 }}>
                {copyLabel}
              </Text>
            </div>
          </div>
        </div>

        <Divider style={{ margin: "8px 0" }} />

        {/* Title & Date */}
        <div style={{ textAlign: "center", margin: "6px 0 10px" }}>
          <Title level={3} style={{ margin: 0, letterSpacing: 0.5 }}>
            PHIẾU THU
          </Title>
          <Text type="secondary" style={{ fontStyle: "italic", fontSize: 14 }}>
            Ngày lập phiếu: {formatDateTimeVN(voucher.paymentDate)}
          </Text>
        </div>

        {/* Customer & Summary */}
        {(() => {
          const customerCode = voucher.customer?.code || "";
          const customerName = voucher.customer?.fullName || "";
          const totalAmount = voucher.totalAmount || 0;
          const methods = (voucher.details || [])
            .map((d: { paymentMethod: string }) => d.paymentMethod)
            .filter(Boolean);
          const uniqueMethods = Array.from(new Set(methods));
          const methodLabel =
            uniqueMethods.length === 0
              ? ""
              : uniqueMethods.length === 1
              ? getPaymentMethodConfig(uniqueMethods[0] as string).label
              : "Nhiều phương thức";
          return (
            <div style={{ marginBottom: 8 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  columnGap: 32,
                  rowGap: 4,
                }}
              >
                <div>
                  <Text strong>Mã số KH:</Text> <Text>{customerCode}</Text>
                </div>
                <div>
                  <Text strong>Họ và tên:</Text> <Text>{customerName}</Text>
                </div>
                <div>
                  <Text strong>Tổng tiền thu:</Text>{" "}
                  <Text style={{ fontWeight: 700 }}>
                    {formatCurrency(totalAmount)}
                  </Text>
                </div>
                <div>
                  <Text strong>Loại giao dịch:</Text> <Text>{methodLabel}</Text>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Details Table */}
        <div>
          <Table
            dataSource={voucher.details || []}
            pagination={false}
            size="small"
            bordered
            rowKey="id"
            style={{ width: "100%" }}
            tableLayout="fixed"
            columns={[
              {
                title: "Tên dịch vụ",
                dataIndex: "consultedServiceName",
                width: "60%",
                render: (name: string) => name || "Không xác định",
              },
              {
                title: "Số tiền thu",
                dataIndex: "amount",
                width: "20%",
                render: (amount: number) => formatCurrency(amount),
                align: "right" as const,
              },
              {
                title: "Loại giao dịch",
                dataIndex: "paymentMethod",
                width: "20%",
                render: (method: string) => {
                  const config = getPaymentMethodConfig(method);
                  return config.label;
                },
                align: "center" as const,
              },
            ]}
          />
        </div>

        {/* Notes */}
        {voucher.notes && (
          <div style={{ margin: "8px 0", fontSize: 14 }}>
            <Text strong>Ghi chú: </Text>
            <Text>{voucher.notes}</Text>
          </div>
        )}

        {/* Signatures */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
            marginTop: 20,
            pageBreakInside: "avoid",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <Text strong>KẾ TOÁN TRƯỞNG</Text>
            <div style={{ height: 40 }} />
            <div style={{ color: "#666", fontStyle: "italic" }}>
              (Ký, họ tên)
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Text strong>THU NGÂN</Text>
            <div style={{ height: 40 }} />
            <div style={{ borderTop: "1px solid #000", paddingTop: 5 }}>
              <Text>{voucher.cashier?.fullName}</Text>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Text strong>KHÁCH HÀNG</Text>
            <div style={{ height: 40 }} />
            <div style={{ borderTop: "1px solid #000", paddingTop: 5 }}>
              <Text>{voucher.customer?.fullName}</Text>
            </div>
          </div>
        </div>
      </>
    );

    return (
      <div ref={ref} style={containerStyles} className="printable-receipt">
        <style>{`
          .printable-receipt .ant-table-cell { padding: 4px 6px; line-height: 1.2; }
          .printable-receipt .ant-table-thead > tr > th { padding: 4px 6px; }
          .printable-receipt .ant-typography { margin-bottom: 0; }
          .printable-receipt .ant-table-wrapper,
          .printable-receipt .ant-table,
          .printable-receipt .ant-table-container,
          .printable-receipt .ant-table-content { width: 100% !important; margin: 0; }
          .printable-receipt .ant-table-container table { width: 100% !important; table-layout: fixed; border-collapse: collapse; }
          @media print {
            .printable-receipt { position: relative; }
            /* Each copy height equals half of A4 height minus top/bottom margins (10mm each) => 138.5mm */
            .printable-receipt .receipt-copy { 
              height: 138.5mm; 
              overflow: hidden; 
              page-break-inside: avoid; 
            }
          }
        `}</style>
        {/* Two copies per A4 page */}
        <div className="receipt-copy">
          <ReceiptBody copyLabel="LIÊN 1" />
        </div>
        <div className="receipt-copy">
          <ReceiptBody copyLabel="LIÊN 2" />
        </div>

        {/* Removed dashed mid-page divider as requested */}
      </div>
    );
  }
);

PrintableReceipt.displayName = "PrintableReceipt";

export default PrintableReceipt;
