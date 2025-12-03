// src/features/reports/sales/utils/exportToExcel.ts
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import type { ConsultedServiceDetail } from "@/shared/validation/sales-report.schema";
import { CUSTOMER_SOURCES } from "@/features/customers/constants";

/**
 * Export sales report detail records to Excel
 * Includes all consulted service details with formatting
 */
export async function exportSalesDetailToExcel(
  records: ConsultedServiceDetail[],
  filename: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Chi tiết dịch vụ");

  // Set column widths
  worksheet.columns = [
    { key: "stt", width: 5 },
    { key: "consultationDate", width: 14 },
    { key: "serviceConfirmDate", width: 14 },
    { key: "serviceName", width: 35 },
    { key: "customerCode", width: 14 },
    { key: "customerName", width: 22 },
    { key: "customerSource", width: 18 },
    { key: "sourceNotes", width: 25 },
    { key: "consultingSale", width: 20 },
    { key: "consultingDoctor", width: 20 },
    { key: "finalPrice", width: 16 },
    { key: "serviceStatus", width: 14 },
  ];

  // Add header row
  const headerRow = worksheet.addRow([
    "STT",
    "Ngày tư vấn",
    "Ngày chốt",
    "Dịch vụ",
    "Khách hàng",
    "Mã khách hàng",
    "Nguồn khách",
    "Ghi chú nguồn",
    "Sale tư vấn",
    "Bác sĩ tư vấn",
    "Giá trị",
    "Trạng thái",
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
    const sourceValue = record.customer.source;
    const source = sourceValue
      ? CUSTOMER_SOURCES.find((s) => s.value === sourceValue)?.label ||
        sourceValue
      : "Không rõ";

    worksheet.addRow({
      stt: index + 1,
      consultationDate: dayjs(record.consultationDate).format("DD/MM/YYYY"),
      serviceConfirmDate: record.serviceConfirmDate
        ? dayjs(record.serviceConfirmDate).format("DD/MM/YYYY")
        : "-",
      serviceName: record.dentalService.name,
      customerName: record.customer.fullName,
      customerCode: record.customer.customerCode || "-",
      customerSource: source,
      sourceNotes: record.customer.sourceNotes || "-",
      consultingSale: record.consultingSale?.fullName || "-",
      consultingDoctor: record.consultingDoctor?.fullName || "-",
      finalPrice: record.finalPrice,
      serviceStatus: record.serviceStatus,
    });
  });

  // Format amount column for all data rows
  const lastRow = worksheet.lastRow;
  if (lastRow) {
    const amountColIndex = 11; // "finalPrice" column (shifted right due to new sourceNotes column)
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
