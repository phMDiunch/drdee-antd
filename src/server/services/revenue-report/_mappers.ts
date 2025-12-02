import type {
  RevenueKpiData,
  DailyRevenueData,
  SourceRevenueData,
  ServiceRevenueData,
  DoctorRevenueData,
  PaymentDetailRecord,
} from "@/shared/validation/revenue-report.schema";
import type { RawPaymentDetail } from "@/server/repos/revenue-report.repo";
import { CUSTOMER_SOURCES } from "@/features/customers/constants";
import dayjs from "dayjs";

/**
 * Input types from Repository layer
 */
type RawKpiData = {
  totalRevenue: number;
  cash: number;
  cardRegular: number;
  cardVisa: number;
  transfer: number;
  totalRevenueGrowthMoM: number | null;
  cashPercentage: number;
  cardRegularPercentage: number;
  cardVisaPercentage: number;
  transferPercentage: number;
  previousMonthRevenue: number;
};

type RawDailyData = {
  date: string;
  cash: number;
  cardRegular: number;
  cardVisa: number;
  transfer: number;
  totalRevenue: number;
};

type RawSourceData = {
  source: string;
  voucherCount: number;
  customerCount: number;
  totalRevenue: number;
};

type RawServiceData = {
  serviceId: string;
  serviceName: string;
  serviceGroup: string | null;
  totalRevenue: number;
  paymentPercentage: number;
  totalPaid: number;
  totalFinalPrice: number;
};

type RawDoctorData = {
  doctorId: string;
  doctorName: string;
  revenue: number;
};

/**
 * Chuyển đổi dữ liệu KPI từ repo sang response format
 * Làm tròn các phần trăm về 1 chữ số thập phân
 */
export function mapKpiData(kpiData: RawKpiData): RevenueKpiData {
  return {
    totalRevenue: kpiData.totalRevenue,
    cash: kpiData.cash,
    cardRegular: kpiData.cardRegular,
    cardVisa: kpiData.cardVisa,
    transfer: kpiData.transfer,
    totalRevenueGrowthMoM:
      kpiData.totalRevenueGrowthMoM !== null
        ? Math.round(kpiData.totalRevenueGrowthMoM * 10) / 10
        : null,
    cashPercentage: Math.round(kpiData.cashPercentage * 10) / 10,
    cardRegularPercentage: Math.round(kpiData.cardRegularPercentage * 10) / 10,
    cardVisaPercentage: Math.round(kpiData.cardVisaPercentage * 10) / 10,
    transferPercentage: Math.round(kpiData.transferPercentage * 10) / 10,
    previousMonthRevenue: kpiData.previousMonthRevenue,
  };
}

/**
 * Chuyển đổi dữ liệu theo ngày từ repo sang response format
 * Tính toán phần trăm dựa trên tổng doanh thu
 */
export function mapDailyData(
  dailyData: RawDailyData[],
  totalRevenue: number
): DailyRevenueData[] {
  return dailyData.map((d) => ({
    id: d.date,
    date: dayjs(d.date).format("DD/MM/YYYY"),
    cash: d.cash,
    cardRegular: d.cardRegular,
    cardVisa: d.cardVisa,
    transfer: d.transfer,
    totalRevenue: d.totalRevenue,
    percentage:
      totalRevenue > 0
        ? Math.round((d.totalRevenue / totalRevenue) * 1000) / 10
        : 0,
  }));
}

/**
 * Chuyển đổi dữ liệu theo nguồn khách từ repo sang response format
 * Tra cứu label từ CUSTOMER_SOURCES constants (giống Sales Report)
 */
export function mapSourceData(
  sourceData: RawSourceData[],
  totalRevenue: number
): SourceRevenueData[] {
  return sourceData.map((s) => {
    const sourceLabel =
      CUSTOMER_SOURCES.find((cs) => cs.value === s.source)?.label ||
      "Không rõ nguồn";

    return {
      id: s.source,
      source: sourceLabel,
      voucherCount: s.voucherCount,
      customerCount: s.customerCount,
      totalRevenue: s.totalRevenue,
      percentage:
        totalRevenue > 0
          ? Math.round((s.totalRevenue / totalRevenue) * 1000) / 10
          : 0,
    };
  });
}

/**
 * Chuyển đổi dữ liệu theo dịch vụ từ repo sang response format
 * Bao gồm payment percentage (aggregate)
 */
export function mapServiceData(
  serviceData: RawServiceData[],
  totalRevenue: number
): ServiceRevenueData[] {
  return serviceData.map((s) => ({
    id: s.serviceId,
    serviceId: s.serviceId,
    serviceName: s.serviceName,
    serviceGroup: s.serviceGroup,
    totalRevenue: s.totalRevenue,
    percentageOfTotal:
      totalRevenue > 0
        ? Math.round((s.totalRevenue / totalRevenue) * 1000) / 10
        : 0,
    paymentPercentage: s.paymentPercentage,
    totalPaid: s.totalPaid,
    totalFinalPrice: s.totalFinalPrice,
  }));
}

/**
 * Chuyển đổi dữ liệu hiệu suất bác sĩ điều trị từ repo sang response format
 */
export function mapDoctorData(
  doctorData: RawDoctorData[],
  totalRevenue: number
): DoctorRevenueData[] {
  return doctorData.map((d) => ({
    id: d.doctorId,
    doctorId: d.doctorId,
    doctorName: d.doctorName,
    totalRevenue: d.revenue,
    percentage:
      totalRevenue > 0 ? Math.round((d.revenue / totalRevenue) * 1000) / 10 : 0,
  }));
}

/**
 * Chuyển đổi payment detail records cho detail panel
 * Bao gồm payment percentage cho từng record
 */
export function mapDetailRecords(
  paymentDetails: RawPaymentDetail[],
  paymentAggregations: Map<string, number>
): PaymentDetailRecord[] {
  return paymentDetails.map((detail) => {
    const totalPaid = paymentAggregations.get(detail.consultedServiceId) || 0;
    const finalPrice = detail.consultedService.finalPrice;
    const paymentPercentage =
      finalPrice > 0 ? (totalPaid / finalPrice) * 100 : 0;

    return {
      id: detail.id,
      paymentDate: detail.paymentVoucher.paymentDate.toISOString(),
      paymentDateDisplay: dayjs(detail.paymentVoucher.paymentDate).format(
        "DD/MM/YYYY"
      ),
      serviceName: detail.consultedService.dentalService.name,
      customerName: detail.consultedService.customer.fullName,
      customerCode: detail.consultedService.customer.customerCode || "N/A",
      customerId: detail.consultedService.customer.id,
      treatingDoctorName:
        detail.consultedService.treatingDoctor?.fullName || null,
      toothPositions: detail.consultedService.toothPositions,
      quantity: detail.consultedService.quantity,
      amount: detail.amount,
      paymentPercentage: Math.round(paymentPercentage * 10) / 10,
      totalPaid,
      finalPrice,
      consultedServiceId: detail.consultedServiceId,
    };
  });
}
