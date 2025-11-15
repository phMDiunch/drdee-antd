// Types for Sales Dashboard

export interface DashboardFilters {
  month: string | null;
  clinicId: string | null;
  saleId: string | null;
  doctorId: string | null;
}

export interface KpiData {
  totalSales: number;
  closedDeals: number;
  averagePerDeal: number;
  newCustomerRevenue: number;
  returningCustomerRevenue: number;
  salesGrowth: number;
  dealsGrowth: number;
  averageGrowth: number;
  newCustomerGrowth: number;
}

export interface DailyRevenueData {
  date: string;
  revenue: number;
}

export interface RevenueBySourceData {
  source: string;
  revenue: number;
}

export interface RevenueByServiceData {
  serviceName: string;
  revenue: number;
}

export interface SalePerformanceData {
  id: string;
  rank: number;
  saleName: string;
  assignedCases: number;
  consultedCases: number;
  closedCases: number;
  revenue: number;
  averagePerCase: number;
  closingRate: number;
}

export interface DailyDetailData {
  date: string;
  arrivals: number;
  consultations: number;
  closed: number;
  revenue: number;
  avgPerCase: number;
  topService: string;
  topSale: string;
  topDoctor: string;
}

export interface SourceDetailData {
  source: string;
  arrivals: number;
  consultations: number;
  closed: number;
  revenue: number;
  roi: number;
}

export interface ServiceDetailData {
  category: string;
  revenue: number;
  closed: number;
  avgValue: number;
  contribution: number;
}

export interface SaleDetailData {
  name: string;
  assigned: number;
  consulted: number;
  closed: number;
  revenue: number;
  closingRate: number;
  mainService: string;
}

export interface DoctorDetailData {
  name: string;
  consulted: number;
  agreed: number;
  closed: number;
  revenue: number;
  agreementRate: number;
}

export interface DetailTabsData {
  byDate: DailyDetailData[];
  bySource: SourceDetailData[];
  byService: ServiceDetailData[];
  bySale: SaleDetailData[];
  byDoctor: DoctorDetailData[];
}

export interface DashboardData {
  kpi: KpiData;
  dailyRevenue: DailyRevenueData[];
  revenueBySource: RevenueBySourceData[];
  revenueByService: RevenueByServiceData[];
  salesPerformance: SalePerformanceData[];
  detailTabs: DetailTabsData;
}
