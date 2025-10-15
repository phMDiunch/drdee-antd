// src/shared/utils/guards.ts
/**
 * Type Guards & Validation Utilities
 *
 * File này chứa các hàm type guard để kiểm tra và đảm bảo type safety
 * cho các object nhận từ API responses, user inputs, hoặc external sources.
 *
 * Type Guards giúp:
 * - Kiểm tra runtime type safety
 * - Narrow down unknown types thành specific types
 * - Validate data structure trước khi sử dụng
 */

import type { LoginResponse, ApiError } from "@/shared/validation/auth.schema";
import type { UserCore } from "@/shared/types/user";

/**
 * Kiểm tra xem object có phải là ApiError không
 *
 * @param x - Unknown value cần kiểm tra
 * @returns true nếu x có structure của ApiError
 *
 * ApiError structure: { error: string, ... }
 * Dùng để validate API error responses
 */
export function isApiError(x: unknown): x is ApiError {
  return (
    !!x && // Kiểm tra x tồn tại và truthy
    typeof x === "object" && // Phải là object
    x !== null && // Không phải null (vì typeof null === "object")
    "error" in x && // Có property "error"
    // Type-safe property access: cast to Record<string, unknown> trước khi access
    typeof (x as Record<string, unknown>).error === "string" // error property là string
  );
}

/**
 * Kiểm tra xem object có phải là LoginResponse không
 *
 * @param x - Unknown value cần kiểm tra
 * @returns true nếu x có structure của LoginResponse
 *
 * LoginResponse structure: { user: UserObject | null, ... }
 * Dùng để validate login API responses
 */
export function isLoginResponse(x: unknown): x is LoginResponse {
  // Kiểm tra basic structure trước
  if (!x || typeof x !== "object" || x === null || !("user" in x)) return false;

  // Type-safe cast: sau khi kiểm tra typeof === "object" && !== null
  const xObj = x as Record<string, unknown>;
  const u = xObj.user;

  // Nếu user là null thì valid (user chưa login)
  if (u === null) return true;

  // Nếu user không phải null thì phải có structure đúng
  // Step-by-step validation để đảm bảo type safety
  return (
    typeof u === "object" &&
    u !== null &&
    "id" in u &&
    // Nested type-safe access: cast inner object to Record<string, unknown>
    typeof (u as Record<string, unknown>).id === "string" &&
    "email" in u
  );
}

/**
 * Kiểm tra xem object có phải là UserCore không
 *
 * @param x - Unknown value cần kiểm tra
 * @returns true nếu x có structure của UserCore
 *
 * UserCore structure: { id: string, email: string, ... }
 * Dùng để validate user objects từ session/auth
 */
export function isUserCore(x: unknown): x is UserCore {
  // Standard object validation pattern
  if (!x || typeof x !== "object" || x === null) return false;

  // Type-safe property access after validation
  const o = x as Record<string, unknown>;
  return typeof o.id === "string" && "email" in o;
}

/**
 * === ASSERTION HELPERS ===
 * Các hàm "ensure" - ném exception nếu validation fail
 * Dùng trong critical paths where type safety is required
 */

/**
 * Đảm bảo object là LoginResponse, throw error nếu không
 *
 * @param x - Unknown value cần validate
 * @returns LoginResponse nếu valid
 * @throws Error nếu x không phải LoginResponse
 *
 * Dùng trong auth flows where login response must be valid
 */
export function ensureLoginResponse(x: unknown): LoginResponse {
  if (!isLoginResponse(x)) throw new Error("Phản hồi đăng nhập không hợp lệ.");
  return x;
}

/**
 * Đảm bảo operation thành công, throw error nếu không
 *
 * @param ok - Boolean indicating success/failure
 * @param fallback - Error message nếu fail
 * @throws Error nếu ok = false
 *
 * Dùng để validate API response status hoặc operation results
 */
export function ensureApiOk(ok: boolean, fallback = "Đã có lỗi xảy ra") {
  if (!ok) throw new Error(fallback);
}

/**
 * === USAGE PATTERNS ===
 *
 * 1. Type Guards trong API response handling:
 *    ```typescript
 *    const response = await fetch('/api/login');
 *    const data = await response.json();
 *
 *    if (isLoginResponse(data)) {
 *      // TypeScript biết data là LoginResponse
 *      console.log(data.user?.email);
 *    }
 *    ```
 *
 * 2. Error handling:
 *    ```typescript
 *    if (isApiError(error)) {
 *      // TypeScript biết error có property .error
 *      notify.error(error.error);
 *    }
 *    ```
 *
 * 3. Assertions trong critical paths:
 *    ```typescript
 *    const loginData = ensureLoginResponse(apiResponse); // Throws if invalid
 *    // Continue with valid loginData
 *    ```
 *
 * === TYPE SAFETY PATTERN ===
 *
 * Thay vì dùng `any`:
 * ❌ const obj = data as any; obj.someProperty
 *
 * Dùng type guards:
 * ✅ if (typeof data === "object" && data !== null) {
 *      const obj = data as Record<string, unknown>;
 *      if ("someProperty" in obj) { ... }
 *    }
 */
