# APPOINTMENT FEATURE - REQUIREMENT CHI TIẾT

## I. TỔNG QUAN

### 1. Mô tả chức năng

Feature Appointment quản lý lịch hẹn khách hàng với bác sĩ, bao gồm 2 phần:

- **Phần A**: Feature appointments chính - Quản lý lịch hẹn (CRUD, check-in, check-out, status transitions)
- **Phần B**: Tích hợp trong feature customers - Check-in nhanh từ danh sách khách hàng

### 2. Database Schema (Prisma)

```prisma
model Appointment {
  id String @id @default(uuid())

  // Thông tin cơ bản
  customerId          String
  appointmentDateTime DateTime @db.Timestamptz
  duration            Int      @default(30) // phút
  notes               String?

  // Phân công
  primaryDentistId   String   // Bắt buộc
  secondaryDentistId String?  // Optional
  clinicId           String

  // Trạng thái & Check-in/out
  status       String    // "Chờ xác nhận", "Đã xác nhận", "Đã đến", "Không đến", "Đã hủy", "Đến đột xuất"
  checkInTime  DateTime? @db.Timestamptz
  checkOutTime DateTime? @db.Timestamptz

  // Audit
  createdById String
  updatedById String
  createdAt   DateTime @default(now()) @db.Timestamptz
  updatedAt   DateTime @updatedAt @db.Timestamptz

  // Relations
  customer         Customer
  primaryDentist   Employee
  secondaryDentist Employee?
  createdBy        Employee
  updatedBy        Employee
  treatmentLogs    TreatmentLog[]
  consultedServices ConsultedService[] // 1 appointment có nhiều consulted services
}
```

---

## II. PHẦN A - FEATURE APPOINTMENTS

### A1. BUSINESS RULES

#### Status Flow & Transitions

```typescript
const STATUS_TRANSITIONS: Record<string, string[]> = {
  "Chờ xác nhận": ["Đã xác nhận", "Đã hủy"],
  "Đã xác nhận": ["Đã đến", "Không đến", "Đã hủy"],
  "Đã đến": [], // Không thể chuyển sau khi check-in
  "Không đến": ["Đã đến"], // Có thể check-in muộn
  "Đã hủy": [],
  "Đến đột xuất": [], // Walk-in không chuyển status
};
```

#### Validation Rules

1. **Thời gian**:

   - Không được đặt lịch trong quá khứ
   - Khi reschedule (sửa appointmentDateTime) → Reset status về "Chờ xác nhận" (nếu chưa check-in)

2. **1 Khách 1 Lịch/Ngày**:

   - Một customer chỉ được có 1 appointment trong 1 ngày (loại trừ status "Đã hủy")
   - Check khi CREATE và UPDATE

3. **Edit Restrictions cho Today's Appointments**:

   - Lịch hẹn hôm nay CHỈ được sửa:
     - `primaryDentistId`, `secondaryDentistId`
     - `notes`
   - KHÔNG được sửa:
     - `customerId`, `appointmentDateTime`, `duration`, `clinicId`, `status`

4. **Check-in Rules**:

   - Cho phép check-in với status: "Chờ xác nhận", "Đã xác nhận", "Không đến"
   - Không cho phép: "Đã đến" (đã check-in), "Đã hủy"
   - Khi check-in → status = "Đã đến"

5. **No-show Rules**:
   - Chỉ đánh dấu "Không đến" SAU thời gian hẹn
   - Không cho phép nếu đã check-in
   - Có thể check-in muộn từ status "Không đến"

---

### A2. BACKEND ARCHITECTURE

#### **Folder Structure**

```
src/
├── shared/
│   └── validation/
│       └── appointment.validation.ts    # Zod schemas (shared FE/BE)
├── server/
│   ├── repos/
│   │   └── appointment.repo.ts          # Data access layer
│   └── services/
│       └── appointment.service.ts       # Business logic
├── app/api/v1/appointments/
│   ├── route.ts                         # GET /list, POST /create
│   ├── today/
│   │   └── route.ts                     # GET /today (filter by date)
│   ├── check-conflict/
│   │   └── route.ts                     # GET /check-conflict (1 khách 1 lịch)
│   └── [id]/
│       ├── route.ts                     # GET /:id, PUT /:id, DELETE /:id
│       ├── confirm/route.ts             # PATCH /:id/confirm
│       ├── check-in/route.ts            # PATCH /:id/check-in
│       ├── checkout/route.ts            # PATCH /:id/checkout
│       └── no-show/route.ts             # PATCH /:id/no-show
```

