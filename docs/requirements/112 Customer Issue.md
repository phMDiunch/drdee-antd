# 🧩 Requirements: Customer Issue Management System

> **📋 STATUS: 🆕 NEW** - Documentation in progress  
> **👥 Audience**: Manager, Customer Service, All Staff  
> **🔗 Related**: [007 Customer.md](./007%20Customer.md), [009 Consulted-Service.md](./009%20Consulted-Service.md)

## 📖 Overview

Hệ thống quản lý **vấn đề và khiếu nại của khách hàng** (Customer Issues & Complaints):

- Ghi nhận tất cả phản hồi/vấn đề từ khách hàng
- Tracking quy trình xử lý từ tiếp nhận → giải quyết → đóng case
- Xác định trách nhiệm (ai gây ra vấn đề)
- KPI performance: Response time, resolution rate, responsible person tracking
- Đảm bảo không có vấn đề nào bị bỏ sót

---

## 🎯 Business Context

### Pain Points (Nỗi Đau Hiện Tại)

1. ❌ **Không có nơi ghi nhận**: Khách phản hồi qua điện thoại, Facebook → không được ghi lại
2. ❌ **Mất dấu vết**: Không biết vấn đề đã được xử lý chưa, ai đang xử lý
3. ❌ **Không truy vết được**: Không biết ai gây ra vấn đề, gây bao nhiêu lần
4. ❌ **Không có trách nhiệm**: Người gây vấn đề không bị nhắc nhở/xử lý
5. ❌ **Không có KPI**: Không đo lường được chất lượng dịch vụ và performance nhân viên

### Goals (Mục Tiêu)

1. ✅ **100% vấn đề được ghi nhận**: Mọi phản hồi đều vào hệ thống
2. ✅ **Tracking đầy đủ**: Biết rõ tình trạng xử lý, người phụ trách
3. ✅ **Truy vết trách nhiệm**: Xác định ai gây ra, đã gây bao nhiêu lần
4. ✅ **KPI rõ ràng**: Đo lường response time, resolution rate, satisfaction
5. ✅ **Continuous Improvement**: Phân tích root cause để cải thiện

---

## 1. 📋 Database Schema

### Model: CustomerIssue

```prisma
model CustomerIssue {
  id String @id @default(uuid())

  // Issue Information
  issueCode       String  @unique // Auto-generate: ISS-YYMM-NNN
  title           String // Tiêu đề ngắn gọn (VD: "Đau răng sau điều trị")
  description     String @db.Text // Mô tả chi tiết vấn đề
  category        String // "service_quality" | "staff_attitude" | "billing" | "appointment" | "facility" | "other"
  severity        String // "critical" | "high" | "medium" | "low"
  source          String // "phone" | "in_person" | "facebook" | "google_review" | "zalo" | "other"

  // Status & Workflow
  status          String @default("new") // "new" | "assigned" | "investigating" | "resolved" | "closed" | "reopened"
  priority        String @default("medium") // "urgent" | "high" | "medium" | "low"
  dueDate         DateTime? @db.Date // Deadline để xử lý (SLA)

  // Customer & Context
  customerId           String
  relatedServiceId     String? // Link to ConsultedService
  relatedTreatmentId   String? // Link to TreatmentLog
  relatedAppointmentId String?
  clinicId             String

  // Responsibility (Người gây ra vấn đề)
  responsibleEmployeeId String? // Ai gây ra vấn đề
  responsibleDepartment String? // Bộ phận gây ra: "doctor" | "receptionist" | "sale" | "facility" | "management"
  rootCause            String? @db.Text // Nguyên nhân gốc rễ
  isRecurring          Boolean @default(false) // Vấn đề này đã xảy ra trước đó chưa

  // Assignment (Người xử lý)
  assignedToId  String? // Manager hoặc staff được giao xử lý
  assignedAt    DateTime? @db.Timestamptz
  assignedById  String? // Ai assign

  // Resolution
  investigationNotes String? @db.Text // Ghi chú quá trình điều tra
  resolution         String? @db.Text // Giải pháp đã áp dụng
  actionsTaken       String? @db.Text // Các hành động đã thực hiện
  resolvedAt         DateTime? @db.Timestamptz
  resolvedById       String? // Ai đánh dấu resolved

  // Follow-up & Satisfaction
  customerSatisfaction Int? // 1-5 stars (khách có hài lòng với cách xử lý không)
  followUpNotes        String? @db.Text
  closedAt             DateTime? @db.Timestamptz
  closedById           String?

  // Prevention (Ngăn ngừa tái phát)
  preventiveActions String? @db.Text // Biện pháp ngăn ngừa
  trainingRequired  Boolean @default(false) // Cần đào tạo lại nhân viên không
  policyUpdate      String? // Cần cập nhật quy trình nào

  // Metadata
  createdById String
  updatedById String
  createdAt   DateTime @default(now()) @db.Timestamptz
  updatedAt   DateTime @updatedAt @db.Timestamptz
  archivedAt  DateTime? @db.Timestamptz

  // Relations
  customer              Customer @relation(fields: [customerId], references: [id])
  clinic                Clinic @relation(fields: [clinicId], references: [id])

  relatedService        ConsultedService? @relation("IssueServices", fields: [relatedServiceId], references: [id])
  relatedTreatment      TreatmentLog? @relation("IssueTreatments", fields: [relatedTreatmentId], references: [id])
  relatedAppointment    Appointment? @relation("IssueAppointments", fields: [relatedAppointmentId], references: [id])

  responsibleEmployee   Employee? @relation("ResponsibleIssues", fields: [responsibleEmployeeId], references: [id])
  assignedTo            Employee? @relation("AssignedIssues", fields: [assignedToId], references: [id])
  assignedBy            Employee? @relation("AssignedByIssues", fields: [assignedById], references: [id])
  resolvedBy            Employee? @relation("ResolvedIssues", fields: [resolvedById], references: [id])
  closedBy              Employee? @relation("ClosedIssues", fields: [closedById], references: [id])

  createdBy             Employee @relation("CreatedIssues", fields: [createdById], references: [id])
  updatedBy             Employee @relation("UpdatedIssues", fields: [updatedById], references: [id])

  activities            IssueActivity[]
  attachments           IssueAttachment[]

  // Indexes
  @@index([customerId, createdAt])
  @@index([status, priority])
  @@index([assignedToId, status])
  @@index([responsibleEmployeeId])
  @@index([clinicId, status])
  @@index([dueDate])
}
```

