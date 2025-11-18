import type {
  KpiData,
  DailyDetailData,
  SourceDetailData,
  ServiceDetailData,
  SaleDetailData,
  DoctorDetailData,
  ConsultedServiceDetail,
} from "@/shared/validation/sales-report.schema";
import type {
  RawDailyData,
  RawSourceData,
  RawServiceData,
  RawEmployeeData,
} from "@/server/repos/sales-report.repo";
import { CUSTOMER_SOURCES } from "@/features/customers/constants";
import dayjs from "dayjs";

/**
 * Input type từ Repository layer
 */
type RawKpiData = {
  totalSales: number;
  totalSalesGrowthMoM: number;
  totalSalesGrowthYoY: number;
  closedDeals: number;
  closedDealsGrowthMoM: number;
  closedDealsGrowthYoY: number;
  newCustomers: number;
  newCustomersGrowthMoM: number;
  newCustomersGrowthYoY: number;
  newCustomerSales: number;
  oldCustomerSales: number;
  newCustomerGrowth: number;
};

type RawDetailRecord = {
  id: string;
  consultationDate: Date;
  serviceConfirmDate: Date | null;
  finalPrice: number;
  serviceStatus: string;
  customer: {
    id: string;
    fullName: string;
    phone: string | null;
    source: string | null;
  };
  dentalService: {
    id: string;
    name: string;
    serviceGroup: string | null;
  };
  consultingSale: {
    id: string;
    fullName: string;
  } | null;
  consultingDoctor: {
    id: string;
    fullName: string;
  } | null;
};

/**
 * Chuyển đổi dữ liệu KPI từ repo sang response format
 * Làm tròn các % tăng trưởng về 1 chữ số thập phân
 */
export function mapKpiData(kpiData: RawKpiData): KpiData {
  return {
    totalSales: kpiData.totalSales,
    totalSalesGrowthMoM: Math.round(kpiData.totalSalesGrowthMoM * 10) / 10,
    totalSalesGrowthYoY: Math.round(kpiData.totalSalesGrowthYoY * 10) / 10,
    closedDeals: kpiData.closedDeals,
    closedDealsGrowthMoM: Math.round(kpiData.closedDealsGrowthMoM * 10) / 10,
    closedDealsGrowthYoY: Math.round(kpiData.closedDealsGrowthYoY * 10) / 10,
    newCustomers: kpiData.newCustomers,
    newCustomersGrowthMoM: Math.round(kpiData.newCustomersGrowthMoM * 10) / 10,
    newCustomersGrowthYoY: Math.round(kpiData.newCustomersGrowthYoY * 10) / 10,
    newCustomerSales: kpiData.newCustomerSales,
    oldCustomerSales: kpiData.oldCustomerSales,
    newCustomerGrowth: Math.round(kpiData.newCustomerGrowth * 10) / 10,
  };
}

/**
 * Chuyển đổi dữ liệu theo ngày từ repo sang response format
 * Tính toán ranking dựa trên doanh thu, sau đó sắp xếp lại theo ngày
 */
