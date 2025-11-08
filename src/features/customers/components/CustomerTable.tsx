// src/features/customers/components/CustomerTable.tsx
"use client";

import React from "react";
import { Space, Table, Tag } from "antd";
import Link from "next/link";
import type { ColumnsType } from "antd/es/table";
import type {
  CustomerResponse,
  CustomerDailyResponse,
} from "@/shared/validation/customer.schema";
import { CUSTOMER_SOURCES, SERVICES_OF_INTEREST } from "../constants";
import { APPOINTMENT_STATUS_COLORS } from "@/features/appointments/constants";
import dayjs from "dayjs";
import QuickCheckInButton from "./QuickCheckInButton";

type Props = {
  data: CustomerResponse[] | CustomerDailyResponse[];
  loading?: boolean;
  showCheckIn?: boolean;
  selectedDate?: string;
};

export default function CustomerTable({
  data,
  loading,
  showCheckIn = false,
  selectedDate,
}: Props) {
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
      title: `Lịch hẹn hôm nay (${dayjs().format("DD/MM")})`,
      key: "todayAppointment",
      width: 200,
      render: (_, record) => {
        const appointment = (record as CustomerDailyResponse).todayAppointment;
        if (!appointment) return "—";

        return (
          <Space direction="vertical" size={2}>
            <Tag color={APPOINTMENT_STATUS_COLORS[appointment.status]}>
              {appointment.status}
            </Tag>
            {appointment.checkInTime ? (
              <span style={{ fontSize: "12px", color: "#52c41a" }}>
                ✓ Check-in: {dayjs(appointment.checkInTime).format("HH:mm")}
              </span>
            ) : (
              <span style={{ fontSize: "12px" }}>
                Giờ hẹn:{" "}
                {dayjs(appointment.appointmentDateTime).format("HH:mm")}
              </span>
            )}
          </Space>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          {showCheckIn && selectedDate && (
            <QuickCheckInButton
              customer={record as CustomerDailyResponse}
              date={selectedDate}
            />
          )}
          {/* Future: Detail view link */}
        </Space>
      ),
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
