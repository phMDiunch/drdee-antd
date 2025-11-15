import { Alert } from "antd";
import { ExperimentOutlined } from "@ant-design/icons";
import { ReactNode } from "react";

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Alert
        message="Demo Mode"
        description="Trang này sử dụng dữ liệu giả lập để demo giao diện. Chức năng chưa kết nối với backend thật."
        type="warning"
        showIcon
        icon={<ExperimentOutlined />}
        style={{ marginBottom: 16 }}
        banner
      />
      {children}
    </>
  );
}
