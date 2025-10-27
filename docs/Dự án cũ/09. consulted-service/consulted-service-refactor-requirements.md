# CONSULTED SERVICE FEATURE - REQUIREMENT CHI TIẾT

## I. TỔNG QUAN

### 1. Mô tả chức năng

Feature Consulted Service (Dịch vụ tư vấn) quản lý các dịch vụ nha khoa được tư vấn cho khách hàng, bao gồm:

- Tạo dịch vụ tư vấn sau khi customer check-in
- Chốt dịch vụ (confirm) → phát sinh nghiệp vụ tài chính
- Quản lý trạng thái điều trị
- Phân công nhân sự (bác sĩ tư vấn, sale, bác sĩ điều trị)
- Quản lý vị trí răng (tooth positions)
- Tính toán giá và công nợ

### 2. Database Schema (Prisma)

```prisma
model ConsultedService {
  id String @id @default(uuid())

  // Liên kết dữ liệu
  customerId      String
  appointmentId   String?  // Lịch hẹn tư vấn (có thể null)
  dentalServiceId String   // Dịch vụ gốc (DentalService)
  clinicId        String

  // Dữ liệu sao chép (Denormalized - snapshot tại thời điểm tư vấn)
  consultedServiceName String  // Tên dịch vụ
  consultedServiceUnit String  // Đơn vị tính

  // Thông tin điều trị
  toothPositions String[]  // Vị trí răng: ["R16", "R26"]
  specificStatus String?   // Ghi chú của bác sĩ

  // Thông tin tài chính
  quantity          Int @default(1)
  price             Int  // Đơn giá gốc (snapshot)
  preferentialPrice Int  // Giá ưu đãi/đơn vị
  finalPrice        Int  // Thành tiền = preferentialPrice * quantity
  amountPaid        Int @default(0)  // Số tiền đã trả
  debt              Int  // Công nợ = finalPrice - amountPaid

  // Trạng thái & Ngày
  consultationDate   DateTime  @default(now()) @db.Timestamptz
  serviceConfirmDate DateTime? @db.Timestamptz
  serviceStatus      String    @default("Chưa chốt")    // "Chưa chốt", "Đã chốt"
  treatmentStatus    String    @default("Chưa điều trị") // "Chưa điều trị", "Đang điều trị", "Hoàn thành"

  // Phân công nhân sự
  consultingDoctorId String?
  consultingSaleId   String?
  treatingDoctorId   String?

  // Audit
  createdById String
  updatedById String
  createdAt   DateTime @default(now()) @db.Timestamptz
  updatedAt   DateTime @updatedAt @db.Timestamptz

  // Relations
  customer         Customer
  dentalService    DentalService
  consultingDoctor Employee?
  consultingSale   Employee?
  treatingDoctor   Employee?
  createdBy        Employee
  updatedBy        Employee
  treatmentLogs    TreatmentLog[]
  paymentDetails   PaymentVoucherDetail[]
  Appointment      Appointment?
}
```

---

## II. BUSINESS RULES

### A. Quy tắc tạo dịch vụ (CREATE)

1. **Bắt buộc check-in trước**:

   - Customer phải có appointment đã check-in (checkInTime != null) hôm nay
   - Nếu chưa check-in → Error: "Khách hàng chưa check-in hôm nay. Vui lòng check-in trước khi tạo dịch vụ tư vấn!"

2. **Gắn với appointment**:

   - Tự động gắn `appointmentId` với appointment đã check-in hôm nay
   - Appointment có relation 1-n với ConsultedService

3. **Copy dữ liệu (Denormalization)**:

   - Copy từ DentalService → ConsultedService:
     - `consultedServiceName` ← `dentalService.name`
     - `consultedServiceUnit` ← `dentalService.unit`
     - `price` ← `dentalService.price`
   - Lý do: Giữ lịch sử giá tại thời điểm tư vấn (giá có thể thay đổi sau)

4. **Tính toán giá**:

   ```typescript
   preferentialPrice = data.preferentialPrice ?? dentalService.price;
   finalPrice = preferentialPrice * quantity;
   debt = finalPrice; // Ban đầu chưa trả
   amountPaid = 0;
   ```

5. **Status mặc định**:
   - `serviceStatus = "Chưa chốt"`
   - `treatmentStatus = "Chưa điều trị"`

---

### B. Quy tắc chỉnh sửa (UPDATE)

#### B1. Service chưa chốt (serviceStatus = "Chưa chốt")

- **Ai cũng có thể sửa tất cả fields** (không giới hạn)

#### B2. Service đã chốt (serviceStatus = "Đã chốt")

**Role: Admin**

- ✅ Được sửa **tất cả fields** (không giới hạn)
- Lý do: Admin có toàn quyền để sửa lỗi nghiệp vụ

**Role: Manager/Employee (Non-admin)**

- ❌ **Không được sửa** các fields nghiệp vụ chính:

  - `dentalServiceId`, `toothPositions`, `quantity`, `price`, `preferentialPrice`, `finalPrice`, `specificStatus`
  - Error: "Dịch vụ đã chốt không thể chỉnh sửa thông tin cơ bản! Chỉ admin mới có quyền này."

- ✅ **Được sửa các fields nhân sự** (có thời hạn):
  - `consultingDoctorId`, `consultingSaleId`, `treatingDoctorId`
  - **Trong 33 ngày** kể từ `serviceConfirmDate`
  - Sau 33 ngày → Error: "Dịch vụ đã chốt quá 33 ngày, không thể sửa thông tin nhân sự!"

**Logic kiểm tra**:

```typescript
const daysSinceConfirm = calculateDaysSinceConfirm(serviceConfirmDate);

if (serviceStatus === "Đã chốt") {
  if (!isAdmin && hasOtherFieldChanges) {
    // Reject: non-admin không được sửa fields nghiệp vụ
    return 403;
  }

  if (!isAdmin && hasEmployeeFieldChanges && daysSinceConfirm > 33) {
    // Reject: non-admin quá 33 ngày
    return 403;
  }
}
```

