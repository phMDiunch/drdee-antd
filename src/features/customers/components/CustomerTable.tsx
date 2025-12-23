// src/features/customers/components/CustomerTable.tsx
"use client";

import React from "react";
import { Space, Table, Tag, Typography } from "antd";
import Link from "next/link";

import type { ColumnsType } from "antd/es/table";
import type { CustomerDailyResponse } from "@/shared/validation/customer.schema";
import {
  CUSTOMER_SOURCES,
  SERVICES_OF_INTEREST,
  PRIMARY_CONTACT_ROLES,
} from "../constants";
import { APPOINTMENT_STATUS_COLORS } from "@/features/appointments/constants";
import dayjs from "dayjs";
import QuickCheckInButton from "./QuickCheckInButton";

const { Text } = Typography;

type Props = {
  data: CustomerDailyResponse[];
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
  const columns: ColumnsType<CustomerDailyResponse> = [
    {
      title: "Mã KH",
      dataIndex: "customerCode",
      key: "customerCode",
      width: 140,
      render: (code, r) => {
        // ⭐ Handle NULL customerCode for LEADs
        if (r.type === "LEAD") return "—";
        return code || "—";
      },
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
      title: "Chi tiết nguồn",
      key: "sourceNotes",
      width: 200,
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

        // Other sources: display raw sourceNotes or "—"
        return r.sourceNotes || "—";
      },
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
