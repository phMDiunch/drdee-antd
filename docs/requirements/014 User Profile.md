# 🧩 Requirements: User Profile & Settings

> **✅ STATUS: IMPLEMENTED** - Implementation finished on December 7, 2025  
> **📄 Feature Documentation**: Self-service user profile management  
> **🔗 Implementation**: `src/features/profile/`

## 📊 Tham khảo

Prisma Model Employee: `prisma/schema.prisma` (reuses Employee table)  
Route: `/profile` (User self-service context)  
Note: Tách biệt hoàn toàn với `/employees/:id/edit` (Admin management context)

## 🎯 Core Requirements

### 1. **User Profile Management**

Cho phép người dùng xem và quản lý thông tin cá nhân của mình, bao gồm:

- Thông tin cơ bản (họ tên, ngày sinh, giới tính, avatarUrl)
- Thông tin liên hệ (email, số điện thoại, địa chỉ)
- Thông tin pháp lý (CCCD, MST, BHXH)
- Thông tin ngân hàng (số tài khoản, tên ngân hàng)
- Thông tin công việc (mã NV, phòng khám, chức vụ) - **Read-only**
- Bảo mật (đổi mật khẩu)

```
┌────────────────────────────────────────────────────────┐
│  User Profile Page                                     │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │  [Tabs]                                       │    │
│  │  ┌─────────────┬─────────────┬──────────┬────┐  │
│  │  │  Cơ bản     │  Liên hệ    │  Pháp lý │ ... │  │
│  │  └─────────────┴─────────────┴──────────┴────┘  │
│  │                                                 │  │
│  │  Tab Content:                                   │  │
│  │  • Form fields (editable)                       │  │
│  │  • Avatar upload                                │  │
│  │  • Validation feedback                          │  │
│  │  • [Lưu thay đổi] button                       │  │
│  └──────────────────────────────────────────────┘    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Core Data Structure

```typescript
// Dựa trên Prisma Employee model
type UserProfile = {
  // Thông tin tài khoản (read-only)
  id: string;
  uid: string;
  email: string;
  role: string;

  // Thông tin cơ bản (editable)
  fullName: string;
  dob?: Date;
  gender?: string;
  avatarUrl?: string;
  favoriteColor?: string;

  // Thông tin liên hệ (editable)
  phone?: string;
  currentAddress?: string;
  hometown?: string;

  // Thông tin pháp lý (editable)
  nationalId?: string;
  nationalIdIssueDate?: Date;
  nationalIdIssuePlace?: string;
  taxId?: string;
  insuranceNumber?: string;

  // Thông tin ngân hàng (editable)
  bankAccountNumber?: string;
  bankName?: string;

  // Thông tin công việc (read-only)
  employeeCode?: string;
  employeeStatus?: string;
  clinicId?: string;
  department?: string;
  team?: string;
  jobTitle?: string;
  positionTitle?: string;

  // Metadata (read-only)
  createdAt: Date;
  updatedAt: Date;
};
```

---

## 🛠️ Technical Implementation

### API Endpoints

```
GET    /api/v1/profile                    # Get current user profile ✅
# PATCH removed - Use updateProfileAction() Server Action instead ✅
# POST removed - Use changePasswordAction() Server Action instead ✅
```

**Note:** Update và change password sử dụng Server Actions thay vì API routes để tận dụng type-safety và server-side validation tốt hơn.

### Architecture

```
Profile Page → useProfile Hook → API Route (GET) → Profile Service → Profile Repo → Database
             ↓
Update Form → useUpdateProfile → Server Action → Profile Service → Profile Repo → Database
             ↓
Change Password → useChangePassword → Server Action → Supabase Auth
```

**Pattern:**

- Query (GET): API Route → Service → Repo
- Mutation (UPDATE): Server Action → Service → Repo
- Auth: Server Action → Supabase Auth directly

### Repository Pattern

**Profile Repository** (`src/server/repos/profile.repo.ts`)

```typescript
// Profile update input - Partial schema for flexible updates
export type ProfileUpdateInput = Partial<UpdateProfileRequest> & {
  updatedById: string; // Server metadata (self-update)
};

