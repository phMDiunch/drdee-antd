// src/features/customers/components/detail-tabs/SalesActivitiesTab.tsx
"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Space, Button, Typography, Empty, Spin, Row, Col } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  useSalesActivities,
  useCreateSalesActivity,
  useUpdateSalesActivity,
  useDeleteSalesActivity,
  SalesActivityTable,
  SalesActivityModal,
} from "@/features/sales-activities";
import type {
  SalesActivityResponse,
  CreateSalesActivityFormData,
  UpdateSalesActivityFormData,
} from "@/shared/validation/sales-activity.schema";

interface SalesActivitiesTabProps {
  customerId: string;
  customerName: string;
  consultedServices: Array<{
    id: string;
    consultedServiceName: string;
    consultationDate: string;
    toothPositions: string[];
    serviceStatus: string;
    stage: string | null;
  }>;
}

type ModalState = {
  open: boolean;
  mode: "add" | "edit";
  customerName?: string;
  initialData?: SalesActivityResponse;
};

/**
 * Sales Activities Tab - Display customer's sales activity logs
 * Features:
 * - View all sales activities for this customer
 * - Create new activity log for consulted services needing follow-up
 * - Edit/Delete activities (owner only, within time windows)
 * - Show count of services needing follow-up
 */
export default function SalesActivitiesTab({
  customerId,
  customerName,
  consultedServices,
}: SalesActivitiesTabProps) {
  const [modal, setModal] = useState<ModalState>({
    open: false,
    mode: "add",
  });

  // Fetch sales activities for this customer
  const { data, isLoading } = useSalesActivities({
    customerId,
    pageSize: 200, // Load all activities for customer detail
    sortField: "contactDate",
    sortDirection: "desc", // Newest first
  });

  // Mutations
  const createMutation = useCreateSalesActivity();
  const updateMutation = useUpdateSalesActivity();
  const deleteMutation = useDeleteSalesActivity();

  // Count services needing follow-up (activities with nextContactDate)
  const followUpCount = useMemo(() => {
    if (!data?.items) return 0;
    const uniqueServices = new Set(
      data.items
        .filter((activity) => activity.nextContactDate)
        .map((activity) => activity.consultedServiceId)
    );
    return uniqueServices.size;
  }, [data]);

  // Close modal on successful create
  useEffect(() => {
    if (createMutation.isSuccess) {
      setModal({ open: false, mode: "add" });
    }
  }, [createMutation.isSuccess]);

  // Close modal on successful update
  useEffect(() => {
    if (updateMutation.isSuccess) {
      setModal({ open: false, mode: "add" });
    }
  }, [updateMutation.isSuccess]);

  // Handlers
  const handleAddActivity = useCallback(() => {
    setModal({
      open: true,
      mode: "add",
      customerName,
    });
  }, [customerName]);

  const handleEditActivity = useCallback((activity: SalesActivityResponse) => {
    setModal({
      open: true,
      mode: "edit",
      initialData: activity,
    });
  }, []);

  const handleDeleteActivity = useCallback(
    (activity: SalesActivityResponse) => {
      deleteMutation.mutate(activity.id);
    },
    [deleteMutation]
  );

  const handleModalSubmit = useCallback(
    (formData: CreateSalesActivityFormData | UpdateSalesActivityFormData) => {
      // Transform string dates to Date objects for API
      const transformedData = {
        ...formData,
        contactDate: new Date(formData.contactDate),
        nextContactDate: formData.nextContactDate
          ? new Date(formData.nextContactDate)
          : null,
      };

      if (modal.mode === "add") {
        createMutation.mutate(
          transformedData as CreateSalesActivityFormData & {
            contactDate: Date;
            nextContactDate: Date | null;
          }
        );
      } else if (modal.mode === "edit" && modal.initialData) {
        updateMutation.mutate({
          id: modal.initialData.id,
          data: transformedData as UpdateSalesActivityFormData & {
            contactDate: Date;
            nextContactDate: Date | null;
          },
        });
      }
    },
    [modal.mode, modal.initialData, createMutation, updateMutation]
  );

  const handleModalCancel = useCallback(() => {
    setModal({ open: false, mode: "add" });
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "50px 0" }}>
        <Spin size="large">
          <div style={{ paddingTop: 50 }}>Đang tải danh sách hoạt động...</div>
        </Spin>
      </div>
    );
  }

  const activities = data?.items || [];
  const activityCount = data?.total || 0;

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      {/* Header */}
      <Row justify="space-between" align="middle">
        <Col>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Nhật ký liên hệ ({activityCount})
          </Typography.Title>
          {followUpCount > 0 && (
            <Typography.Text type="secondary">
              {followUpCount} dịch vụ cần follow-up
            </Typography.Text>
          )}
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddActivity}
            disabled={!consultedServices.length}
          >
            Thêm hoạt động
          </Button>
        </Col>
      </Row>

      {/* Empty State */}
      {activities.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <>
              <Typography.Text type="secondary">
                Chưa có hoạt động liên hệ nào
              </Typography.Text>
              <br />
              {consultedServices.length > 0 && (
                <Button type="link" onClick={handleAddActivity}>
                  Tạo hoạt động đầu tiên
                </Button>
              )}
            </>
          }
        />
      ) : (
        /* Table */
        <SalesActivityTable
          data={activities}
          loading={isLoading}
          onEdit={handleEditActivity}
          onDelete={handleDeleteActivity}
        />
      )}

      {/* Modal */}
      <SalesActivityModal
        open={modal.open}
        mode={modal.mode}
        consultedServices={consultedServices}
        customerName={modal.customerName}
        initialData={modal.initialData}
        loading={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleModalSubmit}
        onCancel={handleModalCancel}
      />
    </Space>
  );
}