---

### C. Quy tắc xóa (DELETE)

**Role: Admin**

- ✅ Được xóa **tất cả services** (kể cả đã chốt)
- Warning: "⚠️ ADMIN: Đây là dịch vụ đã chốt, việc xóa có thể ảnh hưởng đến dữ liệu nghiệp vụ!"

**Role: Manager/Employee (Non-admin)**

- ✅ Được xóa service **chưa chốt**
- ❌ Không được xóa service **đã chốt**
  - Error: "Không thể xóa dịch vụ đã chốt! Chỉ admin mới có quyền này."

---

### D. Quy tắc chốt dịch vụ (CONFIRM - PATCH)

1. **Chỉ chốt được service chưa chốt**:

   - Nếu đã chốt → Error: "Dịch vụ đã được chốt trước đó"

2. **Khi chốt**:

   ```typescript
   serviceStatus = "Đã chốt";
   serviceConfirmDate = now();
   ```

3. **Tác động**:
   - Service đã chốt → Phát sinh nghiệp vụ tài chính
   - Hạn chế quyền sửa/xóa theo rules B, C

---

### E. Tooth Positions (Vị trí răng)

1. **Data type**: `String[]` - Array các mã răng
2. **Format**: `["R11", "R12", "R16", "R26"]`
   - R = Răng
   - Số = Vị trí răng theo hệ FDI (11-48)
3. **UI**: ToothSelectionModal - dental chart selector
4. **Optional**: Có thể không chọn răng (cho dịch vụ tổng quát)

---

## III. BACKEND ARCHITECTURE

### A. Folder Structure

```
src/
├── shared/
│   └── validation/
│       └── consulted-service.validation.ts  # Zod schemas
├── server/
│   ├── repos/
│   │   └── consulted-service.repo.ts        # Data access
│   └── services/
│       └── consulted-service.service.ts     # Business logic
└── app/api/v1/consulted-services/
    ├── route.ts                             # GET /list, POST /create
    └── [id]/
        └── route.ts                         # GET, PUT, DELETE, PATCH /confirm
```

---

### B. Zod Schemas (`src/shared/validation/consulted-service.validation.ts`)

```typescript
import { z } from "zod";

// Base schema (common fields)
const ConsultedServiceBaseSchema = z.object({
  dentalServiceId: z.string().uuid("ID dịch vụ không hợp lệ"),
  toothPositions: z.array(z.string()).default([]),
  specificStatus: z.string().optional().nullable(),
  quantity: z.number().int().min(1, "Số lượng tối thiểu là 1").default(1),
  preferentialPrice: z.number().int().min(0, "Giá ưu đãi không thể âm"),
  consultingDoctorId: z.string().uuid().optional().nullable(),
  consultingSaleId: z.string().uuid().optional().nullable(),
  treatingDoctorId: z.string().uuid().optional().nullable(),
});

// Backend Request Schemas
export const CreateConsultedServiceRequestSchema =
  ConsultedServiceBaseSchema.extend({
    customerId: z.string().uuid(),
    clinicId: z.string().uuid(),
  });

export const UpdateConsultedServiceRequestSchema =
  ConsultedServiceBaseSchema.partial();

// Frontend Form Schema
export const CreateConsultedServiceFormSchema = z.object({
  dentalServiceId: z.string().min(1, "Vui lòng chọn dịch vụ"),
  toothPositions: z.array(z.string()).default([]),
  specificStatus: z.string().optional(),
  quantity: z.number().min(1, "Số lượng tối thiểu là 1").default(1),
  preferentialPrice: z.number().min(0, "Giá ưu đãi không thể âm"),
  consultingDoctorId: z.string().optional(),
  consultingSaleId: z.string().optional(),
  treatingDoctorId: z.string().optional(),
  consultedServiceName: z.string().optional(), // Auto-filled (readonly)
  consultedServiceUnit: z.string().optional(), // Auto-filled (readonly)
  price: z.number().optional(), // Auto-filled (readonly)
  finalPrice: z.number().optional(), // Auto-calculated (readonly)
});

// Query Schemas
export const GetConsultedServicesQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(), // YYYY-MM-DD
  clinicId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  consultingDoctorId: z.string().uuid().optional(),
  consultingSaleId: z.string().uuid().optional(),
});

// Response Schemas
export const ConsultedServiceResponseSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  appointmentId: z.string().nullable(),
  dentalServiceId: z.string(),
  clinicId: z.string(),
  consultedServiceName: z.string(),
  consultedServiceUnit: z.string(),
  toothPositions: z.array(z.string()),
  specificStatus: z.string().nullable(),
  quantity: z.number(),
  price: z.number(),
  preferentialPrice: z.number(),
  finalPrice: z.number(),
  amountPaid: z.number(),
  debt: z.number(),
  consultationDate: z.string().datetime(),
  serviceConfirmDate: z.string().datetime().nullable(),
  serviceStatus: z.string(),
  treatmentStatus: z.string(),
  consultingDoctorId: z.string().nullable(),
  consultingSaleId: z.string().nullable(),
  treatingDoctorId: z.string().nullable(),
  createdById: z.string(),
  updatedById: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  // Relations (when included)
  customer: z
    .object({
      id: z.string(),
      customerCode: z.string().nullable(),
      fullName: z.string(),
      phone: z.string().nullable(),
    })
    .optional(),
  dentalService: z
    .object({
      id: z.string(),
      name: z.string(),
      unit: z.string(),
    })
    .optional(),
  consultingDoctor: z
    .object({
      id: z.string(),
      fullName: z.string(),
    })
    .optional()
    .nullable(),
  consultingSale: z
    .object({
      id: z.string(),
      fullName: z.string(),
    })
    .optional()
    .nullable(),
  treatingDoctor: z
    .object({
      id: z.string(),
      fullName: z.string(),
    })
    .optional()
    .nullable(),
});

export const ConsultedServiceListResponseSchema = z.array(
  ConsultedServiceResponseSchema
);

// Type exports
export type CreateConsultedServiceRequest = z.infer<
  typeof CreateConsultedServiceRequestSchema
>;
export type UpdateConsultedServiceRequest = z.infer<
  typeof UpdateConsultedServiceRequestSchema
>;
export type CreateConsultedServiceFormData = z.infer<
  typeof CreateConsultedServiceFormSchema
>;
export type GetConsultedServicesQuery = z.infer<
  typeof GetConsultedServicesQuerySchema
>;
export type ConsultedServiceResponse = z.infer<
  typeof ConsultedServiceResponseSchema
>;
export type ConsultedServiceListResponse = z.infer<
  typeof ConsultedServiceListResponseSchema
>;
```