export const profileRepo = {
  // Get profile by user UID (from Supabase Auth)
  async findByUid(uid: string) {
    return prisma.employee.findUnique({
      where: { uid },
      include: {
        clinic: {
          select: {
            id: true,
            clinicCode: true,
            name: true,
            colorCode: true,
          },
        },
      },
    });
  },

  // Update profile by UID (user can only update own profile)
  async updateByUid(uid: string, data: ProfileUpdateInput) {
    return prisma.employee.update({
      where: { uid },
      data: {
        // Only update provided fields (Partial)
        fullName: data.fullName,
        dob: data.dob,
        gender: data.gender,
        avatarUrl: data.avatarUrl,
        favoriteColor: data.favoriteColor,
        phone: data.phone,
        currentAddress: data.currentAddress,
        hometown: data.hometown,
        nationalId: data.nationalId,
        nationalIdIssueDate: data.nationalIdIssueDate,
        nationalIdIssuePlace: data.nationalIdIssuePlace,
        taxId: data.taxId,
        insuranceNumber: data.insuranceNumber,
        bankAccountNumber: data.bankAccountNumber,
        bankName: data.bankName,
        updatedById: data.updatedById,
        updatedAt: new Date(),
      },
      include: {
        clinic: {
          select: {
            id: true,
            clinicCode: true,
            name: true,
            colorCode: true,
          },
        },
      },
    });
  },

  // Duplicate check methods - reuse from employeeRepo
  async findByPhoneExcludingUid(phone: string, excludeUid: string) {
    const existing = await employeeRepo.findByPhone(phone);
    return existing && existing.uid !== excludeUid ? existing : null;
  },

  async findByNationalIdExcludingUid(nationalId: string, excludeUid: string) {
    const existing = await employeeRepo.findByNationalId(nationalId);
    return existing && existing.uid !== excludeUid ? existing : null;
  },

  async findByTaxIdExcludingUid(taxId: string, excludeUid: string) {
    const existing = await employeeRepo.findByTaxId(taxId);
    return existing && existing.uid !== excludeUid ? existing : null;
  },

  async findByInsuranceNumberExcludingUid(
    insuranceNumber: string,
    excludeUid: string
  ) {
    const existing = await employeeRepo.findByInsuranceNumber(insuranceNumber);
    return existing && existing.uid !== excludeUid ? existing : null;
  },
};
```

Key Points:

- Reuses Employee table (Employee.uid = Supabase Auth user.id)
- Reuses duplicate check methods from employeeRepo
- Partial updates support (only send changed fields)

### Validation Schemas

**Backend Schema** (`src/features/profile/profile.schema.ts`)

```typescript
// Backend update schema - accepts Partial updates
export const UpdateProfileRequestSchema = z
  .object({
    // Basic Info
    fullName: z.string().min(1, "Họ và tên không được để trống").trim(),
    dob: z.coerce.date().optional().nullable(),
    gender: GenderSchema.optional().nullable(),
    avatarUrl: z.string().trim().optional().nullable(),
    favoriteColor: z.string().trim().optional().nullable(),

    // Contact Info
    phone: z.string().min(1, "Số điện thoại không được để trống").trim(),
    currentAddress: z.string().trim().optional().nullable(),
    hometown: z.string().trim().optional().nullable(),

    // Legal Info
    nationalId: z.string().trim().optional().nullable(),
    nationalIdIssueDate: z.coerce.date().optional().nullable(),
    nationalIdIssuePlace: z.string().trim().optional().nullable(),
    taxId: z.string().trim().optional().nullable(), // ✅ No regex - consistency with employee schema
    insuranceNumber: z.string().trim().optional().nullable(),

    // Banking Info
    bankAccountNumber: z.string().trim().optional().nullable(),
    bankName: z.string().trim().optional().nullable(),
  })
  .partial(); // ✅ Partial schema for flexible backend updates

export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;