### Model: IssueActivity

```prisma
model IssueActivity {
  id String @id @default(uuid())

  issueId      String
  activityType String // "comment" | "status_change" | "assignment" | "investigation" | "resolution" | "follow_up"

  // Activity Content
  content      String? @db.Text // Nội dung comment/note
  oldValue     String? // Giá trị cũ (for status_change, assignment)
  newValue     String? // Giá trị mới

  // Metadata
  createdById String
  createdAt   DateTime @default(now()) @db.Timestamptz

  // Relations
  issue     CustomerIssue @relation(fields: [issueId], references: [id], onDelete: Cascade)
  createdBy Employee @relation("CreatedIssueActivities", fields: [createdById], references: [id])

  @@index([issueId, createdAt])
}
```

### Model: IssueAttachment

```prisma
model IssueAttachment {
  id String @id @default(uuid())

  issueId     String
  fileName    String
  fileUrl     String // URL to uploaded file (Supabase Storage)
  fileType    String // "image" | "document" | "video"
  fileSize    Int // bytes
  description String?

  uploadedById String
  uploadedAt   DateTime @default(now()) @db.Timestamptz

  issue      CustomerIssue @relation(fields: [issueId], references: [id], onDelete: Cascade)
  uploadedBy Employee @relation("UploadedIssueAttachments", fields: [uploadedById], references: [id])

  @@index([issueId])
}
```

### Model Updates: Employee

```prisma
model Employee {
  // ... existing fields ...

  // NEW: Issue Relations
  responsibleIssues      CustomerIssue[] @relation("ResponsibleIssues") // Issues gây ra
  assignedIssues         CustomerIssue[] @relation("AssignedIssues") // Issues được giao xử lý
  assignedByIssues       CustomerIssue[] @relation("AssignedByIssues")
  resolvedIssues         CustomerIssue[] @relation("ResolvedIssues")
  closedIssues           CustomerIssue[] @relation("ClosedIssues")
  createdIssues          CustomerIssue[] @relation("CreatedIssues")
  updatedIssues          CustomerIssue[] @relation("UpdatedIssues")

  createdIssueActivities IssueActivity[] @relation("CreatedIssueActivities")
  uploadedAttachments    IssueAttachment[] @relation("UploadedIssueAttachments")

  // ... existing relations ...
}
```

---

## 2. 📝 Data Validation & Constants

### Issue Categories

```typescript
export const ISSUE_CATEGORIES = [
  {
    value: "service_quality",
    label: "🦷 Chất lượng dịch vụ",
    description:
      "Điều trị không đúng, đau sau điều trị, kết quả không như mong đợi",
  },
  {
    value: "staff_attitude",
    label: "👥 Thái độ nhân viên",
    description:
      "Lễ tân thô lỗ, bác sĩ không tận tâm, nhân viên thiếu chuyên nghiệp",
  },
  {
    value: "billing",
    label: "💰 Vấn đề tài chính",
    description: "Tính tiền sai, không rõ ràng, không báo giá trước",
  },
  {
    value: "appointment",
    label: "📅 Vấn đề hẹn lịch",
    description: "Hủy lịch đột ngột, chờ lâu, không đúng giờ hẹn",
  },
  {
    value: "facility",
    label: "🏥 Cơ sở vật chất",
    description: "Vệ sinh kém, thiết bị cũ, phòng khám chật chội",
  },
  {
    value: "communication",
    label: "💬 Giao tiếp",
    description: "Không giải thích rõ, không tư vấn kỹ, khó liên lạc",
  },
  { value: "other", label: "📌 Khác", description: "Vấn đề khác" },
] as const;
```

### Severity Levels

```typescript
export const ISSUE_SEVERITIES = [
  {
    value: "critical",
    label: "🔴 Nghiêm trọng",
    color: "red",
    sla: 4, // hours
    description:
      "Ảnh hưởng nghiêm trọng đến sức khỏe hoặc danh tiếng phòng khám",
  },
  {
    value: "high",
    label: "🟠 Cao",
    color: "orange",
    sla: 24, // hours
    description: "Khách hàng rất bực tức, có thể đòi hoàn tiền hoặc review xấu",
  },
  {
    value: "medium",
    label: "🟡 Trung bình",
    color: "yellow",
    sla: 72, // hours
    description: "Khách hàng không hài lòng nhưng chưa nghiêm trọng",
  },
  {
    value: "low",
    label: "🟢 Thấp",
    color: "green",
    sla: 168, // hours (1 week)
    description: "Vấn đề nhỏ, góp ý để cải thiện",
  },
] as const;
```

### Status Values

```typescript
export const ISSUE_STATUSES = [
  {
    value: "new",
    label: "🆕 Mới",
    color: "blue",
    description: "Vừa tiếp nhận, chưa xử lý",
  },
  {
    value: "assigned",
    label: "👤 Đã giao",
    color: "cyan",
    description: "Đã giao cho người xử lý",
  },
  {
    value: "investigating",
    label: "🔍 Đang điều tra",
    color: "purple",
    description: "Đang tìm hiểu nguyên nhân",
  },
  {
    value: "resolved",
    label: "✅ Đã giải quyết",
    color: "green",
    description: "Đã có giải pháp, chờ confirm khách",
  },
  {
    value: "closed",
    label: "🔒 Đã đóng",
    color: "gray",
    description: "Hoàn tất, khách đã hài lòng",
  },
  {
    value: "reopened",
    label: "🔄 Mở lại",
    color: "orange",
    description: "Khách vẫn chưa hài lòng, xử lý lại",
  },
] as const;
```

### Priority Levels

```typescript
export const ISSUE_PRIORITIES = [
  { value: "urgent", label: "🚨 Khẩn cấp", color: "red" },
  { value: "high", label: "⬆️ Cao", color: "orange" },
  { value: "medium", label: "➡️ Trung bình", color: "blue" },
  { value: "low", label: "⬇️ Thấp", color: "gray" },
] as const;
```

### Source Channels

```typescript
export const ISSUE_SOURCES = [
  { value: "phone", label: "📞 Điện thoại", icon: "Phone" },
  { value: "in_person", label: "🏥 Trực tiếp", icon: "User" },
  { value: "facebook", label: "👥 Facebook", icon: "Facebook" },
  { value: "google_review", label: "⭐ Google Review", icon: "Google" },
  { value: "zalo", label: "💙 Zalo", icon: "Zalo" },
  { value: "email", label: "📧 Email", icon: "Mail" },
  { value: "other", label: "📌 Khác", icon: "MoreHorizontal" },
] as const;
```

