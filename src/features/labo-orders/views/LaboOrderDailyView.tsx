"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Collapse } from "antd";
import PageHeaderWithDateNav from "@/shared/components/PageHeaderWithDateNav";
import ClinicTabs from "@/shared/components/ClinicTabs";
import { LaboOrderStatistics } from "../components/LaboOrderStatistics";
import { LaboOrderTable } from "../components/LaboOrderTable";
import { LaboOrderFilters } from "../components/LaboOrderFilters";
import { UpdateLaboOrderModal } from "../components/UpdateLaboOrderModal";
import { useLaboOrdersDaily } from "../hooks/queries";
import {
  useReceiveLaboOrder,
  useDeleteLaboOrder,
  useUpdateLaboOrder,
} from "../hooks/mutations";
import { useDateNavigation } from "@/shared/hooks/useDateNavigation";
import { useCurrentUser } from "@/shared/providers";
import type {
  LaboOrderResponse,
  UpdateLaboOrderRequest,
} from "@/shared/validation/labo-order.schema";

export function LaboOrderDailyView() {
  const { user: currentUser } = useCurrentUser();

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

  const [openUpdate, setOpenUpdate] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LaboOrderResponse | null>(
    null
  );

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
  const updateMutation = useUpdateLaboOrder();
  const receiveOrderMutation = useReceiveLaboOrder();
  const deleteOrderMutation = useDeleteLaboOrder();

  // Quick actions
  const handleReceiveOrder = useCallback(
    (orderId: string) => {
      receiveOrderMutation.mutate(orderId);
    },
    [receiveOrderMutation]
  );

  const handleEditOrder = useCallback((order: LaboOrderResponse) => {
    setSelectedOrder(order);
    setOpenUpdate(true);
  }, []);

  const handleDeleteOrder = useCallback(
    (orderId: string) => {
      deleteOrderMutation.mutate(orderId);
    },
    [deleteOrderMutation]
  );

  const handleUpdateSubmit = useCallback(
    async (id: string, payload: UpdateLaboOrderRequest) => {
      try {
        await updateMutation.mutateAsync({ orderId: id, data: payload });
        setOpenUpdate(false);
        setSelectedOrder(null);
      } catch {
        // Hook handles error notification
      }
    },
    [updateMutation]
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
        onExportExcel={handleExportExcel}
        dailyCount={totalCount}
      />

      <Collapse
        defaultActiveKey={["sent", "returned"]}
        items={collapseItems}
        style={{ marginBottom: 16 }}
      />

      {selectedOrder && (
        <UpdateLaboOrderModal
          open={openUpdate}
          order={selectedOrder}
          confirmLoading={updateMutation.isPending}
          onCancel={() => {
            setOpenUpdate(false);
            setSelectedOrder(null);
          }}
          onSubmit={handleUpdateSubmit}
        />
      )}
    </div>
  );
}