---

### C. Repository (`src/server/repos/consulted-service.repo.ts`)

```typescript
import { prisma } from "@/services/prismaClient";
import type {
  CreateConsultedServiceRequest,
  UpdateConsultedServiceRequest,
} from "@/shared/validation/consulted-service.validation";
import type { Prisma } from "@prisma/client";

// Complex Pattern: API Schema + Server Fields + Denormalized Data
export type ConsultedServiceCreateInput = Omit<
  CreateConsultedServiceRequest,
  "dentalServiceId"
> & {
  dentalServiceId: string;
  // Server-controlled fields
  consultedServiceName: string; // Copy from DentalService
  consultedServiceUnit: string; // Copy from DentalService
  price: number; // Copy from DentalService
  finalPrice: number; // Calculated
  debt: number; // Calculated
  amountPaid?: number; // Default 0
  appointmentId?: string; // Auto-linked to today's checked-in appointment
  // Audit
  createdById: string;
  updatedById: string;
};

export type ConsultedServiceUpdateInput = UpdateConsultedServiceRequest & {
  updatedById: string;
  updatedAt: Date;
};

// Select cho API response
const consultedServiceWithRelations = {
  include: {
    customer: {
      select: {
        id: true,
        customerCode: true,
        fullName: true,
        phone: true,
      },
    },
    dentalService: {
      select: {
        id: true,
        name: true,
        unit: true,
      },
    },
    consultingDoctor: { select: { id: true, fullName: true } },
    consultingSale: { select: { id: true, fullName: true } },
    treatingDoctor: { select: { id: true, fullName: true } },
  },
} satisfies Prisma.ConsultedServiceDefaultArgs;

export const consultedServiceRepo = {
  async create(data: ConsultedServiceCreateInput) {
    return prisma.consultedService.create({
      data,
      ...consultedServiceWithRelations,
    });
  },

  async findById(id: string) {
    return prisma.consultedService.findUnique({
      where: { id },
      ...consultedServiceWithRelations,
    });
  },

  async update(id: string, data: ConsultedServiceUpdateInput) {
    return prisma.consultedService.update({
      where: { id },
      data,
      ...consultedServiceWithRelations,
    });
  },

  async delete(id: string) {
    return prisma.consultedService.delete({ where: { id } });
  },

  async list(params: {
    where: Prisma.ConsultedServiceWhereInput;
    orderBy?: Prisma.ConsultedServiceOrderByWithRelationInput;
  }) {
    return prisma.consultedService.findMany({
      ...params,
      ...consultedServiceWithRelations,
    });
  },

  // Helper: Get DentalService by ID (for copying data)
  async getDentalService(id: string) {
    return prisma.dentalService.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        unit: true,
        price: true,
      },
    });
  },

  // Helper: Find today's checked-in appointment
  async findTodayCheckedInAppointment(
    customerId: string,
    startOfDay: string,
    endOfDay: string
  ) {
    return prisma.appointment.findFirst({
      where: {
        customerId,
        appointmentDateTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        checkInTime: { not: null },
      },
      include: {
        customer: { select: { fullName: true } },
      },
    });
  },
};
```

---

### D. Service (`src/server/services/consulted-service.service.ts`)

