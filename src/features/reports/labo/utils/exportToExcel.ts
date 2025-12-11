// src/features/reports/labo/utils/exportToExcel.ts
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type { LaboOrderDetailRecord } from "@/shared/validation/labo-report.schema";

/**
 * Export labo report detail records to Excel
 * Includes all labo order details
 */
export async function exportLaboDetailToExcel(
  records: LaboOrderDetailRecord[],
  filename: string,
  metadata?: {
    title: string;
    month: string;
    clinic?: string;
    totalRecords: number;
    totalCost: number;
  }
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Chi tiết đơn hàng");

  // Add metadata header if provided
  if (metadata) {
    worksheet.mergeCells("A1:H1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = metadata.title;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };

    worksheet.mergeCells("A2:H2");
    const infoCell = worksheet.getCell("A2");
    infoCell.value = `Tháng: ${metadata.month} | Chi nhánh: ${
      metadata.clinic || "Tất cả"
    } | Tổng số: ${
      metadata.totalRecords
    } đơn hàng | Tổng chi phí: ${metadata.totalCost.toLocaleString()} ₫`;
    infoCell.font = { size: 11 };
    infoCell.alignment = { horizontal: "center", vertical: "middle" };

    // Add empty row for spacing
    worksheet.addRow([]);
  }

  // Set column widths
  worksheet.columns = [
    { key: "stt", width: 5 },
    { key: "sentDate", width: 14 },
    { key: "customer", width: 25 },
    { key: "doctorName", width: 20 },
    { key: "supplierShortName", width: 20 },
    { key: "serviceName", width: 30 },
    { key: "orderType", width: 15 },
    { key: "quantity", width: 10 },
    { key: "totalCost", width: 16 },
  ];

  // Add header row
  const headerRow = worksheet.addRow([
    "STT",
    "Ngày gửi",
    "Khách hàng (Mã)",
    "Bác sĩ",
    "Xưởng",
    "Dịch vụ",
    "Loại đơn hàng",
    "Số lượng",
    "Giá",
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
      sentDate: record.sentDate,
      customer: `${record.customerName} (${record.customerCode || "N/A"})`,
      doctorName: record.doctorName,
      supplierShortName: record.supplierShortName || "-",
      serviceName: record.serviceName,
      orderType: record.orderType,
      quantity: record.quantity,
      totalCost: record.totalCost,
    });
  });

  // Format cost column for all data rows
  const lastRow = worksheet.lastRow;
  if (lastRow) {
    const costColIndex = 9; // "totalCost" column
    for (let i = 2; i <= lastRow.number; i++) {
      const cell = worksheet.getCell(i, costColIndex);
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
