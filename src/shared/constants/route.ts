export const DEFAULT_AFTER_LOGIN = "/dashboard";
export const ALLOWED_NEXT_PREFIXES = ["/"]; // restricts redirects to internal paths

export function sanitizeNext(next?: string | null) {
  if (!next) return DEFAULT_AFTER_LOGIN;

  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return DEFAULT_AFTER_LOGIN;
  }

  return ALLOWED_NEXT_PREFIXES.some((prefix) => trimmed.startsWith(prefix))
    ? trimmed
    : DEFAULT_AFTER_LOGIN;
}
