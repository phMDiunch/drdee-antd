# Phase 3: Performance Optimization Roadmap

**Mục tiêu:** Tăng tốc độ load, giảm số lần gọi server, cải thiện UX mà KHÔNG thay đổi architecture.

---

## 🎯 Vấn đề hiện tại

### ❌ **Trước optimization:**

```
User mở trang Customers → React Query fetch → API Route → Service → Database
                          ↓ (1-2s)
User thấy loading spinner... 😴

User click tab khác → React Query fetch lại toàn bộ
                      ↓ (1-2s)
User lại thấy loading spinner... 😴

User tạo customer mới → Server Action → Success
                         ↓
User chờ invalidate → React Query fetch lại toàn bộ list
                      ↓ (1-2s)
User thấy loading spinner lần nữa... 😴
```

**Vấn đề:**

1. **Fetch lại không cần thiết** - data không đổi nhưng vẫn fetch
2. **Chờ lâu sau mutations** - phải fetch toàn bộ list
3. **Không có feedback ngay lập tức** - user không thấy gì cho đến khi fetch xong

---

## ✅ **Sau optimization:**

```
User mở trang Customers → React Query check cache → Có data → Hiển thị ngay
                          ↓ (0ms - instant!)
User thấy data ngay lập tức 🚀

User click tab khác → React Query dùng cache → Hiển thị ngay
                      ↓ (0ms - instant!)
                      Background fetch (nếu stale) → Update silent
User không thấy loading 😊

User tạo customer mới → Server Action → Success
                         ↓
React Query insert vào cache ngay (optimistic update)
                         ↓ (0ms)
User thấy customer mới NGAY LẬP TỨC 🎉
                         ↓
Background invalidate → Sync với server
User không cần chờ 😊
```

**Cải thiện:**

1. ⚡ **Instant display** - dùng cache thay vì fetch
2. 🎨 **Optimistic updates** - hiển thị ngay không cần chờ
3. 🔄 **Background sync** - update silent, user không biết

---

## 📋 Roadmap Chi Tiết

### **Task 1: React Query Caching Strategy** ⭐⭐⭐ (HIGH PRIORITY)

#### Tác dụng:

- **Giảm 80% số lần gọi API** cho data ít thay đổi
- **Load instant** khi user quay lại trang đã xem
- **Background refresh** - update silent không làm gián đoạn UX

#### Implementation:

**1.1) Master Data (Clinics, Employees, Dental Services)**

```typescript
// ❌ TRƯỚC: Fetch lại mỗi lần render
export function useClinics() {
  return useQuery({
    queryKey: ["clinics"],
    queryFn: () => getClinicsApi(),
  });
}
// → User mở dropdown clinics → Fetch (1s) → Đóng → Mở lại → Fetch lại (1s) 😴

// ✅ SAU: Cache 5 phút
export function useClinics() {
  return useQuery({
    queryKey: ["clinics"],
    queryFn: () => getClinicsApi(),
    staleTime: 5 * 60 * 1000, // Cache 5 phút
    gcTime: 10 * 60 * 1000, // Giữ trong memory 10 phút
  });
}
// → User mở dropdown → Fetch lần đầu (1s) → Đóng → Mở lại → INSTANT (0ms) 🚀
```

**Giải thích:**

- `staleTime`: Trong 5 phút, data coi như "fresh" → không fetch lại
- `gcTime`: Giữ data trong memory 10 phút, sau đó mới xóa
- **Kết quả:** Clinics ít thay đổi → fetch 1 lần / 5 phút thay vì mỗi lần render

**Files cần sửa:**

```
src/features/clinics/hooks/useClinics.ts
src/features/employees/hooks/useWorkingEmployees.ts
src/features/dental-services/hooks/useDentalServices.ts
```

---

**1.2) Transaction Data (Customers, Appointments)**

