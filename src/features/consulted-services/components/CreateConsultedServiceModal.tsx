// src/features/consulted-services/components/CreateConsultedServiceModal.tsx
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
  Tag,
  Space,
  Spin,
} from "antd";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDentalServices } from "@/features/dental-services/hooks/useDentalServices";
import { useWorkingEmployees } from "@/features/employees/hooks/useWorkingEmployees";
import { CUSTOMER_SOURCES } from "@/features/customers/constants";
import { useCustomersSearch } from "@/features/customers/hooks/useCustomerSearch";
import ToothSelectorModal from "./ToothSelectorModal";
import type { CreateConsultedServiceRequest } from "@/shared/validation/consulted-service.schema";

// Form schema matching frontend validation from requirement
const CreateConsultedServiceFormSchema = z.object({
  dentalServiceId: z.string().min(1, "Vui lòng chọn dịch vụ"),
  quantity: z.number().int().min(1, "Số lượng tối thiểu là 1"),
  preferentialPrice: z.number().int().min(0, "Giá ưu đãi không thể âm"),
  toothPositions: z.array(z.string()),
  consultingDoctorId: z.string().optional().nullable(),
  consultingSaleId: z.string().optional().nullable(),
  treatingDoctorId: z.string().optional().nullable(),
  specificStatus: z.string().optional().nullable(),
  source: z.string().min(1, "Vui lòng chọn nguồn khách"),
  sourceNote: z.string().optional().nullable(),
});

type FormData = z.infer<typeof CreateConsultedServiceFormSchema>;

type Props = {
  open: boolean;
  confirmLoading?: boolean;
  // Pre-filled customer info from today's checked-in list
  customer: {
    id: string;
    customerCode: string | null;
    fullName: string;
  };
  clinicId: string;
  onCancel: () => void;
  onSubmit: (payload: CreateConsultedServiceRequest) => void;
};