#### **Zod Schemas** (`src/shared/validation/appointment.validation.ts`)

```typescript
import { z } from "zod";

// Base schema (common fields)
const AppointmentBaseSchema = z.object({
  customerId: z.string().uuid("ID khách hàng không hợp lệ"),
  appointmentDateTime: z.coerce.date({ message: "Thời gian hẹn không hợp lệ" }),
  duration: z
    .number()
    .int()
    .min(15, "Thời lượng tối thiểu 15 phút")
    .default(30),
  notes: z.string().optional(),
  primaryDentistId: z.string().uuid("ID bác sĩ chính không hợp lệ"),
  secondaryDentistId: z.string().uuid().optional().nullable(),
  clinicId: z.string().uuid("ID cơ sở không hợp lệ"),
});

// Backend Request Schemas
export const CreateAppointmentRequestSchema = AppointmentBaseSchema.extend({
  status: z.enum(["Chờ xác nhận", "Đã xác nhận"]).default("Chờ xác nhận"),
});

export const UpdateAppointmentRequestSchema = AppointmentBaseSchema.partial();

// Frontend Form Schema (date as string for DatePicker)
export const CreateAppointmentFormSchema = z.object({
  customerId: z.string().min(1, "Vui lòng chọn khách hàng"),
  appointmentDateTime: z.string().min(1, "Vui lòng chọn thời gian"),
  duration: z.number().min(15, "Thời lượng tối thiểu 15 phút").default(30),
  notes: z.string().optional(),
  primaryDentistId: z.string().min(1, "Vui lòng chọn bác sĩ chính"),
  secondaryDentistId: z.string().optional().nullable(),
  clinicId: z.string().min(1, "Vui lòng chọn cơ sở"),
});

// Query Schemas
export const GetAppointmentsQuerySchema = z.object({
  from: z.string().optional(), // ISO string (Calendar view)
  to: z.string().optional(),
  date: z.string().optional(), // YYYY-MM-DD (Daily view)
  clinicId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(20),
  search: z.string().optional(),
});

export const CheckConflictQuerySchema = z.object({
  customerId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  excludeId: z.string().uuid().optional(),
});

// Response Schemas
export const AppointmentResponseSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  appointmentDateTime: z.string().datetime(),
  duration: z.number(),
  notes: z.string().nullable(),
  primaryDentistId: z.string(),
  secondaryDentistId: z.string().nullable(),
  clinicId: z.string(),
  status: z.string(),
  checkInTime: z.string().datetime().nullable(),
  checkOutTime: z.string().datetime().nullable(),
  createdById: z.string(),
  updatedById: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  // Include relations when populated
  customer: z
    .object({
      id: z.string(),
      customerCode: z.string().nullable(),
      fullName: z.string(),
      phone: z.string().nullable(),
      email: z.string().nullable(),
      address: z.string().nullable(),
    })
    .optional(),
  primaryDentist: z
    .object({
      id: z.string(),
      fullName: z.string(),
    })
    .optional(),
  secondaryDentist: z
    .object({
      id: z.string(),
      fullName: z.string(),
    })
    .optional()
    .nullable(),
});

export const AppointmentListResponseSchema = z.object({
  appointments: z.array(AppointmentResponseSchema),
  total: z.number(),
});

// Type exports
export type CreateAppointmentRequest = z.infer<
  typeof CreateAppointmentRequestSchema
>;
export type UpdateAppointmentRequest = z.infer<
  typeof UpdateAppointmentRequestSchema
>;
export type CreateAppointmentFormData = z.infer<
  typeof CreateAppointmentFormSchema
>;
export type GetAppointmentsQuery = z.infer<typeof GetAppointmentsQuerySchema>;
export type CheckConflictQuery = z.infer<typeof CheckConflictQuerySchema>;
export type AppointmentResponse = z.infer<typeof AppointmentResponseSchema>;
export type AppointmentListResponse = z.infer<
  typeof AppointmentListResponseSchema
>;
```

#### **Repository** (`src/server/repos/appointment.repo.ts`)