```typescript
// ❌ TRƯỚC: Fetch mỗi khi focus window
export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: () => getCustomersApi(),
  });
}
// → User switch sang tab khác → Quay lại → Fetch lại toàn bộ 😴

// ✅ SAU: Cache 1 phút, refetch on window focus
export function useCustomers(params?: GetCustomersQuery) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => getCustomersApi(params),
    staleTime: 60 * 1000, // 1 phút
    refetchOnWindowFocus: true, // Refetch khi focus (nhưng silent)
  });
}
// → User switch tab → Quay lại → Hiển thị cache (instant) → Background fetch 🚀
```

**Giải thích:**

- Data thay đổi thường xuyên hơn → cache ngắn hơn (1 phút)
- `refetchOnWindowFocus: true` → sync khi user quay lại, nhưng vẫn show cache trước
- **Kết quả:** User thấy data instant, update silent background

---

### **Task 2: Optimistic Updates** ⭐⭐⭐ (HIGH PRIORITY)

#### Tác dụng:

- **User thấy kết quả NGAY LẬP TỨC** sau khi submit form
- **Không cần chờ** server response
- **UX mượt mà** như native app

#### Implementation:

```typescript
// ❌ TRƯỚC: Chờ server → Chờ invalidate → Chờ refetch
export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => createCustomerAction(data),
    onSuccess: () => {
      qc.invalidateQueries(["customers"]); // Refetch toàn bộ list
      // User phải chờ 1-2s để thấy customer mới 😴
    },
  });
}

// ✅ SAU: Insert vào cache ngay, rollback nếu lỗi
export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => createCustomerAction(data),

    // 1️⃣ TRƯỚC khi gọi server: Insert vào cache
    onMutate: async (newCustomer) => {
      // Cancel ongoing refetches
      await qc.cancelQueries(["customers"]);

      // Snapshot current data (để rollback nếu lỗi)
      const previous = qc.getQueryData(["customers"]);

      // Optimistically update cache
      qc.setQueryData(["customers"], (old: Customer[]) => {
        return [
          { ...newCustomer, id: "temp-id", createdAt: new Date() },
          ...old,
        ];
      });

      // User thấy customer mới NGAY LẬP TỨC 🚀
      return { previous };
    },

    // 2️⃣ Nếu THÀNH CÔNG: Sync với server
    onSuccess: () => {
      qc.invalidateQueries(["customers"]); // Background sync
    },

    // 3️⃣ Nếu LỖI: Rollback về data cũ
    onError: (err, variables, context) => {
      qc.setQueryData(["customers"], context.previous);
      // User thấy data quay về như cũ
    },
  });
}
```

**Giải thích từng bước:**

1. **onMutate** (trước khi gọi server):

   - Snapshot data hiện tại
   - Insert customer mới vào cache với `temp-id`
   - User thấy customer mới trong list NGAY (0ms)

2. **onSuccess** (khi server trả về thành công):

   - Invalidate để fetch data thật từ server
   - Replace `temp-id` bằng ID thật
   - Sync silent, user không thấy gì

3. **onError** (nếu server lỗi):
   - Restore data cũ từ snapshot
   - User thấy customer "biến mất"
   - Show error message

**Timeline so sánh:**

```
❌ TRƯỚC:
User click "Tạo" → Submit → Chờ server (500ms) → Success → Invalidate
→ Refetch (1s) → User mới thấy customer trong list
TỔNG: ~1.5s 😴

✅ SAU:
User click "Tạo" → Submit → Insert cache (0ms) → User thấy ngay
→ Server response (500ms) background → Sync silent
TỔNG: 0ms (instant!) 🚀
```

**Files cần implement:**

```
src/features/customers/hooks/useCreateCustomer.ts
src/features/customers/hooks/useUpdateCustomer.ts
src/features/appointments/hooks/useCreateAppointment.ts
src/features/appointments/hooks/useUpdateAppointment.ts
```

---

### **Task 3: Database Query Optimization** ⭐⭐ (MEDIUM PRIORITY)

#### Tác dụng:

