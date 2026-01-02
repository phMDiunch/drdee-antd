// src/features/labo-orders/components/UpdateLaboOrderModal.tsx
"use client";

import React, { useEffect, useMemo } from "react";
import {
  Modal,
  Form,
  Row,
  Col,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Alert,
  Descriptions,
} from "antd";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import viVN from "antd/es/date-picker/locale/vi_VN";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCurrentUser } from "@/shared/providers";
import { useWorkingEmployees } from "@/features/employees/hooks/queries";
import { useSuppliers } from "@/features/suppliers/hooks/queries";
import { useLaboItems } from "@/features/labo-items/hooks/queries";
import type {
  LaboOrderResponse,
  UpdateLaboOrderRequest,
  UpdateLaboOrderFormData,
} from "@/shared/validation/labo-order.schema";
import { UpdateLaboOrderFormSchema } from "@/shared/validation/labo-order.schema";
import { LABO_ORDER_TYPE_OPTIONS } from "../constants";

dayjs.locale("vi");

type Props = {
  open: boolean;
  confirmLoading?: boolean;
  order: LaboOrderResponse;
  onCancel: () => void;
  onSubmit: (id: string, payload: UpdateLaboOrderRequest) => void;
};

export function UpdateLaboOrderModal({
  open,
  confirmLoading,
  order,
  onCancel,
  onSubmit,
}: Props) {
  const { user: currentUser } = useCurrentUser();
  const isAdmin = currentUser?.role === "admin";
  const isReturned = order.returnDate !== null;

  // Check edit permission
  const canEdit = isAdmin || !isReturned;

  // Working employees (doctors)
  const { data: employeesData } = useWorkingEmployees();
  const doctorOptions = useMemo(() => {
    if (!employeesData) return [];
    return employeesData.map((emp) => ({
      label: emp.fullName,
      value: emp.id,
    }));
  }, [employeesData]);

  // Suppliers
  const { data: suppliersData } = useSuppliers(false);
  const supplierOptions = useMemo(() => {
    if (!suppliersData) return [];
    return suppliersData.map((s) => ({
      label: s.shortName || s.name,
      value: s.id,
    }));
  }, [suppliersData]);

  // Labo Items
  const { data: laboItemsData } = useLaboItems(false);
  const laboItemOptions = useMemo(() => {
    if (!laboItemsData) return [];
    return laboItemsData.map((item) => ({
      label: item.name,
      value: item.id,
    }));
  }, [laboItemsData]);

  const defaultValues: UpdateLaboOrderFormData = useMemo(
    () => ({
      quantity: order.quantity,
      expectedFitDate: order.expectedFitDate || "",
      returnDate: order.returnDate
        ? dayjs(order.returnDate).format("YYYY-MM-DD HH:mm")
        : null,
      detailRequirement: order.detailRequirement || "",
      // Admin-only fields
      treatmentDate: dayjs(order.treatmentDate).format("YYYY-MM-DD"),
      orderType: order.orderType as "Làm mới" | "Bảo hành",
      sentById: order.sentById,
      sentDate: dayjs(order.sentDate).format("YYYY-MM-DD HH:mm"),
      receivedById: order.receivedById || null,
    }),
    [order]
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<UpdateLaboOrderFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(UpdateLaboOrderFormSchema) as any,
    defaultValues,
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, reset, defaultValues]);

  const onValid = (formData: UpdateLaboOrderFormData) => {
    const payload: UpdateLaboOrderRequest = {
      id: order.id,
      quantity: formData.quantity,
      expectedFitDate: formData.expectedFitDate
        ? dayjs(formData.expectedFitDate).format("YYYY-MM-DD")
        : null,
      detailRequirement: formData.detailRequirement || null,
    };

    // Admin can edit additional fields
    if (isAdmin) {
      payload.returnDate = formData.returnDate
        ? (dayjs(formData.returnDate).toISOString() as unknown as Date)
        : null;
      payload.treatmentDate = dayjs(formData.treatmentDate).format(
        "YYYY-MM-DD"
      );
      payload.orderType = formData.orderType;
      payload.sentById = formData.sentById;
      payload.sentDate = dayjs(
        formData.sentDate || order.sentDate
      ).toISOString() as unknown as Date;
      payload.receivedById = formData.receivedById || null;
    }

    onSubmit(order.id, payload);
  };

  return (
    <Modal
      title={`Sửa đơn hàng labo - ${order.customer.fullName}`}
      open={open}
      onCancel={onCancel}
      onOk={canEdit ? handleSubmit(onValid) : undefined}
      confirmLoading={confirmLoading || isSubmitting}
      okText="Cập nhật"
      cancelText="Hủy"
      okButtonProps={{ disabled: !canEdit }}
      width="70%"
      styles={{
        content: { maxHeight: "85vh" },
        body: { maxHeight: "65vh", overflowY: "auto", paddingInline: 16 },
      }}
      destroyOnHidden
      maskClosable={false}
    >
      {!canEdit && (
        <Alert
          message="Chỉ admin mới có thể sửa đơn hàng đã nhận mẫu"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form layout="vertical" requiredMark>
        {/* Row 1: Khách hàng (1/3), Bác sĩ (1/3), Ngày điều trị (1/3) */}
        <Row gutter={12}>
          <Col xs={24} lg={8}>
            <Form.Item label="Khách hàng" required>
              <Input
                value={`${order.customer.customerCode || ""} - ${
                  order.customer.fullName
                }`}
                disabled
                style={{ color: "rgba(0, 0, 0, 0.85)" }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} lg={8}>
            <Form.Item label="Bác sĩ" required>
              <Select
                value={order.doctorId}
                disabled
                options={doctorOptions}
                style={{ color: "rgba(0, 0, 0, 0.85)" }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} lg={8}>
            <Controller
              name="treatmentDate"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Ngày điều trị"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <DatePicker
                    format="DD/MM/YYYY"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(d) =>
                      field.onChange(d ? d.format("YYYY-MM-DD") : "")
                    }
                    locale={viVN}
                    style={{ width: "100%" }}
                    placeholder="Chọn ngày điều trị"
                    disabled={!isAdmin}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Row 2: Xưởng labo (1/3), Loại răng giả (1/3), Số lượng (1/3) */}
        <Row gutter={12}>
          <Col xs={24} lg={8}>
            <Form.Item label="Xưởng labo" required>
              <Select
                value={order.supplierId}
                disabled
                options={supplierOptions}
                style={{ color: "rgba(0, 0, 0, 0.85)" }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} lg={8}>
            <Form.Item label="Loại răng giả" required>
              <Select
                value={order.laboItemId}
                disabled
                options={laboItemOptions}
                style={{ color: "rgba(0, 0, 0, 0.85)" }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} lg={8}>
            <Controller
              name="quantity"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Số lượng"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <InputNumber
                    {...field}
                    min={1}
                    max={100}
                    placeholder="Số lượng"
                    style={{ width: "100%" }}
                    disabled={!canEdit}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Row 3: Loại đơn hàng (1/3), Ngày gửi mẫu (1/3), Người gửi mẫu (1/3) */}
        <Row gutter={12}>
          <Col xs={24} lg={8}>
            <Controller
              name="orderType"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Loại đơn hàng"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    options={[...LABO_ORDER_TYPE_OPTIONS]}
                    disabled={!isAdmin}
                    style={{ color: "rgba(0, 0, 0, 0.85)" }}
                  />
                </Form.Item>
              )}
            />
          </Col>

          <Col xs={24} lg={8}>
            <Controller
              name="sentDate"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Ngày gửi mẫu"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <DatePicker
                    showTime={{ format: "HH:mm" }}
                    format="DD/MM/YYYY HH:mm"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(d) =>
                      field.onChange(d ? d.format("YYYY-MM-DD HH:mm") : "")
                    }
                    locale={viVN}
                    style={{ width: "100%" }}
                    placeholder="Chọn ngày gửi mẫu"
                    disabled={!isAdmin}
                  />
                </Form.Item>
              )}
            />
          </Col>

          <Col xs={24} lg={8}>
            <Controller
              name="sentById"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Người gửi mẫu"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    options={doctorOptions}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    disabled={!isAdmin}
                    style={{ color: "rgba(0, 0, 0, 0.85)" }}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Row 4: Ngày hẹn lắp (1/3), Ngày nhận mẫu (1/3), Người nhận mẫu (1/3) */}
        <Row gutter={12}>
          <Col xs={24} lg={8}>
            <Controller
              name="expectedFitDate"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Ngày hẹn lắp"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <DatePicker
                    format="DD/MM/YYYY"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(d) =>
                      field.onChange(d ? d.format("YYYY-MM-DD") : null)
                    }
                    locale={viVN}
                    style={{ width: "100%" }}
                    placeholder="Chọn ngày hẹn lắp"
                    disabled={!canEdit}
                    allowClear
                  />
                </Form.Item>
              )}
            />
          </Col>

          <Col xs={24} lg={8}>
            <Controller
              name="returnDate"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Ngày nhận mẫu"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <DatePicker
                    showTime={{ format: "HH:mm" }}
                    format="DD/MM/YYYY HH:mm"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(d) =>
                      field.onChange(d ? d.format("YYYY-MM-DD HH:mm") : null)
                    }
                    locale={viVN}
                    style={{ width: "100%" }}
                    placeholder="Chọn ngày nhận mẫu"
                    disabled={!isAdmin}
                    allowClear
                  />
                </Form.Item>
              )}
            />
          </Col>

          <Col xs={24} lg={8}>
            <Controller
              name="receivedById"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Người nhận mẫu"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    value={field.value || undefined}
                    onChange={(value) => field.onChange(value || null)}
                    showSearch
                    placeholder="Chọn người nhận mẫu"
                    optionFilterProp="label"
                    options={doctorOptions}
                    disabled={!isAdmin}
                    allowClear
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Row 5: Detail Requirement */}
        <Row gutter={12}>
          <Col span={24}>
            <Controller
              name="detailRequirement"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Yêu cầu chi tiết"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input.TextArea
                    {...field}
                    value={field.value || ""}
                    rows={3}
                    placeholder="Ghi chú yêu cầu chi tiết cho xưởng"
                    maxLength={1000}
                    showCount
                    disabled={!canEdit}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Metadata - Admin only */}
        {isAdmin && (
          <Descriptions
            bordered
            size="small"
            column={2}
            style={{ marginTop: 8 }}
          >
            <Descriptions.Item label="Đơn giá">
              {order.unitPrice.toLocaleString("vi-VN")} đ
            </Descriptions.Item>
            <Descriptions.Item label="Bảo hành">
              {order.warranty.replace(/-/g, " ")}
            </Descriptions.Item>
            <Descriptions.Item label="Tạo bởi">
              {order.createdBy?.fullName || "System"}
            </Descriptions.Item>
            <Descriptions.Item label="Tạo lúc">
              {dayjs(order.createdAt).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="Cập nhật bởi">
              {order.updatedBy?.fullName || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Cập nhật lúc">
              {order.updatedAt
                ? dayjs(order.updatedAt).format("DD/MM/YYYY HH:mm")
                : "—"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Form>
    </Modal>
  );
}
