// src/shared/validation/labo-order.schema.ts
import { z } from "zod";

/**
 * ============================================================================
 * SHARED BASE SCHEMAS (Common Fields)
 * ============================================================================
 */

/**
 * Order Types
 */
export const ORDER_TYPES = ["Làm mới", "Bảo hành"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

/**
 * Labo Order Common Fields Schema
 * Base schema chứa tất cả fields shared giữa Frontend và Backend
 * - Frontend: Extend với fields phù hợp cho form
 * - Backend: Extend với coerced types và server metadata
 */
const LaboOrderCommonFieldsSchema = z.object({
  doctorId: z
    .string({ message: "Vui lòng chọn bác sĩ" })
    .min(1, "Vui lòng chọn bác sĩ"),
  treatmentDate: z
    .string({ message: "Vui lòng chọn ngày điều trị" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày điều trị không đúng định dạng"),
  orderType: z.enum(ORDER_TYPES, {
    message: "Vui lòng chọn loại đơn hàng",
  }),
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
 * Shared Conditional Validation Function
 * Business rules for Labo Orders
 * - Rule 1: expectedFitDate phải sau treatmentDate
 * - Rule 2: returnDate và receivedById phải đi cùng nhau
 */
const validateLaboOrderConditionalFields = (
  data: {
    treatmentDate?: string;
    expectedFitDate?: string | null;
    returnDate?: string | null;
    receivedById?: string | null;
    quantity?: number;
  },
  ctx: z.RefinementCtx
) => {
  // Rule 1: expectedFitDate must be after treatmentDate
  if (data.treatmentDate && data.expectedFitDate) {
    const treatment = new Date(data.treatmentDate);
    const expected = new Date(data.expectedFitDate);

    if (expected < treatment) {
      ctx.addIssue({
        code: "custom",
        message: "Ngày dự kiến lắp phải sau ngày điều trị",
        path: ["expectedFitDate"],
      });
    }
  }

  // Rule 2: returnDate và receivedById phải đi cùng nhau
  const hasReturnDate = Boolean(data.returnDate);
  const hasReceivedById = Boolean(data.receivedById);

  if (hasReturnDate && !hasReceivedById) {
    ctx.addIssue({
      code: "custom",
      message: "Vui lòng chọn người nhận mẫu",
      path: ["receivedById"],
    });
  }

  if (hasReceivedById && !hasReturnDate) {
    ctx.addIssue({
      code: "custom",
      message: "Vui lòng chọn ngày nhận mẫu",
      path: ["returnDate"],
    });
  }
};

/**
 * ============================================================================
 * FRONTEND SCHEMAS (Client-side Form Validation)
 * ============================================================================
 */

/**
 * Create Labo Order Form Schema (FRONTEND ONLY)
 * Dùng ở: CreateLaboOrderModal với React Hook Form + zodResolver
 */
export const CreateLaboOrderFormSchema = LaboOrderCommonFieldsSchema.extend({
  customerId: z
    .string({ message: "Khách hàng không hợp lệ" })
    .min(1, "Khách hàng không hợp lệ"),
  // expectedFitDate is required in form
  expectedFitDate: z
    .string({ message: "Vui lòng chọn ngày hẹn lắp" })
    .min(1, "Vui lòng chọn ngày hẹn lắp"),
}).superRefine(validateLaboOrderConditionalFields);

export type CreateLaboOrderFormData = z.infer<typeof CreateLaboOrderFormSchema>;

/**
 * ============================================================================
 * BACKEND SCHEMAS (Server-side API Validation)
 * ============================================================================
 */

/**
 * Labo Order Request Base Schema (BACKEND - for API)
 * Base schema for Create/Update requests from client → server
 */
const LaboOrderRequestBaseSchema = LaboOrderCommonFieldsSchema.extend({
  customerId: z.string().uuid("Khách hàng không hợp lệ"),
});

/**
 * Create Labo Order Request Schema (BACKEND - API)
 * Dùng ở: Server Action createLaboOrderAction
 */
export const CreateLaboOrderRequestSchema = LaboOrderRequestBaseSchema.extend({
  quantity: z.number().int().min(1).max(100).default(1),
}).superRefine(validateLaboOrderConditionalFields);

export type CreateLaboOrderRequest = z.infer<
  typeof CreateLaboOrderRequestSchema
>;

/**
 * Update Labo Order Form Schema (FRONTEND ONLY)
 * Dùng ở: UpdateLaboOrderModal với React Hook Form + zodResolver
 * Date fields là strings để tương thích với DatePicker
 * Admin can edit: treatmentDate, orderType, sentById, sentDate, returnDate
 * Employee can edit: quantity, expectedFitDate, detailRequirement only
 */
export const UpdateLaboOrderFormSchema = LaboOrderCommonFieldsSchema.extend({
  // Admin-only fields
  sentDate: z.string().optional(),
  returnDate: z.string().optional().nullable(),
  receivedById: z
    .string()
    .uuid("ID nhân viên nhận mẫu không hợp lệ")
    .optional()
    .nullable(),
})
  .partial()
  .superRefine(validateLaboOrderConditionalFields);

export type UpdateLaboOrderFormData = z.infer<typeof UpdateLaboOrderFormSchema>;

/**
 * Update Labo Order Request Schema (BACKEND - API)
 * Dùng ở: Server Action updateLaboOrderAction
 * Chỉ cho phép cập nhật một số fields
 * Admin can edit: treatmentDate, orderType, sentById, sentDate, returnDate + all basic fields
 * Employee can edit: quantity, expectedFitDate, detailRequirement only
 */
export const UpdateLaboOrderRequestSchema = LaboOrderRequestBaseSchema.extend({
  id: z.string().uuid("ID đơn hàng không hợp lệ").optional(), // For service layer
  // Admin-only fields
  sentDate: z.coerce.date().optional(),
  returnDate: z.coerce.date().optional().nullable(),
  receivedById: z.string().uuid().optional().nullable(),
})
  .partial()
  .superRefine(validateLaboOrderConditionalFields);

export type UpdateLaboOrderRequest = z.infer<
  typeof UpdateLaboOrderRequestSchema
>;

/**
 * ============================================================================
 * QUERY SCHEMAS
 * ============================================================================
 */

/**
 * Get Daily Labo Orders Query Schema (BACKEND)
 * Validate URL query params cho GET /api/v1/labo-orders/daily
 * Supports both daily view (date + type) and customer view (customerId)
 */
export const GetDailyLaboOrdersQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không đúng định dạng YYYY-MM-DD")
    .optional(), // Optional when customerId is provided
  type: z
    .enum(["sent", "returned"], {
      message: 'Loại hiển thị phải là "sent" hoặc "returned"',
    })
    .optional(), // Optional when customerId is provided
  clinicId: z.string().uuid("ID phòng khám không hợp lệ").optional(),
  customerId: z.string().uuid("ID khách hàng không hợp lệ").optional(), // NEW: Filter by customer
});

export type GetDailyLaboOrdersQuery = z.infer<
  typeof GetDailyLaboOrdersQuerySchema
>;

/**
 * Receive Labo Order Request Schema
 * Dùng ở: Server Action receiveLaboOrderAction
 */
export const ReceiveLaboOrderRequestSchema = z.object({
  orderId: z.string().uuid("ID đơn hàng không hợp lệ"),
});

export type ReceiveLaboOrderRequest = z.infer<
  typeof ReceiveLaboOrderRequestSchema
>;

/**
 * ============================================================================
 * RESPONSE SCHEMAS
 * ============================================================================
 */

/**
 * Labo Order Response Schema
 * Full response với relations
 */
export const LaboOrderResponseSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  doctorId: z.string().uuid(),
  laboServiceId: z.string().uuid(),
  supplierId: z.string().uuid(),
  laboItemId: z.string().uuid(),
  clinicId: z.string().uuid(),

  // Treatment Info
  treatmentDate: z.string(),
  orderType: z.enum(ORDER_TYPES),

  // Pricing snapshot
  unitPrice: z.number(),
  quantity: z.number(),
  totalCost: z.number(),
  warranty: z.string(),

  // Dates
  sentDate: z.string().datetime(),
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

  // Relations
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
    unit: z.string(),
  }),

  sentBy: z
    .object({
      id: z.string().uuid(),
      fullName: z.string(),
    })
    .optional(),

  receivedBy: z
    .object({
      id: z.string().uuid(),
      fullName: z.string(),
    })
    .nullable(),

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

  clinic: z
    .object({
      id: z.string().uuid(),
      clinicCode: z.string(),
      name: z.string(),
    })
    .optional(),
});

export type LaboOrderResponse = z.infer<typeof LaboOrderResponseSchema>;

/**
 * Labo Orders Daily Response Schema
 * Response for daily view với statistics summary
 */
export const LaboOrdersDailyResponseSchema = z.object({
  items: z.array(LaboOrderResponseSchema),
  count: z.number(),
  statistics: z.object({
    total: z.number(),
    sent: z.number(),
    returned: z.number(),
    totalCost: z.number(),
    warrantyOrders: z.number(),
    newOrders: z.number(),
  }),
});

export type LaboOrdersDailyResponse = z.infer<
  typeof LaboOrdersDailyResponseSchema
>;
