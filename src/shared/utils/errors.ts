// src/shared/utils/errors.ts
export type ExtractedError = {
  code?: string;
  message: string;
};

// Best-effort extraction of user-facing error message from unknown
export function extractErrorMessage(err: unknown, fallback?: string): string {
  try {
    if (!err) return fallback || "Đã có lỗi xảy ra.";

    if (typeof err === "string") return err;

    if (err instanceof Error) return err.message || fallback || "Đã có lỗi xảy ra.";

    // ZodError-like - sử dụng type guard thay vì any
    if (typeof err === "object" && err !== null) {
      const errorObj = err as Record<string, unknown>;

      // ZodError check
      if (errorObj.name === "ZodError" && Array.isArray(errorObj.issues) && errorObj.issues.length > 0) {
        const firstIssue = errorObj.issues[0] as Record<string, unknown>;
        if (typeof firstIssue.message === "string") {
          return firstIssue.message || fallback || "Dữ liệu không hợp lệ.";
        }
      }

      // API error shape
      if (typeof errorObj.error === "string") return errorObj.error;
      if (typeof errorObj.message === "string") return errorObj.message;
    }

    return fallback || "Đã có lỗi xảy ra.";
  } catch {
    return fallback || "Đã có lỗi xảy ra.";
  }
}
