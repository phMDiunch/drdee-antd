// src/features/profile/views/ProfileView.tsx
"use client";

import React from "react";
import { Card, Tabs, Spin, Alert, Space, Typography } from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  IdcardOutlined,
  BankOutlined,
  SafetyOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { useProfile } from "../hooks/useProfile";
import BasicInfoForm from "../components/BasicInfoForm";
import ContactInfoForm from "../components/ContactInfoForm";
import LegalInfoForm from "../components/LegalInfoForm";
import BankingInfoForm from "../components/BankingInfoForm";
import WorkInfoDisplay from "../components/WorkInfoDisplay";
import ChangePasswordForm from "../components/ChangePasswordForm";

const { Title } = Typography;

export default function ProfileView() {
  const { data: profile, isLoading, error } = useProfile();

  return (
    <div>
      <Title level={4} style={{ marginBottom: 0 }}>
        Hồ sơ cá nhân
      </Title>
      <div style={{ marginBottom: 16 }}>
        <Typography.Text type="secondary">
          Quản lý thông tin cá nhân và cài đặt bảo mật tài khoản.
        </Typography.Text>
      </div>

      {error && (
        <Alert
          message="Lỗi tải dữ liệu"
          description="Không thể tải thông tin hồ sơ. Vui lòng thử lại sau."
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : profile ? (
          <Tabs
            items={[
              {
                key: "basic",
                label: (
                  <Space>
                    <UserOutlined />
                    <span>Cơ bản</span>
                  </Space>
                ),
                children: <BasicInfoForm profile={profile} />,
              },
              {
                key: "contact",
                label: (
                  <Space>
                    <PhoneOutlined />
                    <span>Liên hệ</span>
                  </Space>
                ),
                children: <ContactInfoForm profile={profile} />,
              },
              {
                key: "legal",
                label: (
                  <Space>
                    <IdcardOutlined />
                    <span>Pháp lý</span>
                  </Space>
                ),
                children: <LegalInfoForm profile={profile} />,
              },
              {
                key: "banking",
                label: (
                  <Space>
                    <BankOutlined />
                    <span>Ngân hàng</span>
                  </Space>
                ),
                children: <BankingInfoForm profile={profile} />,
              },
              {
                key: "work",
                label: (
                  <Space>
                    <SafetyOutlined />
                    <span>Công việc</span>
                  </Space>
                ),
                children: <WorkInfoDisplay profile={profile} />,
              },
              {
                key: "security",
                label: (
                  <Space>
                    <LockOutlined />
                    <span>Bảo mật</span>
                  </Space>
                ),
                children: <ChangePasswordForm />,
              },
            ]}
            defaultActiveKey="basic"
          />
        ) : null}
      </Card>
    </div>
  );
}