### Responsible Departments

```typescript
export const RESPONSIBLE_DEPARTMENTS = [
  { value: "doctor", label: "👨‍⚕️ Bác sĩ" },
  { value: "receptionist", label: "👤 Lễ tân" },
  { value: "sale", label: "💼 Sale/Tư vấn viên" },
  { value: "assistant", label: "👩‍⚕️ Phụ tá" },
  { value: "facility", label: "🏥 Cơ sở vật chất" },
  { value: "management", label: "📊 Quản lý" },
  { value: "unknown", label: "❓ Chưa xác định" },
] as const;
```

---

## 3. ✨ Core Features

### 3.1 Create Issue (Tiếp nhận vấn đề)

**Permission**: All staff (anyone can report issue)

**UI**: Modal form hoặc dedicated page

**Fields**:

**Section 1: Thông tin khách hàng**

- ✅ **Customer**: Search/select customer (by phone/name/code)
- **Related Service**: Optional - select from customer's ConsultedServices
- **Related Treatment**: Optional - select from customer's TreatmentLogs
- **Related Appointment**: Optional

**Section 2: Thông tin vấn đề**

- ✅ **Title**: Text input (required, max 200 chars)
- ✅ **Description**: Textarea (required, detailed description)
- ✅ **Category**: Select from ISSUE_CATEGORIES
- ✅ **Severity**: Select from ISSUE_SEVERITIES (auto-calculate due date based on SLA)
- ✅ **Source**: Where the issue came from (phone, in-person, etc.)
- **Priority**: Select (default based on severity)
- **Attachments**: Upload images/files (optional)

**Section 3: Trách nhiệm (optional - có thể điền sau)**

- **Responsible Employee**: Select employee
- **Responsible Department**: Select department
- **Root Cause**: Textarea (nguyên nhân sơ bộ)

**Section 4: Xử lý**

- **Assign To**: Select employee (default: current user if manager, or empty)
- **Due Date**: Auto from severity SLA (có thể edit)

**Auto-generate**:

- `issueCode`: ISS-YYMM-NNN (VD: ISS-2511-001)
- `status`: "new" (hoặc "assigned" nếu có assignedTo)
- `clinicId`: From current user

**Backend Logic**:

```typescript
async function createIssue(currentUser, data) {
  // 1. Generate issue code
  const issueCode = await generateIssueCode(currentUser.clinicId);

  // 2. Calculate due date from severity SLA
  const severity = ISSUE_SEVERITIES.find((s) => s.value === data.severity);
  const dueDate = data.dueDate || addHours(new Date(), severity.sla);

  // 3. Determine initial status
  const status = data.assignedToId ? "assigned" : "new";

  // 4. Create issue
  const issue = await prisma.customerIssue.create({
    data: {
      issueCode,
      title: data.title,
      description: data.description,
      category: data.category,
      severity: data.severity,
      source: data.source,
      priority: data.priority,
      status,
      dueDate,
      customerId: data.customerId,
      relatedServiceId: data.relatedServiceId,
      relatedTreatmentId: data.relatedTreatmentId,
      relatedAppointmentId: data.relatedAppointmentId,
      clinicId: currentUser.clinicId,
      responsibleEmployeeId: data.responsibleEmployeeId,
      responsibleDepartment: data.responsibleDepartment,
      rootCause: data.rootCause,
      assignedToId: data.assignedToId,
      assignedAt: data.assignedToId ? new Date() : null,
      assignedById: data.assignedToId ? currentUser.id : null,
      createdById: currentUser.id,
      updatedById: currentUser.id,
    },
  });

  // 5. Create initial activity
  await prisma.issueActivity.create({
    data: {
      issueId: issue.id,
      activityType: "comment",
      content: `Issue created: ${data.title}`,
      createdById: currentUser.id,
    },
  });

  // 6. If assigned, create assignment activity
  if (data.assignedToId) {
    await prisma.issueActivity.create({
      data: {
        issueId: issue.id,
        activityType: "assignment",
        content: `Assigned to ${assignedEmployee.fullName}`,
        newValue: data.assignedToId,
        createdById: currentUser.id,
      },
    });

    // TODO: Send notification to assignee
  }

  return issue;
}
```

### 3.2 Issue List View

**Route**: `/issues`

**Permission**:

- Staff: See issues they created or assigned to
- Manager/Admin: See all issues

**Filters**:

- **Status**: All / New / Assigned / Investigating / Resolved / Closed
- **Severity**: All / Critical / High / Medium / Low
- **Category**: All / Service Quality / Staff Attitude / etc.
- **Assigned To**: All / Me / Specific employee (Manager only)
- **Responsible**: All / Specific employee (Manager only)
- **Date Range**: Created date, Custom range
- **Overdue**: Show only overdue issues

**Tabs**:

- **My Issues**: Assigned to me
- **My Team**: Created by my team (Manager)
- **All Issues**: All issues (Manager/Admin)

**Columns**:
| Column | Description | Sortable |
|--------|-------------|----------|
| Issue Code | ISS-2511-001 | ✅ |
| Title | Issue title with severity badge | ❌ |
| Customer | Customer name + code | ✅ |
| Category | Badge with icon | ❌ |
| Status | Status badge | ❌ |
| Priority | Priority badge | ❌ |
| Assigned To | Employee name | ✅ |
| Responsible | Employee name (who caused) | ✅ |
| Due Date | Date with overdue indicator | ✅ |
| Created At | Date | ✅ |
| Actions | View / Edit / Close | ❌ |

**Overdue Indicator**:

```typescript
if (issue.dueDate < now() && issue.status !== "closed") {
  return <Badge color="red">⚠️ Overdue {daysSince} days</Badge>;
}
```

### 3.3 Issue Detail Page

**Route**: `/issues/[id]`

**Layout**: 2 columns

**Left Column** (Issue Info):

**Header**:

```
[Issue Code] [Status Badge] [Priority Badge] [Severity Badge]
Title: "Đau răng sau điều trị implant"
```

**Section: Customer Info**

- Customer name + code (link)
- Phone
- Related service/treatment/appointment (if any)

**Section: Issue Details**