export default function CreateConsultedServiceModal({
  open,
  confirmLoading,
  customer,
  clinicId,
  onCancel,
  onSubmit,
}: Props) {
  const [toothSelectorOpen, setToothSelectorOpen] = useState(false);

  const defaultValues: FormData = useMemo(
    () => ({
      dentalServiceId: "",
      quantity: 1,
      preferentialPrice: 0,
      toothPositions: [],
      consultingDoctorId: null,
      consultingSaleId: null,
      treatingDoctorId: null,
      specificStatus: "",
      source: "",
      sourceNote: null,
    }),
    []
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(CreateConsultedServiceFormSchema),
    defaultValues,
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, reset, defaultValues]);

  // Watch fields for reactive logic
  const dentalServiceId = watch("dentalServiceId");
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
  const { data: dentalServices = [] } = useDentalServices(false);
  const { data: employees = [] } = useWorkingEmployees();

  // Filter by clinic
  const clinicDentalServices = useMemo(() => {
    // Note: DentalService from API doesn't have clinicId exposed
    // In reality, services are already filtered by clinic in the API
    // For now, return all services
    return dentalServices;
  }, [dentalServices]);

  // Service options for Select
  const serviceOptions = useMemo(() => {
    return clinicDentalServices.map((s) => ({
      label: s.name,
      value: s.id,
    }));
  }, [clinicDentalServices]);

  // Employee options for Select - Tất cả nhân viên, không filter theo cơ sở
  const employeeOptions = useMemo(() => {
    return employees.map((e) => ({
      label: e.fullName,
      value: e.id,
    }));
  }, [employees]);

  // Selected service data
  const selectedService = useMemo(() => {
    if (!dentalServiceId) return null;
    return clinicDentalServices.find((s) => s.id === dentalServiceId);
  }, [dentalServiceId, clinicDentalServices]);

  // Auto-fill logic when service changes
  useEffect(() => {
    if (selectedService) {
      // Auto-fill preferentialPrice to service price
      setValue("preferentialPrice", selectedService.price);

      // Reset tooth positions when service changes
      setValue("toothPositions", []);

      // Reset quantity
      if (selectedService.unit === "Răng") {
        setValue("quantity", 0); // Will be auto-calculated from tooth positions
      } else {
        setValue("quantity", 1);
      }
    }
  }, [selectedService, setValue]);

  // Auto-calculate quantity when tooth positions change (if unit is Răng)
  useEffect(() => {
    if (selectedService?.unit === "Răng") {
      setValue("quantity", toothPositions.length);
    }
  }, [toothPositions, selectedService, setValue]);

  // Calculate finalPrice
  const finalPrice = useMemo(() => {
    return preferentialPrice * quantity;
  }, [preferentialPrice, quantity]);

  // Validate preferentialPrice range
  const preferentialPriceError = useMemo(() => {
    if (!selectedService) return null;
    const minPrice = selectedService.minPrice ?? 0;
    const price = selectedService.price;

    // Valid: 0 (free) OR [minPrice, price]
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
  }, [selectedService, preferentialPrice]);

  const onValid = (formData: FormData) => {
    // Final validation
    if (preferentialPriceError) {
      return;
    }

    // Validate tooth positions (for Răng unit)
    if (
      selectedService?.unit === "Răng" &&
      formData.toothPositions.length === 0
    ) {
      return;
    }

    // Build payload
    const payload: CreateConsultedServiceRequest = {
      customerId: customer.id,
      clinicId,
      dentalServiceId: formData.dentalServiceId,
      quantity: formData.quantity,
      preferentialPrice: formData.preferentialPrice,
      toothPositions: formData.toothPositions,
      consultingDoctorId: formData.consultingDoctorId || null,
      consultingSaleId: formData.consultingSaleId || null,
      treatingDoctorId: formData.treatingDoctorId || null,
      specificStatus: formData.specificStatus || null,
      source: formData.source,
      sourceNote: formData.sourceNote || null,
    };

    onSubmit(payload);
  };

  const handleToothSelectorOk = (selected: string[]) => {
    setValue("toothPositions", selected);
    setToothSelectorOpen(false);
  };

  // Format VND currency
  const formatVND = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);

  return (
    <>
      <Modal
        title="Thêm dịch vụ tư vấn"
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
          {/* Customer info (read-only) */}
          <Alert
            message={`Khách hàng: ${customer.customerCode || ""} - ${
              customer.fullName
            }`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* Row 1: Service, Unit */}
          <Row gutter={12}>
            <Col xs={24} lg={16}>
              <Controller
                name="dentalServiceId"
                control={control}
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="Dịch vụ"
                    required
                    validateStatus={fieldState.error ? "error" : ""}
                    help={fieldState.error?.message}
                  >
                    <Select
                      {...field}
                      showSearch
                      placeholder="Chọn dịch vụ"
                      optionFilterProp="label"
                      options={serviceOptions}
                      filterOption={(input, option) =>
                        (option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    />
                  </Form.Item>
                )}
              />
            </Col>

            <Col xs={24} lg={8}>
              <Form.Item label="Đơn vị">
                <Input
                  value={selectedService?.unit || ""}
                  disabled
                  placeholder="Đơn vị"
                  style={{ color: "rgba(0, 0, 0, 0.85)" }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Row 2: Tooth positions (conditional) */}
          {selectedService?.unit === "Răng" && (
            <Row gutter={12}>
              <Col span={24}>
                <Form.Item label="Vị trí răng" required>
                  <Space size={[8, 8]} wrap style={{ width: "100%" }}>
                    <Button
                      onClick={() => setToothSelectorOpen(true)}
                      type={toothPositions.length > 0 ? "primary" : "default"}
                      size="small"
                    >
                      Chọn vị trí răng ({toothPositions.length})
                    </Button>

                    {[...toothPositions]
                      .sort((a, b) => {
                        const numA = parseInt(a.replace(/\D/g, ""), 10);
                        const numB = parseInt(b.replace(/\D/g, ""), 10);
                        return numA - numB;
                      })
                      .map((tooth) => (
                        <Tag
                          key={tooth}
                          color="blue"
                          closable
                          onClose={() => {
                            setValue(
                              "toothPositions",
                              toothPositions.filter((t) => t !== tooth)
                            );
                          }}
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
                  value={
                    selectedService ? formatVND(selectedService.price) : ""
                  }
                  disabled
                  style={{ color: "rgba(0, 0, 0, 0.85)" }}
                  placeholder="Đơn giá"
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
                      fieldState.error?.message ||
                      preferentialPriceError ||
                      (selectedService
                        ? `Min: ${formatVND(selectedService.minPrice ?? 0)}`
                        : "")
                    }
                  >
                    <InputNumber
                      {...field}
                      min={0}
                      style={{ width: "100%" }}
                      placeholder="Giá ưu đãi"
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
                      placeholder="Số lượng"
                      disabled={selectedService?.unit === "Răng"}
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
                      allowClear
                    />
                  </Form.Item>
                )}
              />
            </Col>

            <Col xs={24} lg={8}>
              <Controller
                name="consultingSaleId"
                control={control}
                render={({ field }) => (
                  <Form.Item
                    label="Sale tư vấn"
                    help={
                      selectedService && !selectedService.requiresFollowUp
                        ? "Dịch vụ này không yêu cầu follow-up"
                        : undefined
                    }
                  >
                    <Select
                      {...field}
                      showSearch
                      placeholder="Chọn sale tư vấn"
                      optionFilterProp="label"
                      options={employeeOptions}
                      allowClear
                      disabled={
                        !!(selectedService && !selectedService.requiresFollowUp)
                      }
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
                          />
                        </Form.Item>
                      )}
                    />
                  )}
                </>
              )}
            </Col>
          </Row>

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
