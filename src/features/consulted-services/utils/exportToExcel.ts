// src/features/consulted-services/utils/exportToExcel.ts
import * as XLSX from "xlsx";
import type { ConsultedServiceResponse } from "@/shared/validation/consulted-service.schema";

/**
 * Export consulted services to Excel
 * Formats data with VND currency, customer links, and Vietnamese headers
 */
export function exportConsultedServicesToExcel(
  data: ConsultedServiceResponse[],
  filename: string = "dich-vu-tu-van.xlsx"
) {
  // Map data to Excel rows with Vietnamese headers
  const excelData = data.map((item, index) => ({
    STT: index + 1,
    "Mã KH": item.customer?.customerCode || "",
    "Tên khách hàng": item.customer?.fullName || "",
    SĐT: item.customer?.phone || "",
    "Dịch vụ": item.consultedServiceName,
    "Đơn vị": item.consultedServiceUnit,
    "Số lượng": item.quantity,
    "Giá niêm yết": item.price,
    "Giá ưu đãi": item.preferentialPrice,
    "Thành tiền": item.finalPrice,
    "Đã thanh toán": item.amountPaid,
    "Công nợ": item.debt,
    "Bác sĩ": item.consultingDoctor?.fullName || "",
    "NV tư vấn": item.consultingSale?.fullName || "",
    "Trạng thái DV": item.serviceStatus,
    "Trạng thái ĐT": item.treatmentStatus,
    "Vị trí răng": item.toothPositions?.join(", ") || "",
    "Ngày tư vấn": item.consultationDate
      ? new Date(item.consultationDate).toLocaleDateString("vi-VN")
      : "",
    "Ngày chốt": item.serviceConfirmDate
      ? new Date(item.serviceConfirmDate).toLocaleDateString("vi-VN")
      : "",
    "Ghi chú": item.specificStatus || "",
  }));

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Set column widths for better readability
  ws["!cols"] = [
    { wch: 5 }, // STT
    { wch: 10 }, // Mã KH
    { wch: 25 }, // Tên KH
    { wch: 12 }, // SĐT
    { wch: 30 }, // Dịch vụ
    { wch: 10 }, // Đơn vị
    { wch: 8 }, // Số lượng
    { wch: 12 }, // Giá niêm yết
    { wch: 12 }, // Giá ưu đãi
    { wch: 12 }, // Thành tiền
    { wch: 12 }, // Đã thanh toán
    { wch: 12 }, // Công nợ
    { wch: 20 }, // Bác sĩ
    { wch: 20 }, // NV tư vấn
    { wch: 12 }, // Trạng thái DV
    { wch: 15 }, // Trạng thái ĐT
    { wch: 15 }, // Vị trí răng
    { wch: 12 }, // Ngày tư vấn
    { wch: 12 }, // Ngày chốt
    { wch: 30 }, // Ghi chú
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Dịch vụ tư vấn");

  // Write file
  XLSX.writeFile(wb, filename);
}
