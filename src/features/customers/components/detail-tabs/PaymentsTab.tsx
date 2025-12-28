// src/features/customers/components/detail-tabs/PaymentsTab.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Button, Col, Empty, Row, Space, Spin, Typography, App } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  PaymentVoucherTable,
  CreatePaymentVoucherModal,
  UpdatePaymentVoucherModal,
  usePaymentVouchers,
  useCreatePaymentVoucher,
  useUpdatePaymentVoucher,
  useDeletePaymentVoucher,
  useUnpaidServices,
} from "@/features/payments";
import PrintableReceipt from "@/features/payments/components/PrintableReceipt";
import { useClinicById } from "@/features/clinics";
import type { PaymentVoucherResponse } from "@/shared/validation/payment-voucher.schema";
import type {
  CreatePaymentVoucherRequest,
  UpdatePaymentVoucherRequest,
} from "@/shared/validation/payment-voucher.schema";

interface PaymentsTabProps {
  customerId: string;
  customerName: string;
  customerCode: string | null;
  clinicId: string;
  onDataChange?: () => void;
}

/**
 * Payments Tab - Display customer's payment vouchers
 * Features:
 * - View all payment vouchers for this customer
 * - Create new payment voucher (if has unpaid services)
 * - Edit/Delete vouchers (permission-based)
 * - Print receipts
 */