```typescript
import { prisma } from "@/services/prismaClient";
import type {
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
} from "@/shared/validation/appointment.validation";
import type { Prisma } from "@prisma/client";

// Complex Pattern: API Schema + Server Fields
export type AppointmentCreateInput = CreateAppointmentRequest & {
  createdById: string;
  updatedById: string;
};

export type AppointmentUpdateInput = UpdateAppointmentRequest & {
  updatedById: string;
  updatedAt: Date;
};

// Select cho API response
const appointmentWithRelations = {
  include: {
    customer: {
      select: {
        id: true,
        customerCode: true,
        fullName: true,
        phone: true,
        email: true,
        address: true,
      },
    },
    primaryDentist: { select: { id: true, fullName: true } },
    secondaryDentist: { select: { id: true, fullName: true } },
  },
} satisfies Prisma.AppointmentDefaultArgs;

export const appointmentRepo = {
  async create(data: AppointmentCreateInput) {
    return prisma.appointment.create({
      data,
      ...appointmentWithRelations,
    });
  },

  async findById(id: string) {
    return prisma.appointment.findUnique({
      where: { id },
      ...appointmentWithRelations,
    });
  },

  async update(id: string, data: AppointmentUpdateInput) {
    return prisma.appointment.update({
      where: { id },
      data,
      ...appointmentWithRelations,
    });
  },

  async delete(id: string) {
    return prisma.appointment.delete({ where: { id } });
  },

  async list(params: {
    where: Prisma.AppointmentWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.AppointmentOrderByWithRelationInput;
  }) {
    return prisma.appointment.findMany({
      ...params,
      ...appointmentWithRelations,
    });
  },

  async count(where: Prisma.AppointmentWhereInput) {
    return prisma.appointment.count({ where });
  },

  // Check conflict (1 khách 1 lịch/ngày)
  async findConflict(params: {
    customerId: string;
    startOfDay: string;
    endOfDay: string;
    excludeId?: string;
  }) {
    return prisma.appointment.findFirst({
      where: {
        customerId: params.customerId,
        appointmentDateTime: {
          gte: params.startOfDay,
          lte: params.endOfDay,
        },
        status: { not: "Đã hủy" },
        ...(params.excludeId && { id: { not: params.excludeId } }),
      },
      include: {
        customer: { select: { fullName: true } },
      },
    });
  },
};
```

#### **Service** (`src/server/services/appointment.service.ts`)