```typescript
import { consultedServiceRepo } from "@/server/repos/consulted-service.repo";
import type {
  CreateConsultedServiceRequest,
  UpdateConsultedServiceRequest,
} from "@/shared/validation/consulted-service.validation";
import { ServiceError } from "@/server/errors/ServiceError";
import dayjs from "dayjs";

export const consultedServiceService = {
  async create(
    currentUser: { id: string; clinicId: string },
    body: CreateConsultedServiceRequest
  ) {
    // Validation 1: Check customer đã check-in hôm nay chưa
    const today = dayjs();
    const startOfDay = today.startOf("day").format();
    const endOfDay = today.endOf("day").format();

    const checkedInAppointment =
      await consultedServiceRepo.findTodayCheckedInAppointment(
        body.customerId,
        startOfDay,
        endOfDay
      );

    if (!checkedInAppointment) {
      throw new ServiceError(
        "NOT_CHECKED_IN",
        "Khách hàng chưa check-in hôm nay. Vui lòng check-in trước khi tạo dịch vụ tư vấn!",
        400
      );
    }

    // Validation 2: Get DentalService để copy data
    const dentalService = await consultedServiceRepo.getDentalService(
      body.dentalServiceId
    );
    if (!dentalService) {
      throw new ServiceError(
        "NOT_FOUND",
        "Không tìm thấy dịch vụ nha khoa",
        404
      );
    }

    // Calculate prices
    const preferentialPrice = body.preferentialPrice ?? dentalService.price;
    const finalPrice = preferentialPrice * body.quantity;

    // Create consulted service
    return consultedServiceRepo.create({
      ...body,
      appointmentId: checkedInAppointment.id,
      // Copy from DentalService
      consultedServiceName: dentalService.name,
      consultedServiceUnit: dentalService.unit,
      price: dentalService.price,
      // Calculated fields
      preferentialPrice,
      finalPrice,
      debt: finalPrice,
      amountPaid: 0,
      // Audit
      createdById: currentUser.id,
      updatedById: currentUser.id,
    });
  },

  async update(
    currentUser: { id: string; role: string },
    id: string,
    body: UpdateConsultedServiceRequest
  ) {
    const existing = await consultedServiceRepo.findById(id);
    if (!existing) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy dịch vụ", 404);
    }

    const isAdmin = currentUser.role === "admin";
    const isConfirmed = existing.serviceStatus === "Đã chốt";

    // Check employee field changes
    const employeeFields = [
      "consultingDoctorId",
      "treatingDoctorId",
      "consultingSaleId",
    ];
    const hasEmployeeFieldChanges = employeeFields.some(
      (field) => field in body
    );

    // Check other field changes
    const otherFields = Object.keys(body).filter(
      (field) => !employeeFields.includes(field) && field !== "updatedById"
    );
    const hasOtherFieldChanges = otherFields.length > 0;

    // Validation: Service đã chốt
    if (isConfirmed && !isAdmin) {
      // Non-admin không được sửa fields nghiệp vụ
      if (hasOtherFieldChanges) {
        throw new ServiceError(
          "CONFIRMED_SERVICE_EDIT_DENIED",
          "Dịch vụ đã chốt không thể chỉnh sửa thông tin cơ bản! Chỉ admin mới có quyền này.",
          403
        );
      }

      // Non-admin chỉ được sửa employee fields trong 33 ngày
      if (hasEmployeeFieldChanges && existing.serviceConfirmDate) {
        const daysSinceConfirm = dayjs().diff(
          dayjs(existing.serviceConfirmDate),
          "day"
        );
        if (daysSinceConfirm > 33) {
          throw new ServiceError(
            "EMPLOYEE_EDIT_TIME_EXPIRED",
            "Dịch vụ đã chốt quá 33 ngày, không thể sửa thông tin nhân sự!",
            403
          );
        }
      }
    }

    return consultedServiceRepo.update(id, {
      ...body,
      updatedById: currentUser.id,
      updatedAt: new Date(),
    });
  },

  async delete(currentUser: { role: string }, id: string) {
    const existing = await consultedServiceRepo.findById(id);
    if (!existing) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy dịch vụ", 404);
    }

    const isAdmin = currentUser.role === "admin";
    const isConfirmed = existing.serviceStatus === "Đã chốt";

    // Validation: Only admin can delete confirmed services
    if (isConfirmed && !isAdmin) {
      throw new ServiceError(
        "DELETE_CONFIRMED_DENIED",
        "Không thể xóa dịch vụ đã chốt! Chỉ admin mới có quyền này.",
        403
      );
    }

    await consultedServiceRepo.delete(id);
  },

  async getById(id: string) {
    const service = await consultedServiceRepo.findById(id);
    if (!service) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy dịch vụ", 404);
    }
    return service;
  },

  async list(params: {
    date?: string;
    clinicId?: string;
    customerId?: string;
    consultingDoctorId?: string;
    consultingSaleId?: string;
  }) {
    const where: any = {};

    if (params.customerId) {
      where.customerId = params.customerId;
    }

    if (params.date) {
      const selectedDate = dayjs(params.date);
      where.consultationDate = {
        gte: selectedDate.startOf("day").format(),
        lte: selectedDate.endOf("day").format(),
      };
    }

    if (params.clinicId) {
      where.clinicId = params.clinicId;
    }

    if (params.consultingDoctorId || params.consultingSaleId) {
      const orConditions: any[] = [];
      if (params.consultingDoctorId) {
        orConditions.push({ consultingDoctorId: params.consultingDoctorId });
      }
      if (params.consultingSaleId) {
        orConditions.push({ consultingSaleId: params.consultingSaleId });
      }
      where.OR = orConditions;
    }

    return consultedServiceRepo.list({
      where,
      orderBy: { consultationDate: "asc" },
    });
  },

  async confirm(currentUser: { id: string }, id: string) {
    const existing = await consultedServiceRepo.findById(id);
    if (!existing) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy dịch vụ", 404);
    }

    if (existing.serviceStatus === "Đã chốt") {
      throw new ServiceError(
        "ALREADY_CONFIRMED",
        "Dịch vụ đã được chốt trước đó",
        400
      );
    }

    return consultedServiceRepo.update(id, {
      serviceStatus: "Đã chốt",
      serviceConfirmDate: new Date(),
      updatedById: currentUser.id,
      updatedAt: new Date(),
    });
  },
};
```

---

### E. API Routes (Example: `src/app/api/v1/consulted-services/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { consultedServiceService } from "@/server/services/consulted-service.service";
import {
  CreateConsultedServiceRequestSchema,
  GetConsultedServicesQuerySchema,
} from "@/shared/validation/consulted-service.validation";
import { getSessionUser } from "@/server/auth/session";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { ServiceError } from "@/server/errors/ServiceError";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getSessionUser();
    const { searchParams } = new URL(request.url);

    const query = GetConsultedServicesQuerySchema.parse({
      date: searchParams.get("date") || undefined,
      clinicId: searchParams.get("clinicId") || undefined,
      customerId: searchParams.get("customerId") || undefined,
      consultingDoctorId: searchParams.get("consultingDoctorId") || undefined,
      consultingSaleId: searchParams.get("consultingSaleId") || undefined,
    });

    const services = await consultedServiceService.list(query);
    return NextResponse.json(services);
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
    const data = CreateConsultedServiceRequestSchema.parse(body);

    const service = await consultedServiceService.create(currentUser, data);
    return NextResponse.json(service, { status: 201 });
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

