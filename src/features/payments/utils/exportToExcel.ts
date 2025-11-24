// src/features/payments/utils/exportToExcel.ts
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import type { PaymentVoucherResponse } from "@/shared/validation/payment-voucher.schema";

/**
 * Export payment vouchers to Excel with detailed flat structure
 * Each row represents one service payment in a voucher
 */
export async function exportPaymentVouchersToExcel(
  vouchers: PaymentVoucherResponse[],
  selectedDate: dayjs.Dayjs
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Chi tiết phiếu thu");

  // Set column widths
  worksheet.columns = [
    { key: "stt", width: 5 },
    { key: "paymentNumber", width: 15 },
    { key: "customerCode", width: 15 },
    { key: "customerName", width: 25 },
    { key: "paymentDate", width: 18 },
    { key: "consultedServiceName", width: 50 },
    { key: "consultedServiceFinalPrice", width: 15 },
    { key: "paymentAmount", width: 15 },
    { key: "paymentMethod", width: 18 },
    { key: "cashierName", width: 20 },
    { key: "createdAt", width: 18 },
    { key: "notes", width: 30 },
  ];

  // Add header row
  const headerRow = worksheet.addRow([
    "STT",
    "Số phiếu",
    "Mã KH",
    "Tên khách hàng",
    "Ngày thu",
    "Dịch vụ",
    "Giá dịch vụ",
    "Số tiền thu",
    "Phương thức",
    "Người thu",
    "Ngày tạo",
    "Ghi chú",
  ]);

  // Style header row
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD9D9D9" },
  };

  // Add data rows - flat structure (one row per service detail)
  let rowIndex = 1;
  vouchers.forEach((voucher) => {
    voucher.details.forEach((detail) => {
      const row = worksheet.addRow({
        stt: rowIndex++,
        paymentNumber: voucher.paymentNumber,
        customerCode: voucher.customer.code,
        customerName: voucher.customer.fullName,
        paymentDate: dayjs(voucher.paymentDate).format("DD/MM/YYYY HH:mm"),
        consultedServiceName: detail.consultedServiceName,
        consultedServiceFinalPrice: detail.consultedServiceFinalPrice,
        paymentAmount: detail.amount,
        paymentMethod: detail.paymentMethod,
        cashierName: voucher.cashier.fullName,
        createdAt: dayjs(voucher.createdAt).format("DD/MM/YYYY HH:mm"),
        notes: voucher.notes || "",
      });

      // Format amount columns
      row.getCell("consultedServiceFinalPrice").numFmt = '#,##0" ₫"';
      row.getCell("paymentAmount").numFmt = '#,##0" ₫"';
    });
  });

  // Add borders to all cells
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const filename = `phieu-thu-${selectedDate.format("YYYY-MM-DD")}.xlsx`;
  saveAs(blob, filename);
}
