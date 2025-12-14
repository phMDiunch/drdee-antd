// src/features/leads/components/LeadTable.tsx
"use client";

import React, { useMemo } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Tooltip,
  Popconfirm,
  Typography,
} from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import Link from "next/link";
import type { ColumnsType } from "antd/es/table";
import type { LeadResponse } from "@/shared/validation/lead.schema";
import {
  CUSTOMER_SOURCES,
  PRIMARY_CONTACT_ROLES,
} from "@/features/customers/constants";
import { SERVICES_OF_INTEREST } from "../constants";
import dayjs from "dayjs";

const { Text } = Typography;

type Props = {
  data: LeadResponse[];
  loading?: boolean;
  onEdit?: (lead: LeadResponse) => void;
  onDelete?: (lead: LeadResponse) => void;
};

export default function LeadTable({ data, loading, onEdit, onDelete }: Props) {
  const columns = useMemo<ColumnsType<LeadResponse>>(
    () => [
      {
        title: "Họ tên",
        dataIndex: "fullName",
        key: "fullName",
        width: 180,
        render: (fullName, record) => (
          <Link href={`/customers/${record.id}`}>{fullName}</Link>
        ),
      },
      {
        title: "SĐT",
        dataIndex: "phone",
        key: "phone",
        width: 140,
        render: (phone) => phone || "—",
      },
      {
        title: "Người liên hệ chính",
        key: "primary",
        width: 180,
        render: (_, r) => {
          const contact = r.primaryContact;
          if (!contact?.fullName && !contact?.phone) return "—";

          const name = contact.fullName ?? "";
          const phone = contact.phone ?? "";
          const roleValue = r.primaryContactRole ?? "";
          const roleLabel =
            PRIMARY_CONTACT_ROLES.find((role) => role.value === roleValue)
              ?.label || roleValue;

          return (
            <Space direction="vertical" size={0}>
              <div>
                {name} — {phone}
              </div>
              {roleLabel && <div>({roleLabel})</div>}
            </Space>
          );
        },
      },
      {
        title: "Tỉnh/TP",
        dataIndex: "city",
        key: "city",
        width: 120,
      },
      {
        title: "Dịch vụ quan tâm",
        key: "serviceOfInterest",
        width: 160,
        render: (_, r) => {
          if (!r.serviceOfInterest) return "—";
          const service = SERVICES_OF_INTEREST.find(
            (s) => s.value === r.serviceOfInterest
          );
          return (
            <Tag color="blue">{service?.label ?? r.serviceOfInterest}</Tag>
          );
        },
      },
      {
        title: "Nguồn",
        key: "source",
        width: 140,
        render: (_, r) => {
          if (!r.source) return "—";
          const source = CUSTOMER_SOURCES.find((s) => s.value === r.source);
          return <Tag>{source?.label ?? r.source}</Tag>;
        },
      },
      {
        title: "Chi tiết nguồn",
        key: "sourceNotes",
        width: 200,
        ellipsis: true,
        render: (_, r) => {
          // employee_referral: display sourceEmployee (always show phone for employee)
          if (r.source === "employee_referral" && r.sourceEmployee) {
            return `${r.sourceEmployee.fullName}${
              r.sourceEmployee.phone ? ` — ${r.sourceEmployee.phone}` : ""
            }`;
          }

          // customer_referral: display sourceCustomer (code if available, otherwise phone)
          if (r.source === "customer_referral" && r.sourceCustomer) {
            if (r.sourceCustomer.customerCode) {
              return (
                <Space direction="vertical" size={0}>
                  <div>{r.sourceCustomer.fullName}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ({r.sourceCustomer.customerCode})
                  </Text>
                </Space>
              );
            }
            return `${r.sourceCustomer.fullName}${
              r.sourceCustomer.phone ? ` — ${r.sourceCustomer.phone}` : ""
            }`;
          }

          // Text input types: display sourceNotes
          return r.sourceNotes || "—";
        },
      },
      {
        title: "Ghi chú",
        dataIndex: "note",
        key: "note",
        width: 200,
        ellipsis: true,
        render: (note) => note || "—",
      },
      {
        title: "Ngày tạo",
        key: "createdAt",
        width: 160,
        render: (_, r) => dayjs(r.createdAt).format("DD/MM/YYYY HH:mm"),
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 130,
        fixed: "right",
        render: (_, record) => (
          <Space>
            <Tooltip title="Sửa">
              <Button
                icon={<EditOutlined />}
                onClick={() => onEdit?.(record)}
              />
            </Tooltip>
            <Popconfirm
              title="Xóa Lead"
              description={`Bạn có chắc chắn muốn xóa Lead "${record.fullName}" không?`}
              okText="Xóa"
              okType="danger"
              cancelText="Hủy"
              onConfirm={() => onDelete?.(record)}
            >
              <Tooltip title="Xóa">
                <Button danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [onEdit, onDelete]
  );

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={false}
    />
  );
}