```typescript
// src/app/api/v1/consulted-services/[id]/route.ts
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getSessionUser();
    const body = await request.json();
    const data = UpdateConsultedServiceRequestSchema.parse(body);

    const service = await consultedServiceService.update(currentUser, id, data);
    return NextResponse.json(service);
  } catch (error: any) {
    // Handle errors...
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getSessionUser();

    await consultedServiceService.delete(currentUser, id);
    return NextResponse.json({
      success: true,
      message: "Đã xóa dịch vụ thành công!",
    });
  } catch (error: any) {
    // Handle errors...
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getSessionUser();

    const service = await consultedServiceService.confirm(currentUser, id);
    return NextResponse.json(service);
  } catch (error: any) {
    // Handle errors...
  }
}
```

---

## IV. FRONTEND ARCHITECTURE

### A. Folder Structure

```
src/features/consulted-services/
├── constants.ts                       # Endpoints, query keys, messages, status options
├── api/
│   ├── index.ts                       # Barrel export
│   ├── createConsultedService.ts
│   ├── updateConsultedService.ts
│   ├── getConsultedService.ts
│   ├── getConsultedServices.ts
│   ├── deleteConsultedService.ts
│   └── confirmConsultedService.ts
├── hooks/
│   ├── index.ts                       # Barrel export
│   ├── useConsultedServices.ts        # Query (list)
│   ├── useConsultedService.ts         # Query (single)
│   ├── useCreateConsultedService.ts   # Mutation
│   ├── useUpdateConsultedService.ts   # Mutation
│   ├── useDeleteConsultedService.ts   # Mutation
│   └── useConfirmConsultedService.ts  # Mutation
├── components/
│   ├── ConsultedServiceTable.tsx
│   ├── ConsultedServiceForm.tsx
│   ├── ConsultedServiceModal.tsx
│   ├── ConsultedServiceView.tsx       # Read-only view
│   └── ToothSelectionModal.tsx        # Dental chart selector
└── views/
    └── ConsultedServiceDailyView.tsx  # Daily list view
```

---

### B. Constants (`src/features/consulted-services/constants.ts`)

```typescript
export const CONSULTED_SERVICE_ENDPOINTS = {
  BASE: "/api/v1/consulted-services",
  BY_ID: (id: string) => `/api/v1/consulted-services/${id}`,
  CONFIRM: (id: string) => `/api/v1/consulted-services/${id}`, // PATCH
};

export const CONSULTED_SERVICE_QUERY_KEYS = {
  all: ["consulted-services"] as const,
  lists: () => [...CONSULTED_SERVICE_QUERY_KEYS.all, "list"] as const,
  list: (filters: any) =>
    [...CONSULTED_SERVICE_QUERY_KEYS.lists(), filters] as const,
  details: () => [...CONSULTED_SERVICE_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) =>
    [...CONSULTED_SERVICE_QUERY_KEYS.details(), id] as const,
  daily: (date: string, clinicId?: string) =>
    [...CONSULTED_SERVICE_QUERY_KEYS.all, "daily", date, clinicId] as const,
  byCustomer: (customerId: string) =>
    [...CONSULTED_SERVICE_QUERY_KEYS.all, "customer", customerId] as const,
};

export const CONSULTED_SERVICE_MESSAGES = {
  CREATE_SUCCESS: "Tạo dịch vụ tư vấn thành công!",
  UPDATE_SUCCESS: "Cập nhật dịch vụ thành công!",
  DELETE_SUCCESS: "Xóa dịch vụ thành công!",
  CONFIRM_SUCCESS: "Chốt dịch vụ thành công!",
  DELETE_CONFIRM: "Bạn chắc chắn muốn xóa dịch vụ này?",
  CONFIRM_CONFIRM:
    "Bạn chắc chắn muốn chốt dịch vụ này?\n\nSau khi chốt, dịch vụ sẽ chính thức được xác nhận và phát sinh nghiệp vụ tài chính.",
  NOT_CHECKED_IN:
    "Khách hàng chưa check-in hôm nay. Vui lòng check-in trước khi tạo dịch vụ tư vấn!",
};

export const SERVICE_STATUS_OPTIONS = [
  { value: "Chưa chốt", label: "Chưa chốt", color: "orange" },
  { value: "Đã chốt", label: "Đã chốt", color: "green" },
];

export const TREATMENT_STATUS_OPTIONS = [
  { value: "Chưa điều trị", label: "Chưa điều trị", color: "default" },
  { value: "Đang điều trị", label: "Đang điều trị", color: "blue" },
  { value: "Hoàn thành", label: "Hoàn thành", color: "green" },
];
```

---

### C. API Client Example (`src/features/consulted-services/api/createConsultedService.ts`)

```typescript
import { CONSULTED_SERVICE_ENDPOINTS } from "../constants";
import {
  CreateConsultedServiceRequestSchema,
  ConsultedServiceResponseSchema,
} from "@/shared/validation/consulted-service.validation";

export async function createConsultedServiceApi(body: unknown) {
  const validated = CreateConsultedServiceRequestSchema.parse(body);

  const res = await fetch(CONSULTED_SERVICE_ENDPOINTS.BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validated),
  });

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error || "Tạo dịch vụ tư vấn thất bại");
  }

  const data = await res.json();
  return ConsultedServiceResponseSchema.parse(data);
}
```

---

