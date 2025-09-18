# Bộ tài liệu tối thiểu cho mỗi feature

Vị trí: docs/features/<feature>.md

## Overview

- Mục tiêu nghiệp vụ và phạm vi feature.
- Liên quan đến màn hình/flow nào.

## Folder structure

- Theo quy ước: api/, components/, hooks/, views/, types.ts, constants.ts, index.ts.

```text
<feature>/
├─ api/
├─ components/
├─ hooks/
├─ views/
├─ constants.ts
├─ types.ts
└─ index.ts
```

## Data flow

- UI → hooks → API client → API route → services → data source → quay lại UI.
- Ghi rõ điểm validate/cache/throttling.

## API contracts

- Endpoint: /api/...
- Method: GET | POST | PUT | DELETE
- Body: mô tả ngắn gọn (schema)
- Response: mô tả ngắn gọn (schema)
- Error shape: mã lỗi + message chuẩn

## Validation & Error handling

- Client: form validation (Zod nếu có) hoặc validator nhẹ.
- Server: validate input, mapping lỗi, chuẩn hóa mã lỗi.

## State management

- Dùng React Query/Zustand/Context?
- Phân loại server state vs UI state.
- Chiến lược cache, stale time, invalidation.

## Security/Permissions

- Cần đăng nhập?
- Cần quyền/role nào?
- Middleware/guard tham gia.

## UX states

- Loading / Empty / Error / Success.
- Thông báo: message/notification/toast.
- Skeletons và accessibility (nếu có).

## Testing checklist

- Case chính.
- Edge cases.
- API error paths.
- Permission/redirect.
- Loading states.

## Dependencies & TODO

- Thư viện liên quan.
- Việc dự định nâng cấp.