- Category
- Source
- Description (full text)
- Attachments (images/files)
- Created by + date

**Section: Responsibility**

- Responsible Employee (who caused)
- Responsible Department
- Root Cause
- Is Recurring? (Yes/No)

**Section: Assignment**

- Assigned To (who handles)
- Assigned By
- Assigned At
- Due Date (with countdown timer if not overdue)

**Section: Resolution** (if resolved)

- Investigation Notes
- Resolution
- Actions Taken
- Resolved By + Date

**Section: Follow-up** (if closed)

- Customer Satisfaction (1-5 stars)
- Follow-up Notes
- Closed By + Date

**Section: Prevention** (if closed)

- Preventive Actions
- Training Required? (Yes/No)
- Policy Update

**Right Column** (Activity Timeline):

- List of activities (newest first)
- Activity types:
  - 💬 Comment
  - 📊 Status change: "new" → "assigned"
  - 👤 Assignment: Assigned to Nguyễn A
  - 🔍 Investigation: Added notes
  - ✅ Resolution: Marked as resolved
  - ⭐ Follow-up: Customer rated 5 stars
- For each activity:
  - Icon + type
  - Content
  - Created by + timestamp
- [Add Comment] button (floating)

**Actions** (Top right):

- [Edit] button (permission check)
- [Change Status] dropdown
- [Assign] button
- [Close Issue] button (if resolved)
- [Reopen] button (if closed and still has problem)

### 3.4 Change Status

**Trigger**: Click "Change Status" dropdown

**UI**: Inline dropdown or modal

**Available transitions**:

```typescript
const STATUS_TRANSITIONS = {
  new: ["assigned", "investigating"],
  assigned: ["investigating", "resolved", "closed"],
  investigating: ["resolved", "closed"],
  resolved: ["closed", "reopened"],
  closed: ["reopened"],
  reopened: ["investigating", "resolved"],
};
```

**Modal fields** (for certain transitions):

**new → assigned**: Requires assignedToId
**investigating → resolved**: Requires resolution text
**resolved → closed**: Requires customer satisfaction rating
**closed → reopened**: Requires reason

**Backend Logic**:

```typescript
async function changeIssueStatus(issueId, newStatus, data) {
  const issue = await prisma.customerIssue.findUnique({
    where: { id: issueId },
  });

  // Validate transition
  const allowedTransitions = STATUS_TRANSITIONS[issue.status];
  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(`Cannot change from ${issue.status} to ${newStatus}`);
  }

  // Update fields based on new status
  const updateData: any = {
    status: newStatus,
    updatedById: currentUser.id,
  };

  if (newStatus === "assigned" && data.assignedToId) {
    updateData.assignedToId = data.assignedToId;
    updateData.assignedAt = new Date();
    updateData.assignedById = currentUser.id;
  }

  if (newStatus === "resolved") {
    updateData.resolution = data.resolution;
    updateData.investigationNotes = data.investigationNotes;
    updateData.actionsTaken = data.actionsTaken;
    updateData.resolvedAt = new Date();
    updateData.resolvedById = currentUser.id;
  }

  if (newStatus === "closed") {
    updateData.customerSatisfaction = data.customerSatisfaction;
    updateData.followUpNotes = data.followUpNotes;
    updateData.preventiveActions = data.preventiveActions;
    updateData.trainingRequired = data.trainingRequired;
    updateData.policyUpdate = data.policyUpdate;
    updateData.closedAt = new Date();
    updateData.closedById = currentUser.id;
  }

  // Update issue
  await prisma.customerIssue.update({
    where: { id: issueId },
    data: updateData,
  });

  // Create activity
  await prisma.issueActivity.create({
    data: {
      issueId,
      activityType: "status_change",
      content: `Status changed from "${issue.status}" to "${newStatus}"`,
      oldValue: issue.status,
      newValue: newStatus,
      createdById: currentUser.id,
    },
  });
}
```

### 3.5 Assign Issue

**Permission**: Manager, Admin

**UI**: Modal with employee select

**Fields**:

- **Assign To**: Select employee (required)
- **Note**: Optional note for assignee

**Backend Logic**:

```typescript
async function assignIssue(issueId, assignedToId, note) {
  await prisma.customerIssue.update({
    where: { id: issueId },
    data: {
      assignedToId,
      assignedAt: new Date(),
      assignedById: currentUser.id,
      status: "assigned", // Auto change to assigned
    },
  });

  await prisma.issueActivity.create({
    data: {
      issueId,
      activityType: "assignment",
      content: note || `Assigned to ${assignee.fullName}`,
      newValue: assignedToId,
      oldValue: previousAssignedToId,
      createdById: currentUser.id,
    },
  });

  // TODO: Send notification to assignee
}
```

### 3.6 Add Comment/Note

**UI**: Textarea at bottom of activity timeline

**Fields**:

- **Comment**: Textarea
- **Attachments**: Optional file upload

**Backend Logic**:

```typescript
async function addIssueComment(issueId, content, attachments) {
  const activity = await prisma.issueActivity.create({
    data: {
      issueId,
      activityType: "comment",
      content,
      createdById: currentUser.id,
    },
  });

  // Upload attachments if any
  if (attachments?.length > 0) {
    for (const file of attachments) {
      const fileUrl = await uploadToSupabase(file);
      await prisma.issueAttachment.create({
        data: {
          issueId,
          fileName: file.name,
          fileUrl,
          fileType: detectFileType(file),
          fileSize: file.size,
          uploadedById: currentUser.id,
        },
      });
    }
  }
}
```

### 3.7 Update Responsibility

**Permission**: Manager, Staff who investigating

**UI**: Edit form in issue detail

**Fields**:

- **Responsible Employee**: Select employee
- **Responsible Department**: Select department
- **Root Cause**: Textarea
- **Is Recurring**: Checkbox

**Note**: Đây là action quan trọng vì sẽ ảnh hưởng đến KPI của nhân viên

### 3.8 Close Issue

**Trigger**: Click "Close Issue" button (only available when status = "resolved")

**UI**: Modal form

**Fields**:

- ✅ **Customer Satisfaction**: 1-5 stars (required)
- **Follow-up Notes**: Textarea (optional)
- **Preventive Actions**: Textarea (các biện pháp để tránh tái phát)
- **Training Required**: Checkbox (nhân viên liên quan cần đào tạo lại không?)
- **Policy Update**: Textarea (cần cập nhật quy trình/chính sách nào)