```typescript
import { appointmentRepo } from "@/server/repos/appointment.repo";
import type {
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
} from "@/shared/validation/appointment.validation";
import { ServiceError } from "@/server/errors/ServiceError";
import { STATUS_TRANSITIONS } from "@/features/appointments/constants";
import dayjs from "dayjs";

export const appointmentService = {
  async create(
    currentUser: { id: string; clinicId: string },
    body: CreateAppointmentRequest
  ) {
    const appointmentDate = dayjs(body.appointmentDateTime);

    // Validation 1: Không đặt lịch trong quá khứ
    if (appointmentDate.isBefore(dayjs(), "minute")) {
      throw new ServiceError(
        "PAST_APPOINTMENT",
        "Không thể đặt lịch hẹn trong quá khứ!",
        400
      );
    }

    // Validation 2: Kiểm tra conflict (1 khách 1 lịch/ngày)
    const startOfDay = appointmentDate.startOf("day").format();
    const endOfDay = appointmentDate.endOf("day").format();

    const conflict = await appointmentRepo.findConflict({
      customerId: body.customerId,
      startOfDay,
      endOfDay,
    });

    if (conflict) {
      throw new ServiceError(
        "APPOINTMENT_CONFLICT",
        `Khách hàng ${
          conflict.customer.fullName
        } đã có lịch hẹn vào ngày ${appointmentDate.format("DD/MM/YYYY")}!`,
        400
      );
    }

    // Create appointment
    return appointmentRepo.create({
      ...body,
      status: body.status || "Chờ xác nhận",
      createdById: currentUser.id,
      updatedById: currentUser.id,
    });
  },

  async update(
    currentUser: { id: string },
    id: string,
    body: UpdateAppointmentRequest
  ) {
    const existing = await appointmentRepo.findById(id);
    if (!existing) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy lịch hẹn", 404);
    }

    // Validation 1: Không sửa lịch quá khứ
    const currentAppointmentTime = dayjs(existing.appointmentDateTime);
    if (currentAppointmentTime.isBefore(dayjs(), "day")) {
      throw new ServiceError(
        "PAST_APPOINTMENT",
        "Không thể sửa lịch hẹn trong quá khứ!",
        400
      );
    }

    // Validation 2: Restrictions cho today's appointments
    const isToday = currentAppointmentTime.isSame(dayjs(), "day");
    if (isToday) {
      const restrictedFields = [
        "customerId",
        "appointmentDateTime",
        "duration",
        "clinicId",
      ];
      const changedFields = restrictedFields.filter(
        (field) =>
          body[field as keyof UpdateAppointmentRequest] !== undefined &&
          body[field as keyof UpdateAppointmentRequest] !==
            existing[field as keyof typeof existing]
      );

      if (changedFields.length > 0) {
        throw new ServiceError(
          "TODAY_EDIT_RESTRICTED",
          `Lịch hẹn hôm nay chỉ được sửa bác sĩ và ghi chú. Không được sửa: ${changedFields.join(
            ", "
          )}`,
          400
        );
      }
    }

    // Validation 3: Nếu thay đổi appointmentDateTime, check conflict
    if (body.appointmentDateTime) {
      const newDate = dayjs(body.appointmentDateTime);
      if (newDate.isBefore(dayjs(), "minute")) {
        throw new ServiceError(
          "PAST_APPOINTMENT",
          "Không thể đặt lịch hẹn trong quá khứ!",
          400
        );
      }

      const startOfDay = newDate.startOf("day").format();
      const endOfDay = newDate.endOf("day").format();

      const conflict = await appointmentRepo.findConflict({
        customerId: existing.customerId,
        startOfDay,
        endOfDay,
        excludeId: id,
      });

      if (conflict) {
        throw new ServiceError(
          "APPOINTMENT_CONFLICT",
          `Khách hàng đã có lịch hẹn khác vào ngày ${newDate.format(
            "DD/MM/YYYY"
          )}!`,
          400
        );
      }
    }

    // Reschedule logic: Reset status nếu thay đổi appointmentDateTime
    const updateData = { ...body };
    if (
      body.appointmentDateTime &&
      !dayjs(body.appointmentDateTime).isSame(existing.appointmentDateTime)
    ) {
      if (!existing.checkInTime) {
        updateData.status = "Chờ xác nhận";
      }
    }

    return appointmentRepo.update(id, {
      ...updateData,
      updatedById: currentUser.id,
      updatedAt: new Date(),
    });
  },

  async delete(id: string) {
    const existing = await appointmentRepo.findById(id);
    if (!existing) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy lịch hẹn", 404);
    }
    await appointmentRepo.delete(id);
  },

  async getById(id: string) {
    const appointment = await appointmentRepo.findById(id);
    if (!appointment) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy lịch hẹn", 404);
    }
    return appointment;
  },

  async list(params: {
    clinicId?: string;
    from?: string;
    to?: string;
    date?: string;
    doctorId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const where: any = {};

    if (params.clinicId) where.clinicId = params.clinicId;

    // Calendar view: from-to range
    if (params.from && params.to) {
      where.appointmentDateTime = {
        gte: params.from,
        lte: params.to,
      };
    }

    // Daily view: specific date
    if (params.date) {
      const selectedDate = dayjs(params.date);
      where.appointmentDateTime = {
        gte: selectedDate.startOf("day").format(),
        lte: selectedDate.endOf("day").format(),
      };
    }

    // Filter by doctor
    if (params.doctorId) {
      where.OR = [
        { primaryDentistId: params.doctorId },
        { secondaryDentistId: params.doctorId },
      ];
    }

    // Search
    if (params.search) {
      where.OR = [
        {
          customer: {
            fullName: { contains: params.search, mode: "insensitive" },
          },
        },
        {
          primaryDentist: {
            fullName: { contains: params.search, mode: "insensitive" },
          },
        },
        { notes: { contains: params.search, mode: "insensitive" } },
      ];
    }

    // Pagination (table view)
    if (!params.from && !params.to && !params.date) {
      const [appointments, total] = await Promise.all([
        appointmentRepo.list({
          where,
          skip: ((params.page || 1) - 1) * (params.pageSize || 20),
          take: params.pageSize || 20,
          orderBy: { appointmentDateTime: "desc" },
        }),
        appointmentRepo.count(where),
      ]);
      return { appointments, total };
    }

    // Calendar/Daily view: no pagination
    const appointments = await appointmentRepo.list({
      where,
      orderBy: { appointmentDateTime: "asc" },
    });
    return appointments;
  },

  async confirm(currentUser: { id: string }, id: string) {
    const existing = await appointmentRepo.findById(id);
    if (!existing) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy lịch hẹn", 404);
    }

    const allowedTransitions = STATUS_TRANSITIONS[existing.status];
    if (!allowedTransitions?.includes("Đã xác nhận")) {
      throw new ServiceError(
        "INVALID_STATUS_TRANSITION",
        `Không thể xác nhận lịch hẹn có trạng thái "${existing.status}"`,
        400
      );
    }

    return appointmentRepo.update(id, {
      status: "Đã xác nhận",
      updatedById: currentUser.id,
      updatedAt: new Date(),
    });
  },

  async checkIn(currentUser: { id: string }, id: string) {
    const existing = await appointmentRepo.findById(id);
    if (!existing) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy lịch hẹn", 404);
    }

    const allowedTransitions = STATUS_TRANSITIONS[existing.status];
    if (!allowedTransitions?.includes("Đã đến")) {
      throw new ServiceError(
        "INVALID_STATUS_TRANSITION",
        `Không thể check-in lịch hẹn có trạng thái "${existing.status}"`,
        400
      );
    }

    return appointmentRepo.update(id, {
      status: "Đã đến",
      checkInTime: new Date(),
      updatedById: currentUser.id,
      updatedAt: new Date(),
    });
  },

  async noShow(currentUser: { id: string }, id: string) {
    const existing = await appointmentRepo.findById(id);
    if (!existing) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy lịch hẹn", 404);
    }

    // Validation: Chỉ cho phép sau appointment time
    const appointmentTime = dayjs(existing.appointmentDateTime);
    if (appointmentTime.isAfter(dayjs())) {
      throw new ServiceError(
        "TOO_EARLY_NO_SHOW",
        "Chỉ có thể đánh dấu 'Không đến' sau thời gian hẹn",
        400
      );
    }

    // Validation: Không cho phép nếu đã check-in
    if (existing.checkInTime) {
      throw new ServiceError(
        "ALREADY_CHECKED_IN",
        "Không thể đánh dấu 'Không đến' khi khách hàng đã check-in",
        400
      );
    }

    const allowedTransitions = STATUS_TRANSITIONS[existing.status];
    if (!allowedTransitions?.includes("Không đến")) {
      throw new ServiceError(
        "INVALID_STATUS_TRANSITION",
        `Không thể đánh dấu 'Không đến' từ trạng thái "${existing.status}"`,
        400
      );
    }

    return appointmentRepo.update(id, {
      status: "Không đến",
      updatedById: currentUser.id,
      updatedAt: new Date(),
    });
  },
};
```