export default function PaymentsTab({
  customerId,
  customerName,
  customerCode,
  clinicId, // Used for print clinic info
  onDataChange,
}: PaymentsTabProps) {
  const { message } = App.useApp();

  // Create current customer object for modal
  const currentCustomer = {
    id: customerId,
    fullName: customerName,
    phone: customerCode || "",
  };

  // States
  const [openCreate, setOpenCreate] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);
  // Editing voucher for update modal
  const [editingVoucher, setEditingVoucher] =
    useState<PaymentVoucherResponse | null>(null);

  // Print state
  const [printVoucher, setPrintVoucher] =
    useState<PaymentVoucherResponse | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch clinic data for print info
  const { data: clinicData } = useClinicById(clinicId);

  // Queries - Load ALL payment vouchers for this customer
  const {
    data: vouchersData,
    isLoading,
    error,
  } = usePaymentVouchers({
    customerId,
    page: 1,
    pageSize: 100, // Load all for customer detail
    sortField: "paymentDate",
    sortDirection: "desc", // Newest first
  });

  // Check unpaid services to enable/disable create button
  const { data: unpaidData } = useUnpaidServices(customerId);
  const canCreatePayment = (unpaidData?.items?.length || 0) > 0;

  // Mutations
  const createMutation = useCreatePaymentVoucher();
  const updateMutation = useUpdatePaymentVoucher();
  const deleteMutation = useDeletePaymentVoucher();

  // Side effects: Close modals and refetch when mutations succeed
  useEffect(() => {
    if (createMutation.isSuccess) {
      setOpenCreate(false);
      onDataChange?.();
    }
  }, [createMutation.isSuccess, onDataChange]);

  useEffect(() => {
    if (updateMutation.isSuccess) {
      setEditingVoucher(null);
      onDataChange?.();
    }
  }, [updateMutation.isSuccess, onDataChange]);

  useEffect(() => {
    if (deleteMutation.isSuccess) {
      onDataChange?.();
    }
  }, [deleteMutation.isSuccess, onDataChange]);

  // Handlers
  const handleEdit = (voucher: PaymentVoucherResponse) => {
    setEditingVoucher(voucher);
    setOpenUpdate(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleCreateFinish = (
    values: CreatePaymentVoucherRequest,
    accountType: "COMPANY" | "PERSONAL"
  ) => {
    createMutation.mutate(
      { values, accountType },
      {
        onSuccess: (data) => {
          setOpenCreate(false);
          onDataChange?.();
          // Auto-print receipt after successful payment
          if (data) {
            setTimeout(() => {
              handlePrint(data);
            }, 100);
          }
        },
      }
    );
  };

  const handleEditFinish = (
    id: string,
    values: UpdatePaymentVoucherRequest
  ) => {
    updateMutation.mutate(
      { id, data: values },
      {
        onSuccess: () => {
          setEditingVoucher(null);
          setOpenUpdate(false);
          onDataChange?.();
        },
      }
    );
  };

  const handlePrint = (voucher: PaymentVoucherResponse) => {
    setPrintVoucher(voucher);

    // Defer to next tick for hidden receipt to render
    setTimeout(() => {
      if (!printRef.current) return;

      // Create hidden iframe for printing
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.style.visibility = "hidden";

      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        message.error("Không thể tạo iframe in. Vui lòng thử lại.");
        document.body.removeChild(iframe);
        setPrintVoucher(null);
        return;
      }

      const printContent = printRef.current.innerHTML;

      // Write content to iframe
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Phiếu Thu - ${voucher.paymentNumber || "N/A"}</title>
            <style>
              * { box-sizing: border-box; }
              body { font-family: 'Times New Roman', serif; color: #000; margin: 0; }
              .printable-receipt { margin: 0 auto; }
              @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                @page { size: A4; margin: 10mm; }
              }
              .ant-table { font-size: inherit; }
              .ant-table-thead > tr > th { background: #f5f5f5 !important; font-weight: bold; padding: 8px !important; }
              .ant-table-tbody > tr > td { padding: 8px !important; border-bottom: 1px solid #e8e8e8; }
              .ant-divider { border-top: 1px solid #d9d9d9; margin: 12px 0; }
              .ant-typography { margin-bottom: 0; }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      iframeDoc.close();

      // Wait for content to load, then print
      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (error) {
            console.error("Print error:", error);
            message.error("Không thể in. Vui lòng thử lại.");
          } finally {
            // Clean up iframe after print dialog closes
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
              setPrintVoucher(null);
            }, 100);
          }
        }, 300);
      };
    }, 100);
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "50px 0" }}>
        <Spin size="large">
          <div style={{ paddingTop: 50 }}>Đang tải danh sách phiếu thu...</div>
        </Spin>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Empty
        description={
          <Typography.Text type="danger">
            {error instanceof Error
              ? error.message
              : "Không thể tải danh sách phiếu thu"}
          </Typography.Text>
        }
      />
    );
  }

  const vouchers = vouchersData?.items || [];
  const voucherCount = vouchersData?.total || 0;

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      {/* Header */}
      <Row justify="space-between" align="middle">
        <Col>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Danh sách phiếu thu ({voucherCount})
          </Typography.Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setOpenCreate(true)}
            disabled={!canCreatePayment}
          >
            Tạo phiếu thu
          </Button>
        </Col>
      </Row>

      {/* Empty State */}
      {vouchers.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <>
              <Typography.Text type="secondary">
                {!canCreatePayment
                  ? "Khách hàng chưa có dịch vụ nào cần thu tiền"
                  : "Khách hàng chưa có phiếu thu nào"}
              </Typography.Text>
              {canCreatePayment && (
                <>
                  <br />
                  <Button type="link" onClick={() => setOpenCreate(true)}>
                    Tạo phiếu thu đầu tiên
                  </Button>
                </>
              )}
            </>
          }
        />
      ) : (
        /* Table */
        <PaymentVoucherTable
          data={vouchers}
          loading={isLoading}
          isCustomerDetailView={true} // Customer Detail context: hide customer column
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPrint={handlePrint}
        />
      )}

      {/* Create Payment Modal */}
      <CreatePaymentVoucherModal
        open={openCreate}
        confirmLoading={createMutation.isPending}
        customerId={customerId}
        currentCustomer={currentCustomer}
        onCancel={() => setOpenCreate(false)}
        onSubmit={handleCreateFinish}
      />

      {/* Edit Payment Modal */}
      {editingVoucher && (
        <UpdatePaymentVoucherModal
          open={openUpdate}
          confirmLoading={updateMutation.isPending}
          voucher={editingVoucher}
          onCancel={() => {
            setEditingVoucher(null);
            setOpenUpdate(false);
          }}
          onSubmit={handleEditFinish}
        />
      )}

      {/* Hidden printable content for immediate printing */}
      <div style={{ position: "absolute", left: -10000, top: -10000 }}>
        {printVoucher && clinicData && (
          <div ref={printRef}>
            <PrintableReceipt
              voucher={printVoucher}
              clinicInfo={{
                name: clinicData.name || "PHÒNG KHÁM NHA KHOA",
                address: clinicData.address || "",
                phone: clinicData.phone || "",
                // Add bank info based on accountTypeUsed
                bankName:
                  printVoucher.accountTypeUsed === "COMPANY"
                    ? clinicData.companyBankName || undefined
                    : clinicData.personalBankName || undefined,
                bankAccountNo:
                  printVoucher.accountTypeUsed === "COMPANY"
                    ? clinicData.companyBankAccountNo || undefined
                    : clinicData.personalBankAccountNo || undefined,
                bankAccountName:
                  printVoucher.accountTypeUsed === "COMPANY"
                    ? clinicData.companyBankAccountName || undefined
                    : clinicData.personalBankAccountName || undefined,
              }}
            />
          </div>
        )}
      </div>
    </Space>
  );
}