**Backend Logic**:

```typescript
async function closeIssue(issueId, data) {
  await prisma.customerIssue.update({
    where: { id: issueId },
    data: {
      status: "closed",
      customerSatisfaction: data.customerSatisfaction,
      followUpNotes: data.followUpNotes,
      preventiveActions: data.preventiveActions,
      trainingRequired: data.trainingRequired,
      policyUpdate: data.policyUpdate,
      closedAt: new Date(),
      closedById: currentUser.id,
    },
  });

  await prisma.issueActivity.create({
    data: {
      issueId,
      activityType: "status_change",
      content: `Issue closed with ${data.customerSatisfaction} stars satisfaction`,
      oldValue: "resolved",
      newValue: "closed",
      createdById: currentUser.id,
    },
  });
}
```

### 3.9 Reopen Issue

**Trigger**: Click "Reopen" button (only available when status = "closed")

**Use Case**: Khách hàng vẫn chưa hài lòng sau khi đóng issue

**UI**: Modal confirm with reason

**Fields**:

- **Reason**: Textarea (tại sao reopen, required)

**Backend Logic**:

```typescript
async function reopenIssue(issueId, reason) {
  await prisma.customerIssue.update({
    where: { id: issueId },
    data: {
      status: "reopened",
      closedAt: null,
      closedById: null,
    },
  });

  await prisma.issueActivity.create({
    data: {
      issueId,
      activityType: "status_change",
      content: `Issue reopened. Reason: ${reason}`,
      oldValue: "closed",
      newValue: "reopened",
      createdById: currentUser.id,
    },
  });
}
```

---

## 4. 📊 KPIs & Reporting

### 4.1 Issue Overview Dashboard

**Location**: `/dashboard` - Section "Customer Issues"

**Widgets**:

```
┌─────────────────────────────────────────────────────────────┐
│  🚨 CUSTOMER ISSUES - This Month                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Overview                                                   │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Total Issues: 45                                      │ │
│  │ Closed: 32 (71%)                                      │ │
│  │ In Progress: 10                                       │ │
│  │ ⚠️ Overdue: 3                                         │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  By Severity                                                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 🔴 Critical: 2 (4%)                                   │ │
│  │ 🟠 High: 8 (18%)                                      │ │
│  │ 🟡 Medium: 25 (56%)                                   │ │
│  │ 🟢 Low: 10 (22%)                                      │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  By Category                                                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 🦷 Service Quality: 18 (40%)                          │ │
│  │ 👥 Staff Attitude: 12 (27%)                           │ │
│  │ 💰 Billing: 8 (18%)                                   │ │
│  │ 📅 Appointment: 5 (11%)                               │ │
│  │ 🏥 Facility: 2 (4%)                                   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [View All Issues →] [View Reports →]                      │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Response & Resolution Time KPIs

**A. Average Response Time**

**Definition**: Thời gian trung bình từ khi tạo issue → assigned/investigating

**Formula**:

```typescript
Avg Response Time = AVG(assignedAt - createdAt) for issues with status >= "assigned"
```

**Query**:

```sql
SELECT
  AVG(EXTRACT(EPOCH FROM (assignedAt - createdAt)) / 3600) as avgResponseHours
FROM "CustomerIssue"
WHERE
  assignedAt IS NOT NULL
  AND createdAt >= :startDate
  AND createdAt < :endDate;
```

**Target**: < 4 hours (adjustable)

**B. Average Resolution Time**

**Definition**: Thời gian trung bình từ tạo issue → resolved

**Formula**:

```typescript
Avg Resolution Time = AVG(resolvedAt - createdAt) for resolved issues
```

**Query**:

```sql
SELECT
  AVG(EXTRACT(EPOCH FROM (resolvedAt - createdAt)) / 3600) as avgResolutionHours
FROM "CustomerIssue"
WHERE
  status IN ('resolved', 'closed')
  AND resolvedAt IS NOT NULL
  AND createdAt >= :startDate
  AND createdAt < :endDate;
```

**Target**: Based on severity SLA

**C. SLA Compliance Rate**

**Definition**: % issues được giải quyết trong SLA

**Query**:

```sql
WITH issue_sla AS (
  SELECT
    ci.id,
    ci.severity,
    ci.createdAt,
    ci.resolvedAt,
    CASE ci.severity
      WHEN 'critical' THEN 4
      WHEN 'high' THEN 24
      WHEN 'medium' THEN 72
      WHEN 'low' THEN 168
    END as slaHours,
    EXTRACT(EPOCH FROM (ci.resolvedAt - ci.createdAt)) / 3600 as actualHours
  FROM "CustomerIssue" ci
  WHERE
    ci.status IN ('resolved', 'closed')
    AND ci.resolvedAt IS NOT NULL
    AND ci.createdAt >= :startDate
    AND ci.createdAt < :endDate
)
SELECT
  COUNT(CASE WHEN actualHours <= slaHours THEN 1 END)::numeric /
  COUNT(*)::numeric * 100 as slaComplianceRate
FROM issue_sla;
```

### 4.3 Resolution Rate KPI

**Definition**: % issues được giải quyết thành công (closed)

**Query**:

```sql
SELECT
  COUNT(CASE WHEN status = 'closed' THEN 1 END)::numeric /
  COUNT(*)::numeric * 100 as resolutionRate
FROM "CustomerIssue"
WHERE
  createdAt >= :startDate
  AND createdAt < :endDate;
```

**Target**: > 90%

### 4.4 Customer Satisfaction KPI

**Definition**: Điểm hài lòng trung bình của khách hàng (1-5 stars)

**Query**:

```sql
SELECT
  AVG(customerSatisfaction) as avgSatisfaction,
  COUNT(CASE WHEN customerSatisfaction >= 4 THEN 1 END)::numeric /
  COUNT(*)::numeric * 100 as satisfactionRate
FROM "CustomerIssue"
WHERE
  status = 'closed'
  AND customerSatisfaction IS NOT NULL
  AND closedAt >= :startDate
  AND closedAt < :endDate;
