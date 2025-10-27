// src/features/customers/components/detail-tabs/TreatmentCareTab.tsx
import { Empty, Typography } from "antd";

/**
 * Treatment Care Tab - Placeholder for Phase 5
 * Will be implemented when Treatment Care module is ready
 */
export default function TreatmentCareTab() {
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <>
          <Typography.Title level={4}>
            Tính năng đang phát triển
          </Typography.Title>
          <Typography.Text type="secondary">
            Tab &quot;Chăm sóc sau điều trị&quot; sẽ được bổ sung trong phiên
            bản tiếp theo
          </Typography.Text>
        </>
      }
    />
  );
}
