// src/hooks/useDebounce.js
import { useState, useEffect } from "react";

/**
 * Hook để trì hoãn một giá trị.
 * @param {any} value - Giá trị cần trì hoãn.
 * @param {number} delay - Thời gian trì hoãn (ms).
 * @returns {any} Giá trị đã được trì hoãn.
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Thiết lập một timeout để cập nhật giá trị sau khoảng `delay`
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function: Hủy timeout nếu value hoặc delay thay đổi trước khi timeout kết thúc
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