```

**Target**: Avg >= 4.0 stars, Satisfaction rate >= 80%

### 4.5 Responsible Person Report (CRITICAL)

**Definition**: Báo cáo nhân viên gây ra bao nhiêu issues

**Purpose**: Xác định nhân viên nào cần đào tạo, nhắc nhở

**Query**:

```sql
SELECT
  e.id as employeeId,
  e.fullName as employeeName,
  e.jobTitle,
  rd.responsibleDepartment,
  COUNT(ci.id) as totalIssues,
  COUNT(CASE WHEN ci.severity = 'critical' THEN 1 END) as criticalIssues,
  COUNT(CASE WHEN ci.severity = 'high' THEN 1 END) as highIssues,
  COUNT(CASE WHEN ci.isRecurring = true THEN 1 END) as recurringIssues,
  STRING_AGG(DISTINCT ci.category, ', ') as categories,
  AVG(ci.customerSatisfaction) as avgSatisfactionAfterResolve
FROM "Employee" e
JOIN "CustomerIssue" ci ON ci.responsibleEmployeeId = e.id
LEFT JOIN LATERAL (
  SELECT ci.responsibleDepartment
) rd ON true
WHERE
  ci.createdAt >= :startDate
  AND ci.createdAt < :endDate
  AND ci.archivedAt IS NULL
GROUP BY e.id, e.fullName, e.jobTitle, rd.responsibleDepartment
ORDER BY totalIssues DESC;
```

**UI Display**:

```
┌─────────────────────────────────────────────────────────────┐
│  RESPONSIBLE PERSON REPORT - November 2025                  │
├─────────────────────────────────────────────────────────────┤
│ Name         │ Role    │ Total │ Critical │ Recurring │ Avg   │
│              │         │ Issues│          │           │ Sat   │
├─────────────────────────────────────────────────────────────┤
│ Dr. Nguyễn A │ Dentist │  12   │    2     │     3     │ 3.5⭐ │
│ Trần B       │ Recept. │   8   │    0     │     1     │ 4.2⭐ │
│ Lê C         │ Sale    │   5   │    1     │     0     │ 4.0⭐ │
└─────────────────────────────────────────────────────────────┘
```

**Red Flags** (Auto-highlight):

- Critical issues > 0
- Recurring issues > 2
- Avg satisfaction < 3.5 stars
- Total issues > team average × 1.5

### 4.6 Resolver Performance Report

**Definition**: Nhân viên xử lý issues hiệu quả như nào

**Query**:

```sql
SELECT
  e.id as employeeId,
  e.fullName as employeeName,
  COUNT(ci.id) as totalAssigned,
  COUNT(CASE WHEN ci.status = 'closed' THEN 1 END) as totalClosed,
  ROUND(
    COUNT(CASE WHEN ci.status = 'closed' THEN 1 END)::numeric /
    NULLIF(COUNT(ci.id), 0)::numeric * 100,
    2
  ) as closureRate,
  AVG(EXTRACT(EPOCH FROM (ci.resolvedAt - ci.assignedAt)) / 3600) as avgResolutionHours,
  AVG(ci.customerSatisfaction) as avgSatisfaction,
  COUNT(CASE WHEN ci.resolvedAt <= ci.dueDate THEN 1 END)::numeric /
  NULLIF(COUNT(CASE WHEN ci.status IN ('resolved', 'closed') THEN 1 END), 0)::numeric * 100 as slaComplianceRate
FROM "Employee" e
JOIN "CustomerIssue" ci ON ci.assignedToId = e.id
WHERE
  ci.assignedAt >= :startDate
  AND ci.assignedAt < :endDate
GROUP BY e.id, e.fullName
ORDER BY closureRate DESC, avgResolutionHours ASC;
```

**KPIs for Resolver**:

- **Closure Rate**: % issues assigned đã close
- **Avg Resolution Time**: Thời gian xử lý trung bình
- **SLA Compliance**: % resolve đúng deadline
- **Avg Satisfaction**: Điểm hài lòng khách hàng

### 4.7 Category & Root Cause Analysis

**Query**:

```sql
-- Issues by category with common root causes
SELECT
  ci.category,
  COUNT(ci.id) as totalIssues,
  COUNT(CASE WHEN ci.status = 'closed' THEN 1 END) as closedIssues,
  AVG(EXTRACT(EPOCH FROM (ci.resolvedAt - ci.createdAt)) / 3600) as avgResolutionHours,
  STRING_AGG(DISTINCT ci.rootCause, '; ') as commonRootCauses,
  COUNT(CASE WHEN ci.isRecurring = true THEN 1 END) as recurringCount
FROM "CustomerIssue" ci
WHERE
  ci.createdAt >= :startDate
  AND ci.createdAt < :endDate
  AND ci.archivedAt IS NULL
GROUP BY ci.category
ORDER BY totalIssues DESC;
```

**Purpose**: Xác định vấn đề nào xảy ra nhiều nhất để cải thiện

### 4.8 Recurring Issues Report

**Definition**: Issues xảy ra lặp lại (cùng root cause, cùng category)

**Query**:

```sql
SELECT
  ci.category,
  ci.rootCause,
  COUNT(ci.id) as occurrences,
  STRING_AGG(ci.issueCode, ', ') as issueCodes,
  MIN(ci.createdAt) as firstOccurrence,
  MAX(ci.createdAt) as lastOccurrence
FROM "CustomerIssue" ci
WHERE
  ci.isRecurring = true
  AND ci.createdAt >= :startDate
  AND ci.createdAt < :endDate
GROUP BY ci.category, ci.rootCause
HAVING COUNT(ci.id) >= 2
ORDER BY occurrences DESC;
```

**Action**: High recurring count → need process improvement

### 4.9 Additional KPI Suggestions

**A. First Response Time (FRT)**

**Definition**: Thời gian đầu tiên có action trên issue (assign hoặc comment)

**Formula**:

```sql
SELECT
  AVG(EXTRACT(EPOCH FROM (firstActivity.createdAt - ci.createdAt)) / 3600) as avgFRT
FROM "CustomerIssue" ci
LEFT JOIN LATERAL (
  SELECT createdAt
  FROM "IssueActivity" ia
  WHERE ia.issueId = ci.id
  ORDER BY createdAt ASC
  LIMIT 1
) firstActivity ON true
WHERE ci.createdAt >= :startDate;
```

**Target**: < 2 hours

**B. Reopen Rate**

**Definition**: % issues bị reopen (chất lượng xử lý chưa tốt)

**Formula**:

```sql
SELECT
  COUNT(CASE WHEN status = 'reopened' THEN 1 END)::numeric /
  COUNT(*)::numeric * 100 as reopenRate
