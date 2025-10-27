// src/features/customers/components/detail-tabs/AppointmentsTab.tsx
import { Empty, Typography } from "antd";

/**
 * Appointments Tab - Placeholder for Phase 2
 * Will be implemented when Appointment module is ready
 */
export default function AppointmentsTab() {
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <>
          <Typography.Title level={4}>
            Tính năng đang phát triển
          </Typography.Title>
          <Typography.Text type="secondary">
            Tab &quot;Lịch hẹn&quot; sẽ được bổ sung trong phiên bản tiếp theo
          </Typography.Text>
        </>
      }
    />
  );
}
