// src/features/customers/components/detail-tabs/TreatmentLogsTab.tsx
import { Empty, Typography } from "antd";

/**
 * Treatment Logs Tab - Placeholder for Phase 4
 * Will be implemented when Treatment module is ready
 */
export default function TreatmentLogsTab() {
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <>
          <Typography.Title level={4}>
            Tính năng đang phát triển
          </Typography.Title>
          <Typography.Text type="secondary">
            Tab &quot;Lịch sử điều trị&quot; sẽ được bổ sung trong phiên bản
            tiếp theo
          </Typography.Text>
        </>
      }
    />
  );
}
