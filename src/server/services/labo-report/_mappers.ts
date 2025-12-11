import type {
  RawKpiData,
  RawDailyData,
  RawSupplierData,
  RawDoctorData,
  RawServiceData,
  laboReportRepo,
} from "@/server/repos/labo-report.repo";
import type {
  LaboKpiData,
  DailyLaboData,
  SupplierLaboData,
  DoctorLaboData,
  ServiceLaboData,
  LaboOrderDetailRecord,
} from "@/shared/validation/labo-report.schema";

/**
 * Transform KPI metrics với growth
 * Không sort, không ranking
 */
export function mapKpiData(raw: RawKpiData): LaboKpiData {
  return {
    totalOrders: raw.totalOrders,
    totalCost: raw.totalCost,
    totalOrdersGrowthMoM:
      raw.totalOrdersGrowthMoM !== null
        ? Math.round(raw.totalOrdersGrowthMoM * 10) / 10
        : null,
    totalCostGrowthMoM:
      raw.totalCostGrowthMoM !== null
        ? Math.round(raw.totalCostGrowthMoM * 10) / 10
        : null,
    previousMonthOrders: raw.previousMonthOrders,
    previousMonthCost: raw.previousMonthCost,
  };
}

/**
 * Transform daily aggregates
 * Data đã được sort ASC từ repo, không có rank
 */
export function mapDailyData(
  raw: RawDailyData[],
  totalCost: number
): DailyLaboData[] {
  return raw.map((item) => ({
    id: item.date.toISOString().split("T")[0],
    date: item.date.toLocaleDateString("vi-VN"),
    orderCount: item.orderCount,
    totalCost: item.totalCost,
    percentage:
      totalCost > 0 ? Math.round((item.totalCost / totalCost) * 1000) / 10 : 0,
  }));
}

/**
 * Transform supplier aggregates
 * Rank đã được assign từ repo
 */
export function mapSupplierData(
  raw: RawSupplierData[],
  totalCost: number
): SupplierLaboData[] {
  return raw.map((item) => ({
    id: item.supplierId,
    supplierId: item.supplierId,
    supplierShortName: item.supplierShortName,
    orderCount: item.orderCount,
    totalCost: item.totalCost,
    percentage:
      totalCost > 0 ? Math.round((item.totalCost / totalCost) * 1000) / 10 : 0,
    rank: item.rank,
  }));
}

/**
 * Transform doctor aggregates
 * Rank đã được assign từ repo
 */
export function mapDoctorData(
  raw: RawDoctorData[],
  totalCost: number
): DoctorLaboData[] {
  return raw.map((item) => ({
    id: item.doctorId,
    doctorId: item.doctorId,
    doctorName: item.doctorName,
    orderCount: item.orderCount,
    totalCost: item.totalCost,
    percentage:
      totalCost > 0 ? Math.round((item.totalCost / totalCost) * 1000) / 10 : 0,
    rank: item.rank,
  }));
}

/**
 * Transform service aggregates
 * Rank đã được assign từ repo
 */
export function mapServiceData(
  raw: RawServiceData[],
  totalCost: number
): ServiceLaboData[] {
  return raw.map((item) => ({
    id: item.serviceId,
    serviceId: item.serviceId,
    serviceName: item.serviceName,
    supplierShortName: item.supplierShortName,
    itemName: item.itemName,
    orderCount: item.orderCount,
    totalCost: item.totalCost,
    percentage:
      totalCost > 0 ? Math.round((item.totalCost / totalCost) * 1000) / 10 : 0,
    rank: item.rank,
  }));
}

/**
 * Transform detail records (nested structure, không flatten)
 */
export function mapDetailRecords(
  raw: Awaited<ReturnType<typeof laboReportRepo.queryAllOrders>>
): LaboOrderDetailRecord[] {
  return raw.map((item) => ({
    id: item.id,
    sentDate: item.sentDate.toISOString(),
    sentDateDisplay: item.sentDate.toLocaleDateString("vi-VN"),
    returnDate: item.returnDate ? item.returnDate.toISOString() : null,
    returnDateDisplay: item.returnDate
      ? item.returnDate.toLocaleDateString("vi-VN")
      : null,
    customerName: item.customer.fullName,
    customerCode: item.customer.customerCode,
    customerId: item.customer.id,
    doctorName: item.doctor.fullName,
    serviceName: item.laboService?.laboItem.name || "N/A",
    supplierShortName: item.supplier.shortName,
    itemName: item.laboItem.name,
    orderType: item.orderType,
    quantity: item.quantity,
    totalCost: item.totalCost,
    treatmentDate: item.treatmentDate ? item.treatmentDate.toISOString() : null,
    treatmentDateDisplay: item.treatmentDate
      ? item.treatmentDate.toLocaleDateString("vi-VN")
      : null,
  }));
}
