"use client";

import React, { useEffect, useMemo } from "react";
import {
  Modal,
  Form,
  Row,
  Col,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Spin,
} from "antd";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import viVN from "antd/es/date-picker/locale/vi_VN";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCustomersSearch } from "@/features/customers/hooks/useCustomerSearch";
import { useWorkingEmployees } from "@/features/employees/hooks/useWorkingEmployees";
import { useSuppliers } from "@/features/suppliers/hooks/useSuppliers";
import { useLaboItems } from "@/features/labo-items/hooks/useLaboItems";
import { useLaboServices } from "@/features/labo-services/hooks/useLaboServices";
import type {
  CreateLaboOrderFormData,
  CreateLaboOrderRequest,
} from "@/shared/validation/labo-order.schema";
import { CreateLaboOrderFormSchema } from "@/shared/validation/labo-order.schema";
import { LABO_ORDER_TYPE_OPTIONS } from "../constants";

dayjs.locale("vi");

type Props = {
  open: boolean;
  confirmLoading?: boolean;
  selectedClinicId?: string; // From clinic tabs (admin only)
  prefilledCustomer?: {
    // Pre-fill customer (for Customer Detail view)
    id: string;
    customerCode: string | null;
    fullName: string;
    phone: string | null;
  };
  onCancel: () => void;
  onSubmit: (payload: CreateLaboOrderRequest) => void;
};

