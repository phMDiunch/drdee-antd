// src/shared/hooks/useNotify.ts
"use client";

import { App } from "antd";
import { useMemo, useRef } from "react";
import { extractErrorMessage } from "@/shared/utils/errors";

type NotifyType = "success" | "error" | "warning" | "info";

const DEFAULT_DURATION = 2.5; // seconds
const DEDUPE_TTL = 2500; // ms, aligned with DEFAULT_DURATION

export function useNotify() {
  const { message } = App.useApp();
  const recentRef = useRef<Map<string, number>>(new Map());

  return useMemo(() => {
    const show = (type: NotifyType, content: string, duration = DEFAULT_DURATION) => {
      const key = `${type}:${content}`;
      const now = Date.now();
      const last = recentRef.current.get(key) || 0;
      if (now - last < DEDUPE_TTL) return; // dedupe
      recentRef.current.set(key, now);
      if (type === "success") message.success(content, duration);
      else if (type === "warning") message.warning(content, duration);
      else if (type === "info") message.info(content, duration);
      else message.error(content, duration);
    };

    return {
      success: (content: string, duration?: number) => show("success", content, duration),
      warning: (content: string, duration?: number) => show("warning", content, duration),
      info: (content: string, duration?: number) => show("info", content, duration),
      error: (errOrContent: unknown, opts?: { fallback?: string; duration?: number }) => {
        const content = extractErrorMessage(errOrContent, opts?.fallback);
        show("error", content, opts?.duration ?? DEFAULT_DURATION);
      },
    };
  }, [message]);
}
