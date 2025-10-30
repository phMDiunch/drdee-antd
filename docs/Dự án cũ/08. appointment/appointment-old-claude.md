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
  "Không đến": ["Đã đến"],
  "Đã đến": [],
  "Đến đột xuất": [],
  "Đã hủy": [],
};
```

#### **Views**

**Daily View** (`src/features/appointments/views/AppointmentDailyView.tsx`):

- Date picker navigation (previous/next day, today button)
- Clinic selector (admin only)
- Filter by doctor (optional)
- AppointmentTable with inline actions (confirm, check-in, edit, delete)
- Add appointment button → AppointmentModal

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
