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
  Alert,
  InputNumber,
  Spin,
} from "antd";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import viVN from "antd/es/date-picker/locale/vi_VN";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCurrentUser } from "@/shared/providers";
import { useCustomersSearch } from "@/features/customers/hooks/useCustomerSearch";
import { useWorkingEmployees } from "@/features/employees/hooks/useWorkingEmployees";
import { useClinics } from "@/features/clinics/hooks/useClinics";
import { useDentistAvailability } from "../hooks/useDentistAvailability";
import { APPOINTMENT_STATUS_OPTIONS } from "../constants";
import { getAppointmentDateTimePickerConfig } from "../utils/dateTimePickerConfig";
import type {
  CreateAppointmentFormData,
  CreateAppointmentRequest,
} from "@/shared/validation/appointment.schema";
import { CreateAppointmentFormSchema } from "@/shared/validation/appointment.schema";

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
  onSubmit: (payload: CreateAppointmentRequest) => void;
};

export default function CreateAppointmentModal({
  open,
  selectedClinicId,
  prefilledCustomer,
  confirmLoading,
  onCancel,
  onSubmit,
}: Props) {
  const { user: currentUser } = useCurrentUser();

  // Determine default clinic (Employee: session clinic, Admin: selected clinic from tabs)
  const defaultClinicId = selectedClinicId || currentUser?.clinicId || "";

  const defaultValues = useMemo(
    () => ({
      clinicId: defaultClinicId,
      status: "Chờ xác nhận" as const,
      duration: 30,
      appointmentDateTime: "",
      customerId: prefilledCustomer?.id || "",
      primaryDentistId: "",
      secondaryDentistId: undefined,
      notes: "",
    }),
    [defaultClinicId, prefilledCustomer?.id]
  );

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<CreateAppointmentFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(CreateAppointmentFormSchema) as any, // Type assertion needed due to Zod default values
    mode: "onBlur",
    defaultValues,
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, reset, defaultValues]);

  // Watch fields for dependent logic
  const appointmentDateTime = watch("appointmentDateTime");
  const duration = watch("duration") as number;
  const primaryDentistId = watch("primaryDentistId") as string;

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

  // Working employees - Show all (no clinic filter)
  const { data: employeesData } = useWorkingEmployees();
  const dentistOptions = useMemo(() => {
    if (!employeesData) return [];
    return employeesData.map((emp) => ({
      label: emp.fullName,
      value: emp.id,
    }));
  }, [employeesData]);

  // Clinics (for admin)
  const { data: clinicsData } = useClinics();
  const clinicOptions = useMemo(() => {
    if (!clinicsData) return [];
    return clinicsData.map((clinic) => ({
      label: `${clinic.clinicCode}`,
      value: clinic.id,
    }));
  }, [clinicsData]);

  // Dentist availability check (soft warning)
  const { data: availabilityData } = useDentistAvailability(
    primaryDentistId && appointmentDateTime && duration
      ? {
          dentistId: primaryDentistId,
          datetime: dayjs(appointmentDateTime).toISOString(),
          duration,
        }
      : undefined
  );

  const onValid = (formData: CreateAppointmentFormData) => {
    // Convert form data to API payload
    const payload: CreateAppointmentRequest = {
      ...formData,
      appointmentDateTime: dayjs(formData.appointmentDateTime).toDate(),
    };
    onSubmit(payload);
  };

  const hasConflicts = availabilityData && !availabilityData.available;

  return (
    <Modal
      title="Tạo lịch hẹn"
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit(onValid)}
      confirmLoading={confirmLoading || isSubmitting}
      width="65%"
      styles={{
        content: { maxHeight: "85vh" },
        body: { maxHeight: "60vh", overflowY: "auto", paddingInline: 16 },
      }}
      destroyOnHidden
      maskClosable={false}
    >
      <Form layout="vertical" requiredMark>
        {/* Row 1: Customer, DateTime, Duration */}
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
                    // CASE 1: Prefilled customer (Customer Detail view) - Show as disabled Input
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
                        style={{ color: "rgba(0, 0, 0, 0.85)" }} // Override disabled text color
                      />
                      {/* Hidden field to hold the actual customerId value */}
                      <input
                        type="hidden"
                        {...field}
                        value={prefilledCustomer.id}
                      />
                    </>
                  ) : (
                    // CASE 2: Normal mode (Daily/List view) - Show searchable Select
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

          <Col xs={24} lg={6}>
            <Controller
              name="appointmentDateTime"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Thời gian hẹn"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <DatePicker
                    showTime={getAppointmentDateTimePickerConfig()}
                    format="DD/MM/YYYY HH:mm"
                    value={field.value ? dayjs(field.value) : undefined}
                    onChange={(d) =>
                      field.onChange(d ? d.format("YYYY-MM-DD HH:mm") : "")
                    }
                    locale={viVN}
                    style={{ width: "100%" }}
                    disabledDate={(current) =>
                      current && current < dayjs().startOf("day")
                    }
                  />
                </Form.Item>
              )}
            />
          </Col>

          <Col xs={24} lg={6}>
            <Controller
              name="duration"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Thời lượng (phút)"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <InputNumber
                    {...field}
                    min={1}
                    max={480}
                    placeholder="Nhập thời lượng"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Row 2: Primary Dentist, Secondary Dentist, Clinic */}
        <Row gutter={12}>
          <Col xs={24} lg={12}>
            <Controller
              name="primaryDentistId"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Bác sĩ chính"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    showSearch
                    placeholder="Chọn bác sĩ chính"
                    optionFilterProp="label"
                    options={dentistOptions}
                  />
                </Form.Item>
              )}
            />
          </Col>

          <Col xs={24} lg={12}>
            <Controller
              name="secondaryDentistId"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Bác sĩ phụ"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    showSearch
                    placeholder="Chọn bác sĩ phụ (không bắt buộc)"
                    optionFilterProp="label"
                    options={dentistOptions}
                    allowClear
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Row 3: Status, Notes */}
        <Row gutter={12}>
          <Col xs={24} lg={12}>
            <Controller
              name="clinicId"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Chi nhánh"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    placeholder="Chọn chi nhánh"
                    options={clinicOptions}
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={24} lg={12}>
            <Controller
              name="status"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Trạng thái"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    disabled={currentUser?.role !== "admin"}
                    options={[...APPOINTMENT_STATUS_OPTIONS]}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
        <Row gutter={12}>
          <Col xs={24} lg={24}>
            <Controller
              name="notes"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Ghi chú"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input.TextArea
                    {...field}
                    value={field.value || ""}
                    rows={2}
                    placeholder="Ghi chú cho lịch hẹn..."
                    maxLength={500}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Dentist Availability Warning (Soft) */}
        {hasConflicts && (
          <Alert
            type="warning"
            message="Bác sĩ đã có lịch hẹn trong khung giờ này"
            description={
              <div>
                <p style={{ marginBottom: 8 }}>
                  Bác sĩ có {availabilityData.conflicts.length} lịch hẹn trùng
                  thời gian:
                </p>
                <ul style={{ marginBottom: 0 }}>
                  {availabilityData.conflicts.map((conflict) => (
                    <li key={conflict.id}>
                      {dayjs(conflict.appointmentDateTime).format(
                        "HH:mm DD/MM/YYYY"
                      )}{" "}
                      - {conflict.customerName} ({conflict.duration} phút)
                    </li>
                  ))}
                </ul>
                <p style={{ marginTop: 8, marginBottom: 0 }}>
                  Bạn vẫn có thể tiếp tục tạo lịch hẹn.
                </p>
              </div>
            }
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Form>
    </Modal>
  );
}
