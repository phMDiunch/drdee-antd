// src/features/payments/views/PaymentDailyView.tsx
"use client";

import React, { useCallback, useMemo, useState, useRef } from "react";
import PageHeaderWithDateNav from "@/shared/components/PageHeaderWithDateNav";
import ClinicTabs from "@/shared/components/ClinicTabs";
import {
  PaymentStatistics,
  PaymentFilters,
  PaymentVoucherTable,
  UpdatePaymentVoucherModal,
  PrintableReceipt,
  usePaymentVouchersDaily,
  useDeletePaymentVoucher,
  useUpdatePaymentVoucher,
  exportPaymentVouchersToExcel,
} from "@/features/payments";

import { useDateNavigation } from "@/shared/hooks/useDateNavigation";
import { useCurrentUser } from "@/shared/providers";
import { useClinicById } from "@/features/clinics";
import { useNotify } from "@/shared/hooks/useNotify";
import type {
  PaymentVoucherResponse,
  UpdatePaymentVoucherRequest,
} from "@/shared/validation/payment-voucher.schema";

export default function PaymentDailyView() {
  const { user: currentUser } = useCurrentUser();
  const notify = useNotify();

  const {
    selectedDate,
    goToPreviousDay,
    goToToday,
    goToNextDay,
    handleDateChange,
  } = useDateNavigation();

  const [selectedClinicId, setSelectedClinicId] = useState<string | undefined>(
    currentUser?.clinicId || undefined
  );

  // Fetch clinic data for print info
  const { data: clinicData } = useClinicById(selectedClinicId);

  const { data, isLoading } = usePaymentVouchersDaily({
    date: selectedDate.format("YYYY-MM-DD"),
    clinicId: selectedClinicId!,
  });

  const vouchers = useMemo(() => data?.items ?? [], [data?.items]);

  // Modal state - separate for Create and Update
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] =
    useState<PaymentVoucherResponse | null>(null);

  // Print state
  const [printVoucher, setPrintVoucher] =
    useState<PaymentVoucherResponse | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Mutations
  const deleteMutation = useDeletePaymentVoucher();
  const updateMutation = useUpdatePaymentVoucher();

  // Handlers

  const handleEdit = useCallback((voucher: PaymentVoucherResponse) => {
    setEditingVoucher(voucher);
    setUpdateModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation]
  );

  const handlePrint = useCallback(
    (voucher: PaymentVoucherResponse) => {
      setPrintVoucher(voucher);

      // Defer to next tick for hidden receipt to render
      setTimeout(() => {
        if (!printRef.current) return;
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          notify.error(
            "Không thể mở cửa sổ in. Vui lòng kiểm tra popup blocker."
          );
          return;
        }
        const printContent = printRef.current.innerHTML;
        printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Phiếu Thu - ${voucher.paymentNumber}</title>
            <style>
              * { box-sizing: border-box; }
              body { font-family: 'Times New Roman', serif; color: #000; }
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
        printWindow.document.close();
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
            setPrintVoucher(null);
          }, 300);
        };
      }, 0);
    },
    [notify]
  );

  const handleCloseModal = useCallback(() => {
    setUpdateModalOpen(false);
    setEditingVoucher(null);
  }, []);

  const handleUpdateSubmit = useCallback(
    (id: string, values: UpdatePaymentVoucherRequest) => {
      updateMutation.mutate(
        { id, data: values },
        {
          onSuccess: () => {
            handleCloseModal();
          },
        }
      );
    },
    [updateMutation, handleCloseModal]
  );

  const handleExportExcel = useCallback(async () => {
    if (!vouchers.length) {
      notify.warning("Không có dữ liệu để xuất");
      return;
    }

    try {
      await exportPaymentVouchersToExcel(vouchers, selectedDate);
      notify.success("Xuất Excel thành công");
    } catch (error) {
      console.error("Excel export error:", error);
      notify.error(error, { fallback: "Xuất Excel thất bại" });
    }
  }, [vouchers, selectedDate, notify]);

  return (
    <div>
      <PageHeaderWithDateNav
        title="Phiếu thu"
        selectedDate={selectedDate}
        onPreviousDay={goToPreviousDay}
        onToday={goToToday}
        onNextDay={goToNextDay}
        onDateChange={(date) => handleDateChange(date)}
      />

      {currentUser?.role === "admin" && (
        <div style={{ marginBottom: 16 }}>
          <ClinicTabs value={selectedClinicId} onChange={setSelectedClinicId} />
        </div>
      )}

      <PaymentStatistics statistics={data?.statistics} loading={isLoading} />

      <div style={{ marginTop: 24 }}>
        <PaymentFilters
          dailyCount={data?.count ?? 0}
          onExportExcel={handleExportExcel}
        />

        <PaymentVoucherTable
          data={vouchers}
          loading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPrint={handlePrint}
        />
      </div>

      {editingVoucher && (
        <UpdatePaymentVoucherModal
          open={updateModalOpen}
          confirmLoading={updateMutation.isPending}
          voucher={editingVoucher}
          onCancel={handleCloseModal}
          onSubmit={handleUpdateSubmit}
        />
      )}

      {/* Hidden printable content for immediate printing */}
      <div style={{ position: "absolute", left: -10000, top: -10000 }}>
        {printVoucher && (
          <div ref={printRef}>
            <PrintableReceipt
              voucher={printVoucher}
              clinicInfo={{
                name: clinicData?.name || "PHÒNG KHÁM NHA KHOA",
                address: clinicData?.address || "",
                phone: clinicData?.phone || "",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
