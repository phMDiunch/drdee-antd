// src/features/profile/components/WorkInfoDisplay.tsx
"use client";

import React from "react";
import { Descriptions, Tag, Space } from "antd";
import type { ProfileResponse } from "@/shared/validation/profile.schema";

type Props = {
  profile: ProfileResponse;
};

export default function WorkInfoDisplay({ profile }: Props) {
  const getStatusTag = () => {
    if (profile.employeeStatus === "WORKING") {
      return <Tag color="green">Đang làm việc</Tag>;
    }
    if (profile.employeeStatus === "RESIGNED") {
      return <Tag color="red">Đã nghỉ việc</Tag>;
    }
    if (profile.employeeStatus === "PENDING") {
      return <Tag color="orange">Chờ hoàn thiện hồ sơ</Tag>;
    }
    return <Tag>Không xác định</Tag>;
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Descriptions bordered column={2} size="middle">
        <Descriptions.Item label="Mã nhân viên">
          {profile.employeeCode || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          {getStatusTag()}
        </Descriptions.Item>

        <Descriptions.Item label="Vai trò" span={2}>
          {profile.role}
        </Descriptions.Item>

        <Descriptions.Item label="Phòng khám" span={2}>
          {profile.clinic ? `${profile.clinic.shortName}` : "—"}
        </Descriptions.Item>

        <Descriptions.Item label="Phòng ban">
          {profile.department || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Bộ phận">
          {profile.team || "—"}
        </Descriptions.Item>

        <Descriptions.Item label="Chức danh">
          {profile.jobTitle || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Chức vụ">
          {profile.positionTitle || "—"}
        </Descriptions.Item>
      </Descriptions>
    </Space>
  );
}
