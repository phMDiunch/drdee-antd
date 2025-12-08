// src/features/customers/components/detail-tabs/LaboOrdersTab.tsx
import { Empty, Typography } from "antd";

/**
 * Labo Orders Tab - Placeholder for future implementation
 * Will be implemented when Labo Orders customer integration is ready
 */
export default function LaboOrdersTab() {
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <>
          <Typography.Title level={4}>
            Tính năng đang phát triển
          </Typography.Title>
          <Typography.Text type="secondary">
            Tab &quot;Đơn hàng labo&quot; sẽ được bổ sung trong phiên bản tiếp
            theo
          </Typography.Text>
        </>
      }
    />
  );
}
