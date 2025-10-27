// src/features/customers/components/detail-tabs/PaymentsTab.tsx
import { Empty, Typography } from "antd";

/**
 * Payments Tab - Placeholder for Phase 6
 * Will be implemented when Payment module is ready
 */
export default function PaymentsTab() {
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <>
          <Typography.Title level={4}>
            Tính năng đang phát triển
          </Typography.Title>
          <Typography.Text type="secondary">
            Tab &quot;Phiếu thu&quot; sẽ được bổ sung trong phiên bản tiếp theo
          </Typography.Text>
        </>
      }
    />
  );
}