export function mapDailyData(
  dailyData: RawDailyData[],
  totalRevenue: number
): DailyDetailData[] {
  const byDateWithRank: DailyDetailData[] = dailyData
    .map((d) => ({
      id: d.date,
      date: dayjs(d.date).format("DD/MM/YYYY"),
      rank: 0, // Sẽ được gán ở bước sau
      customersVisited: d.customersVisited,
      consultations: d.consultations,
      closed: d.closed,
      revenue: d.revenue,
      closingRate:
        d.consultations > 0
          ? Math.round((d.closed / d.consultations) * 1000) / 10
          : 0,
      averagePerService: d.closed > 0 ? Math.round(d.revenue / d.closed) : 0,
      revenuePercentage:
        totalRevenue > 0
          ? Math.round((d.revenue / totalRevenue) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue) // Sắp xếp theo doanh thu giảm dần để gán rank
    .map((item, index) => ({ ...item, rank: index + 1 })) // Gán rank
    .sort((a, b) => a.id.localeCompare(b.id)); // Sắp xếp lại theo ngày tăng dần

  return byDateWithRank;
}

/**
 * Chuyển đổi dữ liệu theo nguồn khách từ repo sang response format
 * Tra cứu label từ CUSTOMER_SOURCES constants
 */
export function mapSourceData(
  sourceData: RawSourceData[],
  totalRevenue: number
): SourceDetailData[] {
  return sourceData
    .map((s) => {
      const sourceValue = s.source;
      let sourceLabel = "Không rõ nguồn";
      if (sourceValue) {
        const sourceConfig = CUSTOMER_SOURCES.find(
          (cs) => cs.value === sourceValue
        );
        sourceLabel = sourceConfig?.label || sourceValue;
      }
      return {
        id: sourceValue || "null",
        source: sourceLabel,
        customersVisited: s.customersVisited,
        consultations: s.consultations,
        closed: s.closed,
        revenue: s.revenue,
        closingRate:
          s.consultations > 0
            ? Math.round((s.closed / s.consultations) * 1000) / 10
            : 0,
        averagePerService: s.closed > 0 ? Math.round(s.revenue / s.closed) : 0,
        revenuePercentage:
          totalRevenue > 0
            ? Math.round((s.revenue / totalRevenue) * 1000) / 10
            : 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

/**
 * Chuyển đổi dữ liệu theo nhóm dịch vụ từ repo sang response format
 */
export function mapServiceData(
  serviceData: RawServiceData[],
  totalRevenue: number
): ServiceDetailData[] {
  return serviceData
    .map((s) => ({
      id: s.serviceGroup || "null",
      service: s.serviceGroup || "Không rõ nhóm dịch vụ",
      customersVisited: s.customersVisited,
      consultations: s.consultations,
      closed: s.closed,
      revenue: s.revenue,
      closingRate:
        s.consultations > 0
          ? Math.round((s.closed / s.consultations) * 1000) / 10
          : 0,
      averagePerService: s.closed > 0 ? Math.round(s.revenue / s.closed) : 0,
      revenuePercentage:
        totalRevenue > 0
          ? Math.round((s.revenue / totalRevenue) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

/**
 * Chuyển đổi dữ liệu hiệu suất nhân viên tư vấn từ repo sang response format
 */
export function mapSaleData(
  saleData: RawEmployeeData[],
  totalRevenue: number
): SaleDetailData[] {
  return saleData
    .map((s) => ({
      id: s.id,
      saleName: s.fullName,
      customersVisited: s.customersVisited,
      consultations: s.consultations,
      closed: s.closed,
      revenue: s.revenue,
      closingRate:
        s.consultations > 0
          ? Math.round((s.closed / s.consultations) * 1000) / 10
          : 0,
      averagePerService: s.closed > 0 ? Math.round(s.revenue / s.closed) : 0,
      revenuePercentage:
        totalRevenue > 0
          ? Math.round((s.revenue / totalRevenue) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

/**
 * Chuyển đổi dữ liệu hiệu suất bác sĩ tư vấn từ repo sang response format
 */
export function mapDoctorData(
  doctorData: RawEmployeeData[],
  totalRevenue: number
): DoctorDetailData[] {
  return doctorData
    .map((d) => ({
      id: d.id,
      doctorName: d.fullName,
      customersVisited: d.customersVisited,
      consultations: d.consultations,
      closed: d.closed,
      revenue: d.revenue,
      closingRate:
        d.consultations > 0
          ? Math.round((d.closed / d.consultations) * 1000) / 10
          : 0,
      averagePerService: d.closed > 0 ? Math.round(d.revenue / d.closed) : 0,
      revenuePercentage:
        totalRevenue > 0
          ? Math.round((d.revenue / totalRevenue) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

/**
 * Chuyển đổi chi tiết các dịch vụ tư vấn từ repo sang response format
 * Dùng cho detail panel khi click vào một dimension cụ thể
 */
export function mapDetailRecords(
  services: RawDetailRecord[]
): ConsultedServiceDetail[] {
  return services.map((service) => ({
    id: service.id,
    consultationDate: service.consultationDate.toISOString(),
    serviceConfirmDate: service.serviceConfirmDate?.toISOString() || null,
    finalPrice: service.finalPrice,
    serviceStatus: service.serviceStatus,
    customer: {
      id: service.customer.id,
      fullName: service.customer.fullName,
      phone: service.customer.phone,
      source: service.customer.source,
    },
    dentalService: {
      id: service.dentalService.id,
      name: service.dentalService.name,
      serviceGroup: service.dentalService.serviceGroup,
    },
    consultingSale: service.consultingSale
      ? {
          id: service.consultingSale.id,
          fullName: service.consultingSale.fullName,
        }
      : null,
    consultingDoctor: service.consultingDoctor
      ? {
          id: service.consultingDoctor.id,
          fullName: service.consultingDoctor.fullName,
        }
      : null,
  }));
}
