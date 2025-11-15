import type { DailyRevenue, Transaction } from "./types";
import { formatCurrency, formatDate } from "./utils";

/**
 * Export daily revenue data to Excel-compatible format
 * In production, use a library like xlsx or exceljs
 */
export function exportDailyRevenueToExcel(data: DailyRevenue[]): void {
  // Create CSV content
  const headers = [
    "Ngày",
    "Số giao dịch",
    "Tổng doanh thu",
    "Tiền mặt",
    "Quẹt thẻ",
    "Quẹt Visa",
    "Chuyển khoản",
    "Dịch vụ hàng đầu",
    "Bác sĩ hàng đầu",
  ];

  const rows = data.map((row) => [
    formatDate(row.date),
    row.transactionCount,
    formatCurrency(row.total),
    formatCurrency(row.cash),
    formatCurrency(row.card),
    formatCurrency(row.visa),
    formatCurrency(row.transfer),
    row.topService,
    row.topDoctor,
  ]);

  const csvContent =
    headers.join(",") +
    "\n" +
    rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

  // Create download link
  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `doanh-thu-theo-ngay-${Date.now()}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export all transactions to Excel
 */
export function exportTransactionsToExcel(data: Transaction[]): void {
  const headers = [
    "Mã GD",
    "Ngày",
    "Số tiền",
    "Phương thức",
    "Nguồn",
    "Dịch vụ",
    "Nhóm dịch vụ",
    "Bác sĩ",
    "Sale",
    "Khách hàng",
  ];

  const rows = data.map((tx) => [
    tx.id,
    formatDate(tx.date),
    formatCurrency(tx.amount),
    tx.paymentType,
    tx.source,
    tx.serviceName,
    tx.serviceGroup,
    tx.doctorName,
    tx.saleName || "",
    tx.customerName,
  ]);

  const csvContent =
    headers.join(",") +
    "\n" +
    rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `giao-dich-${Date.now()}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Example: Export using xlsx library (requires: npm install xlsx)
 * Uncomment when ready to use
 */
/*
import * as XLSX from 'xlsx';

export function exportToExcelWithXLSX(data: DailyRevenue[], filename: string): void {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map(row => ({
      'Ngày': formatDate(row.date),
      'Số GD': row.transactionCount,
      'Tổng DT': row.total,
      'Tiền mặt': row.cash,
      'Quẹt thẻ': row.card,
      'Quẹt Visa': row.visa,
      'Chuyển khoản': row.transfer,
      'DV hàng đầu': row.topService,
      'BS hàng đầu': row.topDoctor,
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Doanh thu');

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
*/