// Frontend form schemas - per tab validation (only validate visible fields)
export const BasicInfoFormSchema = z.object({
  fullName: z.string().min(1, "Họ và tên không được để trống").trim(),
  dob: z.coerce.date().optional().nullable(),
  gender: GenderSchema.optional().nullable(),
  avatarUrl: z.string().trim().optional().nullable(),
  favoriteColor: z.string().trim().optional().nullable(),
});
export type BasicInfoFormData = z.infer<typeof BasicInfoFormSchema>;

export const ContactInfoFormSchema = z.object({
  phone: z.string().min(1, "Số điện thoại không được để trống").trim(),
  currentAddress: z.string().trim().optional().nullable(),
  hometown: z.string().trim().optional().nullable(),
});
export type ContactInfoFormData = z.infer<typeof ContactInfoFormSchema>;

export const LegalInfoFormSchema = z.object({
  nationalId: z.string().trim().optional().nullable(),
  nationalIdIssueDate: z.coerce.date().optional().nullable(),
  nationalIdIssuePlace: z.string().trim().optional().nullable(),
  taxId: z.string().trim().optional().nullable(),
  insuranceNumber: z.string().trim().optional().nullable(),
});
export type LegalInfoFormData = z.infer<typeof LegalInfoFormSchema>;

export const BankingInfoFormSchema = z.object({
  bankAccountNumber: z.string().trim().optional().nullable(),
  bankName: z.string().trim().optional().nullable(),
});
export type BankingInfoFormData = z.infer<typeof BankingInfoFormSchema>;

