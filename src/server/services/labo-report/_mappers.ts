import dayjs from "dayjs";
import type {
  RawKpiData,
  RawDailyData,
  RawSupplierData,
  RawDoctorData,
  RawServiceData,
  RawDetailRecord,
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
  // Tính MoM growth
  const totalOrdersGrowthMoM =
    raw.previousMonthOrders && raw.previousMonthOrders > 0
      ? ((raw.totalOrders - raw.previousMonthOrders) /
          raw.previousMonthOrders) *
        100
      : null;

  const totalCostGrowthMoM =
    raw.previousMonthCost && raw.previousMonthCost > 0
      ? ((raw.totalCost - raw.previousMonthCost) / raw.previousMonthCost) * 100
      : null;

  return {
    totalOrders: raw.totalOrders,
    totalCost: raw.totalCost,
    totalOrdersGrowthMoM,
    totalCostGrowthMoM,
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
    id: dayjs(item.date).format("YYYY-MM-DD"),
    date: dayjs(item.date).format("DD/MM/YYYY"),
    orderCount: item.orderCount,
    totalCost: item.totalCost,
    percentage: totalCost > 0 ? (item.totalCost / totalCost) * 100 : 0,
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
    supplierName: item.supplierName,
    orderCount: item.orderCount,
    totalCost: item.totalCost,
    avgCost: item.avgCost,
    percentage: totalCost > 0 ? (item.totalCost / totalCost) * 100 : 0,
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
    percentage: totalCost > 0 ? (item.totalCost / totalCost) * 100 : 0,
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
    supplierName: item.supplierName,
    itemName: item.itemName,
    orderCount: item.orderCount,
    totalCost: item.totalCost,
    percentage: totalCost > 0 ? (item.totalCost / totalCost) * 100 : 0,
    rank: item.rank,
  }));
}

/**
 * Transform detail records
 */
export function mapDetailRecords(
  raw: RawDetailRecord[]
): LaboOrderDetailRecord[] {
  return raw.map((item) => ({
    id: item.id,
    sendDate: item.sendDate.toISOString(),
    sendDateDisplay: dayjs(item.sendDate).format("DD/MM/YYYY"),
    returnDate: item.returnDate ? item.returnDate.toISOString() : null,
    returnDateDisplay: item.returnDate
      ? dayjs(item.returnDate).format("DD/MM/YYYY")
      : null,
    customerName: item.customerName,
    customerCode: item.customerCode,
    customerId: item.customerId,
    doctorName: item.doctorName,
    serviceName: item.serviceName || "N/A",
    supplierName: item.supplierName,
    itemName: item.itemName,
    orderType: item.orderType,
    quantity: item.quantity,
    totalCost: item.totalCost,
    treatmentDate: item.treatmentDate ? item.treatmentDate.toISOString() : null,
    treatmentDateDisplay: item.treatmentDate
      ? dayjs(item.treatmentDate).format("DD/MM/YYYY")
      : null,
  }));
}
