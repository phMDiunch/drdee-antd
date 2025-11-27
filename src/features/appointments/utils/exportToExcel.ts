// src/features/appointments/utils/exportToExcel.ts
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import type { AppointmentResponse } from "@/shared/validation/appointment.schema";

/**
 * Export appointments to Excel with formatted data
 * Includes appointment details, customer info, dentist info, and status
 */
export async function exportAppointmentsToExcel(
  appointments: AppointmentResponse[],
  selectedDate: dayjs.Dayjs
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Lịch hẹn");

  // Set column widths
  worksheet.columns = [
    { key: "stt", width: 8 },
    { key: "customerCode", width: 15 },
    { key: "customerName", width: 25 },
    { key: "appointmentDateTime", width: 18 },
    { key: "primaryDentist", width: 20 },
    { key: "secondaryDentist", width: 20 },
    { key: "notes", width: 30 },
    { key: "status", width: 15 },
    { key: "duration", width: 20 },
    { key: "clinic", width: 50 },
  ];

  // Add header row
  const headerRow = worksheet.addRow([
    "STT",
    "Mã KH",
    "Tên khách hàng",
    "Thời gian hẹn",
    "Bác sĩ chính",
    "Bác sĩ phụ",
    "Ghi chú",
    "Trạng thái",
    "Thời lượng (phút)",
    "Chi nhánh",
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
  appointments.forEach((appointment, index) => {
    worksheet.addRow({
      stt: index + 1,
      customerCode: appointment.customer.customerCode || "",
      customerName: appointment.customer.fullName,
      appointmentDateTime: dayjs(appointment.appointmentDateTime).format(
        "HH:mm"
      ),
      primaryDentist: appointment.primaryDentist.fullName,
      secondaryDentist: appointment.secondaryDentist?.fullName || "",
      notes: appointment.notes || "",
      status: appointment.status,
      duration: appointment.duration,
      clinic: appointment.clinic.name,
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
  const filename = `lich-hen-${selectedDate.format("YYYY-MM-DD")}.xlsx`;
  saveAs(blob, filename);
}