// Password change schema
export const ChangePasswordRequestSchema = z
  .object({
    currentPassword: z.string().min(1, "Mật khẩu hiện tại không được để trống"),
    newPassword: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"), // ✅ min 6, no complexity - consistency
    confirmPassword: z.string().min(1, "Xác nhận mật khẩu không được để trống"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
```

**Validation Strategy:**

- ✅ **Partial schemas per tab** - each form validates only visible fields
- ✅ **Backend accepts Partial** - flexible updates, no need to send all fields
- ✅ **Consistency with employee schema** - taxId no regex, password min 6 chars
- ✅ **No getDirtyFields utility** - simplified approach, send full form data

// ============================================================================
// TYPE INFERENCE
// ============================================================================

export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

```

---

## 🎨 Component Specifications

### 1. Profile Page

#### Layout & Design

- **Tabs Navigation**: Horizontal tabs với icons
- **Responsive**: Mobile stack, Desktop side-by-side
- **Card Container**: White background, shadow, rounded corners
- **Sticky Action Buttons**: Float at bottom on scroll

#### Tab Structure

```

┌───────────────────────────────────────────────────┐
│ 👤 Cơ bản │ 📞 Liên hệ │ 📄 Pháp lý │ 💳 Ngân hàng │ 🔒 Bảo mật │
└───────────────────────────────────────────────────┘

```

**Tab 1: Thông tin cơ bản** (👤 Cơ bản)

```

┌─────────────────────────────────────┐
│ Avatar Upload (center) │
│ ┌─────────────┐ │
│ │ [Image] │ [Upload] [Remove] │
│ └─────────────┘ │
│ │
│ Họ tên đầy đủ \* [_______________] │
│ Ngày sinh [_______________] │
│ Giới tính [_______________] │
│ Màu yêu thích [_______________] │
│ │
│ [Lưu thay đổi] [Hủy bỏ] │
└─────────────────────────────────────┘

```

**Tab 2: Thông tin liên hệ** (📞 Liên hệ)

```

┌─────────────────────────────────────┐
│ Email (read-only) [_______________] │
│ Số điện thoại [_______________] │
│ Địa chỉ hiện tại [_______________] │
│ Quê quán [_______________] │
│ │
│ [Lưu thay đổi] [Hủy bỏ] │
└─────────────────────────────────────┘

```

**Tab 3: Thông tin pháp lý** (📄 Pháp lý)

```

┌─────────────────────────────────────┐
│ Số CCCD [_______________] │
│ Ngày cấp [_______________] │
│ Nơi cấp [_______________] │
│ Mã số thuế [_______________] │
│ Số sổ BHXH [_______________] │
│ │
│ [Lưu thay đổi] [Hủy bỏ] │
└─────────────────────────────────────┘

```

**Tab 4: Thông tin ngân hàng** (💳 Ngân hàng)

```

┌─────────────────────────────────────┐
│ Số tài khoản [_______________] │
│ Tên ngân hàng [_______________] │
│ │
│ 💡 Thông tin này dùng để thanh toán │
│ lương và các khoản phụ cấp │
│ │
│ [Lưu thay đổi] [Hủy bỏ] │
└─────────────────────────────────────┘

```

**Tab 5: Thông tin công việc** (💼 Công việc) - **Read-only**

```

┌─────────────────────────────────────┐
│ Mã nhân viên [_______________] │
│ Phòng khám [_______________] │
│ Phòng ban [_______________] │
│ Bộ phận [_______________] │
│ Chức danh [_______________] │
│ Chức vụ [_______________] │
│ Trạng thái [_______________] │
│ │
│ ℹ️ Thông tin này do quản lý cập nhật │
└─────────────────────────────────────┘

```

**Tab 6: Bảo mật** (🔒 Bảo mật)

```

┌─────────────────────────────────────┐
│ Đổi mật khẩu │
│ ───────────────── │
│ Mật khẩu hiện tại [_______________] │
│ Mật khẩu mới [_______________] │
│ Xác nhận mật khẩu [_______________] │
│ │
│ ✅ Ít nhất 6 ký tự │
│ │
│ [Đổi mật khẩu] │
└─────────────────────────────────────┘

````

#### Validation Rules

**Thông tin cơ bản:**

- `fullName`: Required, min 1 char, trimmed
- `dob`: Optional, Date picker (z.coerce.date())
- `gender`: Optional, Dropdown (MALE/FEMALE/OTHER)
- `favoriteColor`: Optional, Color picker

**Thông tin liên hệ:**

- `email`: Read-only (không cho sửa)
- `phone`: Required, min 1 char, trimmed (no regex - flexibility)
- `currentAddress`: Optional, trimmed
- `hometown`: Optional, trimmed

**Thông tin pháp lý:**

- `nationalId`: Optional, trimmed (no regex - flexibility)
- `nationalIdIssueDate`: Optional, Date picker (z.coerce.date())
- `nationalIdIssuePlace`: Optional, trimmed
- `taxId`: Optional, trimmed (no regex - consistency with employee schema)
- `insuranceNumber`: Optional, trimmed

**Thông tin ngân hàng:**

- `bankAccountNumber`: Optional, trimmed (no regex - flexibility)
- `bankName`: Optional, trimmed (Autocomplete with VN banks list)

**Đổi mật khẩu:**

- `currentPassword`: Required
- `newPassword`: Required, min 6 chars (no complexity requirements - consistency)
- `confirmPassword`: Required, must match `newPassword`

---

### 2. Avatar Upload Component - NOT IMPLEMENTED

**Note:** Avatar upload feature (AvatarUpload component, useUploadAvatar hook, POST /api/v1/profile/upload-avatar) was not implemented in this phase. Currently only supports text input for avatarUrl field.

---

### 3. Profile Form Components

**Shared Form Behavior:**

- React Hook Form + Zod validation (per tab partial schemas)
- Auto-save indicator (optional)
- Dirty state tracking (hiển thị "Có thay đổi chưa lưu")
- Cancel button → Reset to initial values
- Submit button → Disabled if no changes

**Form Layout Pattern:**

```typescript
<Form layout="vertical">
  <Row gutter={16}>
    <Col xs={24} md={12}>
      <Form.Item label="Field 1" required>
        <Input {...register("field1")} />
      </Form.Item>
    </Col>
    <Col xs={24} md={12}>
      <Form.Item label="Field 2">
        <Input {...register("field2")} />
      </Form.Item>
    </Col>
  </Row>

  <Form.Item>
    <Space>
      <Button type="primary" htmlType="submit" loading={isLoading}>
        Lưu thay đổi
      </Button>
      <Button onClick={handleCancel}>Hủy bỏ</Button>
    </Space>
  </Form.Item>
</Form>
````

---

## 🔐 Security & Permissions

### Access Control

- **Own Profile**: User chỉ được xem/sửa profile của chính mình qua `/profile`
- **Admin View Others**: Admin/Manager xem profile nhân viên khác qua `/employees/:id/edit` (trang riêng biệt)
- **Read-only Fields** (at `/profile`): Email, role, employeeCode, clinicId, department, team, jobTitle, positionTitle, employeeStatus
- **Sensitive Fields**: Thông tin pháp lý và ngân hàng CHỈ hiển thị tại `/profile` (admin KHÔNG thấy khi xem nhân viên tại `/employees/:id`)

### Security Measures

1. **Authentication**: Middleware bảo vệ `(private)` routes
2. **Authorization**: Verify `uid` matches session user (only self-access)
3. **Input Sanitization**: Zod validation cho mọi fields
4. **Password Change Security**:
   - Require current password verification via Supabase Auth
   - Password strength validation (min 6 chars)
   - Rate limiting handled by Supabase Auth
   - Uses Supabase updateUser() API

### Supabase Integration

**Change Password:**

```typescript
// Uses Supabase Auth API via Server Action
export async function changePasswordAction(data: ChangePasswordRequest) {
  // Verify current password via sign-in attempt
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: data.currentPassword,
  });

  if (signInError) {
    throw new ServiceError(
      "INVALID_PASSWORD",
      "Mật khẩu hiện tại không đúng",
      401
    );
  }

  // Update password
  const { error } = await supabase.auth.updateUser({
    password: data.newPassword,
  });
}
```

---

## 📱 User Experience

### Main User Flow

```
1. User clicks "Hồ sơ" in header dropdown
   ↓
2. Navigate to /profile
   ↓
3. Load profile data (with loading skeleton)
   ↓
4. Display tabs (default: Tab 1 - Cơ bản)
   ↓
5. User edits fields → Validation feedback real-time
   ↓
6. Click "Lưu thay đổi"
   ↓
7. Submit to server → Loading state
   ↓
8. Success → Toast message + Refresh data
   ↓
9. Update header (if name/avatar changed)
```

### Error Handling

```typescript
// Error message mapping (tiếng Việt)
{
  'VALIDATION_ERROR': 'Thông tin không hợp lệ. Vui lòng kiểm tra lại.',
  'DUPLICATE_PHONE': 'Số điện thoại này đã được sử dụng.',
  'DUPLICATE_NATIONAL_ID': 'Số CCCD này đã được sử dụng.',
  'DUPLICATE_TAX_ID': 'Mã số thuế này đã được sử dụng.',
  'DUPLICATE_INSURANCE_NUMBER': 'Số sổ BHXH này đã được sử dụng.',
  'INVALID_PASSWORD': 'Mật khẩu hiện tại không đúng.',
  'SERVER_ERROR': 'Lỗi máy chủ. Vui lòng thử lại sau.',
}
```

### Responsive Design

**Mobile (< 768px):**

- Tabs → Dropdown selector
- Form fields stacked (full width)
- Avatar centered
- Sticky save button at bottom

**Tablet (768px - 1024px):**

- Tabs horizontal
- Form fields 2 columns
- Avatar left-aligned

**Desktop (> 1024px):**

- Tabs horizontal
- Form fields 2-3 columns
- Side panel with avatar + quick info
- Floating action buttons

### Performance

- **Initial Load**: < 1s (with inline Spin loading in Card)
- **Form Submit**: < 500ms
- **Tab Switch**: Instant (no re-fetch)
- **Cache Strategy**:
  - Profile data: `staleTime: 5 * 60 * 1000` (5 minutes) via React Query

---

## 🔄 State Management

### React Query Keys

```typescript
// src/features/profile/constants.ts
export const PROFILE_QUERY_KEYS = {
  current: ["profile", "current"] as const,
} as const;
```

### Hooks:

```typescript
// src/features/profile/hooks/useProfile.ts
export function useProfile() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEYS.current,
    queryFn: getProfileApi,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// src/features/profile/hooks/useUpdateProfile.ts
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateProfileAction,
    onSuccess: () => {
      notify.success("Cập nhật thông tin thành công");
      qc.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.current });
    },
    onError: (e) =>
      notify.error(e, {
        fallback: "Cập nhật thông tin thất bại",
      }),
  });
}

// src/features/profile/hooks/useChangePassword.ts
export function useChangePassword() {
  return useMutation({
    mutationFn: changePasswordAction,
    onSuccess: () => {
      notify.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
      // Redirect to login after 2s
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    },
    onError: (e) =>
      notify.error(e, {
        fallback: "Đổi mật khẩu thất bại",
      }),
  });
}

// src/features/profile/hooks/useUploadAvatar.ts
export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: uploadAvatarAction,
    onSuccess: (avatarUrl) => {
      notify.success("Tải ảnh đại diện thành công");
      // Optimistic update (optional)
      qc.setQueryData(PROFILE_QUERY_KEYS.current, (old: any) => ({
        ...old,
        avatarUrl,
      }));
      qc.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.current });
    },
    onError: (e) =>
      notify.error(e, {
        fallback: "Tải ảnh đại diện thất bại",
      }),
  });
}
```

---

## 📋 Implementation Checklist

### Phase 1: Backend (MVP) ✅ COMPLETED

- ✅ **Zod Schemas** (`src/features/profile/profile.schema.ts`)

  - ✅ `UpdateProfileRequestSchema` (partial schema)
  - ✅ `BasicInfoFormSchema`, `ContactInfoFormSchema`, `LegalInfoFormSchema`, `BankingInfoFormSchema`
  - ✅ `ChangePasswordRequestSchema`

- ✅ **Repository** (`src/server/repos/profile.repo.ts`)

  - ✅ `findByUid()` - Get profile by user UID
  - ✅ `updateByUid()` - Update with partial data
  - ✅ `findByPhoneExcludingUid()`, `findByNationalIdExcludingUid()`, `findByTaxIdExcludingUid()`, `findByInsuranceNumberExcludingUid()` - Duplicate checks

- ✅ **Service** (`src/server/services/profile.service.ts`)

  - ✅ `getProfile()` - Get current user profile
  - ✅ `updateProfile()` - Update with duplicate validation
  - ✅ `changePassword()` - Verify current + update via Supabase

- ✅ **Server Actions** (`src/server/actions/profile.actions.ts`)

  - ✅ `updateProfileAction()`
  - ✅ `changePasswordAction()`

- ✅ **API Routes** (`src/app/api/v1/profile/route.ts`)
  - ✅ `GET /api/v1/profile` - Get current user profile

**Note:** Avatar upload backend (uploadAvatar service, uploadAvatarAction, POST endpoint) NOT implemented

### Phase 2: Frontend (MVP) ✅ COMPLETED

- ✅ **API Client** (`src/features/profile/api.ts`)

  - ✅ `getProfileApi()`

- ✅ **React Query Hooks** (`src/features/profile/hooks/`)

  - ✅ `useProfile.ts` - Query hook
  - ✅ `useUpdateProfile.ts` - Mutation hook
  - ✅ `useChangePassword.ts` - Mutation hook

- ✅ **Components** (`src/features/profile/components/`)

  - ✅ `BasicInfoForm.tsx` - Tab 1 form
  - ✅ `ContactInfoForm.tsx` - Tab 2 form
  - ✅ `LegalInfoForm.tsx` - Tab 3 form
  - ✅ `BankingInfoForm.tsx` - Tab 4 form
  - ✅ `WorkInfoDisplay.tsx` - Tab 5 (read-only)
  - ✅ `ChangePasswordForm.tsx` - Tab 6 form

- ✅ **Views** (`src/features/profile/views/ProfileView.tsx`)

  - ✅ Tabs layout with 6 tabs
  - ✅ Inline loading (Spin in Card)
  - ✅ Inline error (Alert above Card)

- ✅ **Page** (`src/app/(private)/profile/page.tsx`)

- ✅ **Constants** (`src/features/profile/constants.ts`)

  - ✅ `PROFILE_QUERY_KEYS`

- ✅ **Barrel Export** (`src/features/profile/index.ts`)

**Note:** AvatarUpload component and useUploadAvatar hook NOT implemented

### Phase 3: Polish ⚠️ PARTIAL

- ✅ **Validation**

  - ✅ Real-time validation feedback (React Hook Form)
  - ✅ Duplicate check (phone, nationalId, taxId, insuranceNumber)
  - ❌ Password strength indicator (not implemented)

- ⚠️ **UX Enhancements**

  - ❌ Unsaved changes warning (not implemented)
  - ❌ Auto-save draft (not implemented)
  - ❌ Keyboard shortcuts (not implemented)
  - ❌ Field-level help tooltips (not implemented)

- ⚠️ **Performance**

  - ❌ Lazy load tabs (not implemented - all tabs render upfront)
  - ❌ Avatar optimization (not implemented - no avatar upload)
  - ❌ Debounce duplicate check (not implemented - checked on submit only)

- ❌ **Testing** - Not implemented

### Phase 4: Future Enhancements ❌ NOT STARTED

- ❌ **Activity Log** - Track profile changes history
- ❌ **Session Management** - View/manage active sessions
- ❌ **Two-Factor Authentication** - Enable 2FA
- ❌ **Preferences** - Theme, language, notifications
- ❌ **Export Data** - Download personal data (GDPR)

---

## 📚 Related Documentation

- **Employee Management**: `005 Employee.md` (for admin view of employee profiles)
- **Auth System**: `003 Auth.md` (for login/logout flow)
- **Layout**: `002 Layout.md` (for header dropdown menu integration)

---

## 📝 Implementation Notes

### Key Architectural Decisions:

1. **Partial Schemas per Tab** - Each form validates only visible fields instead of monolithic schema for all fields. Solves React Hook Form silent validation failure when defaultValues are incomplete.

2. **No getDirtyFields Utility** - Simplified approach: send full form data to backend, which accepts `Partial<UpdateProfileRequest>`. Backend naturally handles partial updates without frontend filtering complexity.

3. **Inline Loading/Error Pattern** - ProfileView uses inline Spin and Alert components inside Card, matching project-wide patterns (SalesReportView, ClinicsPageView). Avoids early return pattern for better UX.

4. **Consistency with Employee Schema** - taxId has no regex validation, password requires min 6 chars (no complexity), matching employee management patterns for uniform UX.

5. **Server Actions for Mutations** - Uses updateProfileAction() and changePasswordAction() instead of PATCH API routes. API routes only for queries (GET /api/v1/profile).

### Bug Fixes:

- **Issue**: Save buttons in all tabs appeared non-functional
- **Root Cause**: Forms used UpdateProfileRequestSchema (requires all fields) but defaultValues only contained tab-specific fields, causing React Hook Form to fail validation silently
- **Solution**: Created partial schemas per tab (BasicInfoFormSchema, ContactInfoFormSchema, etc.) matching only visible fields

### Deferred Features:

- Avatar Upload Component (AvatarUpload.tsx, useUploadAvatar hook, file upload UI, Supabase Storage integration)
- Password strength indicator
- Unsaved changes warning
- Auto-save draft to localStorage
- Keyboard shortcuts (Ctrl+S)
- Field-level help tooltips
- Tab lazy loading
- Debounced duplicate checks
- Activity log / change history
- Session management UI
- Two-factor authentication
- User preferences (theme/language/notifications)
- GDPR data export

---

**Last Updated:** December 7, 2025  
**Implementation Status:** MVP Complete (20 files implemented)  
**Next Phase:** Avatar upload feature + UX enhancements