FROM "CustomerIssue"
WHERE closedAt >= :startDate;
```

**Target**: < 5%

**C. Issue Volume Trend**

**Definition**: Số lượng issues theo thời gian (tăng hay giảm?)

**Query**:

```sql
SELECT
  DATE_TRUNC('week', createdAt) as week,
  COUNT(id) as totalIssues,
  COUNT(CASE WHEN severity = 'critical' THEN 1 END) as criticalIssues
FROM "CustomerIssue"
WHERE createdAt >= :startDate
GROUP BY week
ORDER BY week;
```

**Good sign**: Volume giảm dần (cải thiện chất lượng)

**D. Training Effectiveness**

**Definition**: Sau khi đào tạo, số issues từ nhân viên đó có giảm không?

**Query**:

```sql
-- Compare issues before and after training date
SELECT
  e.id,
  e.fullName,
  COUNT(CASE WHEN ci.createdAt < :trainingDate THEN 1 END) as issuesBeforeTraining,
  COUNT(CASE WHEN ci.createdAt >= :trainingDate THEN 1 END) as issuesAfterTraining,
  ROUND(
    (COUNT(CASE WHEN ci.createdAt >= :trainingDate THEN 1 END) -
     COUNT(CASE WHEN ci.createdAt < :trainingDate THEN 1 END))::numeric /
    NULLIF(COUNT(CASE WHEN ci.createdAt < :trainingDate THEN 1 END), 0)::numeric * 100,
    2
  ) as changePercentage
FROM "Employee" e
JOIN "CustomerIssue" ci ON ci.responsibleEmployeeId = e.id
WHERE ci.createdAt >= :trainingDate - INTERVAL '3 months'
GROUP BY e.id, e.fullName;
```

**E. Department Performance**

**Query**:

```sql
SELECT
  responsibleDepartment,
  COUNT(id) as totalIssues,
  AVG(customerSatisfaction) as avgSatisfaction,
  COUNT(CASE WHEN isRecurring = true THEN 1 END) as recurringIssues
FROM "CustomerIssue"
WHERE createdAt >= :startDate
GROUP BY responsibleDepartment
ORDER BY totalIssues DESC;
```

---

## 5. 🔌 API Endpoints

### Issue Management

| Method | Endpoint                 | Description             | Permission                              |
| ------ | ------------------------ | ----------------------- | --------------------------------------- |
| POST   | `/api/issues`            | Create issue            | All staff                               |
| GET    | `/api/issues`            | List issues (paginated) | Staff (assigned/created), Manager (all) |
| GET    | `/api/issues/:id`        | Get issue detail        | Owner, Assignee, Manager                |
| PATCH  | `/api/issues/:id`        | Update issue            | Owner, Assignee, Manager                |
| DELETE | `/api/issues/:id`        | Soft delete             | Manager                                 |
| POST   | `/api/issues/:id/assign` | Assign to employee      | Manager                                 |
| POST   | `/api/issues/:id/status` | Change status           | Assignee, Manager                       |
| POST   | `/api/issues/:id/close`  | Close issue             | Assignee, Manager                       |
| POST   | `/api/issues/:id/reopen` | Reopen issue            | Any staff                               |

### Issue Activities

| Method | Endpoint                     | Description           | Permission               |
| ------ | ---------------------------- | --------------------- | ------------------------ |
| GET    | `/api/issues/:id/activities` | Get activity timeline | Owner, Assignee, Manager |
| POST   | `/api/issues/:id/activities` | Add comment           | Owner, Assignee, Manager |

### Issue Attachments

| Method | Endpoint                                    | Description       | Permission               |
| ------ | ------------------------------------------- | ----------------- | ------------------------ |
| POST   | `/api/issues/:id/attachments`               | Upload attachment | Owner, Assignee, Manager |
| DELETE | `/api/issues/:id/attachments/:attachmentId` | Delete attachment | Uploader, Manager        |

### Reporting

| Method | Endpoint                          | Description               | Permission |
| ------ | --------------------------------- | ------------------------- | ---------- |
| GET    | `/api/reports/issues/overview`    | Dashboard overview stats  | Manager    |
| GET    | `/api/reports/issues/responsible` | Responsible person report | Manager    |
| GET    | `/api/reports/issues/resolver`    | Resolver performance      | Manager    |
| GET    | `/api/reports/issues/category`    | Category analysis         | Manager    |
| GET    | `/api/reports/issues/recurring`   | Recurring issues          | Manager    |
| GET    | `/api/reports/issues/trend`       | Issue volume trend        | Manager    |

---

## 6. 🎨 UI/UX Guidelines

### Status Badge Colors

```typescript
export const ISSUE_STATUS_COLORS = {
  new: "blue",
  assigned: "cyan",
  investigating: "purple",
  resolved: "green",
  closed: "gray",
  reopened: "orange",
};
```

### Severity Badge with Icons

```typescript
export const SEVERITY_DISPLAY = {
  critical: { icon: "🔴", color: "red", pulse: true },
  high: { icon: "🟠", color: "orange" },
  medium: { icon: "🟡", color: "yellow" },
  low: { icon: "🟢", color: "green" },
};
```

### Priority Indicators

```typescript
if (issue.priority === "urgent") {
  return (
    <Badge color="red" className="animate-pulse">
      🚨 URGENT
    </Badge>
  );
}
```

### Overdue Alerts

```typescript
if (issue.dueDate < now() && issue.status !== "closed") {
  const daysOverdue = daysBetween(issue.dueDate, now());
  return <Alert type="error">⚠️ Overdue by {daysOverdue} days!</Alert>;
}
```

---

## 7. 🔐 Permissions

### Role-Based Access

| Feature                 | Staff                 | Manager | Admin  |
| ----------------------- | --------------------- | ------- | ------ |
| Create Issue            | ✅                    | ✅      | ✅     |
| View All Issues         | ❌                    | ✅      | ✅     |
| View My Issues          | ✅                    | ✅      | ✅     |
| Edit Issue              | ✅ (created/assigned) | ✅ All  | ✅ All |
| Assign Issue            | ❌                    | ✅      | ✅     |
| Change Status           | ✅ (assigned)         | ✅ All  | ✅ All |
| Close Issue             | ✅ (assigned)         | ✅ All  | ✅ All |
| Delete Issue            | ❌                    | ❌      | ✅     |
| View Reports            | ❌                    | ✅      | ✅     |
| View Responsible Report | ❌                    | ✅      | ✅     |

### Permission Implementation

```typescript
// src/shared/permissions/issue.permissions.ts

