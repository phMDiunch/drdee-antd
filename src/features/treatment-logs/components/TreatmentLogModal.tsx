// src/features/treatment-logs/components/TreatmentLogModal.tsx
"use client";

import React, { useEffect, useMemo } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Radio,
  Row,
  Col,
  Descriptions,
  Alert,
} from "antd";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import dayjs from "dayjs";
import {
  CreateTreatmentLogFormSchema,
  UpdateTreatmentLogFormSchema,
  TREATMENT_STATUSES,
  type CreateTreatmentLogFormData,
  type UpdateTreatmentLogFormData,
  type TreatmentLogResponse,
} from "@/shared/validation/treatment-log.schema";
import { useWorkingEmployees } from "@/features/employees/hooks/useWorkingEmployees";
import { useClinics } from "@/features/clinics/hooks/useClinics";
import { useCurrentUser } from "@/shared/providers";
import type { AppointmentForTreatmentResponse } from "@/shared/validation/treatment-log.schema";
import { treatmentLogPermissions } from "@/shared/permissions/treatment-log.permissions";

const { TextArea } = Input;

type TreatmentLogModalProps = {
  open: boolean;
  mode: "add" | "edit";
  appointmentId?: string; // Required for add mode
  appointmentDate?: string; // Display in modal title
  consultedServices?: AppointmentForTreatmentResponse["customer"]["consultedServices"];
  initialData?: TreatmentLogResponse;
  onSubmit: (
    data: CreateTreatmentLogFormData | UpdateTreatmentLogFormData
  ) => void;
  onCancel: () => void;
  loading?: boolean;
};

