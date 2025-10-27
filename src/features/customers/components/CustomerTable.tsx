"use client";
import React from "react";
import { Table, Tag } from "antd";
import Link from "next/link";
import type { ColumnsType } from "antd/es/table";
import type { CustomerResponse } from "@/shared/validation/customer.schema";
import { CUSTOMER_SOURCES, SERVICES_OF_INTEREST } from "../constants";
import dayjs from "dayjs";

type Props = {
  data: CustomerResponse[];
  loading?: boolean;
};

export default function CustomerTable({ data, loading }: Props) {
  const columns: ColumnsType<CustomerResponse> = [
    {
      title: "Mã KH",
      dataIndex: "customerCode",
      key: "customerCode",
      width: 140,
    },
    {
      title: "Họ tên",
      dataIndex: "fullName",
      key: "fullName",
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
      render: (_, r) => {
        const contact = r.primaryContact;
        if (!contact?.fullName && !contact?.phone) return "—";
        return `${contact.fullName ?? ""}${
          contact.fullName && contact.phone ? " — " : ""
        }${contact.phone ?? ""}`;
      },
    },
    {
      title: "Dịch vụ quan tâm",
      key: "serviceOfInterest",
      width: 160,
      render: (_, r) => {
        const service = SERVICES_OF_INTEREST.find(
          (s) => s.value === r.serviceOfInterest
        );
        return <Tag color="blue">{service?.label ?? r.serviceOfInterest}</Tag>;
      },
    },
    {
      title: "Nguồn khách",
      key: "source",
      width: 160,
      render: (_, r) => {
        const source = CUSTOMER_SOURCES.find((s) => s.value === r.source);
        return <Tag>{source?.label ?? r.source}</Tag>;
      },
    },
    {
      title: "Thời gian tạo",
      key: "createdAt",
      width: 160,
      render: (_, r) => dayjs(r.createdAt).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      render: () => null,
    },
  ];

  return (
    <Table
      rowKey={(r) => r.id}
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
    />
  );
}
