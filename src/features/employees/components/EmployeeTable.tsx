"use client";

import React, { useMemo } from "react";
import { Table, Tag, Tooltip, Space, Button, Popconfirm } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  MailOutlined,
  EditOutlined,
  DeleteOutlined,
  PhoneOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
} from "@ant-design/icons";
import type { EmployeeResponse } from "@/shared/validation/employee.schema";

type Props = {
  data: EmployeeResponse[];
  loading?: boolean;
  disabled?: boolean;
  statusLoadingId?: string | null;
  inviteLoadingId?: string | null;
  deleteLoadingId?: string | null;
  onEdit: (row: EmployeeResponse) => void;
  onDelete: (row: EmployeeResponse) => void;
  onToggleStatus: (row: EmployeeResponse) => void;
  onResendInvite: (row: EmployeeResponse) => void;
};

function renderStatusTag(status?: string | null) {
  const normalized = status?.toUpperCase();
  if (normalized === "PENDING") {
    return <Tag color="default">Chưa hoàn tất</Tag>;
  }
  if (normalized === "WORKING") {
    return <Tag color="green">Đang làm việc</Tag>;
  }
  if (normalized === "RESIGNED") {
    return <Tag color="volcano">Đã nghỉ việc</Tag>;
  }
  return <Tag>-</Tag>;
}

