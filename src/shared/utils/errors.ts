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

    // ZodError-like
    const anyErr: any = err as any;
    if (anyErr?.name === "ZodError" && Array.isArray(anyErr.issues) && anyErr.issues.length > 0) {
      return anyErr.issues[0]?.message || fallback || "Dữ liệu không hợp lệ.";
    }

    // API error shape
    if (typeof anyErr === "object") {
      if (typeof anyErr.error === "string") return anyErr.error;
      if (typeof anyErr.message === "string") return anyErr.message;
    }

    return fallback || "Đã có lỗi xảy ra.";
  } catch (_) {
    return fallback || "Đã có lỗi xảy ra.";
  }
}

