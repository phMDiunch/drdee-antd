// Revenue Dashboard Types

export type PaymentType = "cash" | "card" | "visa" | "transfer";
export type CustomerSource =
  | "facebook"
  | "tiktok"
  | "referral"
  | "walkin"
  | "online";

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  paymentType: PaymentType;
  source: CustomerSource;
  serviceId: string;
  serviceName: string;
  serviceGroup: string;
  doctorId: string;
  doctorName: string;
  saleId?: string;
  saleName?: string;
  customerId: string;
  customerName: string;
}

export interface DailyRevenue {
  date: string;
  total: number;
  cash: number;
  card: number;
  visa: number;
  transfer: number;
  transactionCount: number;
  topService: string;
  topDoctor: string;
}

export interface PaymentMethodStats {
  type: PaymentType;
  label: string;
  transactionCount: number;
  revenue: number;
  percentage: number;
  avgPerTransaction: number;
}

export interface SourceRevenue {
  source: CustomerSource;
  label: string;
  transactionCount: number;
  revenue: number;
  percentage: number;
  avgValue: number;
  conversionRate?: number;
}

export interface ServiceRevenue {
  serviceId: string;
  serviceName: string;
  serviceGroup: string;
  transactionCount: number;
  revenue: number;
  percentage: number;
  avgValue: number;
}

export interface DoctorRevenue {
  doctorId: string;
  doctorName: string;
  caseCount: number;
  revenue: number;
  avgValue: number;
  closingRate?: number;
}

export interface RevenueKPI {
  totalRevenue: number;
  previousMonthRevenue: number;
  percentageChange: number;
  transactionCount: number;
  avgPerTransaction: number;
  paymentMethodBreakdown: {
    cash: number;
    card: number;
    visa: number;
    transfer: number;
  };
}

export interface DashboardFilters {
  month: string; // YYYY-MM
  clinicId?: string;
  sources?: CustomerSource[];
  saleId?: string;
  doctorId?: string;
}
