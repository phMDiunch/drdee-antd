// src/features/customers/components/detail-tabs/ConsultedServicesTab.tsx
import { Empty, Typography } from "antd";

/**
 * Consulted Services Tab - Placeholder for Phase 3
 * Will be implemented when Consulted Service module is ready
 */
export default function ConsultedServicesTab() {
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <>
          <Typography.Title level={4}>
            Tính năng đang phát triển
          </Typography.Title>
          <Typography.Text type="secondary">
            Tab &quot;Dịch vụ đã tư vấn&quot; sẽ được bổ sung trong phiên bản
            tiếp theo
          </Typography.Text>
        </>
      }
    />
  );
}