### D. React Query Hook Example (`src/features/consulted-services/hooks/useCreateConsultedService.ts`)

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createConsultedServiceApi } from "../api/createConsultedService";
import {
  CONSULTED_SERVICE_QUERY_KEYS,
  CONSULTED_SERVICE_MESSAGES,
} from "../constants";
import { useNotify } from "@/hooks/useNotify";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useCreateConsultedService() {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: createConsultedServiceApi,
    onSuccess: () => {
      notify.success(CONSULTED_SERVICE_MESSAGES.CREATE_SUCCESS);
      queryClient.invalidateQueries({
        queryKey: CONSULTED_SERVICE_QUERY_KEYS.all,
      });
    },
    onError: (error) => {
      notify.error(error, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR });
    },
  });
}
```

---

### E. Components

#### E1. ConsultedServiceForm

- **Edit permissions**:
  - Check `canEditOtherFields` (admin always true, non-admin only if not confirmed)
  - Check `canEditEmployeeFields` (admin always true, non-admin within 33 days if confirmed)
- **Auto-fill logic**:
  - When select `dentalServiceId` → auto-fill `price`, `preferentialPrice`, `consultedServiceName`, `consultedServiceUnit`
- **Auto-calculate**:
  - `finalPrice = preferentialPrice * quantity`
- **Tooth selection**:
  - Button "Chọn vị trí răng" → Open ToothSelectionModal
  - Display selected teeth as Tags

#### E2. ConsultedServiceTable

- **Columns**:
  - Customer info (conditional - `showCustomerColumn`)
  - Service name, price, quantity, finalPrice
  - Doctors/sale
  - Service status (with tooltip showing confirm date)
  - Consultation date
- **Actions**:
  - View (Eye icon) - always enabled
  - Confirm (Button "Chốt") - only if status = "Chưa chốt"
  - Edit (Pencil icon) - always enabled
  - Delete (Trash icon) - conditional:
    - Admin: always show
    - Non-admin: only show if status = "Chưa chốt"

#### E3. ConsultedServiceModal

- **Modes**: `add`, `edit`, `view`
- **View mode**: All fields readonly, no save button
- **Add mode**: Check customer check-in status first
- **Edit mode**: Permissions based on service status + role

#### E4. ToothSelectionModal

- **UI**: Dental chart (4 quadrants)
- **Tooth numbering**: FDI system (11-48)
- **Interaction**: Click to toggle selection
- **Return**: Array of selected tooth codes `["R11", "R16", ...]`

---

### F. Views

#### ConsultedServiceDailyView

- **Date navigation**: Previous/Next day, Today button, DatePicker
- **Clinic selector** (admin only)
- **Summary cards**:
  - Total services
  - Confirmed services
  - Pending services
  - Total value (confirmed only)
- **Table**: ConsultedServiceTable
- **Actions**: Edit, View, Delete, Confirm
- **No Add button**: Services created from CustomerDetailPage only

---

## V. INTEGRATION WITH CUSTOMERS FEATURE

### A. Customer Detail Page

**Tab: "Dịch vụ đã tư vấn"**

- Display `customer.consultedServices` in ConsultedServiceTable
- Show alert if customer not checked in today (when trying to add service)
- Actions: Add, Edit, View, Delete, Confirm

**Check-in requirement**:

```typescript
const todayCheckinStatus = useMemo(() => {
  const today = dayjs().format("YYYY-MM-DD");
  const todayAppt = customer.appointments?.find((appt) => {
    const apptDate = dayjs(appt.appointmentDateTime).format("YYYY-MM-DD");
    return apptDate === today && appt.checkInTime;
  });
  return { hasCheckedIn: !!todayAppt, appointment: todayAppt };
}, [customer.appointments]);
```

### B. Customer List Page

**Check-in modal**:

- Show today's appointment info
- After check-in → Customer can create consulted services

---

### C. useConsultedService Hook (trong Customer Feature)

**Location**: `src/features/customers/hooks/useConsultedService.ts`

**Purpose**: Quản lý CRUD operations cho consulted services trong context của customer detail page

**State Management**:

```typescript
const [modalState, setModalState] = useState<{
  open: boolean;
  mode: "add" | "edit" | "view";
  data?: Partial<ConsultedServiceWithDetails>;
}>({ open: false, mode: "add" });

