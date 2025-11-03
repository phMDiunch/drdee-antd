import { z } from "zod";
import {
  CustomerResponseSchema,
  CustomerDailyResponseSchema,
} from "@/shared/validation/customer.schema";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

// Create response schema for daily list
const CustomersListResponseSchema = z.object({
  items: z.array(CustomerResponseSchema),
  count: z.number(),
});

// Response schema when includeAppointments=true
const CustomersDailyResponseSchema = z.object({
  items: z.array(CustomerDailyResponseSchema),
  count: z.number(),
});

export type GetCustomersDailyParams = {
  date?: string;
  clinicId?: string;
  includeAppointments?: boolean;
};

export async function getCustomersDailyApi(params?: GetCustomersDailyParams) {
  const query = new URLSearchParams();
  if (params?.date) query.set("date", params.date);
  if (params?.clinicId) query.set("clinicId", params.clinicId);
  if (params?.includeAppointments) query.set("includeAppointments", "true");
  const qs = query.toString();
  const url = qs ? `/api/v1/customers/daily?${qs}` : "/api/v1/customers/daily";

  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);

  // Use appropriate schema based on includeAppointments
  const schema = params?.includeAppointments
    ? CustomersDailyResponseSchema
    : CustomersListResponseSchema;

  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new Error("Danh sách khách hàng không hợp lệ.");
  return parsed.data;
}
