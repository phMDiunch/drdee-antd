import type { Transaction, PaymentType, CustomerSource } from "./types";
import dayjs from "dayjs";

// Generate mock transactions for a month
function generateMockTransactions(month: string): Transaction[] {
  const transactions: Transaction[] = [];
  const startDate = dayjs(month);
  const daysInMonth = startDate.daysInMonth();

  const paymentTypes: PaymentType[] = ["cash", "card", "visa", "transfer"];
  const sources: CustomerSource[] = [
    "facebook",
    "tiktok",
    "referral",
    "walkin",
    "online",
  ];

  const services = [
    { id: "s1", name: "Tẩy trắng răng", group: "Thẩm mỹ" },
    { id: "s2", name: "Niềng răng invisalign", group: "Chỉnh nha" },
    { id: "s3", name: "Cấy ghép implant", group: "Phục hồi" },
    { id: "s4", name: "Trám răng thẩm mỹ", group: "Phục hồi" },
    { id: "s5", name: "Nhổ răng khôn", group: "Nha khoa tổng quát" },
    { id: "s6", name: "Bọc răng sứ", group: "Thẩm mỹ" },
    { id: "s7", name: "Lấy cao răng", group: "Nha khoa tổng quát" },
    { id: "s8", name: "Điều trị tủy", group: "Nội nha" },
    { id: "s9", name: "Niềng răng mắc cài", group: "Chỉnh nha" },
    { id: "s10", name: "Tư vấn tổng quát", group: "Nha khoa tổng quát" },
  ];

  const doctors = [
    { id: "d1", name: "BS. Nguyễn Văn A" },
    { id: "d2", name: "BS. Trần Thị B" },
    { id: "d3", name: "BS. Lê Văn C" },
    { id: "d4", name: "BS. Phạm Thị D" },
    { id: "d5", name: "BS. Hoàng Văn E" },
  ];

  const sales = [
    { id: "sale1", name: "Sale Nguyễn F" },
    { id: "sale2", name: "Sale Trần G" },
    { id: "sale3", name: "Sale Lê H" },
  ];

  // Generate 200-400 transactions for the month
  const txCount = 250 + Math.floor(Math.random() * 150);

  for (let i = 0; i < txCount; i++) {
    const day = Math.floor(Math.random() * daysInMonth) + 1;
    const date = startDate.date(day).format("YYYY-MM-DD");

    const service = services[Math.floor(Math.random() * services.length)];
    const doctor = doctors[Math.floor(Math.random() * doctors.length)];
    const sale = sales[Math.floor(Math.random() * sales.length)];
    const paymentType =
      paymentTypes[Math.floor(Math.random() * paymentTypes.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];

    // Revenue varies by service type
    let baseAmount = 500000;
    if (service.group === "Chỉnh nha") baseAmount = 15000000;
    else if (service.group === "Phục hồi") baseAmount = 8000000;
    else if (service.group === "Thẩm mỹ") baseAmount = 5000000;
    else if (service.group === "Nội nha") baseAmount = 2000000;

    const amount = baseAmount + Math.floor(Math.random() * baseAmount * 0.5);

    transactions.push({
      id: `tx-${month}-${i + 1}`,
      date,
      amount,
      paymentType,
      source,
      serviceId: service.id,
      serviceName: service.name,
      serviceGroup: service.group,
      doctorId: doctor.id,
      doctorName: doctor.name,
      saleId: sale.id,
      saleName: sale.name,
      customerId: `c-${i + 1}`,
      customerName: `Khách hàng ${i + 1}`,
    });
  }

  return transactions.sort((a, b) => a.date.localeCompare(b.date));
}

// Default mock data for current month
export const mockTransactions = generateMockTransactions(
  dayjs().format("YYYY-MM")
);

// Previous month data for comparison
export const mockPreviousMonthTransactions = generateMockTransactions(
  dayjs().subtract(1, "month").format("YYYY-MM")
);

// Export function to generate data for any month
export function getMockTransactionsForMonth(month: string): Transaction[] {
  return generateMockTransactions(month);
}

// Helper to get previous month data
export function getPreviousMonthData(month: string): Transaction[] {
  const prevMonth = dayjs(month).subtract(1, "month").format("YYYY-MM");
  return generateMockTransactions(prevMonth);
}
