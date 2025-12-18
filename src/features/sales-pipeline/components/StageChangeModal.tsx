"use client";

import { Modal, Form, Input, Tag, Typography, Space } from "antd";
import type { SalesStage } from "@/shared/validation/consulted-service.schema";
import {
  UserAddOutlined,
  MessageOutlined,
  DollarCircleOutlined,
  WalletOutlined,
  MedicineBoxOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

const { TextArea } = Input;
const { Text } = Typography;

// Stage configuration
const STAGE_CONFIG: Record<
  SalesStage,
  { label: string; color: string; icon: React.ReactNode }
> = {
  ARRIVED: { label: "Đến", color: "blue", icon: <UserAddOutlined /> },
  CONSULTING: { label: "Tư vấn", color: "cyan", icon: <MessageOutlined /> },
  QUOTED: { label: "Báo giá", color: "purple", icon: <DollarCircleOutlined /> },
  DEPOSIT: { label: "Đặt cọc", color: "orange", icon: <WalletOutlined /> },
  TREATING: {
    label: "Đang điều trị",
    color: "green",
    icon: <MedicineBoxOutlined />,
  },
  LOST: { label: "Thất bại", color: "red", icon: <CloseCircleOutlined /> },
};

interface StageChangeModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (reason?: string) => void;
  fromStage: SalesStage;
  toStage: SalesStage;
  isLoading?: boolean;
}

export function StageChangeModal({
  open,
  onCancel,
  onSubmit,
  fromStage,
  toStage,
  isLoading = false,
}: StageChangeModalProps) {
  const [form] = Form.useForm();

  const fromConfig = STAGE_CONFIG[fromStage];
  const toConfig = STAGE_CONFIG[toStage];
  const isLostStage = toStage === "LOST";

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values.reason?.trim() || undefined);
      form.resetFields();
    } catch {
      // Validation failed, form will show errors
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Xác nhận chuyển giai đoạn"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={isLoading}
      okText="Xác nhận"
      cancelText="Hủy"
      width={500}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* Stage transition display */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <Tag
            color={fromConfig.color}
            icon={fromConfig.icon}
            style={{ fontSize: 14, padding: "4px 12px" }}
          >
            {fromConfig.label}
          </Tag>
          <Text type="secondary">→</Text>
          <Tag
            color={toConfig.color}
            icon={toConfig.icon}
            style={{ fontSize: 14, padding: "4px 12px" }}
          >
            {toConfig.label}
          </Tag>
        </div>

        {/* Reason input form */}
        <Form form={form} layout="vertical">
          <Form.Item
            label={isLostStage ? "Lý do thất bại" : "Ghi chú (tùy chọn)"}
            name="reason"
            rules={
              isLostStage
                ? [
                    { required: true, message: "Vui lòng nhập lý do thất bại" },
                    { min: 5, message: "Lý do phải có ít nhất 5 ký tự" },
                    {
                      max: 500,
                      message: "Lý do không được vượt quá 500 ký tự",
                    },
                  ]
                : [
                    {
                      max: 500,
                      message: "Ghi chú không được vượt quá 500 ký tự",
                    },
                  ]
            }
            tooltip={
              isLostStage
                ? "Bắt buộc nhập lý do khi chuyển sang trạng thái Thất bại"
                : undefined
            }
          >
            <TextArea
              rows={4}
              placeholder={
                isLostStage
                  ? "Ví dụ: Khách hàng chọn phòng khám khác, giá cao, không hài lòng với dịch vụ..."
                  : "Nhập ghi chú về việc chuyển giai đoạn..."
              }
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>

        {/* Warning for LOST stage */}
        {isLostStage && (
          <div
            style={{
              padding: 12,
              backgroundColor: "#fff1f0",
              border: "1px solid #ffa39e",
              borderRadius: 4,
            }}
          >
            <Text type="danger" style={{ fontSize: 13 }}>
              ⚠️ Lưu ý: Sau khi chuyển sang trạng thái <strong>Thất bại</strong>
              , bạn không thể thay đổi giai đoạn này nữa.
            </Text>
          </div>
        )}
      </Space>
    </Modal>
  );
}
