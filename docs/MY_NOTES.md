📋 CẤU TRÚC TỔNG QUÁT CỦA MỖI FUNCTION
PATTERN CHUNG (Tất cả functions):

```
async functionName(currentUser: UserCore | null, params: unknown) {
  // 1️⃣ AUTHENTICATION & AUTHORIZATION
  // 2️⃣ INPUT VALIDATION (Zod)
  // 3️⃣ BUSINESS RULES VALIDATION
  // 4️⃣ DATA PROCESSING / TRANSFORMATION
  // 5️⃣ DATABASE OPERATION (via Repo)
  // 6️⃣ RESPONSE MAPPING & VALIDATION
}
```

🔍 PHÂN TÍCH CHI TIẾT TỪNG FUNCTION:

1. create() - Tạo khách hàng mới

```
async create(currentUser: UserCore | null, body: unknown) {
  // 1️⃣ AUTHENTICATION & AUTHORIZATION (lines 184-194)
  requireAuth(currentUser);  // Check logged in + has employeeId

  if (!currentUser?.clinicId || !currentUser?.employeeId) {
    throw new ServiceError(...);  // Check has clinic
  }

  // 2️⃣ INPUT VALIDATION - Zod Schema (lines 196-202)
  const parsed = CreateCustomerRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new ServiceError(...);
  }
  const data = parsed.data;

  // 3️⃣ BUSINESS RULES VALIDATION (lines 204-234)
  // Rule 3.1: Unique phone check
  if (data.phone) {
    const existingPhone = await customerRepo.findByPhone(data.phone);
    if (existingPhone) {
      throw new ServiceError("PHONE_EXISTS", ...);
    }
  }

  // Rule 3.2: Unique email check
  if (data.email) {
    const existingEmail = await customerRepo.findByEmail(data.email);
    if (existingEmail) {
      throw new ServiceError("EMAIL_EXISTS", ...);
    }
  }

  // Rule 3.3: Validate primary contact
  if (data.primaryContactId) {
    const primaryContact = await customerRepo.findById(...);
    if (!primaryContact || !primaryContact.phone) {
      throw new ServiceError(...);
    }
  }

  // 4️⃣ DATA PROCESSING - Generate metadata (lines 236-246)
  const result = await prisma.$transaction(async () => {
    // Generate customer code (server-controlled)
    const customerCode = await generateCustomerCode(currentUser.clinicId!);

    // 5️⃣ DATABASE OPERATION (lines 240-245)
    const customer = await customerRepo.create({
      ...data,                                    // Business data
      customerCode,                               // Server-generated
      createdById: currentUser.employeeId!,      // Server-controlled
      updatedById: currentUser.employeeId!,      // Server-controlled
    });

    return customer;
  });

  // 6️⃣ RESPONSE MAPPING & VALIDATION (line 248)
  return mapCustomerToResponse(result);
}
```

2. list() - Danh sách khách hàng với pagination

```
async list(currentUser: UserCore | null, query: unknown) {
  // 1️⃣ AUTHENTICATION (lines 254-255)
  requireAuth(currentUser);

  // 2️⃣ INPUT VALIDATION - Query params (lines 257-264)
  const parsed = GetCustomersQuerySchema.safeParse(query);
  if (!parsed.success) {
    throw new ServiceError("VALIDATION_ERROR", ...);
  }

  const { search, page, pageSize, clinicId, source, serviceOfInterest, sort } = parsed.data;

  // 3️⃣ AUTHORIZATION LOGIC - Clinic scoping (lines 266-270)
  let effectiveClinicId = clinicId;
  if (currentUser?.role !== "admin") {
    effectiveClinicId = currentUser?.clinicId || undefined;  // Non-admin chỉ thấy clinic của mình
  }

  // 4️⃣ DATA TRANSFORMATION - Parse sort (lines 272-273)
  const [sortField = "createdAt", sortDirection = "desc"] = sort.split(":");

  // 5️⃣ DATABASE OPERATION (lines 275-283)
  const result = await customerRepo.list({
    search,
    page,
    pageSize,
    clinicId: effectiveClinicId,
    source,
    serviceOfInterest,
    sortField,
    sortDirection: sortDirection as "asc" | "desc",
  });

  // 6️⃣ RESPONSE MAPPING (lines 289-291)
  const mappedItems = result.items.map(mapCustomerToResponse);

  // 6️⃣ RESPONSE VALIDATION (lines 293-298)
  const finalResult = CustomersListResponseSchema.parse({
    items: mappedItems,
    count: result.count,
    page,
    pageSize,
  });

  return finalResult;
}
```

3. daily() - KPI khách hàng theo ngày

```
async daily(currentUser: UserCore | null, query: unknown) {
  // 1️⃣ AUTHENTICATION
  requireAuth(currentUser);

  // 2️⃣ INPUT VALIDATION
  const parsed = GetCustomersDailyQuerySchema.safeParse(query);
  if (!parsed.success) {
    throw new ServiceError("VALIDATION_ERROR", ...);
  }

  const { date, clinicId } = parsed.data;

  // 4️⃣ DATA PROCESSING - Parse date range (lines 340-345)
  const targetDate = date ? new Date(date) : new Date();
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const day = targetDate.getDate();

  const dateStart = new Date(year, month, day, 0, 0, 0);
  const dateEnd = new Date(year, month, day + 1, 0, 0, 0);

  // 3️⃣ AUTHORIZATION - Clinic scoping (lines 347-351)
  let effectiveClinicId = clinicId;
  if (currentUser?.role !== "admin") {
    effectiveClinicId = currentUser?.clinicId || undefined;
  }

  if (!effectiveClinicId) {
    throw new ServiceError("MISSING_CLINIC", ...);
  }

  // 5️⃣ DATABASE OPERATION
  const result = await customerRepo.listDaily({
    clinicId: effectiveClinicId,
    dateStart,
    dateEnd,
  });

  // 6️⃣ RESPONSE MAPPING
  return {
    items: result.items.map(mapCustomerToResponse),
    count: result.count,
  };
}
```
