"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Collapse } from "antd";
import PageHeaderWithDateNav from "@/shared/components/PageHeaderWithDateNav";
import ClinicTabs from "@/shared/components/ClinicTabs";
import { LaboOrderStatistics } from "../components/LaboOrderStatistics";
import { LaboOrderTable } from "../components/LaboOrderTable";
import { LaboOrderFilters } from "../components/LaboOrderFilters";
import { CreateLaboOrderModal } from "../components/CreateLaboOrderModal";
import { useLaboOrdersDaily } from "../hooks/useLaboOrdersDaily";
import { useReceiveLaboOrder } from "../hooks/useReceiveLaboOrder";
import { useDeleteLaboOrder } from "../hooks/useDeleteLaboOrder";
import { useCreateLaboOrder } from "../hooks/useCreateLaboOrder";
import { useDateNavigation } from "@/shared/hooks/useDateNavigation";
import { useCurrentUser } from "@/shared/providers";
import type {
  DailyLaboOrderResponse,
  CreateLaboOrderRequest,
} from "@/shared/validation/labo-order.schema";

export function LaboOrderDailyView() {
  const { user: currentUser } = useCurrentUser();
  const isAdmin = currentUser?.role?.toLowerCase() === "admin";

  const {
    selectedDate,
    goToPreviousDay,
    goToToday,
    goToNextDay,
    handleDateChange,
  } = useDateNavigation();

  const [selectedClinicId, setSelectedClinicId] = useState<string | undefined>(
    currentUser?.clinicId || undefined
  );

  const [openCreate, setOpenCreate] = useState(false);

  // Fetch sent orders
  const { data: sentData, isLoading: sentLoading } = useLaboOrdersDaily({
    date: selectedDate.format("YYYY-MM-DD"),
    type: "sent",
    clinicId: selectedClinicId,
  });

  // Fetch returned orders
  const { data: returnedData, isLoading: returnedLoading } = useLaboOrdersDaily(
    {
      date: selectedDate.format("YYYY-MM-DD"),
      type: "returned",
      clinicId: selectedClinicId,
    }
  );

  const sentOrders = useMemo(() => sentData?.items ?? [], [sentData?.items]);
  const returnedOrders = useMemo(
    () => returnedData?.items ?? [],
    [returnedData?.items]
  );

  // Mutations
  const createMutation = useCreateLaboOrder();
  const receiveOrderMutation = useReceiveLaboOrder();
  const deleteOrderMutation = useDeleteLaboOrder();

  // Quick actions
  const handleReceiveOrder = useCallback(
    (orderId: string) => {
      receiveOrderMutation.mutate(orderId);
    },
    [receiveOrderMutation]
  );

  const handleEditOrder = useCallback((order: DailyLaboOrderResponse) => {
    // TODO: Open edit modal or navigate to edit page
    console.log("Edit order:", order.id);
  }, []);

  const handleDeleteOrder = useCallback(
    (orderId: string) => {
      deleteOrderMutation.mutate(orderId);
    },
    [deleteOrderMutation]
  );

  const handleCreateSubmit = useCallback(
    async (payload: CreateLaboOrderRequest) => {
      try {
        await createMutation.mutateAsync(payload);
        setOpenCreate(false);
      } catch {
        // Hook handles error notification
      }
    },
    [createMutation]
  );

  const handleExportExcel = useCallback(() => {
    // TODO: Implement export to Excel
    console.log("Export to Excel");
  }, []);

  const isLoading = sentLoading || returnedLoading;
  const totalCount = sentOrders.length + returnedOrders.length;

  // Collapse items
  const collapseItems = useMemo(
    () => [
      {
        key: "sent",
        label: (
          <span style={{ fontSize: "15px", fontWeight: 500 }}>
            📤 Mẫu gửi đi ({sentOrders.length})
          </span>
        ),
        children: (
          <LaboOrderTable
            data={sentOrders}
            loading={sentLoading}
            isAdmin={isAdmin}
            onReceive={handleReceiveOrder}
            onEdit={handleEditOrder}
            onDelete={handleDeleteOrder}
            actionLoading={
              receiveOrderMutation.isPending || deleteOrderMutation.isPending
            }
          />
        ),
      },
      {
        key: "returned",
        label: (
          <span style={{ fontSize: "15px", fontWeight: 500 }}>
            📥 Mẫu nhận về ({returnedOrders.length})
          </span>
        ),
        children: (
          <LaboOrderTable
            data={returnedOrders}
            loading={returnedLoading}
            isAdmin={isAdmin}
            onReceive={handleReceiveOrder}
            onEdit={handleEditOrder}
            onDelete={handleDeleteOrder}
            actionLoading={
              receiveOrderMutation.isPending || deleteOrderMutation.isPending
            }
          />
        ),
      },
    ],
    [
      sentOrders,
      returnedOrders,
      sentLoading,
      returnedLoading,
      isAdmin,
      handleReceiveOrder,
      handleEditOrder,
      handleDeleteOrder,
      receiveOrderMutation.isPending,
      deleteOrderMutation.isPending,
    ]
  );

  return (
    <div>
      <PageHeaderWithDateNav
        title="Labo"
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        onPreviousDay={goToPreviousDay}
        onToday={goToToday}
        onNextDay={goToNextDay}
        loading={isLoading}
      />

      <ClinicTabs
        value={selectedClinicId}
        onChange={(id) => setSelectedClinicId(id)}
      />

      <LaboOrderStatistics
        sentOrders={sentOrders}
        returnedOrders={returnedOrders}
        loading={isLoading}
      />

      <LaboOrderFilters
        loading={isLoading}
        onCreate={() => setOpenCreate(true)}
        onExportExcel={handleExportExcel}
        dailyCount={totalCount}
      />

      <Collapse
        defaultActiveKey={["sent", "returned"]}
        items={collapseItems}
        style={{ marginBottom: 16 }}
      />

      <CreateLaboOrderModal
        open={openCreate}
        selectedClinicId={selectedClinicId}
        confirmLoading={createMutation.isPending}
        onCancel={() => setOpenCreate(false)}
        onSubmit={handleCreateSubmit}
      />

      {/* TODO: Add UpdateLaboOrderModal */}
    </div>
  );
}
