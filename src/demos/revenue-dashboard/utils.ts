import type {
  Transaction,
  DailyRevenue,
  PaymentMethodStats,
  SourceRevenue,
  ServiceRevenue,
  DoctorRevenue,
  RevenueKPI,
  PaymentType,
  CustomerSource,
} from "./types";
import dayjs from "dayjs";

// Payment type labels
const PAYMENT_LABELS: Record<PaymentType, string> = {
  cash: "Tiền mặt",
  card: "Quẹt thẻ thường",
  visa: "Quẹt Visa",
  transfer: "Chuyển khoản",
};

// Source labels
const SOURCE_LABELS: Record<CustomerSource, string> = {
  facebook: "Facebook",
  tiktok: "TikTok",
  referral: "Giới thiệu",
  walkin: "Walk-in",
  online: "Sale Online",
};

/**
 * Calculate KPI metrics from transactions
 */
export function calculateKPI(
  transactions: Transaction[],
  previousTransactions: Transaction[]
): RevenueKPI {
  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const previousMonthRevenue = previousTransactions.reduce(
    (sum, tx) => sum + tx.amount,
    0
  );

  const percentageChange =
    previousMonthRevenue > 0
      ? ((totalRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
      : 0;

  const avgPerTransaction =
    transactions.length > 0 ? totalRevenue / transactions.length : 0;

  // Payment method breakdown
  const paymentMethodBreakdown = {
    cash: 0,
    card: 0,
    visa: 0,
    transfer: 0,
  };

  transactions.forEach((tx) => {
    paymentMethodBreakdown[tx.paymentType] += tx.amount;
  });

  return {
    totalRevenue,
    previousMonthRevenue,
    percentageChange,
    transactionCount: transactions.length,
    avgPerTransaction,
    paymentMethodBreakdown,
  };
}

/**
 * Group transactions by day
 */
export function groupByDay(transactions: Transaction[]): DailyRevenue[] {
  const grouped = new Map<string, Transaction[]>();

  transactions.forEach((tx) => {
    if (!grouped.has(tx.date)) {
      grouped.set(tx.date, []);
    }
    grouped.get(tx.date)!.push(tx);
  });

  const dailyData: DailyRevenue[] = [];

  grouped.forEach((txs, date) => {
    const total = txs.reduce((sum, tx) => sum + tx.amount, 0);
    const cash = txs
      .filter((tx) => tx.paymentType === "cash")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const card = txs
      .filter((tx) => tx.paymentType === "card")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const visa = txs
      .filter((tx) => tx.paymentType === "visa")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const transfer = txs
      .filter((tx) => tx.paymentType === "transfer")
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Find top service and doctor
    const serviceCount = new Map<string, number>();
    const doctorCount = new Map<string, number>();

    txs.forEach((tx) => {
      serviceCount.set(
        tx.serviceName,
        (serviceCount.get(tx.serviceName) || 0) + tx.amount
      );
      doctorCount.set(
        tx.doctorName,
        (doctorCount.get(tx.doctorName) || 0) + tx.amount
      );
    });

    const topService =
      Array.from(serviceCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "";
    const topDoctor =
      Array.from(doctorCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "";

    dailyData.push({
      date,
      total,
      cash,
      card,
      visa,
      transfer,
      transactionCount: txs.length,
      topService,
      topDoctor,
    });
  });

  return dailyData.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate payment method statistics
 */
export function calculatePaymentMethodStats(
  transactions: Transaction[]
): PaymentMethodStats[] {
  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const grouped = new Map<PaymentType, Transaction[]>();

  transactions.forEach((tx) => {
    if (!grouped.has(tx.paymentType)) {
      grouped.set(tx.paymentType, []);
    }
    grouped.get(tx.paymentType)!.push(tx);
  });

  const stats: PaymentMethodStats[] = [];

  (["cash", "card", "visa", "transfer"] as PaymentType[]).forEach((type) => {
    const txs = grouped.get(type) || [];
    const revenue = txs.reduce((sum, tx) => sum + tx.amount, 0);
    const percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
    const avgPerTransaction = txs.length > 0 ? revenue / txs.length : 0;

    stats.push({
      type,
      label: PAYMENT_LABELS[type],
      transactionCount: txs.length,
      revenue,
      percentage,
      avgPerTransaction,
    });
  });

  return stats.sort((a, b) => b.revenue - a.revenue);
}

/**
 * Calculate revenue by customer source
 */
export function calculateSourceRevenue(
  transactions: Transaction[]
): SourceRevenue[] {
  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const grouped = new Map<CustomerSource, Transaction[]>();

  transactions.forEach((tx) => {
    if (!grouped.has(tx.source)) {
      grouped.set(tx.source, []);
    }
    grouped.get(tx.source)!.push(tx);
  });

  const stats: SourceRevenue[] = [];

  grouped.forEach((txs, source) => {
    const revenue = txs.reduce((sum, tx) => sum + tx.amount, 0);
    const percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
    const avgValue = txs.length > 0 ? revenue / txs.length : 0;

    stats.push({
      source,
      label: SOURCE_LABELS[source],
      transactionCount: txs.length,
      revenue,
      percentage,
      avgValue,
      conversionRate: 0, // Mock data doesn't have lead info
    });
  });

  return stats.sort((a, b) => b.revenue - a.revenue);
}

/**
 * Calculate revenue by service
 */
export function calculateServiceRevenue(
  transactions: Transaction[]
): ServiceRevenue[] {
  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const grouped = new Map<string, Transaction[]>();

  transactions.forEach((tx) => {
    const key = `${tx.serviceId}-${tx.serviceName}-${tx.serviceGroup}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(tx);
  });

  const stats: ServiceRevenue[] = [];

  grouped.forEach((txs, key) => {
    const [serviceId, serviceName, serviceGroup] = key.split("-");
    const revenue = txs.reduce((sum, tx) => sum + tx.amount, 0);
    const percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
    const avgValue = txs.length > 0 ? revenue / txs.length : 0;

    stats.push({
      serviceId,
      serviceName,
      serviceGroup,
      transactionCount: txs.length,
      revenue,
      percentage,
      avgValue,
    });
  });

  return stats.sort((a, b) => b.revenue - a.revenue);
}

/**
 * Calculate revenue by doctor
 */
export function calculateDoctorRevenue(
  transactions: Transaction[]
): DoctorRevenue[] {
  const grouped = new Map<string, Transaction[]>();

  transactions.forEach((tx) => {
    const key = `${tx.doctorId}-${tx.doctorName}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(tx);
  });

  const stats: DoctorRevenue[] = [];

  grouped.forEach((txs, key) => {
    const [doctorId, doctorName] = key.split("-");
    const revenue = txs.reduce((sum, tx) => sum + tx.amount, 0);
    const avgValue = txs.length > 0 ? revenue / txs.length : 0;

    stats.push({
      doctorId,
      doctorName,
      caseCount: txs.length,
      revenue,
      avgValue,
      closingRate: 0, // Mock data doesn't have consultation info
    });
  });

  return stats.sort((a, b) => b.revenue - a.revenue);
}

/**
 * Format currency VND
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format date
 */
export function formatDate(
  date: string,
  format: string = "DD/MM/YYYY"
): string {
  return dayjs(date).format(format);
}
