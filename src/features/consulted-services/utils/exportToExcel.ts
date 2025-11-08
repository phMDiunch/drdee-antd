// src/features/consulted-services/utils/exportToExcel.ts
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type { ConsultedServiceResponse } from "@/shared/validation/consulted-service.schema";

/**
 * Export consulted services to Excel
 * Formats data with VND currency, customer links, and Vietnamese headers
 */
export async function exportConsultedServicesToExcel(
  data: ConsultedServiceResponse[],
  filename: string = "dich-vu-tu-van.xlsx"
) {
  // Create a new workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Dịch vụ tư vấn");

  // Define columns with headers and widths
  worksheet.columns = [
    { header: "STT", key: "stt", width: 5 },
    { header: "Mã KH", key: "customerCode", width: 10 },
    { header: "Tên khách hàng", key: "fullName", width: 25 },
    { header: "SĐT", key: "phone", width: 12 },
    { header: "Dịch vụ", key: "service", width: 30 },
    { header: "Đơn vị", key: "unit", width: 10 },
    { header: "Số lượng", key: "quantity", width: 8 },
    { header: "Giá niêm yết", key: "price", width: 12 },
    { header: "Giá ưu đãi", key: "preferentialPrice", width: 12 },
    { header: "Thành tiền", key: "finalPrice", width: 12 },
    { header: "Đã thanh toán", key: "amountPaid", width: 12 },
    { header: "Công nợ", key: "debt", width: 12 },
    { header: "Bác sĩ", key: "doctor", width: 20 },
    { header: "NV tư vấn", key: "sale", width: 20 },
    { header: "Trạng thái DV", key: "serviceStatus", width: 12 },
    { header: "Trạng thái ĐT", key: "treatmentStatus", width: 15 },
    { header: "Vị trí răng", key: "toothPositions", width: 15 },
    { header: "Ngày tư vấn", key: "consultationDate", width: 12 },
    { header: "Ngày chốt", key: "serviceConfirmDate", width: 12 },
    { header: "Ghi chú", key: "note", width: 30 },
  ];

  // Add data rows
  data.forEach((item, index) => {
    worksheet.addRow({
      stt: index + 1,
      customerCode: item.customer?.customerCode || "",
      fullName: item.customer?.fullName || "",
      phone: item.customer?.phone || "",
      service: item.consultedServiceName,
      unit: item.consultedServiceUnit,
      quantity: item.quantity,
      price: item.price,
      preferentialPrice: item.preferentialPrice,
      finalPrice: item.finalPrice,
      amountPaid: item.amountPaid,
      debt: item.debt,
      doctor: item.consultingDoctor?.fullName || "",
      sale: item.consultingSale?.fullName || "",
      serviceStatus: item.serviceStatus,
      treatmentStatus: item.treatmentStatus,
      toothPositions: item.toothPositions?.join(", ") || "",
      consultationDate: item.consultationDate
        ? new Date(item.consultationDate).toLocaleDateString("vi-VN")
        : "",
      serviceConfirmDate: item.serviceConfirmDate
        ? new Date(item.serviceConfirmDate).toLocaleDateString("vi-VN")
        : "",
      note: item.specificStatus || "",
    });
  });

  // Write to file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, filename);
}
