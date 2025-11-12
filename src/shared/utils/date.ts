// src/shared/utils/date.ts
import dayjs from "dayjs";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function formatDateVN(date: string | Date): string {
  return dayjs(date).format("DD/MM/YYYY");
}

export function formatDateTimeVN(date: string | Date): string {
  return dayjs(date).format("DD/MM/YYYY HH:mm");
}
