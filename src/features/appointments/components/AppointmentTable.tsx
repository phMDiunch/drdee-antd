// src/features/appointments/components/AppointmentTable.tsx
"use client";

import React from "react";
import {
  Button,
  Divider,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  UserDeleteOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import Link from "next/link";
import { APPOINTMENT_STATUS_COLORS } from "../constants";
import type { AppointmentResponse } from "@/shared/validation/appointment.schema";

const { Text } = Typography;

type Props = {
  data: AppointmentResponse[];
  loading?: boolean;
  onCheckIn: (id: string) => void;
  onCheckOut: (id: string) => void;
  onConfirm: (id: string) => void;
  onMarkNoShow: (id: string) => void;
  onEdit: (appointment: AppointmentResponse) => void;
  onDelete: (id: string) => void;
  actionLoading?: boolean;
};

export default function AppointmentTable({
  data,
  loading,
  onCheckIn,
  onCheckOut,
  onConfirm,
  onMarkNoShow,
  onEdit,
  onDelete,
  actionLoading,
}: Props) {
  const calculateAge = (dob: string | null) => {
    if (!dob) return "—";
    const age = dayjs().diff(dayjs(dob), "year");
    return `${age} tuổi`;
  };

  const isToday = (dateStr: string) => {
    return dayjs(dateStr).format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD");
  };

  // Get unique dentists for filter
  const uniqueDentists = React.useMemo(() => {
    const dentistSet = new Set<string>();
    data.forEach((apt) => {
      dentistSet.add(apt.primaryDentist.fullName);
      if (apt.secondaryDentist) {
        dentistSet.add(apt.secondaryDentist.fullName);
      }
    });
    return Array.from(dentistSet).sort();
  }, [data]);

  // Get unique statuses for filter
  const uniqueStatuses = React.useMemo(() => {
    const statusSet = new Set<string>();
    data.forEach((apt) => {
      statusSet.add(apt.status);
    });
    return Array.from(statusSet);
  }, [data]);

  const columns = React.useMemo<ColumnsType<AppointmentResponse>>(
    () => [
      {
        title: "Khách hàng",
        dataIndex: "customer",
        key: "customer",
        width: 180,
        render: (customer) => (
          <div>
            <Link
              href={`/customers/${customer.id}`}
              style={{ fontWeight: 600 }}
            >
              {customer.fullName}
            </Link>
            <br />
            <Space size={4} style={{ marginTop: 4 }}>
              {customer.customerCode && (
                <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>
                  {customer.customerCode}
                </Tag>
              )}
              {customer.phone && (
                <Tooltip title={customer.phone}>
                  <PhoneOutlined style={{ color: "#1890ff", fontSize: 14 }} />
                </Tooltip>
              )}
            </Space>
          </div>
        ),
      },
      {
        title: "Tuổi",
        dataIndex: ["customer", "dob"],
        key: "age",
        width: 70,
        render: (dob) => <Text>{calculateAge(dob)}</Text>,
      },
      {
        title: "Thời gian hẹn",
        dataIndex: "appointmentDateTime",
        key: "time",
        width: 100,
        sorter: (a, b) =>
          dayjs(a.appointmentDateTime).valueOf() -
          dayjs(b.appointmentDateTime).valueOf(),
        defaultSortOrder: "ascend",
        render: (datetime) => <Text>{dayjs(datetime).format("HH:mm")}</Text>,
      },
      {
        title: "Bác sĩ chính",
        dataIndex: ["primaryDentist", "fullName"],
        key: "primaryDentist",
        width: 140,
        sorter: (a, b) =>
          a.primaryDentist.fullName.localeCompare(b.primaryDentist.fullName),
        filters: uniqueDentists.map((name) => ({ text: name, value: name })),
        onFilter: (value, record) => record.primaryDentist.fullName === value,
      },
      {
        title: "Bác sĩ phụ",
        dataIndex: ["secondaryDentist", "fullName"],
        key: "secondaryDentist",
        width: 140,
        sorter: (a, b) => {
          const nameA = a.secondaryDentist?.fullName || "";
          const nameB = b.secondaryDentist?.fullName || "";
          return nameA.localeCompare(nameB);
        },
        filters: [
          { text: "Không có", value: "NONE" },
          ...uniqueDentists.map((name) => ({ text: name, value: name })),
        ],
        onFilter: (value, record) => {
          if (value === "NONE") return !record.secondaryDentist;
          return record.secondaryDentist?.fullName === value;
        },
        render: (name) => name || "—",
      },
      {
        title: "Ghi chú",
        dataIndex: "notes",
        key: "notes",
        width: 160,
        ellipsis: true,
        render: (notes) => notes || "—",
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 120,
        filters: uniqueStatuses.map((status) => ({
          text: status,
          value: status,
        })),
        onFilter: (value, record) => record.status === value,
        render: (status) => (
          <Tag color={APPOINTMENT_STATUS_COLORS[status]}>{status}</Tag>
        ),
      },
      {
        title: "Check-in",
        dataIndex: "checkInTime",
        key: "checkIn",
        width: 120,
        sorter: (a, b) => {
          const timeA = a.checkInTime
            ? dayjs(a.checkInTime).valueOf()
            : Infinity;
          const timeB = b.checkInTime
            ? dayjs(b.checkInTime).valueOf()
            : Infinity;
          return timeA - timeB;
        },
        render: (checkInTime, record) => {
          if (checkInTime) {
            return <Text>{dayjs(checkInTime).format("HH:mm")}</Text>;
          }

          if (isToday(record.appointmentDateTime) && !checkInTime) {
            return (
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => onCheckIn(record.id)}
                loading={actionLoading}
              >
                Check-in
              </Button>
            );
          }

          return <Text type="secondary">—</Text>;
        },
      },
      {
        title: "Check-out",
        dataIndex: "checkOutTime",
        key: "checkOut",
        width: 120,
        sorter: (a, b) => {
          const timeA = a.checkOutTime
            ? dayjs(a.checkOutTime).valueOf()
            : Infinity;
          const timeB = b.checkOutTime
            ? dayjs(b.checkOutTime).valueOf()
            : Infinity;
          return timeA - timeB;
        },
        render: (checkOutTime, record) => {
          if (checkOutTime) {
            return <Text>{dayjs(checkOutTime).format("HH:mm")}</Text>;
          }

          if (
            isToday(record.appointmentDateTime) &&
            record.checkInTime &&
            !checkOutTime
          ) {
            return (
              <Button
                size="small"
                icon={<CheckOutlined />}
                onClick={() => onCheckOut(record.id)}
                loading={actionLoading}
              >
                Check-out
              </Button>
            );
          }

          return <Text type="secondary">—</Text>;
        },
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 280,
        fixed: "right",
        render: (_, record) => (
          <Space split={<Divider type="vertical" />}>
            {/* Group 1: Quick Actions with text + icon */}
            <Space size="small">
              {/* Confirm button - conditional */}
              {record.status === "Chờ xác nhận" &&
                dayjs(record.appointmentDateTime).isAfter(dayjs(), "day") && (
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    onClick={() => onConfirm(record.id)}
                    loading={actionLoading}
                  >
                    Xác nhận
                  </Button>
                )}

              {/* Mark no-show button - conditional */}
              {!record.checkInTime &&
                record.status !== "Không đến" &&
                dayjs(record.appointmentDateTime) <= dayjs() && (
                  <Button
                    type="default"
                    size="small"
                    icon={<UserDeleteOutlined />}
                    onClick={() => onMarkNoShow(record.id)}
                    loading={actionLoading}
                  >
                    Không đến
                  </Button>
                )}
            </Space>

            {/* Group 2: Edit & Delete - icon only */}
            <Space size="small">
              <Tooltip title="Sửa">
                <Button
                  icon={<EditOutlined />}
                  onClick={() => onEdit(record)}
                />
              </Tooltip>

              <Popconfirm
                title="Xóa lịch hẹn"
                description={`Bạn có chắc muốn xóa lịch hẹn của ${record.customer.fullName}?`}
                onConfirm={() => onDelete(record.id)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Xóa">
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    loading={actionLoading}
                  />
                </Tooltip>
              </Popconfirm>
            </Space>
          </Space>
        ),
      },
    ],
    [
      uniqueDentists,
      uniqueStatuses,
      onCheckIn,
      onCheckOut,
      onConfirm,
      onMarkNoShow,
      onEdit,
      onDelete,
      actionLoading,
    ]
  );

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={false}
      locale={{
        emptyText: "Không có lịch hẹn nào trong ngày",
      }}
    />
  );
}