const [saving, setSaving] = useState(false);
```

**Exported Functions**:

#### C1. handleAddService()

- Open modal in "add" mode
- Automatically pass `customerId` from customer context

#### C2. handleEditService(service)

- Fetch fresh data from API
- Open modal in "edit" mode
- Pre-fill form with service data

#### C3. handleViewService(service)

- Fetch fresh data from API
- Open modal in "view" mode (readonly)
- Display all service details

#### C4. handleFinishService(values)

- **Create flow** (mode = "add"):

  ```typescript
  POST /api/v1/consulted-services
  Body: {
    ...values,
    customerId: customer.id,
    clinicId: employeeProfile.clinicId,
    createdById: employeeProfile.id,
    updatedById: employeeProfile.id,
  }
  ```

- **Update flow** (mode = "edit"):

  ```typescript
  PUT /api/v1/consulted-services/:id
  Body: {
    ...values,
    updatedById: employeeProfile.id,
  }
  ```

- **Permission-aware payload** (nếu service đã chốt và user không phải admin):

  ```typescript
  // Chỉ gửi employee fields
  const filteredPayload = {
    consultingDoctorId: values.consultingDoctorId,
    treatingDoctorId: values.treatingDoctorId,
    consultingSaleId: values.consultingSaleId,
    updatedById: employeeProfile.id,
  };
  ```

- **Local state update**:

  ```typescript
  setCustomer((prev) => ({
    ...prev,
    consultedServices: isEdit
      ? prev.consultedServices.map((s) =>
          s.id === serviceId ? updatedService : s
        )
      : [newService, ...prev.consultedServices],
  }));
  ```

- **Refresh customer data**:
  ```typescript
  const refreshRes = await fetch(
    `/api/customers/${customer.id}?includeDetails=true`
  );
  if (refreshRes.ok) {
    const refreshedCustomer = await refreshRes.json();
    setCustomer(refreshedCustomer);
  }
  ```

#### C5. handleDeleteService(service)

- **Permission check** (Frontend):

  ```typescript
  const isAdmin = employeeProfile?.role === "admin";
  if (!isAdmin && service.serviceStatus === "Đã chốt") {
    toast.error("Không thể xóa dịch vụ đã chốt! Chỉ admin mới có quyền này.");
    return;
  }
  ```

- **Confirmation**:

  ```typescript
  let confirmMessage = `Bạn chắc chắn muốn xóa dịch vụ "${service.consultedServiceName}"?`;

  if (isAdmin && service.serviceStatus === "Đã chốt") {
    confirmMessage = `⚠️ ADMIN: ${confirmMessage}\n\nLưu ý: Đây là dịch vụ đã chốt, việc xóa có thể ảnh hưởng đến dữ liệu nghiệp vụ!`;
  }
  ```

- **API call with auth headers**:

  ```typescript
  const res = await fetch(`/api/consulted-services/${service.id}`, {
    method: "DELETE",
    headers: {
      ...authHeaders, // Include x-employee-role header
    },
  });
  ```

- **Local state update + refresh**:

  ```typescript
  setCustomer((prev) => ({
    ...prev,
    consultedServices: prev.consultedServices.filter(
      (s) => s.id !== service.id
    ),
  }));

  // Refresh customer data để đồng bộ
  const refreshRes = await fetch(
    `/api/customers/${customer.id}?includeDetails=true`
  );
  ```

#### C6. handleConfirmService(service)

- **Confirmation dialog**:

  ```typescript
  const confirmed = window.confirm(
    `Bạn chắc chắn muốn chốt dịch vụ "${service.consultedServiceName}"?\n\nSau khi chốt, dịch vụ sẽ chính thức được xác nhận và phát sinh nghiệp vụ tài chính.`
  );
  ```

- **API call**:

  ```typescript
  PATCH /api/consulted-services/:id
  Body: {
    serviceStatus: "Đã chốt",
    serviceConfirmDate: nowVN(),
    updatedById: employeeProfile.id,
  }
  ```

- **Local state update**:
  ```typescript
  setCustomer((prev) => ({
    ...prev,
    consultedServices: prev.consultedServices.map((s) =>
      s.id === service.id ? updatedService : s
    ),
  }));
  ```

**Return object**:

```typescript
return {
  modalState,
  setModalState,
  saving,
  handleAddService,
  handleEditService,
  handleViewService,
  handleFinishService,
  handleDeleteService,
  handleConfirmService,
};
```

---

### D. Customer API - Include Consulted Services

**Endpoint**: `GET /api/v1/customers/:id?includeDetails=true`

**Include structure**:

```typescript
const include = includeDetails
  ? {
      primaryContact: true,
      appointments: {
        orderBy: { appointmentDateTime: "desc" },
        include: {
          customer: true,
          primaryDentist: true,
          secondaryDentist: true,
        },
      },
      consultedServices: {
        orderBy: { consultationDate: "desc" },
        include: {
          dentalService: true,
          consultingDoctor: {
            select: { id: true, fullName: true },
          },
          treatingDoctor: {
            select: { id: true, fullName: true },
          },
          consultingSale: {
            select: { id: true, fullName: true },
          },
        },
      },
      treatmentLogs: {
        /* ... */
      },
      paymentVouchers: {
        /* ... */
      },
    }
  : {
      // Minimal includes for list view
      primaryContact: {
        select: { customerCode: true, fullName: true, phone: true },
      },
    };
```

**Response Type**:

```typescript
export type CustomerWithDetails = Customer & {
  appointments?: Appointment[];
  consultedServices?: ConsultedServiceWithDetails[];
  treatmentLogs?: TreatmentLog[];
  paymentVouchers?: PaymentVoucherWithDetails[];
  primaryContact?: Customer | null;
};
```

---

### E. Customer Outstanding Services API

**Endpoint**: `GET /api/v1/customers/:id/outstanding-services`

**Purpose**: Lấy danh sách dịch vụ đã chốt nhưng còn nợ (để thanh toán)

**Logic**:

```typescript
const consultedServices = await prisma.consultedService.findMany({
  where: {
    customerId: id,
    serviceStatus: "Đã chốt",
    debt: { gt: 0 }, // Còn nợ
  },
  include: {
    dentalService: { select: { id: true, name: true, unit: true } },
  },
  orderBy: { consultationDate: "asc" },
});

const outstandingServices = consultedServices.map((service) => ({
  id: service.id,
  consultedServiceName: service.consultedServiceName,
  finalPrice: service.finalPrice,
  amountPaid: service.amountPaid,
  debt: service.debt,
  consultationDate: service.consultationDate,
}));

return NextResponse.json(outstandingServices);
```

**Usage**: Trong payment feature để chọn dịch vụ cần thanh toán

---

### F. Integration Flow Summary

```
1. Customer Detail Page
   ↓
2. Click "Thêm dịch vụ tư vấn"
   ↓
3. Check todayCheckinStatus
   ├─ Not checked in → Show alert "Cần check-in trước"
   └─ Checked in → Open ConsultedServiceModal (mode: add)
       ↓
4. Fill form + Submit
   ↓
5. useConsultedService.handleFinishService()
   ├─ Call POST /api/consulted-services
   ├─ Backend validates check-in
   ├─ Backend copies data from DentalService
   ├─ Backend links with today's appointment
   └─ Return created service
       ↓
6. Update local state + Refresh customer data
   ↓
7. Table re-renders with new service
   ↓
8. User can: Edit, View, Delete, Confirm
```

**Financial Flow**:

```
Consulted Service (Đã chốt)
   ↓
Payment Voucher Creation
   ├─ Select outstanding services (debt > 0)
   ├─ Create payment voucher
   └─ Create payment details (link to consulted services)
       ↓
Update ConsultedService.amountPaid
Update ConsultedService.debt
```

---

## VI. SPECIAL FEATURES

### A. Denormalization (Data Snapshot)

**Why**:

- DentalService prices change over time
- Need to keep historical record of prices at consultation time

**What to copy**:

```typescript
{
  consultedServiceName: dentalService.name,
  consultedServiceUnit: dentalService.unit,
  price: dentalService.price,
}
```

### B. Financial Calculation

```typescript
// Initial calculation
preferentialPrice = data.preferentialPrice ?? dentalService.price;
finalPrice = preferentialPrice * quantity;
debt = finalPrice;
amountPaid = 0;