export const issuePermissions = {
  canCreate(user: UserCore): boolean {
    return true; // All staff can create
  },

  canView(user: UserCore, issue: CustomerIssue): boolean {
    if (["admin", "manager"].includes(user.role)) return true;
    return issue.createdById === user.id || issue.assignedToId === user.id;
  },

  canEdit(user: UserCore, issue: CustomerIssue): boolean {
    if (["admin", "manager"].includes(user.role)) return true;
    return issue.createdById === user.id || issue.assignedToId === user.id;
  },

  canAssign(user: UserCore): boolean {
    return ["admin", "manager"].includes(user.role);
  },

  canViewReports(user: UserCore): boolean {
    return ["admin", "manager"].includes(user.role);
  },

  canViewResponsibleReport(user: UserCore): boolean {
    return ["admin", "manager"].includes(user.role);
  },
};
```

---

## 8. 🚀 Implementation Tasks

### Phase 1: Database & Core Logic (Priority: High)

- [ ] Update Prisma schema (CustomerIssue, IssueActivity, IssueAttachment)
- [ ] Add relations to Employee, Customer, ConsultedService, TreatmentLog, Appointment
- [ ] Run migration: `prisma migrate dev --name add_customer_issue_models`
- [ ] Create validation schemas (issue.schema.ts)
- [ ] Create constants (categories, severities, statuses, etc.)
- [ ] Implement issue.service.ts (CRUD operations)
- [ ] Implement issue code generation logic
- [ ] Add indexes for performance

### Phase 2: API Layer (Priority: High)

- [ ] Create API routes for issue management
- [ ] Create API routes for activities
- [ ] Create API routes for attachments
- [ ] Create API routes for reporting
- [ ] Add permission checks
- [ ] Error handling and logging
- [ ] Unit tests for services

### Phase 3: UI - List & Detail (Priority: High)

- [ ] Issue list page with filters and tabs
- [ ] Issue detail page (2-column layout)
- [ ] Create issue modal/page
- [ ] Edit issue form
- [ ] Change status modal
- [ ] Assign modal
- [ ] Close issue modal
- [ ] Reopen modal
- [ ] Activity timeline component
- [ ] Add comment component
- [ ] Upload attachment component

### Phase 4: Reporting & Dashboard (Priority: Medium)

- [ ] Dashboard overview widget
- [ ] Response & resolution time reports
- [ ] SLA compliance report
- [ ] Responsible person report
- [ ] Resolver performance report
- [ ] Category analysis
- [ ] Recurring issues report
- [ ] Trend charts
- [ ] Export to Excel

### Phase 5: Notifications (Priority: Low)

- [ ] Email notification when assigned
- [ ] Email notification when overdue
- [ ] In-app notification system
- [ ] Notification preferences

### Phase 6: Advanced Features (Priority: Low)

- [ ] Bulk actions (assign multiple, close multiple)
- [ ] Issue templates (quick create for common issues)
- [ ] Smart assignment (auto-assign based on workload)
- [ ] Integration with external systems (Facebook, Google Review)

---

## 9. 🔮 Future Enhancements

### Advanced Analytics

- [ ] **Predictive Analytics**: Dự đoán issues sắp xảy ra dựa trên patterns
- [ ] **Sentiment Analysis**: Phân tích tone của description (angry, frustrated, etc.)
- [ ] **Root Cause Tree**: Visualize root cause hierarchy
- [ ] **Cost of Quality**: Tính chi phí xử lý issues

### Automation

- [ ] **Auto-categorize**: AI tự động phân loại category dựa trên description
- [ ] **Auto-assign**: Assign dựa trên workload và specialty
- [ ] **Auto-escalate**: Tự động escalate nếu quá SLA
- [ ] **Smart SLA**: Dynamic SLA based on issue complexity

### Integration

- [ ] **Facebook Integration**: Auto-import comments/reviews
- [ ] **Google Review Integration**: Auto-import reviews
- [ ] **WhatsApp Integration**: Customer support chat
- [ ] **CRM Integration**: Sync with external CRM

---

## 10. 📚 Related Documents

- [007 Customer.md](./007%20Customer.md) - Customer Management
- [009 Consulted-Service.md](./009%20Consulted-Service.md) - Service tracking
- [010 Follow-up.md](./010%20Follow-up.md) - Follow-up after consultation (different purpose)

---

## 11. ❓ Decision Points & Questions

### 1. Organization Structure

**Q**: Có nên có bộ phận Customer Service riêng không?

**Options**:

- **A. No separate team** (Current): Manager xử lý tất cả
  - ✅ Simple, no new hiring
  - ❌ Manager overload khi issues nhiều
- **B. Dedicated CS team**: Có 1-2 người chuyên xử lý issues
  - ✅ Professional, faster response
  - ✅ Manager focus on strategy
  - ❌ Need hiring, training
- **C. Distributed**: Mỗi department tự xử lý issues của mình
  - ✅ Responsible person fix their own problems
  - ❌ No centralized tracking, inconsistent quality

**Recommendation**: Start with A (current), move to B when issues > 50/month

### 2. SLA Configuration

**Q**: SLA cho mỗi severity có hợp lý không?

**Current**:

- Critical: 4 hours
- High: 24 hours
- Medium: 72 hours
- Low: 1 week

**Alternative**: Dựa vào category + severity matrix?

### 3. Punishment/Reward

**Q**: Cơ chế thưởng phạt như nào?

**Options**:

- **Punishment**: Nhân viên gây > X issues/month → warning/minus KPI
- **Reward**: Resolver xử lý tốt → bonus
- **Transparency**: Publish responsible report monthly?

**Need to decide**: Threshold và consequences

### 4. Customer Notification

**Q**: Có thông báo cho khách khi issue resolved không?

**Options**:

- Email: "Your issue has been resolved"
- SMS: Quick notification
- No notification: Only if customer asks

### 5. Compensation Tracking

**Q**: Tương lai có cần track compensation không?

- Refund amount
- Free service value
- Discount for next visit

**Decision**: Not now, but schema ready for future

---

**✍️ Document History**

- 2025-11-16: Initial draft - Customer Issue Management System requirements
- Based on user pain points: No issue tracking, no responsibility, no KPI
