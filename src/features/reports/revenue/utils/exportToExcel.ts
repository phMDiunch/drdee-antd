// src/features/reports/revenue/utils/exportToExcel.ts
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type { PaymentDetailRecord } from "@/shared/validation/revenue-report.schema";

/**
 * Export revenue report detail records to Excel
 * Includes all payment details with payment percentage
 */
export async function exportRevenueDetailToExcel(
  records: PaymentDetailRecord[],
  filename: string,
  metadata?: {
    title: string;
    month: string;
    clinic?: string;
    totalRecords: number;
    totalRevenue: number;
  }
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Chi tiết thanh toán");

  // Add metadata header if provided
  if (metadata) {
    worksheet.mergeCells("A1:J1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = metadata.title;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };

    worksheet.mergeCells("A2:J2");
    const infoCell = worksheet.getCell("A2");
    infoCell.value = `Tháng: ${metadata.month} | Chi nhánh: ${
      metadata.clinic || "Tất cả"
    } | Tổng số: ${
      metadata.totalRecords
    } giao dịch | Tổng doanh thu: ${metadata.totalRevenue.toLocaleString()} ₫`;
    infoCell.font = { size: 11 };
    infoCell.alignment = { horizontal: "center", vertical: "middle" };

    // Add empty row for spacing
    worksheet.addRow([]);
  }

  // Set column widths
  worksheet.columns = [
    { key: "stt", width: 5 },
    { key: "paymentDate", width: 14 },
    { key: "serviceName", width: 35 },
    { key: "toothPositions", width: 15 },
    { key: "quantity", width: 10 },
    { key: "customerName", width: 25 },
    { key: "customerCode", width: 12 },
    { key: "treatingDoctor", width: 20 },
    { key: "amount", width: 16 },
    { key: "paymentPercentage", width: 18 },
  ];

  // Add header row
  const headerRow = worksheet.addRow([
    "STT",
    "Ngày thu",
    "Dịch vụ",
    "Vị trí răng",
    "Số lượng",
    "Khách hàng",
    "Mã KH",
    "Bác sĩ điều trị",
    "Số tiền thu",
    "% thanh toán",
  ]);

  // Style header row
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD9D9D9" },
  };

  // Add data rows
  records.forEach((record, index) => {
    worksheet.addRow({
      stt: index + 1,
      paymentDate: record.paymentDateDisplay,
      serviceName: record.serviceName,
      toothPositions: record.toothPositions?.join(", ") || "-",
      quantity: record.quantity,
      customerName: record.customerName,
      customerCode: record.customerCode || "N/A",
      treatingDoctor: record.treatingDoctorName || "-",
      amount: record.amount,
      paymentPercentage: `${record.paymentPercentage.toFixed(1)}%`,
    });
  });

  // Format amount column for all data rows
  const lastRow = worksheet.lastRow;
  if (lastRow) {
    const amountColIndex = 9; // "amount" column
    for (let i = 2; i <= lastRow.number; i++) {
      const cell = worksheet.getCell(i, amountColIndex);
      cell.numFmt = '#,##0" ₫"';
    }
  }

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
  saveAs(blob, filename);
}