#### **API Routes** (Example: `src/app/api/v1/appointments/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { appointmentService } from "@/server/services/appointment.service";
import {
  CreateAppointmentRequestSchema,
  GetAppointmentsQuerySchema,
} from "@/shared/validation/appointment.validation";
import { getSessionUser } from "@/server/auth/session";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getSessionUser();
    const { searchParams } = new URL(request.url);

    const query = GetAppointmentsQuerySchema.parse({
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
      date: searchParams.get("date") || undefined,
      clinicId: searchParams.get("clinicId") || undefined,
      doctorId: searchParams.get("doctorId") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
    });

    const result = await appointmentService.list(query);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: COMMON_MESSAGES.VALIDATION_INVALID },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: COMMON_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getSessionUser();
    const body = await request.json();
    const data = CreateAppointmentRequestSchema.parse(body);

    const appointment = await appointmentService.create(currentUser, data);
    return NextResponse.json(appointment, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          error: error.issues[0]?.message || COMMON_MESSAGES.VALIDATION_INVALID,
        },
        { status: 400 }
      );
    }
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.httpStatus }
      );
    }
    return NextResponse.json(
      { error: COMMON_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
```

---

### A3. FRONTEND ARCHITECTURE

#### **Folder Structure**

```
src/features/appointments/
├── constants.ts                      # Status options, transitions, messages
├── api/
│   ├── index.ts                      # Barrel export
│   ├── createAppointment.ts
│   ├── updateAppointment.ts
│   ├── getAppointment.ts
│   ├── getAppointments.ts
│   ├── deleteAppointment.ts
│   ├── confirmAppointment.ts
│   ├── checkInAppointment.ts
│   ├── checkOutAppointment.ts
│   ├── noShowAppointment.ts
│   └── checkConflict.ts
├── hooks/
│   ├── index.ts                      # Barrel export
│   ├── useAppointments.ts            # Query (list)
│   ├── useAppointment.ts             # Query (single)
│   ├── useCreateAppointment.ts       # Mutation
│   ├── useUpdateAppointment.ts       # Mutation
│   ├── useDeleteAppointment.ts       # Mutation
│   ├── useConfirmAppointment.ts      # Mutation
│   ├── useCheckInAppointment.ts      # Mutation
│   └── useNoShowAppointment.ts       # Mutation
├── components/
│   ├── AppointmentTable.tsx
│   ├── AppointmentForm.tsx
│   ├── AppointmentModal.tsx
│   └── AppointmentCalendar.tsx
└── views/
    ├── AppointmentDailyView.tsx      # Daily table view
    └── AppointmentListView.tsx       # Full list/calendar view
```

#### **Constants** (`src/features/appointments/constants.ts`)

```typescript
export const APPOINTMENT_ENDPOINTS = {
  BASE: "/api/v1/appointments",
  BY_ID: (id: string) => `/api/v1/appointments/${id}`,
  TODAY: "/api/v1/appointments/today",
  CHECK_CONFLICT: "/api/v1/appointments/check-conflict",
  CONFIRM: (id: string) => `/api/v1/appointments/${id}/confirm`,
  CHECK_IN: (id: string) => `/api/v1/appointments/${id}/check-in`,
  CHECKOUT: (id: string) => `/api/v1/appointments/${id}/checkout`,
  NO_SHOW: (id: string) => `/api/v1/appointments/${id}/no-show`,
};

export const APPOINTMENT_QUERY_KEYS = {
  all: ["appointments"] as const,
  lists: () => [...APPOINTMENT_QUERY_KEYS.all, "list"] as const,
  list: (filters: any) => [...APPOINTMENT_QUERY_KEYS.lists(), filters] as const,
  details: () => [...APPOINTMENT_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...APPOINTMENT_QUERY_KEYS.details(), id] as const,
  daily: (date: string, clinicId?: string) =>
    [...APPOINTMENT_QUERY_KEYS.all, "daily", date, clinicId] as const,
};

export const APPOINTMENT_MESSAGES = {
  CREATE_SUCCESS: "Tạo lịch hẹn thành công!",
  UPDATE_SUCCESS: "Cập nhật lịch hẹn thành công!",
  DELETE_SUCCESS: "Xóa lịch hẹn thành công!",
  CONFIRM_SUCCESS: "Xác nhận lịch hẹn thành công!",
  CHECKIN_SUCCESS: "Check-in thành công!",
  CHECKOUT_SUCCESS: "Check-out thành công!",
  NO_SHOW_SUCCESS: "Đã đánh dấu 'Không đến'",
  DELETE_CONFIRM: "Bạn chắc chắn muốn xóa lịch hẹn này?",
};

export const APPOINTMENT_STATUS_OPTIONS = [
  { value: "Chờ xác nhận", label: "Chờ xác nhận", color: "orange" },
  { value: "Đã xác nhận", label: "Đã xác nhận", color: "blue" },
  { value: "Đã đến", label: "Đã đến", color: "green" },
  { value: "Đến đột xuất", label: "Đến đột xuất", color: "purple" },
  { value: "Không đến", label: "Không đến", color: "red" },
  { value: "Đã hủy", label: "Đã hủy", color: "gray" },
];

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  "Chờ xác nhận": ["Đã xác nhận", "Đã hủy"],
  "Đã xác nhận": ["Đã đến", "Không đến", "Đã hủy"],
  "Đã đến": [],
  "Không đến": ["Đã đến"],
  "Đã hủy": [],
  "Đến đột xuất": [],
};
```

#### **API Client Example** (`src/features/appointments/api/createAppointment.ts`)

```typescript
import { APPOINTMENT_ENDPOINTS } from "../constants";
import {
  CreateAppointmentRequestSchema,
  AppointmentResponseSchema,
} from "@/shared/validation/appointment.validation";

export async function createAppointmentApi(body: unknown) {
  const validated = CreateAppointmentRequestSchema.parse(body);

  const res = await fetch(APPOINTMENT_ENDPOINTS.BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validated),
  });

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error || "Tạo lịch hẹn thất bại");
  }

  const data = await res.json();
  return AppointmentResponseSchema.parse(data);
}
```

#### **React Query Hook Example** (`src/features/appointments/hooks/useCreateAppointment.ts`)

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAppointmentApi } from "../api/createAppointment";
import { APPOINTMENT_QUERY_KEYS, APPOINTMENT_MESSAGES } from "../constants";
import { useNotify } from "@/hooks/useNotify";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: createAppointmentApi,
    onSuccess: () => {
      notify.success(APPOINTMENT_MESSAGES.CREATE_SUCCESS);
      queryClient.invalidateQueries({ queryKey: APPOINTMENT_QUERY_KEYS.all });
    },
    onError: (error) => {
      notify.error(error, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR });
    },
  });
}
```

