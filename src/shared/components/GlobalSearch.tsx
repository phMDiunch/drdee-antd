"use client";
import React, { useState, useMemo } from "react";
import { AutoComplete, Spin, Typography, Tag } from "antd";
import { useRouter } from "next/navigation";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useCustomerSearch } from "@/features/customers";
import type { SearchItem } from "@/shared/validation/customer.schema";

const { Text } = Typography;

type Props = {
  placeholder?: string;
  style?: React.CSSProperties;
  autoFocus?: boolean;
};

/**
 * Global customer search with AutoComplete dropdown
 * Searches by customerCode, fullName, phone with relevance scoring
 * Shows top 20 results, navigates to customer detail on select
 */
export default function GlobalSearch({
  placeholder = "Tìm khách hàng...",
  style,
  autoFocus = false,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);

  const { data: customers, isFetching } = useCustomerSearch({
    q: debouncedQuery,
    limit: 20,
    enabled: debouncedQuery.length >= 2,
  });

  // Format options for AutoComplete
  const options = useMemo(() => {
    if (!customers || customers.length === 0) return [];

    return customers.map((customer: SearchItem) => ({
      value: customer.id,
      label: (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Text strong>{customer.fullName}</Text>
            {customer.type === "LEAD" && (
              <Tag color="blue" style={{ marginLeft: 8 }}>
                LEAD
              </Tag>
            )}
            {customer.customerCode && (
              <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                {customer.customerCode}
              </Text>
            )}
          </div>
          {customer.phone && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {customer.phone}
            </Text>
          )}
        </div>
      ),
    }));
  }, [customers]);

  const handleSelect = (value: string) => {
    router.push(`/customers/${value}`);
    setQuery(""); // Clear search after selection
  };

  const notFoundContent = useMemo(() => {
    if (isFetching) return <Spin size="small" />;
    if (debouncedQuery.length < 2)
      return <Text type="secondary">Nhập ít nhất 2 ký tự để tìm kiếm</Text>;
    if (query.length < 2) return <Text type="secondary">Đang nhập...</Text>;
    return <Text type="secondary">Không tìm thấy khách hàng</Text>;
  }, [isFetching, debouncedQuery.length, query.length]);

  return (
    <AutoComplete
      value={query}
      options={options}
      onSearch={setQuery}
      onSelect={handleSelect}
      placeholder={placeholder}
      notFoundContent={notFoundContent}
      autoFocus={autoFocus}
      allowClear
      popupMatchSelectWidth={false}
      style={{ ...style, minWidth: 200 }}
    />
  );
}
