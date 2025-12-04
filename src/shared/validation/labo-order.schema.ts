// src/shared/validation/labo-order.schema.ts
import { z } from "zod";

/**
 * Labo Order Base Schema
 * Dùng làm nền cho Create và Update schemas
 */
export const LaboOrderBaseSchema = z.object({
  customerId: z
    .string({ message: "Vui lòng chọn khách hàng" })
    .min(1, "Vui lòng chọn khách hàng"),
  doctorId: z
    .string({ message: "Vui lòng chọn bác sĩ" })
    .min(1, "Vui lòng chọn bác sĩ"),
  supplierId: z
    .string({ message: "Vui lòng chọn xưởng" })
    .min(1, "Vui lòng chọn xưởng"),
  laboItemId: z
    .string({ message: "Vui lòng chọn loại răng giả" })
    .min(1, "Vui lòng chọn loại răng giả"),
  quantity: z
    .number({ message: "Vui lòng nhập số lượng" })
    .int("Số lượng phải là số nguyên")
    .positive("Số lượng phải lớn hơn 0")
    .max(100, "Số lượng tối đa là 100"),
  sendDate: z
    .string({ message: "Vui lòng chọn ngày gửi" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày gửi không đúng định dạng"),
  expectedFitDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày dự kiến lắp không đúng định dạng")
    .optional()
    .nullable(),
  detailRequirement: z
    .string()
    .max(1000, "Ghi chú tối đa 1000 ký tự")
    .optional()
    .nullable(),
});

/**
 * Create Labo Order Request Schema
 * Dùng ở: Form create + Server Action
 */
export const CreateLaboOrderRequestSchema = LaboOrderBaseSchema;

/**
 * Create Labo Order Form Schema
 * Dùng ở: Form create (React Hook Form)
 * Date fields là strings để tương thích với DatePicker
 */
export const CreateLaboOrderFormSchema = z.object({
  customerId: z
    .string({ message: "Vui lòng chọn khách hàng" })
    .min(1, "Vui lòng chọn khách hàng"),
  doctorId: z
    .string({ message: "Vui lòng chọn bác sĩ" })
    .min(1, "Vui lòng chọn bác sĩ"),
  supplierId: z
    .string({ message: "Vui lòng chọn xưởng" })
    .min(1, "Vui lòng chọn xưởng"),
  laboItemId: z
    .string({ message: "Vui lòng chọn loại răng giả" })
    .min(1, "Vui lòng chọn loại răng giả"),
  quantity: z
    .number({ message: "Vui lòng nhập số lượng" })
    .int("Số lượng phải là số nguyên")
    .positive("Số lượng phải lớn hơn 0")
    .max(100, "Số lượng tối đa là 100"),
  sendDate: z
    .string({ message: "Vui lòng chọn ngày gửi" })
    .min(1, "Vui lòng chọn ngày gửi"),
  expectedFitDate: z.string().optional().nullable(),
  detailRequirement: z
    .string()
    .max(1000, "Ghi chú tối đa 1000 ký tự")
    .optional()
    .nullable(),
});

/**
 * Update Labo Order Request Schema
 * Chỉ cho phép cập nhật một số fields
 * KHÔNG cho phép thay đổi pricing snapshot và receivedById
 */
export const UpdateLaboOrderRequestSchema = z.object({
  id: z.string({ message: "ID không hợp lệ" }),
  quantity: z
    .number({ message: "Vui lòng nhập số lượng" })
    .int("Số lượng phải là số nguyên")
    .positive("Số lượng phải lớn hơn 0")
    .max(100, "Số lượng tối đa là 100")
    .optional(),
  sendDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày gửi không đúng định dạng")
    .optional(),
  expectedFitDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày dự kiến lắp không đúng định dạng")
    .optional()
    .nullable(),
  detailRequirement: z
    .string()
    .max(1000, "Ghi chú tối đa 1000 ký tự")
    .optional()
    .nullable(),
});

/**
 * Daily Labo Order Response Schema
 * Dùng ở: API GET /api/v1/labo-orders/daily
 * Bao gồm nested objects (customer, doctor, supplier, laboItem)
 */
export const DailyLaboOrderResponseSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  doctorId: z.string().uuid(),
  supplierId: z.string().uuid(),
  laboItemId: z.string().uuid(),
  clinicId: z.string().uuid(),

  // Pricing snapshot
  unitPrice: z.number(),
  quantity: z.number(),
  totalCost: z.number(),
  warranty: z.string(),

  // Dates
  sendDate: z.string(), // ISO date string
  returnDate: z.string().nullable(),
  expectedFitDate: z.string().nullable(),

  // Details
  // Details
  detailRequirement: z.string().nullable(),

  // Tracking
  receivedById: z.string().uuid().nullable(),
  updatedAt: z.string().datetime(),

  // Nested objects
  customer: z.object({
    id: z.string().uuid(),
    fullName: z.string(),
    customerCode: z.string().nullable(),
  }),

  doctor: z.object({
    id: z.string().uuid(),
    fullName: z.string(),
  }),

  supplier: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),

  laboItem: z.object({
    id: z.string().uuid(),
    name: z.string(),
    serviceGroup: z.string(),
    serviceGroupLabel: z.string().optional(), // Will be resolved by frontend from MasterData
    unit: z.string(),
  }),

  receivedBy: z
    .object({
      id: z.string().uuid(),
      fullName: z.string(),
    })
    .nullable()
    .optional(),

  createdBy: z
    .object({
      id: z.string().uuid(),
      fullName: z.string(),
    })
    .nullable()
    .optional(),

  updatedBy: z
    .object({
      id: z.string().uuid(),
      fullName: z.string(),
    })
    .nullable()
    .optional(),
});

/**
 * Get Daily Labo Orders Query Schema
 * Dùng ở: API GET /api/v1/labo-orders/daily
 */
export const GetDailyLaboOrdersQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không đúng định dạng YYYY-MM-DD"),
  type: z.enum(["sent", "returned"]),
  clinicId: z.string().uuid("ID phòng khám không hợp lệ").optional(),
});

/**
 * Receive Labo Order Request Schema
 * Dùng ở: Server Action receiveLaboOrderAction
 */
export const ReceiveLaboOrderRequestSchema = z.object({
  orderId: z.string().uuid("ID đơn hàng không hợp lệ"),
});

/** Types */
export type CreateLaboOrderRequest = z.infer<
  typeof CreateLaboOrderRequestSchema
>;
export type CreateLaboOrderFormData = z.infer<typeof CreateLaboOrderFormSchema>;
export type UpdateLaboOrderRequest = z.infer<
  typeof UpdateLaboOrderRequestSchema
>;
export type DailyLaboOrderResponse = z.infer<
  typeof DailyLaboOrderResponseSchema
>;
export type GetDailyLaboOrdersQuery = z.infer<
  typeof GetDailyLaboOrdersQuerySchema
>;
export type ReceiveLaboOrderRequest = z.infer<
  typeof ReceiveLaboOrderRequestSchema
>;