#### **Views**

**Daily View** (`src/features/appointments/views/AppointmentDailyView.tsx`):

- Date picker navigation (previous/next day, today button)
- Clinic selector (admin only)
- Filter by doctor (optional)
- AppointmentTable with inline actions (confirm, check-in, edit, delete)
- Add appointment button → AppointmentModal

**List View** (`src/features/appointments/views/AppointmentListView.tsx`):

- Tabs: Calendar view (month) & Table view (paginated)
- Calendar view: react-big-calendar with events
- Table view: pagination, search, filters
- AppointmentModal for add/edit

---

## III. PHẦN B - CHECK-IN TỪNG CUSTOMER (FEATURE CUSTOMERS)

### B1. BUSINESS RULES

#### Check-in Flow

1. **Có lịch hẹn hôm nay**:

   - Update `appointment.checkInTime = now`
   - Update `appointment.status = "Đã đến"`
   - Giữ nguyên `notes` nếu đã có (không overwrite)

2. **Không có lịch hẹn** (Walk-in):
   - Tạo appointment mới:
     - `appointmentDateTime = now`
     - `status = "Đến đột xuất"`
     - `checkInTime = now`
     - `notes = "Lịch phát sinh - Check-in lúc HH:mm DD/MM/YYYY"`
   - Yêu cầu chọn `primaryDentistId`