export default function EmployeeTable({
  data,
  loading,
  disabled,
  statusLoadingId,
  inviteLoadingId,
  deleteLoadingId,
  onEdit,
  onDelete,
  onToggleStatus,
  onResendInvite,
}: Props) {
  // Memoize filter values separately to prevent columns regeneration
  const clinicCodes = useMemo(
    () =>
      Array.from(
        new Set(
          data
            .map((item) => item.clinic?.clinicCode)
            .filter((code): code is string => !!code)
        )
      ).sort(),
    [data]
  );

  const departments = useMemo(
    () =>
      Array.from(
        new Set(data.map((item) => item.department).filter(Boolean))
      ).sort(),
    [data]
  );

  const jobTitles = useMemo(
    () =>
      Array.from(
        new Set(data.map((item) => item.jobTitle).filter(Boolean))
      ).sort(),
    [data]
  );

  const columns = useMemo<ColumnsType<EmployeeResponse>>(() => {
    return [
      {
        title: "Tên nhân viên",
        dataIndex: "fullName",
        key: "fullName",
        sorter: (a, b) => (a.fullName || "").localeCompare(b.fullName || ""),
        render: (fullName: string, row) => (
          <div>
            <div style={{ fontWeight: 600 }}>{fullName}</div>
            <div style={{ fontSize: 12, color: "#666" }}>
              {row.employeeCode}
            </div>
          </div>
        ),
      },
      {
        title: "Điện thoại",
        dataIndex: "phone",
        key: "phone",
        width: 180,
        render: (phone: string) => (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>{phone}</span>
            {phone && (
              <Tooltip title="Gọi điện thoại">
                <Button
                  type="text"
                  size="small"
                  icon={<PhoneOutlined />}
                  onClick={() => window.open(`tel:${phone}`, "_self")}
                />
              </Tooltip>
            )}
          </div>
        ),
      },
      {
        title: "Vai trò",
        dataIndex: "role",
        key: "role",
        sorter: (a, b) => (a.role || "").localeCompare(b.role || ""),
      },
      {
        title: "Chi nhánh",
        dataIndex: "clinicCode",
        key: "clinicCode",
        sorter: (a, b) =>
          (a.clinic?.clinicCode || "").localeCompare(
            b.clinic?.clinicCode || ""
          ),
        filterSearch: true,
        filters: clinicCodes.map((code) => ({
          text: code,
          value: code,
        })),
        onFilter: (value, record) => record.clinic?.clinicCode === value,
        render: (_: unknown, row) => (
          <Tag color={row.clinic?.colorCode || "default"}>
            {row.clinic?.clinicCode}
          </Tag>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "employeeStatus",
        key: "employeeStatus",
        sorter: (a, b) =>
          (a.employeeStatus || "").localeCompare(b.employeeStatus || ""),
        render: (value: string | null | undefined) => renderStatusTag(value),
      },
      {
        title: "Phòng ban",
        dataIndex: "department",
        key: "department",
        sorter: (a, b) => a.department.localeCompare(b.department),
        filterSearch: true,
        filters: departments.map((dept) => ({
          text: dept,
          value: dept,
        })),
        onFilter: (value, record) => record.department === value,
        // width: 180,
      },
      {
        title: "Chức danh",
        dataIndex: "jobTitle",
        key: "jobTitle",
        sorter: (a, b) => a.jobTitle.localeCompare(b.jobTitle),
        filterSearch: true,
        filters: jobTitles.map((title) => ({
          text: title,
          value: title,
        })),
        onFilter: (value, record) => record.jobTitle === value,
        // width: 180,
      },
      {
        title: "Thao tác",
        key: "actions",
        fixed: "right",
        width: 160,
        render: (_: unknown, row) => {
          const normalizedStatus = row.employeeStatus?.toUpperCase();
          const canToggle =
            normalizedStatus === "WORKING" || normalizedStatus === "RESIGNED";
          const toggleIcon =
            normalizedStatus === "RESIGNED" ? (
              <PlayCircleOutlined />
            ) : (
              <PauseCircleOutlined />
            );
          const toggleTooltip = canToggle
            ? normalizedStatus === "RESIGNED"
              ? "Kích hoạt lại nhân viên"
              : "Cho nghỉ việc"
            : "Chỉ đổi được khi trạng thái là Đang làm việc hoặc Đã nghỉ việc.";

          return (
            <Space>
              <Tooltip title="Sửa">
                <Button
                  icon={<EditOutlined />}
                  onClick={() => onEdit(row)}
                  disabled={disabled}
                />
              </Tooltip>

              <Tooltip title="Gửi lại lời mời">
                <Button
                  icon={<MailOutlined />}
                  onClick={() => onResendInvite(row)}
                  disabled={!row.email || disabled}
                  loading={inviteLoadingId === row.id}
                />
              </Tooltip>

              <Popconfirm
                title="Đổi trạng thái làm việc"
                description="Bạn muốn đổi trạng thái làm việc của nhân viên này?"
                onConfirm={() => onToggleStatus(row)}
                okText="Đồng ý"
                cancelText="Hủy"
                disabled={disabled || !canToggle}
              >
                <Tooltip title={toggleTooltip}>
                  <Button
                    icon={toggleIcon}
                    danger={normalizedStatus !== "RESIGNED"}
                    loading={statusLoadingId === row.id}
                    disabled={disabled || !canToggle}
                  />
                </Tooltip>
              </Popconfirm>
              <Popconfirm
                title="Xóa nhân viên"
                description="Bạn chắc chắn muốn xóa? Hành động này không thể hoàn tác."
                onConfirm={() => onDelete(row)}
                okText="Xóa"
                cancelText="Hủy"
                disabled={disabled}
              >
                <Tooltip title="Xóa">
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    loading={deleteLoadingId === row.id}
                    disabled={disabled}
                  />
                </Tooltip>
              </Popconfirm>
            </Space>
          );
        },
      },
    ];
  }, [
    clinicCodes,
    departments,
    jobTitles,
    disabled,
    statusLoadingId,
    inviteLoadingId,
    deleteLoadingId,
    onEdit,
    onDelete,
    onToggleStatus,
    onResendInvite,
  ]);

  return (
    <Table<EmployeeResponse>
      size="small"
      rowKey="id"
      dataSource={data}
      columns={columns}
      loading={loading}
      pagination={false}
      scroll={{ x: 960 }}
    />
  );
}