export default function TreatmentLogModal({
  open,
  mode,
  appointmentId,
  appointmentDate,
  consultedServices = [],
  initialData,
  onSubmit,
  onCancel,
  loading,
}: TreatmentLogModalProps) {
  const { user } = useCurrentUser();
  const { data: employees = [] } = useWorkingEmployees();
  const { data: clinics = [] } = useClinics();

  // Prepare options
  const clinicOptions = clinics.map((clinic) => ({
    label: clinic.name,
    value: clinic.id,
  }));

  // Permission check for edit mode
  const canEditPermission =
    mode === "add"
      ? { allowed: true }
      : treatmentLogPermissions.canEdit(user, {
          id: initialData?.id || "",
          createdById: initialData?.createdBy.id || "",
          clinicId: initialData?.clinic.id,
        });

  const canEdit = canEditPermission.allowed;

  const defaultValues = useMemo(() => {
    if (mode === "edit" && initialData) {
      return {
        treatmentNotes: initialData.treatmentNotes,
        nextStepNotes: initialData.nextStepNotes || "",
        treatmentStatus: initialData.treatmentStatus,
        dentistId: initialData.dentist.id,
        assistant1Id: initialData.assistant1?.id || "",
        assistant2Id: initialData.assistant2?.id || "",
        clinicId: initialData.clinic.id,
      };
    }
    return {
      consultedServiceId: "",
      appointmentId: appointmentId || "",
      treatmentNotes: "",
      nextStepNotes: "",
      treatmentStatus: "Đang điều trị" as const,
      dentistId: user?.employeeId || "",
      assistant1Id: "",
      assistant2Id: "",
      clinicId: user?.clinicId || "",
    };
  }, [mode, initialData, appointmentId, user]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTreatmentLogFormData | UpdateTreatmentLogFormData>({
    resolver: zodResolver(
      mode === "add"
        ? CreateTreatmentLogFormSchema
        : UpdateTreatmentLogFormSchema
    ),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, reset, defaultValues]);

  const handleFormSubmit = handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <Modal
      title={
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {mode === "add"
              ? "Thêm lịch sử điều trị"
              : "Cập nhật lịch sử điều trị"}
          </div>
          {appointmentDate && (
            <div
              style={{
                fontSize: 14,
                color: "#666",
                fontWeight: 400,
                marginTop: 4,
              }}
            >
              Ngày điều trị: {appointmentDate}
            </div>
          )}
        </div>
      }
      open={open}
      onOk={handleFormSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      width="80%"
      style={{ maxWidth: 1000 }}
      destroyOnHidden
      okButtonProps={{ disabled: mode === "edit" && !canEdit }}
    >
      {mode === "edit" && !canEdit && (
        <Alert
          message="Bạn chỉ có thể xem, không thể chỉnh sửa lịch sử điều trị này"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form layout="vertical" requiredMark>
        {mode === "add" && (
          <Form.Item
            label="Dịch vụ nha khoa"
            required
            validateStatus={
              "consultedServiceId" in errors && errors.consultedServiceId
                ? "error"
                : ""
            }
            help={
              "consultedServiceId" in errors
                ? errors.consultedServiceId?.message
                : undefined
            }
          >
            <Controller
              name="consultedServiceId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Chọn dịch vụ điều trị"
                  disabled={!canEdit}
                  options={consultedServices.map((service) => ({
                    label: `${service.consultedServiceName}${
                      service.toothPositions.length > 0
                        ? ` - ${service.toothPositions.join(", ")}`
                        : ""
                    } - ${dayjs(service.serviceConfirmDate).format(
                      "DD/MM/YY"
                    )}`,
                    value: service.id,
                  }))}
                />
              )}
            />
          </Form.Item>
        )}

        {mode === "edit" && initialData && (
          <Form.Item label="Dịch vụ nha khoa">
            <Input
              value={`${initialData.consultedService.consultedServiceName}${
                initialData.consultedService.toothPositions.length > 0
                  ? ` - ${initialData.consultedService.toothPositions.join(
                      ", "
                    )}`
                  : ""
              } - ${dayjs(
                initialData.consultedService.serviceConfirmDate
              ).format("DD/MM/YY")}`}
              disabled
            />
          </Form.Item>
        )}

        <Form.Item
          label="Nội dung điều trị"
          required
          validateStatus={errors.treatmentNotes ? "error" : ""}
          help={errors.treatmentNotes?.message}
        >
          <Controller
            name="treatmentNotes"
            control={control}
            render={({ field }) => (
              <TextArea
                {...field}
                rows={4}
                placeholder="Mô tả chi tiết quá trình điều trị..."
                disabled={!canEdit}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Kế hoạch bước tiếp theo"
          validateStatus={errors.nextStepNotes ? "error" : ""}
          help={errors.nextStepNotes?.message}
        >
          <Controller
            name="nextStepNotes"
            control={control}
            render={({ field }) => (
              <TextArea
                {...field}
                value={field.value || ""}
                rows={3}
                placeholder="Ghi chú cho buổi hẹn tiếp theo (nếu có)..."
                disabled={!canEdit}
              />
            )}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Bác sĩ điều trị"
              required
              validateStatus={errors.dentistId ? "error" : ""}
              help={errors.dentistId?.message}
            >
              <Controller
                name="dentistId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    showSearch
                    placeholder="Chọn bác sĩ điều trị"
                    optionFilterProp="label"
                    disabled={!canEdit}
                    options={employees.map((emp) => ({
                      label: emp.fullName,
                      value: emp.id,
                    }))}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Điều dưỡng 1"
              validateStatus={errors.assistant1Id ? "error" : ""}
              help={errors.assistant1Id?.message}
            >
              <Controller
                name="assistant1Id"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    showSearch
                    placeholder="Chọn điều dưỡng 1"
                    optionFilterProp="label"
                    disabled={!canEdit}
                    allowClear
                    options={employees.map((emp) => ({
                      label: emp.fullName,
                      value: emp.id,
                    }))}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Điều dưỡng 2"
              validateStatus={errors.assistant2Id ? "error" : ""}
              help={errors.assistant2Id?.message}
            >
              <Controller
                name="assistant2Id"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    showSearch
                    placeholder="Chọn điều dưỡng 2"
                    optionFilterProp="label"
                    disabled={!canEdit}
                    allowClear
                    options={employees.map((emp) => ({
                      label: emp.fullName,
                      value: emp.id,
                    }))}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Trạng thái điều trị"
              required
              validateStatus={errors.treatmentStatus ? "error" : ""}
              help={errors.treatmentStatus?.message}
            >
              <Controller
                name="treatmentStatus"
                control={control}
                render={({ field }) => (
                  <Radio.Group {...field} disabled={!canEdit}>
                    {TREATMENT_STATUSES.map((status) => (
                      <Radio key={status} value={status}>
                        {status}
                      </Radio>
                    ))}
                  </Radio.Group>
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Chi nhánh"
              required
              validateStatus={errors.clinicId ? "error" : ""}
              help={errors.clinicId?.message}
            >
              <Controller
                name="clinicId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Chọn chi nhánh"
                    options={clinicOptions}
                    disabled
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        {mode === "edit" && initialData && (
          <Descriptions
            title="Thông tin chi tiết"
            bordered
            column={2}
            size="small"
            style={{ marginTop: 24 }}
          >
            <Descriptions.Item label="Ngày điều trị">
              {dayjs(initialData.treatmentDate).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="Buổi hẹn">
              {dayjs(initialData.appointment.appointmentDateTime).format(
                "DD/MM/YYYY HH:mm"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Người tạo">
              {initialData.createdBy.fullName}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {dayjs(initialData.createdAt).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="Người sửa">
              {initialData.updatedBy.fullName}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày sửa">
              {dayjs(initialData.updatedAt).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Form>
    </Modal>
  );
}