export function CreateLaboOrderModal({
  open,
  // selectedClinicId,
  prefilledCustomer,
  confirmLoading,
  onCancel,
  onSubmit,
}: Props) {
  // const { user: currentUser } = useCurrentUser();

  const defaultValues = useMemo(
    () => ({
      customerId: prefilledCustomer?.id || "",
      doctorId: "",
      treatmentDate: "",
      orderType: "",
      supplierId: "",
      laboItemId: "",
      quantity: 1,
      sentById: "",
      expectedFitDate: "",
      detailRequirement: "",
    }),
    [prefilledCustomer?.id]
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<CreateLaboOrderFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(CreateLaboOrderFormSchema) as any,
    mode: "onBlur",
    defaultValues,
  });

  // Watch fields for dependent logic
  const supplierId = watch("supplierId");
  const laboItemId = watch("laboItemId");

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, reset, defaultValues]);

  // Customer search with debounce
  const [customerQuery, setCustomerQuery] = React.useState("");
  const [debouncedCustomerQuery, setDebouncedCustomerQuery] =
    React.useState("");

  // Reset customer search when modal opens with prefilled customer
  useEffect(() => {
    if (open && prefilledCustomer) {
      setCustomerQuery("");
      setDebouncedCustomerQuery("");
    }
  }, [open, prefilledCustomer]);

  // Debounce customer search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCustomerQuery(customerQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [customerQuery]);

  const { data: customerSearchResults = [], isFetching: customerFetching } =
    useCustomersSearch({
      q: debouncedCustomerQuery,
      limit: 20,
    });

  // Customer select options - combine prefilled customer with search results
  const customerSelectOptions = useMemo(() => {
    // CASE 1: Prefilled customer (Customer Detail view)
    if (prefilledCustomer) {
      return [
        {
          label: `${prefilledCustomer.customerCode || ""} - ${
            prefilledCustomer.fullName
          }${prefilledCustomer.phone ? ` (${prefilledCustomer.phone})` : ""}`,
          value: prefilledCustomer.id,
        },
      ];
    }

    // CASE 2: Search results (Daily/List view)
    return customerSearchResults.map((c) => ({
      label: `${c.customerCode || ""} - ${c.fullName}${
        c.phone ? ` (${c.phone})` : ""
      }`,
      value: c.id,
    }));
  }, [prefilledCustomer, customerSearchResults]);

  // Working employees (doctors)
  const { data: employeesData } = useWorkingEmployees();
  const doctorOptions = useMemo(() => {
    if (!employeesData) return [];
    return employeesData.map((emp) => ({
      label: emp.fullName,
      value: emp.id,
    }));
  }, [employeesData]);

  // Suppliers (labo-xuong-rang-gia)
  const { data: suppliersData } = useSuppliers(false);
  const supplierOptions = useMemo(() => {
    if (!suppliersData) return [];
    return suppliersData
      .filter((s) => s.supplierGroup === "labo-xuong-rang-gia")
      .map((s) => ({
        label: s.shortName || s.name,
        value: s.id,
      }));
  }, [suppliersData]);

  // Labo Services - Load khi đã chọn supplier
  const { data: laboServicesData = [] } = useLaboServices(false, {
    supplierId: supplierId || undefined,
  });

  // Labo Items - Filter theo những item có trong LaboServices của supplier đã chọn
  const { data: allLaboItemsData } = useLaboItems(false);
  const laboItemOptions = useMemo(() => {
    if (!supplierId || !allLaboItemsData || laboServicesData.length === 0) {
      return [];
    }

    // Get laboItemIds from LaboServices of selected supplier
    const availableLaboItemIds = new Set(
      laboServicesData.map((service) => service.laboItemId)
    );

    // Filter LaboItems
    return allLaboItemsData
      .filter((item) => availableLaboItemIds.has(item.id))
      .map((item) => ({
        label: `${item.name} (${item.unit})`,
        value: item.id,
      }));
  }, [supplierId, allLaboItemsData, laboServicesData]);

  // Reset laboItemId khi supplierId thay đổi
  useEffect(() => {
    if (supplierId) {
      setValue("laboItemId", "");
    }
  }, [supplierId, setValue]);

  // Get selected LaboService để hiển thị thông tin giá và bảo hành
  const selectedLaboService = useMemo(() => {
    if (!supplierId || !laboItemId || laboServicesData.length === 0) {
      return null;
    }
    return (
      laboServicesData.find(
        (service) =>
          service.supplierId === supplierId && service.laboItemId === laboItemId
      ) || null
    );
  }, [supplierId, laboItemId, laboServicesData]);

  // Format warranty display (e.g., "5-nam" → "5 năm")
  const formatWarranty = (warranty: string) => {
    return warranty.replace(/-/g, " ");
  };

  const onValid = (formData: CreateLaboOrderFormData) => {
    const payload: CreateLaboOrderRequest = {
      ...formData,
      expectedFitDate: formData.expectedFitDate
        ? dayjs(formData.expectedFitDate).format("YYYY-MM-DD")
        : null,
    };
    onSubmit(payload);
  };

  return (
    <Modal
      title="Tạo đơn hàng labo"
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit(onValid)}
      confirmLoading={confirmLoading || isSubmitting}
      width="70%"
      styles={{
        content: { maxHeight: "85vh" },
        body: { maxHeight: "65vh", overflowY: "auto", paddingInline: 16 },
      }}
      destroyOnHidden
      maskClosable={false}
    >
      <Form layout="vertical" requiredMark>
        {/* Row 1: Customer, Doctor */}
        <Row gutter={12}>
          <Col xs={24} lg={12}>
            <Controller
              name="customerId"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Khách hàng"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  {prefilledCustomer ? (
                    // CASE 1: Prefilled customer - Show as disabled Input
                    <>
                      <Input
                        value={`${prefilledCustomer.customerCode || ""} - ${
                          prefilledCustomer.fullName
                        }${
                          prefilledCustomer.phone
                            ? ` (${prefilledCustomer.phone})`
                            : ""
                        }`}
                        disabled
                        style={{ color: "rgba(0, 0, 0, 0.85)" }}
                      />
                      <input
                        type="hidden"
                        {...field}
                        value={prefilledCustomer.id}
                      />
                    </>
                  ) : (
                    // CASE 2: Normal mode - Show searchable Select
                    <Select
                      {...field}
                      showSearch
                      placeholder="Tìm kiếm khách hàng..."
                      filterOption={false}
                      onSearch={setCustomerQuery}
                      notFoundContent={
                        customerFetching ? (
                          <Spin size="small" />
                        ) : customerQuery.length >= 2 ? (
                          "Không tìm thấy khách hàng"
                        ) : customerQuery.length > 0 ? (
                          "Nhập ít nhất 2 ký tự"
                        ) : (
                          "Nhập để tìm kiếm"
                        )
                      }
                      options={customerSelectOptions}
                    />
                  )}
                </Form.Item>
              )}
            />
          </Col>

          <Col xs={24} lg={12}>
            <Controller
              name="doctorId"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Bác sĩ"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    showSearch
                    placeholder="Chọn bác sĩ"
                    optionFilterProp="label"
                    options={doctorOptions}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Row 2: Treatment Date, Order Type, Sent By */}
        <Row gutter={12}>
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
                    value={field.value ? dayjs(field.value) : undefined}
                    onChange={(d) =>
                      field.onChange(d ? d.format("YYYY-MM-DD") : "")
                    }
                    locale={viVN}
                    style={{ width: "100%" }}
                    placeholder="Chọn ngày điều trị"
                  />
                </Form.Item>
              )}
            />
          </Col>

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
                    placeholder="Chọn loại đơn hàng"
                    options={[...LABO_ORDER_TYPE_OPTIONS]}
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
                    showSearch
                    placeholder="Chọn người gửi mẫu"
                    optionFilterProp="label"
                    options={doctorOptions}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Row 3: Supplier, Labo Item */}
        <Row gutter={12}>
          <Col xs={24} lg={12}>
            <Controller
              name="supplierId"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Xưởng labo"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    showSearch
                    placeholder="Chọn xưởng labo"
                    optionFilterProp="label"
                    options={supplierOptions}
                  />
                </Form.Item>
              )}
            />
          </Col>

          <Col xs={24} lg={12}>
            <Controller
              name="laboItemId"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Loại răng giả"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    showSearch
                    placeholder={
                      supplierId
                        ? "Chọn loại răng giả"
                        : "Vui lòng chọn xưởng trước"
                    }
                    disabled={!supplierId}
                    optionFilterProp="label"
                    options={laboItemOptions}
                    notFoundContent={
                      supplierId && laboItemOptions.length === 0
                        ? "Xưởng này chưa có bảng giá dịch vụ"
                        : undefined
                    }
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Hiển thị thông tin bảo hành khi đã chọn cả supplier và labo item */}
        {selectedLaboService && (
          <Row gutter={12} style={{ marginBottom: 16 }}>
            <Col span={24}>
              <div
                style={{
                  padding: "12px 16px",
                  background: "#f0f5ff",
                  border: "1px solid #adc6ff",
                  borderRadius: 6,
                }}
              >
                <strong>Thông tin bảo hành:</strong>{" "}
                <span>
                  🛡️{" "}
                  <strong>
                    {formatWarranty(selectedLaboService.warranty)}
                  </strong>
                </span>
              </div>
            </Col>
          </Row>
        )}

        {/* Row 4: Quantity, Expected Fit Date */}
        <Row gutter={12}>
          <Col xs={24} lg={12}>
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
                  />
                </Form.Item>
              )}
            />
          </Col>

          <Col xs={24} lg={12}>
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
                    value={field.value ? dayjs(field.value) : undefined}
                    onChange={(d) =>
                      field.onChange(d ? d.format("YYYY-MM-DD") : "")
                    }
                    locale={viVN}
                    style={{ width: "100%" }}
                    placeholder="Chọn ngày hẹn lắp"
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Row 5: Detail Requirement */}
        <Row gutter={12}>
          <Col xs={24}>
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
                    placeholder="Ghi chú yêu cầu chi tiết cho xưởng..."
                    maxLength={1000}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