#### Validation

- Không check-in nếu đã check-in rồi (check `todayAppointment.checkInTime`)
- Walk-in bắt buộc chọn bác sĩ

---

### B2. BACKEND (TRONG FEATURE CUSTOMERS)

#### API Endpoint

- **POST** `/api/v1/customers/:id/checkin`
- Body: `{ primaryDentistId?: string, notes?: string, updatedById: string }`

#### Logic

```typescript
// Pseudo-code
if (existingAppointment) {
  if (existingAppointment.checkInTime) throw Error("Đã check-in rồi");
  appointment = update appointment {
    checkInTime: now,
    status: "Đã đến",
    notes: existingAppointment.notes || notes || auto-generated,
    updatedById
  }
} else {
  if (!primaryDentistId) throw Error("Vui lòng chọn bác sĩ");
  appointment = create appointment {
    customerId,
    appointmentDateTime: now,
    duration: 30,
    status: "Đến đột xuất",
    checkInTime: now,
    notes: notes || "Lịch phát sinh - Check-in lúc ...",
    primaryDentistId,
    clinicId: customer.clinicId,
    createdById: updatedById,
    updatedById
  }
}
return { appointment, message: "Check-in thành công!" }
```

---

### B3. FRONTEND (TRONG FEATURE CUSTOMERS)

#### Customer List Page

- Hiển thị `todayAppointment` info (nếu có)
- Button "Check-in" → Modal check-in
- Modal check-in:
  - Hiển thị thông tin lịch hẹn (nếu có)
  - Chọn bác sĩ (nếu walk-in)
  - Notes (optional)

#### Customer Detail Page

- Tab "Lịch hẹn": AppointmentTable với button check-in inline
- Alert nếu chưa check-in hôm nay (khi tạo consulted service)

#### Type Extension

