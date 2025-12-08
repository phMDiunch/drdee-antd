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
  treatmentDate: z
    .string({ message: "Vui lòng chọn ngày điều trị" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày điều trị không đúng định dạng"),
  orderType: z
    .string({ message: "Vui lòng chọn loại đơn hàng" })
    .min(1, "Vui lòng chọn loại đơn hàng"),
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
  sentById: z
    .string({ message: "Vui lòng chọn người gửi mẫu" })
    .min(1, "Vui lòng chọn người gửi mẫu"),
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
  treatmentDate: z
    .string({ message: "Vui lòng chọn ngày điều trị" })
    .min(1, "Vui lòng chọn ngày điều trị"),
  orderType: z
    .string({ message: "Vui lòng chọn loại đơn hàng" })
    .min(1, "Vui lòng chọn loại đơn hàng"),
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
  sentById: z
    .string({ message: "Vui lòng chọn người gửi mẫu" })
    .min(1, "Vui lòng chọn người gửi mẫu"),
  expectedFitDate: z
    .string({ message: "Vui lòng chọn ngày hẹn lắp" })
    .min(1, "Vui lòng chọn ngày hẹn lắp"),
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
  // Basic fields (Employee + Admin)
  quantity: z
    .number({ message: "Vui lòng nhập số lượng" })
    .int("Số lượng phải là số nguyên")
    .positive("Số lượng phải lớn hơn 0")
    .max(100, "Số lượng tối đa là 100")
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
  // Admin-only fields (validated by permission layer)
  treatmentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày điều trị không đúng định dạng")
    .optional(),
  orderType: z
    .enum(["Làm mới", "Bảo hành"], {
      message: "Loại đơn hàng không hợp lệ",
    })
    .optional(),
  sentById: z.string().uuid("ID nhân viên gửi mẫu không hợp lệ").optional(),
  sendDate: z.string().datetime("Ngày gửi không đúng định dạng").optional(),
  returnDate: z
    .string()
    .datetime("Ngày nhận mẫu không đúng định dạng")
    .optional()
    .nullable(),
  receivedById: z
    .string()
    .uuid("ID nhân viên nhận mẫu không hợp lệ")
    .optional()
    .nullable(),
});

/**
 * Update Labo Order Form Schema
 * Dùng ở: Form update (React Hook Form)
 * Date fields là strings để tương thích với DatePicker
 * Admin can edit: treatmentDate, orderType, sentById, sendDate, returnDate
 * Employee can edit: quantity, expectedFitDate, detailRequirement only
 */
export const UpdateLaboOrderFormSchema = z.object({
  // Basic fields (Employee + Admin)
  quantity: z
    .number({ message: "Vui lòng nhập số lượng" })
    .int("Số lượng phải là số nguyên")
    .positive("Số lượng phải lớn hơn 0")
    .max(100, "Số lượng tối đa là 100"),
  expectedFitDate: z
    .string({ message: "Vui lòng chọn ngày hẹn lắp" })
    .min(1, "Vui lòng chọn ngày hẹn lắp"),
  detailRequirement: z
    .string()
    .max(1000, "Ghi chú tối đa 1000 ký tự")
    .optional(),
  // Admin-only fields
  treatmentDate: z.string().min(1, "Vui lòng chọn ngày điều trị"),
  orderType: z.enum(["Làm mới", "Bảo hành"], {
    message: "Loại đơn hàng không hợp lệ",
  }),
  sentById: z.string().uuid("ID nhân viên gửi mẫu không hợp lệ"),
  sendDate: z.string().min(1, "Vui lòng chọn ngày gửi mẫu"),
  returnDate: z.string().optional().nullable(),
  receivedById: z
    .string()
    .uuid("ID nhân viên nhận mẫu không hợp lệ")
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
  laboServiceId: z.string().uuid(), // Link to pricing record (audit trail)
  supplierId: z.string().uuid(),
  laboItemId: z.string().uuid(),
  clinicId: z.string().uuid(),

  // Treatment Info
  treatmentDate: z.string(), // Date string YYYY-MM-DD
  orderType: z.string(), // "lam-moi" | "bao-hanh"

  // Pricing snapshot
  unitPrice: z.number(),
  quantity: z.number(),
  totalCost: z.number(),
  warranty: z.string(),

  // Dates
  sendDate: z.string().datetime(), // ISO datetime string
  returnDate: z.string().datetime().nullable(),
  expectedFitDate: z.string().nullable(),

  // Details
  detailRequirement: z.string().nullable(),

  // Tracking
  sentById: z.string().uuid(),
  receivedById: z.string().uuid().nullable(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
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
    shortName: z.string().nullable(),
  }),

  laboItem: z.object({
    id: z.string().uuid(),
    name: z.string(),
    serviceGroup: z.string(),
    serviceGroupLabel: z.string().optional(), // Will be resolved by frontend from MasterData
    unit: z.string(),
  }),

  sentBy: z
    .object({
      id: z.string().uuid(),
      fullName: z.string(),
    })
    .nullable()
    .optional(),

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
export type UpdateLaboOrderFormData = z.infer<typeof UpdateLaboOrderFormSchema>;
export type DailyLaboOrderResponse = z.infer<
  typeof DailyLaboOrderResponseSchema
>;
export type GetDailyLaboOrdersQuery = z.infer<
  typeof GetDailyLaboOrdersQuerySchema
>;
export type ReceiveLaboOrderRequest = z.infer<
  typeof ReceiveLaboOrderRequestSchema
>;
