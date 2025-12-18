// src/features/consulted-services/components/UpdateConsultedServiceModal.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Form,
  Row,
  Col,
  Input,
  Select,
  InputNumber,
  Button,
  Alert,
  Divider,
  DatePicker,
  Descriptions,
  Tag,
  Space,
  Spin,
} from "antd";
import dayjs from "dayjs";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useWorkingEmployees } from "@/features/employees/hooks/useWorkingEmployees";
import { useCurrentUser } from "@/shared/providers";
import { consultedServicePermissions } from "@/shared/permissions/consulted-service.permissions";
import { CUSTOMER_SOURCES } from "@/features/customers/constants";
import { useCustomersSearch } from "@/features/customers/hooks/useCustomerSearch";
import ToothSelectorModal from "./ToothSelectorModal";
import type {
  ConsultedServiceResponse,
  UpdateConsultedServiceRequest,
} from "@/shared/validation/consulted-service.schema";

// Form schema
const UpdateConsultedServiceFormSchema = z.object({
  dentalServiceId: z.string().min(1, "Vui lòng chọn dịch vụ"),
  quantity: z.number().int().min(1, "Số lượng tối thiểu là 1"),
  preferentialPrice: z.number().int().min(0, "Giá ưu đãi không thể âm"),
  toothPositions: z.array(z.string()),
  consultingDoctorId: z.string().optional().nullable(),
  treatingDoctorId: z.string().optional().nullable(),
  specificStatus: z.string().optional().nullable(),
  source: z.string().min(1, "Vui lòng chọn nguồn khách"),
  sourceNote: z.string().optional().nullable(),
  // Admin fields
  serviceStatus: z.enum(["Chưa chốt", "Đã chốt"]).optional(),
  // treatmentStatus: Read-only, auto-computed from TreatmentLogs (not in form)
  serviceConfirmDate: z.string().optional().nullable(),
  consultationDate: z.string().optional().nullable(),
});

type FormData = z.infer<typeof UpdateConsultedServiceFormSchema>;

type Props = {
  open: boolean;
  confirmLoading?: boolean;
  service: ConsultedServiceResponse;
  onCancel: () => void;
  onSubmit: (id: string, payload: UpdateConsultedServiceRequest) => void;
};

