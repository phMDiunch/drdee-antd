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
import { prisma } from "@/services/prisma/prisma";
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
    sourceNotes: string | null;
    customerCode: string | null;
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
 * Data đã được sort by date ASC ở repo layer
 * Tính toán ranking dựa trên doanh thu (cần sort by revenue DESC)
 */
export function mapDailyData(
  dailyData: RawDailyData[],
  totalRevenue: number
): DailyDetailData[] {
  // Map sang format output
  const mapped = dailyData.map((d) => ({
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
      totalRevenue > 0 ? Math.round((d.revenue / totalRevenue) * 1000) / 10 : 0,
  }));

  // Sort by revenue DESC để gán rank
  const withRank = mapped
    .sort((a, b) => b.revenue - a.revenue)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  // Sort lại by date ASC để hiển thị theo thứ tự thời gian
  return withRank.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Chuyển đổi dữ liệu theo nguồn khách từ repo sang response format
 * Tra cứu label từ CUSTOMER_SOURCES constants
 * Data đã được sort by revenue DESC ở repo layer
 * Rank được gán dựa trên thứ tự trong array đã sort (1 = doanh số cao nhất)
 */
export function mapSourceData(
  sourceData: RawSourceData[],
  totalRevenue: number
): SourceDetailData[] {
  return sourceData.map((s, index) => {
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
      rank: index + 1,
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
  });
}

/**
 * Chuyển đổi dữ liệu theo nhóm dịch vụ từ repo sang response format
 * Data đã được sort by revenue DESC ở repo layer
 * Rank được gán dựa trên thứ tự trong array đã sort (1 = doanh số cao nhất)
 */
export function mapServiceData(
  serviceData: RawServiceData[],
  totalRevenue: number
): ServiceDetailData[] {
  return serviceData.map((s, index) => ({
    id: s.serviceGroup || "null",
    service: s.serviceGroup || "Không rõ nhóm dịch vụ",
    rank: index + 1,
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
      totalRevenue > 0 ? Math.round((s.revenue / totalRevenue) * 1000) / 10 : 0,
  }));
}

/**
 * Chuyển đổi dữ liệu hiệu suất nhân viên tư vấn từ repo sang response format
 * Data đã được sort by revenue DESC ở repo layer
 * Rank được gán dựa trên thứ tự trong array đã sort (1 = doanh số cao nhất)
 */
export function mapSaleData(
  saleData: RawEmployeeData[],
  totalRevenue: number
): SaleDetailData[] {
  return saleData.map((s, index) => ({
    id: s.id,
    saleName: s.fullName,
    rank: index + 1,
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
      totalRevenue > 0 ? Math.round((s.revenue / totalRevenue) * 1000) / 10 : 0,
  }));
}

/**
 * Chuyển đổi dữ liệu hiệu suất bác sĩ tư vấn từ repo sang response format
 * Data đã được sort by revenue DESC ở repo layer
 * Rank được gán dựa trên thứ tự trong array đã sort (1 = doanh số cao nhất)
 */
export function mapDoctorData(
  doctorData: RawEmployeeData[],
  totalRevenue: number
): DoctorDetailData[] {
  return doctorData.map((d, index) => ({
    id: d.id,
    doctorName: d.fullName,
    rank: index + 1,
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
      totalRevenue > 0 ? Math.round((d.revenue / totalRevenue) * 1000) / 10 : 0,
  }));
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
      sourceNotes: service.customer.sourceNotes,
      customerCode: service.customer.customerCode,
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

/**
 * Enrich detail records with resolved sourceNotes names
 * Converts IDs to display names for employee_referral and customer_referral
 *
 * Performance: Batch query để tránh N+1, immutable transformation
 */
export async function enrichDetailRecordsWithSourceNames(
  services: RawDetailRecord[]
): Promise<RawDetailRecord[]> {
  // Collect unique IDs for batch lookup
  const employeeIds = new Set<string>();
  const customerIds = new Set<string>();

  for (const service of services) {
    const { source, sourceNotes } = service.customer;
    if (!sourceNotes) continue;

    if (source === "employee_referral") {
      employeeIds.add(sourceNotes);
    } else if (source === "customer_referral") {
      customerIds.add(sourceNotes);
    }
  }

  // Batch fetch names (optimal: 2 queries max instead of N queries)
  const [employees, customers] = await Promise.all([
    employeeIds.size > 0
      ? prisma.employee.findMany({
          where: { id: { in: Array.from(employeeIds) } },
          select: { id: true, fullName: true },
        })
      : Promise.resolve([]),
    customerIds.size > 0
      ? prisma.customer.findMany({
          where: { id: { in: Array.from(customerIds) } },
          select: { id: true, fullName: true, customerCode: true },
        })
      : Promise.resolve([]),
  ]);

  // Build lookup maps
  const employeeNames = new Map(employees.map((emp) => [emp.id, emp.fullName]));
  const customerNames = new Map(
    customers.map((cust) => [
      cust.id,
      cust.customerCode
        ? `${cust.fullName} (${cust.customerCode})`
        : cust.fullName,
    ])
  );

  // Immutable transformation: return new array with enriched data
  return services.map((service) => {
    const { source, sourceNotes } = service.customer;
    if (!sourceNotes) return service;

    let enrichedSourceNotes = sourceNotes;

    if (source === "employee_referral" && employeeNames.has(sourceNotes)) {
      enrichedSourceNotes = employeeNames.get(sourceNotes)!;
    } else if (
      source === "customer_referral" &&
      customerNames.has(sourceNotes)
    ) {
      enrichedSourceNotes = customerNames.get(sourceNotes)!;
    }

    // Return new object if changed, same object if unchanged (performance)
    if (enrichedSourceNotes === sourceNotes) return service;

    return {
      ...service,
      customer: {
        ...service.customer,
        sourceNotes: enrichedSourceNotes,
      },
    };
  });
}