- **Giảm query time** từ 500ms → 100ms
- **Giảm load database** bằng cách chỉ lấy data cần thiết
- **Scale tốt hơn** khi data lớn

#### Implementation:

**3.1) Prisma Select Optimization**

```typescript
// ❌ TRƯỚC: Fetch toàn bộ fields
async list() {
  return prisma.customer.findMany({
    include: {
      clinic: true,           // 10+ fields
      createdBy: true,        // 20+ fields
      updatedBy: true,        // 20+ fields
      appointments: true,     // 100+ records × 30 fields
    }
  });
}
// → Fetch 1000 customers × 200 fields = 200,000 cells
// → Query time: 2000ms 😴
// → Network transfer: 5MB

// ✅ SAU: Chỉ lấy fields cần thiết cho list view
async list() {
  return prisma.customer.findMany({
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      clinic: {
        select: { id: true, name: true }  // Chỉ 2 fields
      },
    },
    take: 50,  // Pagination
  });
}
// → Fetch 50 customers × 6 fields = 300 cells
// → Query time: 100ms 🚀
// → Network transfer: 50KB
```

**Giải thích:**

- List view chỉ cần: name, phone, email, clinic name
- Detail view mới cần: address, dob, appointments, etc.
- **Kết quả:** Query nhanh hơn 20x, transfer nhỏ hơn 100x

**Files cần sửa:**

```
src/server/repos/customer.repo.ts
src/server/repos/appointment.repo.ts
src/server/repos/employee.repo.ts
```

---

**3.2) Database Indexes**

```prisma
// ❌ TRƯỚC: Không có index
model Customer {
  id        String   @id
  phone     String?  @unique
  clinicId  String
  createdAt DateTime @default(now())
}
// → Query WHERE clinicId = 'x' AND createdAt >= 'date': Full table scan
// → 10,000 customers → Query time: 1000ms 😴

// ✅ SAU: Add composite index
model Customer {
  id        String   @id
  phone     String?  @unique
  clinicId  String
  createdAt DateTime @default(now())

  @@index([clinicId, createdAt])  // ← Index này
}
// → Query WHERE clinicId = 'x' AND createdAt >= 'date': Index seek
// → 10,000 customers → Query time: 50ms 🚀
```

**Giải thích:**

- Daily view query: `WHERE clinicId = X AND date = Y`
- Index này optimize chính xác query pattern đó
- **Kết quả:** Query nhanh hơn 20x

**Files cần sửa:**

```
prisma/schema.prisma
```

**Indexes cần thêm:**

```prisma
model Customer {
  @@index([clinicId, createdAt])     // Daily view
  @@index([phone])                    // Search by phone
}

model Appointment {
  @@index([clinicId, appointmentDateTime])  // Daily view
  @@index([customerId])                     // Customer detail
  @@index([primaryDentistId])               // Dentist schedule
}

model Employee {
  @@index([clinicId, employeeStatus])  // Working employees
  @@index([email])                     // Login
}
```

---

### **Task 4: API Response Caching** ⭐ (LOW PRIORITY)

#### Tác dụng:

- **CDN caching** cho data public
- **Giảm load server** khi nhiều user truy cập cùng lúc
- **Response time nhanh hơn** từ edge locations

#### Implementation:

```typescript
// ❌ TRƯỚC: Mỗi request đều hit database
export async function GET(req: Request) {
  const data = await clinicService.list(user);
  return NextResponse.json(data);
}
// → 100 users mở trang → 100 database queries 😴

// ✅ SAU: Cache response 5 phút
export async function GET(req: Request) {
  const data = await clinicService.list(user);
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
// → 100 users mở trang → 1 database query → 99 requests serve từ cache 🚀
```

**Giải thích:**

- `s-maxage=300`: CDN cache 5 phút
- `stale-while-revalidate=600`: Serve stale cache while revalidating
- **Kết quả:** Server chỉ xử lý 1 request / 5 phút thay vì 100 requests

**Áp dụng cho:**