export default function UpdateConsultedServiceModal({
  open,
  confirmLoading,
  service,
  onCancel,
  onSubmit,
}: Props) {
  const { user: currentUser } = useCurrentUser();
  const [toothSelectorOpen, setToothSelectorOpen] = useState(false);

  // Check permissions
  const permission = consultedServicePermissions.canEdit(currentUser, service);
  const editableFields = permission.editableFields || [];
  const isAdmin = currentUser?.role === "admin";

  const defaultValues: FormData = useMemo(
    () => ({
      dentalServiceId: service.dentalServiceId,
      quantity: service.quantity,
      preferentialPrice: service.preferentialPrice,
      toothPositions: service.toothPositions,
      consultingDoctorId: service.consultingDoctorId || null,
      treatingDoctorId: service.treatingDoctorId || null,
      specificStatus: service.specificStatus || "",
      source: service.source || "",
      sourceNote: service.sourceNote || null,
      serviceStatus: service.serviceStatus,
      // treatmentStatus: Not in form, read-only display
      serviceConfirmDate: service.serviceConfirmDate || null,
      consultationDate: service.consultationDate || null,
    }),
    [service]
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(UpdateConsultedServiceFormSchema),
    defaultValues,
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, reset, defaultValues]);

  // Watch fields
  const quantity = watch("quantity");
  const preferentialPrice = watch("preferentialPrice");
  const toothPositions = watch("toothPositions");
  const sourceValue = watch("source");

  // Source metadata for conditional sourceNote rendering
  const sourceMeta = useMemo(
    () => CUSTOMER_SOURCES.find((s) => s.value === sourceValue),
    [sourceValue]
  );

  // Customer search for sourceNote (when source = "customer_referral")
  const [custQuery, setCustQuery] = useState("");
  const [custDebounced, setCustDebounced] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setCustDebounced(custQuery), 500);
    return () => clearTimeout(timer);
  }, [custQuery]);

  const { data: customerSearchResults = [], isFetching: custFetching } =
    useCustomersSearch({
      q: custDebounced,
      requirePhone: false,
    });

  const customerSourceOptions = useMemo(
    () =>
      customerSearchResults.map((c) => ({
        label: `${c.fullName} — ${c.phone ?? "—"}`,
        value: c.id,
      })),
    [customerSearchResults]
  );

  // Fetch data
  const { data: employees = [] } = useWorkingEmployees();

  // Employee options for Select - Tất cả nhân viên, không filter theo cơ sở
  const employeeOptions = useMemo(() => {
    return employees.map((e) => ({
      label: e.fullName,
      value: e.id,
    }));
  }, [employees]);

  // Auto-calculate quantity when tooth positions change (if unit is Răng)
  useEffect(() => {
    if (service.consultedServiceUnit === "Răng") {
      setValue("quantity", toothPositions.length);
    }
  }, [toothPositions, service.consultedServiceUnit, setValue]);

  // Calculate finalPrice
  const finalPrice = useMemo(() => {
    return preferentialPrice * quantity;
  }, [preferentialPrice, quantity]);

  // Validate preferentialPrice range
  const preferentialPriceError = useMemo(() => {
    if (!service.dentalService) return null;
    const minPrice = service.dentalService.minPrice ?? 0;
    const price = service.dentalService.price;

    if (preferentialPrice === 0) return null;
    if (preferentialPrice >= minPrice && preferentialPrice <= price)
      return null;

    if (preferentialPrice < minPrice) {
      return `Giá ưu đãi phải là 0 (miễn phí) hoặc từ ${new Intl.NumberFormat(
        "vi-VN",
        { style: "currency", currency: "VND" }
      ).format(minPrice)} đến ${new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(price)}`;
    }

    if (preferentialPrice > price) {
      return `Giá ưu đãi không được vượt quá giá niêm yết ${new Intl.NumberFormat(
        "vi-VN",
        { style: "currency", currency: "VND" }
      ).format(price)}`;
    }

    return null;
  }, [service, preferentialPrice]);

  const onValid = (formData: FormData) => {
    if (preferentialPriceError) {
      return;
    }

    // Validate tooth positions (for Răng unit)
    if (
      service.consultedServiceUnit === "Răng" &&
      formData.toothPositions.length === 0
    ) {
      return;
    }

    // Build payload with only changed fields
    const payload: Partial<UpdateConsultedServiceRequest> = {};

    // Only include editable fields
    if (
      editableFields.includes("quantity") &&
      formData.quantity !== service.quantity
    ) {
      payload.quantity = formData.quantity;
    }

    if (
      editableFields.includes("preferentialPrice") &&
      formData.preferentialPrice !== service.preferentialPrice
    ) {
      payload.preferentialPrice = formData.preferentialPrice;
    }

    if (
      editableFields.includes("toothPositions") &&
      JSON.stringify(formData.toothPositions) !==
        JSON.stringify(service.toothPositions)
    ) {
      payload.toothPositions = formData.toothPositions;
    }

    if (
      editableFields.includes("consultingDoctorId") &&
      formData.consultingDoctorId !== service.consultingDoctorId
    ) {
      payload.consultingDoctorId = formData.consultingDoctorId || null;
    }

    // consultingSaleId - removed per requirement, use button in table instead

    if (
      editableFields.includes("treatingDoctorId") &&
      formData.treatingDoctorId !== service.treatingDoctorId
    ) {
      payload.treatingDoctorId = formData.treatingDoctorId || null;
    }

    if (
      editableFields.includes("specificStatus") &&
      formData.specificStatus !== service.specificStatus
    ) {
      payload.specificStatus = formData.specificStatus || null;
    }

    if (
      editableFields.includes("source") &&
      formData.source !== service.source
    ) {
      payload.source = formData.source;
    }

    if (
      editableFields.includes("sourceNote") &&
      formData.sourceNote !== service.sourceNote
    ) {
      payload.sourceNote = formData.sourceNote || null;
    }

    // Admin fields
    if (
      isAdmin &&
      formData.serviceStatus &&
      formData.serviceStatus !== service.serviceStatus
    ) {
      payload.serviceStatus = formData.serviceStatus;
    }

    // treatmentStatus: Auto-computed from TreatmentLogs, not editable

    if (isAdmin && formData.serviceConfirmDate !== service.serviceConfirmDate) {
      payload.serviceConfirmDate = formData.serviceConfirmDate
        ? new Date(formData.serviceConfirmDate)
        : null;
    }

    if (isAdmin && formData.consultationDate !== service.consultationDate) {
      payload.consultationDate = formData.consultationDate
        ? new Date(formData.consultationDate)
        : null;
    }

    onSubmit(service.id, payload as UpdateConsultedServiceRequest);
  };

  const handleToothSelectorOk = (selected: string[]) => {
    setValue("toothPositions", selected);
    setToothSelectorOpen(false);
  };

  const formatVND = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);

  // Warning messages
  const warningMessage = useMemo(() => {
    if (!permission.allowed) {
      return {
        type: "error" as const,
        message: permission.reason || "Không có quyền chỉnh sửa",
      };
    }

    if (currentUser?.role !== "admin" && service.serviceStatus === "Đã chốt") {
      return {
        type: "warning" as const,
        message: "Dịch vụ đã chốt - chỉ sửa nhân sự trong 33 ngày",
      };
    }

    return null;
  }, [permission, currentUser, service]);

  return (
    <>
      <Modal
        title="Cập nhật dịch vụ tư vấn"
        open={open}
        onCancel={onCancel}
        onOk={() => {
          handleSubmit(onValid)();
        }}
        confirmLoading={confirmLoading}
        width="65%"
        styles={{
          body: { maxHeight: "60vh", overflowY: "auto", paddingInline: 16 },
        }}
        destroyOnHidden
        maskClosable={false}
      >
        <Form layout="vertical" requiredMark>
          {/* Warning alert */}
          {warningMessage && (
            <Alert
              message={warningMessage.message}
              type={warningMessage.type}
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Customer info (read-only) */}
          <Alert
            message={`Khách hàng: ${service.customer?.customerCode || ""} - ${
              service.customer?.fullName || ""
            }`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* Row 1: Service (disabled if confirmed), Unit */}
          <Row gutter={12}>
            <Col xs={24} lg={16}>
              <Form.Item label="Dịch vụ">
                <Input
                  value={service.consultedServiceName}
                  disabled
                  style={{ color: "rgba(0, 0, 0, 0.85)" }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} lg={8}>
              <Form.Item label="Đơn vị">
                <Input
                  value={service.consultedServiceUnit}
                  disabled
                  style={{ color: "rgba(0, 0, 0, 0.85)" }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Row 2: Tooth positions (conditional) */}
          {service.consultedServiceUnit === "Răng" && (
            <Row gutter={12}>
              <Col span={24}>
                <Form.Item label="Vị trí răng" required>
                  <Space size={[8, 8]} wrap style={{ width: "100%" }}>
                    <Button
                      onClick={() => setToothSelectorOpen(true)}
                      size="small"
                      type={toothPositions.length > 0 ? "primary" : "default"}
                      disabled={!editableFields.includes("toothPositions")}
                    >
                      Chọn vị trí răng ({toothPositions.length})
                    </Button>

                    {toothPositions
                      .sort(
                        (a, b) =>
                          parseInt(a.replace(/\D/g, ""), 10) -
                          parseInt(b.replace(/\D/g, ""), 10)
                      )
                      .map((tooth) => (
                        <Tag
                          key={tooth}
                          closable={editableFields.includes("toothPositions")}
                          onClose={() =>
                            setValue(
                              "toothPositions",
                              toothPositions.filter((t) => t !== tooth)
                            )
                          }
                          color="blue"
                        >
                          {tooth}
                        </Tag>
                      ))}
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          )}

          {/* Row 3: Price, Preferential Price, Quantity, Final Price - 4 columns */}
          <Row gutter={12}>
            <Col xs={24} lg={6}>
              <Form.Item label="Đơn giá (VNĐ)">
                <Input
                  value={formatVND(service.price)}
                  disabled
                  style={{ color: "rgba(0, 0, 0, 0.85)" }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} lg={6}>
              <Controller
                name="preferentialPrice"
                control={control}
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="Giá ưu đãi (VNĐ)"
                    validateStatus={
                      fieldState.error || preferentialPriceError ? "error" : ""
                    }
                    help={
                      fieldState.error?.message || preferentialPriceError || ""
                    }
                  >
                    <InputNumber
                      {...field}
                      min={0}
                      style={{ width: "100%" }}
                      disabled={!editableFields.includes("preferentialPrice")}
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) =>
                        value?.replace(/\$\s?|(,*)/g, "") as unknown as number
                      }
                    />
                  </Form.Item>
                )}
              />
            </Col>

            <Col xs={24} lg={6}>
              <Controller
                name="quantity"
                control={control}
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="Số lượng"
                    validateStatus={fieldState.error ? "error" : ""}
                    help={fieldState.error?.message}
                  >
                    <InputNumber
                      {...field}
                      min={1}
                      style={{ width: "100%" }}
                      disabled={
                        service.consultedServiceUnit === "Răng" ||
                        !editableFields.includes("quantity")
                      }
                    />
                  </Form.Item>
                )}
              />
            </Col>

            <Col xs={24} lg={6}>
              <Form.Item label="Thành tiền (VNĐ)">
                <Input
                  value={formatVND(finalPrice)}
                  disabled
                  style={{
                    color: "rgba(0, 0, 0, 0.85)",
                    fontWeight: 600,
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Row 5: Doctors and Sale - 3 columns */}
          <Row gutter={12}>
            <Col xs={24} lg={8}>
              <Controller
                name="consultingDoctorId"
                control={control}
                render={({ field }) => (
                  <Form.Item label="Bác sĩ tư vấn">
                    <Select
                      {...field}
                      showSearch
                      placeholder="Chọn bác sĩ tư vấn"
                      optionFilterProp="label"
                      options={employeeOptions}
                      disabled={!editableFields.includes("consultingDoctorId")}
                      allowClear
                    />
                  </Form.Item>
                )}
              />
            </Col>

            <Col xs={24} lg={8}>
              <Controller
                name="treatingDoctorId"
                control={control}
                render={({ field }) => (
                  <Form.Item label="Bác sĩ điều trị">
                    <Select
                      {...field}
                      showSearch
                      placeholder="Chọn bác sĩ điều trị"
                      optionFilterProp="label"
                      options={employeeOptions}
                      disabled={!editableFields.includes("treatingDoctorId")}
                      allowClear
                    />
                  </Form.Item>
                )}
              />
            </Col>
          </Row>

          {/* Row 6: Specific Status */}
          <Row gutter={12}>
            <Col span={24}>
              <Controller
                name="specificStatus"
                control={control}
                render={({ field }) => (
                  <Form.Item label="Ghi chú tình trạng">
                    <Input.TextArea
                      {...field}
                      value={field.value || ""}
                      rows={3}
                      placeholder="Ghi chú của bác sĩ về tình trạng răng..."
                      maxLength={500}
                      showCount
                      disabled={!editableFields.includes("specificStatus")}
                    />
                  </Form.Item>
                )}
              />
            </Col>
          </Row>

          {/* Row 7: Source & Source Note */}
          <Row gutter={12}>
            <Col xs={24} lg={12}>
              <Controller
                name="source"
                control={control}
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="Nguồn khách"
                    required
                    validateStatus={fieldState.error ? "error" : ""}
                    help={fieldState.error?.message}
                  >
                    <Select
                      {...field}
                      showSearch
                      placeholder="Chọn nguồn khách"
                      options={CUSTOMER_SOURCES.map((s) => ({
                        label: s.label,
                        value: s.value,
                        desc: s.description,
                      }))}
                      optionRender={(option) => (
                        <Space
                          direction="vertical"
                          size={0}
                          style={{ width: "100%" }}
                        >
                          <span style={{ fontWeight: 500 }}>
                            {option.label}
                          </span>
                          {option.data.desc && (
                            <span
                              style={{ fontSize: "12px", color: "#8c8c8c" }}
                            >
                              {option.data.desc}
                            </span>
                          )}
                        </Space>
                      )}
                      onChange={(v) => {
                        field.onChange(v);
                        setValue("sourceNote", null);
                      }}
                      disabled={!editableFields.includes("source")}
                    />
                  </Form.Item>
                )}
              />
            </Col>
            <Col xs={24} lg={12}>
              {sourceMeta && sourceMeta.noteType !== "none" && (
                <>
                  {sourceMeta.noteType === "employee_search" ? (
                    <Controller
                      name="sourceNote"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Form.Item
                          label="Ghi chú nguồn"
                          validateStatus={fieldState.error ? "error" : ""}
                          help={fieldState.error?.message}
                        >
                          <Select
                            {...field}
                            showSearch
                            allowClear
                            placeholder="Tìm và chọn nhân viên giới thiệu"
                            options={employeeOptions}
                            filterOption={(input, option) =>
                              (option?.label ?? "")
                                .toLowerCase()
                                .includes(input.toLowerCase())
                            }
                            disabled={!editableFields.includes("sourceNote")}
                          />
                        </Form.Item>
                      )}
                    />
                  ) : sourceMeta.noteType === "customer_search" ? (
                    <Controller
                      name="sourceNote"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Form.Item
                          label="Ghi chú nguồn"
                          validateStatus={fieldState.error ? "error" : ""}
                          help={fieldState.error?.message}
                        >
                          <Select
                            {...field}
                            showSearch
                            allowClear
                            onSearch={(v) => setCustQuery(v)}
                            filterOption={false}
                            options={customerSourceOptions}
                            placeholder="Nhập tên hoặc SĐT để tìm khách (ít nhất 2 ký tự)"
                            notFoundContent={
                              custFetching ? (
                                <Spin size="small" />
                              ) : custQuery.length >= 2 ? (
                                "Không tìm thấy khách hàng"
                              ) : custQuery.length > 0 ? (
                                "Nhập ít nhất 2 ký tự"
                              ) : (
                                "Nhập để tìm kiếm"
                              )
                            }
                            disabled={!editableFields.includes("sourceNote")}
                          />
                        </Form.Item>
                      )}
                    />
                  ) : (
                    <Controller
                      name="sourceNote"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Form.Item
                          label="Ghi chú nguồn"
                          required={
                            sourceMeta.noteType === "text_input_required"
                          }
                          validateStatus={fieldState.error ? "error" : ""}
                          help={fieldState.error?.message}
                        >
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="Nhập ghi chú nguồn (nếu cần)"
                            disabled={!editableFields.includes("sourceNote")}
                          />
                        </Form.Item>
                      )}
                    />
                  )}
                </>
              )}
            </Col>
          </Row>

          {/* Admin Section */}
          {isAdmin && (
            <>
              <Divider orientation="left">Chỉnh sửa nâng cao (Admin)</Divider>

              <Row gutter={12}>
                <Col xs={24} lg={12}>
                  <Controller
                    name="serviceStatus"
                    control={control}
                    render={({ field }) => (
                      <Form.Item label="Trạng thái dịch vụ">
                        <Select
                          {...field}
                          options={[
                            { label: "Chưa chốt", value: "Chưa chốt" },
                            { label: "Đã chốt", value: "Đã chốt" },
                          ]}
                        />
                      </Form.Item>
                    )}
                  />
                </Col>

                <Col xs={24} lg={12}>
                  <Form.Item label="Trạng thái điều trị">
                    <Tag
                      color={
                        service.treatmentStatus === "Hoàn thành"
                          ? "success"
                          : service.treatmentStatus === "Đang điều trị"
                          ? "processing"
                          : "default"
                      }
                    >
                      {service.treatmentStatus}
                    </Tag>
                    <div
                      style={{ fontSize: 12, color: "#8c8c8c", marginTop: 4 }}
                    >
                      Tự động tính từ Lịch sử điều trị
                    </div>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col xs={24} lg={12}>
                  <Controller
                    name="serviceConfirmDate"
                    control={control}
                    render={({ field }) => (
                      <Form.Item label="Ngày chốt dịch vụ">
                        <DatePicker
                          value={field.value ? dayjs(field.value) : undefined}
                          onChange={(date) =>
                            field.onChange(
                              date ? date.toISOString() : undefined
                            )
                          }
                          format="DD/MM/YYYY"
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    )}
                  />
                </Col>

                <Col xs={24} lg={12}>
                  <Controller
                    name="consultationDate"
                    control={control}
                    render={({ field }) => (
                      <Form.Item label="Ngày tư vấn">
                        <DatePicker
                          value={field.value ? dayjs(field.value) : undefined}
                          onChange={(date) =>
                            field.onChange(
                              date ? date.toISOString() : undefined
                            )
                          }
                          format="DD/MM/YYYY"
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    )}
                  />
                </Col>
              </Row>

              {/* Metadata */}
              <Descriptions
                bordered
                size="small"
                column={2}
                style={{ marginTop: 8 }}
              >
                <Descriptions.Item label="Tạo bởi">
                  {service.createdBy?.fullName || "System"}
                </Descriptions.Item>
                <Descriptions.Item label="Tạo lúc">
                  {dayjs(service.createdAt).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>
                <Descriptions.Item label="Cập nhật bởi">
                  {service.updatedBy?.fullName || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Cập nhật lúc">
                  {service.updatedAt
                    ? dayjs(service.updatedAt).format("DD/MM/YYYY HH:mm")
                    : "—"}
                </Descriptions.Item>
              </Descriptions>
            </>
          )}

          {/* Validation summary */}
          {Object.keys(errors).length > 0 && (
            <Alert
              message="Vui lòng kiểm tra lại các trường đã nhập"
              type="error"
              showIcon
              style={{ marginTop: 8 }}
            />
          )}
        </Form>
      </Modal>

      {/* Tooth Selector Modal */}
      <ToothSelectorModal
        open={toothSelectorOpen}
        value={toothPositions}
        onOk={handleToothSelectorOk}
        onCancel={() => setToothSelectorOpen(false)}
      />
    </>
  );
}