```typescript
// src/features/customers/type.ts
export type Customer = PrismaCustomer & {
  todayAppointment?: {
    id: string;
    appointmentDateTime: string;
    status: string;
    checkInTime: string | null;
    primaryDentist: { fullName: string };
  } | null;
};
```

#### API Query

- GET `/api/v1/customers?date=YYYY-MM-DD&includeAppointments=true`
- Backend populate `todayAppointment` cho mỗi customer

---

## IV. CHECKLIST IMPLEMENTATION

### Backend

- [ ] Tạo `src/shared/validation/appointment.validation.ts`
- [ ] Tạo `src/server/repos/appointment.repo.ts`
- [ ] Tạo `src/server/services/appointment.service.ts`
- [ ] Tạo `src/server/errors/ServiceError.ts` (nếu chưa có)
- [ ] Refactor API routes sang `/api/v1/appointments/*`
- [ ] Implement status transition validation
- [ ] Implement edit restrictions (today's appointments)
- [ ] Implement 1 khách 1 lịch/ngày validation
- [ ] Implement check-in/confirm/no-show actions
- [ ] Update `/api/v1/customers/:id/checkin` cho walk-in flow

### Frontend (Appointments)

- [ ] Update `constants.ts` với endpoints, query keys, messages
- [ ] Tạo API clients (`api/*.ts` + `index.ts`)
- [ ] Tạo React Query hooks (`hooks/*.ts` + `index.ts`)
- [ ] Refactor AppointmentForm (Zod integration, validation)
- [ ] Refactor AppointmentTable (status-based actions)
- [ ] Refactor AppointmentModal (add/edit modes)
- [ ] Tạo AppointmentDailyView (date navigation, filters)
- [ ] Tạo AppointmentListView (calendar + table tabs)
- [ ] Update routes `/appointments/today` và `/appointments`

### Frontend (Customers Integration)

- [ ] Update Customer type với `todayAppointment`
- [ ] Update CustomerListPage: hiển thị today appointment info
- [ ] Update CustomerListPage: check-in modal (walk-in flow)
- [ ] Update CustomerDetailPage: appointment tab với check-in button
- [ ] Update CustomerDetailPage: alert nếu chưa check-in (consulted service tab)

### Testing

- [ ] Test 1 khách 1 lịch/ngày validation
- [ ] Test status transitions (confirm, check-in, no-show)
- [ ] Test edit restrictions (today's appointments)
- [ ] Test reschedule logic (status reset)
- [ ] Test walk-in flow (check-in từ customer list)
- [ ] Test conflict checking khi edit appointmentDateTime
- [ ] Test permissions (admin vs manager vs employee)

---

## V. MESSAGES & ERROR HANDLING

### Shared Messages (`src/shared/constants/messages.ts`)

```typescript
export const COMMON_MESSAGES = {
  VALIDATION_INVALID: "Dữ liệu không hợp lệ",
  UNKNOWN_ERROR: "Có lỗi xảy ra, vui lòng thử lại",
  SERVER_ERROR: "Lỗi máy chủ, vui lòng liên hệ quản trị viên",
  NOT_FOUND: "Không tìm thấy dữ liệu",
  UNAUTHORIZED: "Bạn không có quyền thực hiện thao tác này",
};
```

### ServiceError Class

```typescript
export class ServiceError extends Error {
  constructor(public code: string, message: string, public httpStatus: number) {
    super(message);
    this.name = "ServiceError";
  }
}
```

---

## VI. NOTES & BEST PRACTICES

1. **Không dùng Prisma trực tiếp trong API routes** → Dùng service layer
2. **Mọi validation dùng Zod** → Single source of truth
3. **React Query cho server state** → Không dùng Zustand/Context
4. **useNotify() thay vì toast trực tiếp** → Chuẩn hóa thông báo
5. **Barrel exports** → `index.ts` trong `api/` và `hooks/`
6. **Status transitions strict** → Validate theo `STATUS_TRANSITIONS` map
7. **Date handling** → dayjs với timezone VN (Asia/Ho_Chi_Minh)
8. **Optimistic updates** (optional) → React Query optimistic mutations
9. **Prefetch adjacent days** → Improve UX cho daily view navigation
10. **Admin scope** → Cho phép xem/edit cross-clinic (nếu cần)

---

**Kết thúc requirement document.**