```
GET /api/v1/clinics            (cache 5 phút)
GET /api/v1/dental-services    (cache 5 phút)
GET /api/v1/employees/working  (cache 1 phút)
```

---

## 📊 Expected Results

### Trước Optimization:

```
Metric                    | Before
--------------------------|--------
Initial page load         | 1.5s
Refetch on tab switch     | 1.2s
Post-mutation update      | 1.8s
Daily API calls (1 user)  | ~500
Database queries/day      | ~10,000
User perception           | "App hơi chậm" 😴
```

### Sau Optimization:

```
Metric                    | Before | After  | Improvement
--------------------------|--------|--------|-------------
Initial page load         | 1.5s   | 1.5s   | -
Refetch on tab switch     | 1.2s   | 0ms    | ⚡ Instant
Post-mutation update      | 1.8s   | 0ms    | ⚡ Instant
Daily API calls (1 user)  | ~500   | ~50    | 🔽 -90%
Database queries/day      | 10,000 | 2,000  | 🔽 -80%
User perception           | Slow   | Fast   | 🚀 "Rất mượt!"
```

---

## 🎯 Implementation Order

### Week 1: Quick Wins

- [ ] **Day 1-2:** Task 1.1 - Master data caching (clinics, employees, services)
- [ ] **Day 3-4:** Task 1.2 - Transaction data caching (customers, appointments)
- [ ] **Day 5:** Test & measure improvements

**Expected impact:** 80% reduction in API calls

### Week 2: UX Improvements

- [ ] **Day 1-3:** Task 2 - Optimistic updates (create customer, create appointment)
- [ ] **Day 4-5:** Test & refine rollback logic

**Expected impact:** Instant feedback after mutations

### Week 3: Backend Optimization

- [ ] **Day 1-2:** Task 3.1 - Prisma select optimization
- [ ] **Day 3-4:** Task 3.2 - Add database indexes
- [ ] **Day 5:** Run `prisma migrate dev` + test

**Expected impact:** 80% faster database queries

### Week 4: Polish (Optional)

- [ ] **Day 1-2:** Task 4 - API response caching
- [ ] **Day 3-5:** Monitoring & fine-tuning

---

## 🛠️ Tools & Monitoring

### Before starting:

```bash
# Install React Query Devtools (if not installed)
npm install @tanstack/react-query-devtools
```

### Add to app:

```typescript
// src/app/providers.tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Metrics to track:

1. **Cache hit rate** - React Query Devtools
2. **API call count** - Browser Network tab
3. **Query time** - Prisma query logs
4. **User feedback** - "App có nhanh hơn không?"

---

## ❓ FAQ

### Q: Có phải thay đổi architecture không?

**A:** KHÔNG. Chỉ config React Query và optimize queries. Architecture (Server Actions, Services, Repos) giữ nguyên 100%.

### Q: Có ảnh hưởng đến code hiện tại không?

**A:** CÓ nhưng nhỏ. Chỉ thêm config vào hooks và update Prisma queries. Không break existing features.

### Q: Optimistic updates có an toàn không?

**A:** CÓ. Rollback tự động nếu lỗi. User không bao giờ thấy data sai.

### Q: Caching có làm data cũ không?

**A:** KHÔNG. Background refetch đảm bảo data luôn sync. User thấy cache (instant) nhưng data update silent.

### Q: Có cần rewrite code không?

**A:** KHÔNG. Chỉ sửa config files và optimization. Logic business giữ nguyên.

---

## ✅ Success Criteria

Optimization thành công khi:

1. ✅ **User feedback positive:** "App nhanh hơn, mượt hơn"
2. ✅ **Metrics improved:** -80% API calls, -80% query time
3. ✅ **No bugs:** Features hoạt động như trước
4. ✅ **Team understands:** Documentation clear, maintainable

---

## 🚀 Ready to Start?

Next steps:

1. Review roadmap này với team
2. Start với Week 1 (quick wins)
3. Measure improvements sau mỗi task
4. Iterate based on results

Questions? Discuss với team trước khi implement! 💬
