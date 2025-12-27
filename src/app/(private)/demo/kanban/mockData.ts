import { KanbanColumnDef } from "@/shared/components/Kanban";

export interface MockDeal {
  id: string;
  customerName: string;
  serviceName: string;
  amount: number;
  stage: string;
  priority: "High" | "Medium" | "Low";
  createdAt: string;
}

export const MOCK_STAGES: KanbanColumnDef[] = [
  { key: "NEW", label: "Mới", color: "#1890ff" },
  { key: "CONTACTED", label: "Đã liên hệ", color: "#13c2c2" },
  { key: "CONSULTING", label: "Đang tư vấn", color: "#faad14" },
  { key: "QUOTED", label: "Đã báo giá", color: "#722ed1" },
  { key: "WON", label: "Thành công", color: "#52c41a" },
  { key: "LOST", label: "Thất bại", color: "#f5222d", collapsible: true },
];

export const INITIAL_DEALS: MockDeal[] = [
  {
    id: "1",
    customerName: "Nguyễn Văn A",
    serviceName: "Niềng răng Invisalign",
    amount: 80000000,
    stage: "NEW",
    priority: "High",
    createdAt: "2023-10-01",
  },
  {
    id: "2",
    customerName: "Trần Thị B",
    serviceName: "Trám răng thẩm mỹ",
    amount: 1500000,
    stage: "NEW",
    priority: "Medium",
    createdAt: "2023-10-02",
  },
  {
    id: "3",
    customerName: "Lê Văn C",
    serviceName: "Bọc răng sứ",
    amount: 25000000,
    stage: "CONTACTED",
    priority: "High",
    createdAt: "2023-10-03",
  },
  {
    id: "4",
    customerName: "Phạm Văn D",
    serviceName: "Nhổ răng khôn",
    amount: 2000000,
    stage: "CONSULTING",
    priority: "Low",
    createdAt: "2023-10-04",
  },
  {
    id: "5",
    customerName: "Hoàng Thị E",
    serviceName: "Tẩy trắng răng",
    amount: 3000000,
    stage: "QUOTED",
    priority: "Medium",
    createdAt: "2023-10-05",
  },
  {
    id: "6",
    customerName: "Vũ Văn F",
    serviceName: "Trồng răng Implant",
    amount: 45000000,
    stage: "WON",
    priority: "High",
    createdAt: "2023-10-06",
  },
  {
    id: "7",
    customerName: "Đặng Thị G",
    serviceName: "Niềng răng mắc cài",
    amount: 35000000,
    stage: "LOST",
    priority: "Medium",
    createdAt: "2023-10-07",
  },
];

export const generateMoreDeals = (stage: string, count: number): MockDeal[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `more-${stage}-${Date.now()}-${i}`,
    customerName: `Khách hàng ${stage} ${i + 1}`,
    serviceName: "Dịch vụ nha khoa",
    amount: Math.floor(Math.random() * 50000000),
    stage: stage,
    priority: ["High", "Medium", "Low"][Math.floor(Math.random() * 3)] as
      | "High"
      | "Medium"
      | "Low",
    createdAt: new Date().toISOString().split("T")[0],
  }));
};
