// src/features/dental-services/components/DentalServiceTable.tsx
"use client";

import React, { useMemo } from "react";
import { Table, Tag, Button, Popconfirm, Space, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  InboxOutlined,
  DeleteOutlined,
  EditOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import type { DentalServiceResponse } from "@/shared/validation/dental-service.schema";

type Props = {
  data: DentalServiceResponse[];
  loading?: boolean;
  onEdit: (row: DentalServiceResponse) => void;
  onArchive: (row: DentalServiceResponse) => void;
  onUnarchive: (row: DentalServiceResponse) => void;
  onDelete: (row: DentalServiceResponse) => void;
};

// Types cho nested structure
type DentalServiceNode = DentalServiceResponse & {
  type: "service";
  key: string;
};

type ServiceGroupNode = {
  type: "serviceGroup";
  key: string;
  serviceGroup: string;
  children: DentalServiceNode[];
};

type DepartmentNode = {
  type: "department";
  key: string;
  department: string;
  children: ServiceGroupNode[];
};

type TableNode = DepartmentNode | ServiceGroupNode | DentalServiceNode;

export default function DentalServiceTable({
  data,
  loading,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
}: Props) {
  // Transform flat data to nested structure
  const nestedData = useMemo(() => {
    const departmentMap = new Map<
      string,
      Map<string, DentalServiceResponse[]>
    >();

    // Group by department -> serviceGroup
    data.forEach((service) => {
      const dept = service.department || "Không có bộ môn";
      const group = service.serviceGroup || "Không có nhóm";

      if (!departmentMap.has(dept)) {
        departmentMap.set(dept, new Map());
      }

      const groupMap = departmentMap.get(dept)!;
      if (!groupMap.has(group)) {
        groupMap.set(group, []);
      }

      groupMap.get(group)!.push(service);
    });

    // Convert to array structure with sorting
    const result: DepartmentNode[] = [];
    let deptIndex = 0;

    // Sort departments alphabetically
    const sortedDepts = Array.from(departmentMap.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );

    sortedDepts.forEach(([deptName, groupMap]) => {
      const serviceGroups: ServiceGroupNode[] = [];
      let groupIndex = 0;

      // Sort service groups alphabetically
      const sortedGroups = Array.from(groupMap.entries()).sort(([a], [b]) =>
        a.localeCompare(b)
      );

      sortedGroups.forEach(([groupName, services]) => {
        // Sort services by name alphabetically
        const sortedServices = [...services].sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        serviceGroups.push({
          type: "serviceGroup",
          key: `dept-${deptIndex}-group-${groupIndex}`,
          serviceGroup: groupName,
          children: sortedServices.map((service, serviceIndex) => ({
            ...service,
            type: "service",
            key: `dept-${deptIndex}-group-${groupIndex}-service-${serviceIndex}`,
          })),
        });
        groupIndex++;
      });

      result.push({
        type: "department",
        key: `dept-${deptIndex}`,
        department: deptName,
        children: serviceGroups,
      });
      deptIndex++;
    });

    return result;
  }, [data]);

  const columns = useMemo<ColumnsType<TableNode>>(
    () => [
      {
        title: "Bộ môn / Nhóm dịch vụ / Tên dịch vụ",
        dataIndex: "name",
        key: "name",
        render: (_, record) => {
          if (record.type === "department") {
            return (
              <strong style={{ fontSize: 16, color: "#1890ff" }}>
                {record.department}
              </strong>
            );
          }
          if (record.type === "serviceGroup") {
            return (
              <strong
                style={{ fontSize: 14, color: "#52c41a", marginLeft: 24 }}
              >
                {record.serviceGroup}
              </strong>
            );
          }
          // service level
          const service = record as DentalServiceNode;
          return <span style={{ marginLeft: 48 }}>{service.name}</span>;
        },
      },
      {
        title: "Đơn vị",
        dataIndex: "unit",
        key: "unit",
        width: 100,
        render: (_, record) => {
          if (record.type === "service") {
            return (record as DentalServiceNode).unit;
          }
          return null;
        },
      },
      {
        title: "Giá niêm yết",
        dataIndex: "price",
        key: "price",
        width: 150,
        render: (_, record) => {
          if (record.type === "service") {
            const service = record as DentalServiceNode;
            return (
              <Tag color="blue">{service.price.toLocaleString("vi-VN")} ₫</Tag>
            );
          }
          return null;
        },
      },
      {
        title: "Follow-up",
        dataIndex: "requiresFollowUp",
        key: "requiresFollowUp",
        width: 110,
        render: (_, record) => {
          if (record.type === "service") {
            const service = record as DentalServiceNode;
            return service.requiresFollowUp ? (
              <Tag color="orange">Có</Tag>
            ) : (
              <Tag color="default">Không</Tag>
            );
          }
          return null;
        },
      },
      {
        title: "TK thu",
        dataIndex: "paymentAccountType",
        key: "paymentAccountType",
        width: 110,
        render: (_, record) => {
          if (record.type === "service") {
            const service = record as DentalServiceNode;
            return service.paymentAccountType === "COMPANY" ? (
              <Tag color="blue">Công ty</Tag>
            ) : (
              <Tag color="purple">Cá nhân</Tag>
            );
          }
          return null;
        },
      },
      {
        title: "Trạng thái",
        dataIndex: "archivedAt",
        key: "archivedAt",
        width: 110,
        render: (_, record) => {
          if (record.type === "service") {
            const service = record as DentalServiceNode;
            return service.archivedAt ? (
              <Tag color="default">Archived</Tag>
            ) : (
              <Tag color="green">Active</Tag>
            );
          }
          return null;
        },
      },
      {
        title: "Tags",
        dataIndex: "tags",
        key: "tags",
        width: 200,
        render: (_, record) => {
          if (record.type === "service") {
            const service = record as DentalServiceNode;
            return (service.tags || []).map((t) => <Tag key={t}>{t}</Tag>);
          }
          return null;
        },
      },
      {
        title: "Thao tác",
        key: "actions",
        fixed: "right",
        width: 150,
        render: (_, record) => {
          // Only show actions for service level
          if (record.type !== "service") return null;

          const service = record as DentalServiceNode;
          const isArchived = !!service.archivedAt;

          return (
            <Space>
              <Tooltip title="Sửa">
                <Button
                  icon={<EditOutlined />}
                  onClick={() => onEdit(service)}
                />
              </Tooltip>

              {!isArchived ? (
                <Tooltip title="Lưu trữ">
                  <Button
                    icon={<InboxOutlined />}
                    onClick={() => onArchive(service)}
                  />
                </Tooltip>
              ) : (
                <Tooltip title="Khôi phục">
                  <Button
                    icon={<RollbackOutlined />}
                    onClick={() => onUnarchive(service)}
                  />
                </Tooltip>
              )}

              <Popconfirm
                title="Xóa dịch vụ"
                description="Bạn chắc chắn muốn xóa? Hành động này không thể hoàn tác."
                okText="Xóa"
                cancelText="Hủy"
                onConfirm={() => onDelete(service)}
              >
                <Tooltip title="Xóa">
                  <Button danger icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    [onEdit, onArchive, onUnarchive, onDelete]
  );

  return (
    <Table<TableNode>
      size="small"
      rowKey={(record) => record.key}
      loading={loading}
      columns={columns}
      dataSource={nestedData}
      pagination={false}
      scroll={{ x: 1200 }}
      expandable={{
        defaultExpandAllRows: false,
        childrenColumnName: "children",
      }}
    />
  );
}