// After payments (handled by payment feature)
amountPaid += paymentAmount;
debt = finalPrice - amountPaid;
```

### C. 33-Day Rule for Employee Fields

**Logic**:

```typescript
import dayjs from "dayjs";

export function calculateDaysSinceConfirm(serviceConfirmDate: string): number {
  const confirmDate = dayjs(serviceConfirmDate);
  const now = dayjs();
  return now.diff(confirmDate, "day");
}

// Usage
const daysSinceConfirm = calculateDaysSinceConfirm(service.serviceConfirmDate);
const canEditEmployeeFields = daysSinceConfirm <= 33;
```

---

## VII. CHECKLIST IMPLEMENTATION

### Backend

- [ ] Tạo `src/shared/validation/consulted-service.validation.ts`
- [ ] Tạo `src/server/repos/consulted-service.repo.ts`
- [ ] Tạo `src/server/services/consulted-service.service.ts`
- [ ] Refactor API routes sang `/api/v1/consulted-services/*`
- [ ] Implement check-in validation (customer must check-in first)
- [ ] Implement denormalization (copy data from DentalService)
- [ ] Implement edit permissions (confirmed service restrictions)
- [ ] Implement 33-day rule for employee field edits
- [ ] Implement delete permissions (admin vs non-admin)
- [ ] Implement confirm action (PATCH)

### Frontend (Consulted Services)

- [ ] Update `constants.ts` với endpoints, query keys, messages
- [ ] Tạo API clients (`api/*.ts` + `index.ts`)
- [ ] Tạo React Query hooks (`hooks/*.ts` + `index.ts`)
- [ ] Refactor ConsultedServiceForm (permissions, auto-fill, tooth selection)
- [ ] Refactor ConsultedServiceTable (conditional columns, actions)
- [ ] Refactor ConsultedServiceModal (add/edit/view modes)
- [ ] Implement ConsultedServiceView (read-only display)
- [ ] Implement ToothSelectionModal (dental chart)
- [ ] Tạo ConsultedServiceDailyView (date navigation, summary)

### Frontend (Customers Integration)

- [ ] Update CustomerDetailPage: consulted service tab
- [ ] Update CustomerDetailPage: check-in requirement alert
- [ ] Update useConsultedService hook (add/edit/delete/confirm/view)
- [ ] Pass auth headers for API calls (role-based permissions)

### Testing

- [ ] Test check-in requirement (cannot create service without check-in)
- [ ] Test denormalization (correct data copied from DentalService)
- [ ] Test price calculations (preferentialPrice, finalPrice, debt)
- [ ] Test edit permissions (confirmed service restrictions)
- [ ] Test 33-day rule (employee fields edit time limit)
- [ ] Test delete permissions (admin vs non-admin)
- [ ] Test confirm action (status transition, confirm date)
- [ ] Test tooth selection UI (dental chart, selection array)
- [ ] Test role-based UI (admin sees all actions, non-admin has restrictions)

---

## VIII. MESSAGES & ERROR HANDLING

### Shared Messages (`src/shared/constants/messages.ts`)

```typescript
export const COMMON_MESSAGES = {
  VALIDATION_INVALID: "Dữ liệu không hợp lệ",
  UNKNOWN_ERROR: "Có lỗi xảy ra, vui lòng thử lại",
  SERVER_ERROR: "Lỗi máy chủ, vui lòng liên hệ quản trị viên",
  NOT_FOUND: "Không tìm thấy dữ liệu",
  UNAUTHORIZED: "Bạn không có quyền thực hiện thao tác này",
  PERMISSION_DENIED: "Quyền truy cập bị từ chối",
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

// Usage examples
throw new ServiceError("NOT_CHECKED_IN", "Khách hàng chưa check-in...", 400);
throw new ServiceError(
  "CONFIRMED_SERVICE_EDIT_DENIED",
  "Dịch vụ đã chốt...",
  403
);
throw new ServiceError(
  "DELETE_CONFIRMED_DENIED",
  "Không thể xóa dịch vụ đã chốt...",
  403
);
```

---

## IX. NOTES & BEST PRACTICES

1. **Không dùng Prisma trực tiếp trong API routes** → Dùng service layer
2. **Mọi validation dùng Zod** → Single source of truth
3. **React Query cho server state** → Không dùng Zustand/Context
4. **useNotify() thay vì toast trực tiếp** → Chuẩn hóa thông báo
5. **Barrel exports** → `index.ts` trong `api/` và `hooks/`
6. **Permission checking**:
   - Backend: Check trong service layer
   - Frontend: Conditional rendering (buttons, fields disabled)
7. **Auth headers**: Include `x-employee-role` header cho permission checks
8. **Date handling**: dayjs với timezone VN (Asia/Ho_Chi_Minh)
9. **Denormalization**: Copy data ngay khi create, không update sau này
10. **Financial calculations**: Handle `preferentialPrice = 0` correctly (miễn phí)
11. **Tooth positions**: Optional field, có thể empty array
12. **33-day rule**: Calculate với VN timezone để chính xác

---

## X. API SUMMARY

| Method | Endpoint                         | Action          | Permission                           |
| ------ | -------------------------------- | --------------- | ------------------------------------ |
| GET    | `/api/v1/consulted-services`     | List services   | All authenticated                    |
| POST   | `/api/v1/consulted-services`     | Create service  | All (requires check-in)              |
| GET    | `/api/v1/consulted-services/:id` | Get service     | All authenticated                    |
| PUT    | `/api/v1/consulted-services/:id` | Update service  | Conditional (role + status + 33-day) |
| DELETE | `/api/v1/consulted-services/:id` | Delete service  | Conditional (admin OR not confirmed) |
| PATCH  | `/api/v1/consulted-services/:id` | Confirm service | All authenticated                    |

---

**Kết thúc requirement document.**
