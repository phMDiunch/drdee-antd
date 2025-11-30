// src/features/appointments/components/AppointmentTable.tsx
"use client";

import React, { useMemo } from "react";
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
import { useCurrentUser } from "@/shared/providers";
import { appointmentPermissions } from "@/shared/permissions/appointment.permissions";

const { Text } = Typography;

type Props = {
  data: AppointmentResponse[];
  loading?: boolean;
  isCustomerDetailView?: boolean; // Customer Detail context: hide customer column + show full datetime
  onCheckIn: (id: string) => void;
  onCheckOut: (id: string) => void;
  onConfirm: (id: string) => void;
  onEdit: (appointment: AppointmentResponse) => void;
  onDelete: (id: string) => void;
  actionLoading?: boolean;
};

export default function AppointmentTable({
  data,
  loading,
  isCustomerDetailView = false,
  onCheckIn,
  onCheckOut,
  onConfirm,
  onEdit,
  onDelete,
  actionLoading,
}: Props) {
  const { user: currentUser } = useCurrentUser();

  const calculateAge = (dob: string | null) => {
    if (!dob) return "—";
    const age = dayjs().diff(dayjs(dob), "year");
    return `${age} tuổi`;
  };

  const isToday = (dateStr: string) => {
    return dayjs(dateStr).format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD");
  };

  const columns = useMemo<ColumnsType<AppointmentResponse>>(() => {
    // Calculate unique dentists for filters
    const dentistSet = new Set<string>();
    data.forEach((apt) => {
      dentistSet.add(apt.primaryDentist.fullName);
      if (apt.secondaryDentist) {
        dentistSet.add(apt.secondaryDentist.fullName);
      }
    });
    const uniqueDentists = Array.from(dentistSet).sort();

    // Calculate unique statuses for filters
    const statusSet = new Set<string>();
    data.forEach((apt) => {
      statusSet.add(apt.status);
    });
    const uniqueStatuses = Array.from(statusSet);

    return [
      {
        title: "Khách hàng",
        dataIndex: "customer",
        key: "customer",
        width: 170,
        render: (customer) => (
          <div>
            <Space size={4}>
              <Link
                href={`/customers/${customer.id}`}
                style={{ fontWeight: 600 }}
              >
                {customer.fullName}
              </Link>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ({calculateAge(customer.dob)})
              </Text>
            </Space>
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
        title: "Chi nhánh",
        dataIndex: "clinic",
        key: "clinic",
        width: 80,
        render: (clinic) => (
          <Tag color={clinic.colorCode} style={{ fontSize: 11 }}>
            {clinic.clinicCode}
          </Tag>
        ),
      },
      {
        title: "Thời gian hẹn",
        dataIndex: "appointmentDateTime",
        key: "time",
        width: isCustomerDetailView ? 135 : 90,
        sorter: (a, b) =>
          dayjs(a.appointmentDateTime).valueOf() -
          dayjs(b.appointmentDateTime).valueOf(),
        defaultSortOrder: "ascend",
        render: (datetime) => (
          <Text>
            {dayjs(datetime).format(
              isCustomerDetailView ? "DD/MM/YYYY HH:mm" : "HH:mm"
            )}
          </Text>
        ),
      },
      {
        title: "Bác sĩ chính",
        dataIndex: "primaryDentist",
        key: "primaryDentist",
        width: 120,
        sorter: (a, b) =>
          a.primaryDentist.fullName.localeCompare(b.primaryDentist.fullName),
        filters: uniqueDentists.map((name) => ({ text: name, value: name })),
        onFilter: (value, record) => record.primaryDentist.fullName === value,
        render: (dentist) => (
          <Tag color={dentist.favoriteColor}>{dentist.fullName}</Tag>
        ),
      },
      {
        title: "Bác sĩ phụ",
        dataIndex: "secondaryDentist",
        key: "secondaryDentist",
        width: 120,
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
        render: (dentist) => {
          if (!dentist) return "—";
          return (
            <Tag color={dentist.favoriteColor || "default"}>
              {dentist.fullName}
            </Tag>
          );
        },
      },
      {
        title: "Ghi chú",
        dataIndex: "notes",
        key: "notes",
        width: 140,
        ellipsis: true,
        render: (notes) => notes || "—",
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 110,
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
        width: 110,
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
            const permission = appointmentPermissions.canCheckIn(
              currentUser,
              record
            );
            return (
              <Tooltip
                title={!permission.allowed ? permission.reason : undefined}
              >
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => onCheckIn(record.id)}
                  loading={actionLoading}
                  disabled={!permission.allowed}
                >
                  Check-in
                </Button>
              </Tooltip>
            );
          }

          return <Text type="secondary">—</Text>;
        },
      },
      {
        title: "Check-out",
        dataIndex: "checkOutTime",
        key: "checkOut",
        width: 110,
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
            const permission = appointmentPermissions.canCheckOut(
              currentUser,
              record
            );
            return (
              <Tooltip
                title={!permission.allowed ? permission.reason : undefined}
              >
                <Button
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => onCheckOut(record.id)}
                  loading={actionLoading}
                  disabled={!permission.allowed}
                >
                  Check-out
                </Button>
              </Tooltip>
            );
          }

          return <Text type="secondary">—</Text>;
        },
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 160,
        // fixed: "right",
        render: (_, record) => {
          // Calculate permissions once per render
          const confirmPermission =
            record.status === "Chờ xác nhận" &&
            dayjs(record.appointmentDateTime).isAfter(dayjs(), "day")
              ? appointmentPermissions.canConfirm(currentUser, record)
              : null;

          const editPermission = appointmentPermissions.canEdit(
            currentUser,
            record
          );

          const deletePermission = appointmentPermissions.canDelete(
            currentUser,
            record
          );

          return (
            <Space split={<Divider type="vertical" />}>
              {/* Group 1: Quick Actions with text + icon */}
              <Space size="small">
                {/* Confirm button - conditional */}
                {confirmPermission && (
                  <Tooltip
                    title={
                      !confirmPermission.allowed
                        ? confirmPermission.reason
                        : undefined
                    }
                  >
                    <Button
                      type="primary"
                      size="small"
                      icon={<CheckCircleOutlined />}
                      onClick={() => onConfirm(record.id)}
                      loading={actionLoading}
                      disabled={!confirmPermission.allowed}
                    >
                      Xác nhận
                    </Button>
                  </Tooltip>
                )}
              </Space>

              {/* Group 2: Edit & Delete - icon only */}
              <Space size="small">
                <Tooltip
                  title={editPermission.allowed ? "Sửa" : editPermission.reason}
                >
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => onEdit(record)}
                    disabled={!editPermission.allowed}
                  />
                </Tooltip>

                <Popconfirm
                  title="Xóa lịch hẹn"
                  description={`Bạn có chắc muốn xóa lịch hẹn của ${record.customer.fullName}?`}
                  onConfirm={() => onDelete(record.id)}
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                  disabled={!deletePermission.allowed}
                >
                  <Tooltip
                    title={
                      deletePermission.allowed ? "Xóa" : deletePermission.reason
                    }
                  >
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      loading={actionLoading}
                      disabled={!deletePermission.allowed}
                    />
                  </Tooltip>
                </Popconfirm>
              </Space>
            </Space>
          );
        },
      },
    ];
  }, [
    data,
    isCustomerDetailView,
    currentUser,
    onCheckIn,
    onCheckOut,
    onConfirm,
    onEdit,
    onDelete,
    actionLoading,
  ]);

  // Filter columns based on context
  const visibleColumns = React.useMemo(() => {
    if (isCustomerDetailView) {
      // Customer Detail view: Hide "Khách hàng", Show "Chi nhánh"
      return columns.filter((col) => col.key !== "customer");
    } else {
      // Daily/List view: Show "Khách hàng", Hide "Chi nhánh"
      return columns.filter((col) => col.key !== "clinic");
    }
  }, [columns, isCustomerDetailView]);

  return (
    <Table
      columns={visibleColumns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={false}
      scroll={{ x: 1250 }}
      locale={{
        emptyText: "Không có lịch hẹn nào",
      }}
    />
  );
}
