// src/features/customers/components/QuickCheckInButton.tsx
"use client";

import { useState } from "react";
import { Button } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useUpdateAppointment } from "@/features/appointments";
import { useQueryClient } from "@tanstack/react-query";
import { WalkInModal } from "@/features/customers";
import type { CustomerDailyResponse } from "@/shared/validation/customer.schema";

type Props = {
  customer: CustomerDailyResponse;
  date: string; // YYYY-MM-DD
};

export default function QuickCheckInButton({ customer, date }: Props) {
  const [openWalkIn, setOpenWalkIn] = useState(false);
  const updateMutation = useUpdateAppointment();
  const qc = useQueryClient();

  const { todayAppointment } = customer;

  const handleCheckIn = async () => {
    if (!todayAppointment) return;

    await updateMutation.mutateAsync({
      id: todayAppointment.id,
      body: {
        checkInTime: new Date(),
        status: "Đã đến",
      },
    });

    // Refetch daily list to update button state
    qc.invalidateQueries({ queryKey: ["customers", "daily"] });
  };

  // Case 1: Đã check-in
  if (todayAppointment?.checkInTime) {
    return (
      <Button size="small" disabled icon={<CheckCircleOutlined />}>
        Đã check-in
      </Button>
    );
  }

  // Case 2: Có lịch, chưa check-in
  if (todayAppointment) {
    return (
      <Button
        type="primary"
        size="small"
        icon={<CheckCircleOutlined />}
        loading={updateMutation.isPending}
        onClick={handleCheckIn}
      >
        Check-in
      </Button>
    );
  }

  // Case 3: Không có lịch - Walk-in
  return (
    <>
      <Button
        type="primary"
        size="small"
        icon={<CheckCircleOutlined />}
        onClick={() => setOpenWalkIn(true)}
      >
        Check-in
      </Button>

      <WalkInModal
        open={openWalkIn}
        customer={customer}
        date={date}
        onClose={() => setOpenWalkIn(false)}
      />
    </>
  );
}
