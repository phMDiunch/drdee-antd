// src/features/sales-pipeline/components/ActivityTimeline.tsx
"use client";

import { Timeline, Typography, Empty, Spin } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { CONTACT_TYPE_CONFIG } from "../constants";
import type { SalesActivityResponse } from "@/shared/validation/sales-activity.schema";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Text, Paragraph } = Typography;

interface ActivityTimelineProps {
  activities: SalesActivityResponse[];
  loading?: boolean;
}

export default function ActivityTimeline({
  activities,
  loading,
}: ActivityTimelineProps) {
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <Spin />
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return <Empty description="Chưa có hoạt động tiếp xúc nào" />;
  }

  return (
    <Timeline
      items={activities.map((activity) => {
        const config =
          CONTACT_TYPE_CONFIG[
            activity.contactType as keyof typeof CONTACT_TYPE_CONFIG
          ];
        const contactDate = dayjs(activity.contactDate);

        return {
          color: config.color,
          children: (
            <div>
              <Text strong>
                {config.icon} {contactDate.format("DD/MM/YYYY HH:mm")} -{" "}
                {activity.employee.fullName} ({config.label})
              </Text>
              <Paragraph style={{ marginTop: 4, marginBottom: 4 }}>
                {activity.content}
              </Paragraph>
              {activity.nextContactDate && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Hẹn liên hệ tiếp:{" "}
                  {dayjs(activity.nextContactDate).format("DD/MM/YYYY")}
                </Text>
              )}
            </div>
          ),
        };
      })}
    />
  );
}
