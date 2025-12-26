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
  Descriptions,
  Divider,
  InputNumber,
  Typography,
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
import { appointmentPermissions } from "@/shared/permissions/appointment.permissions";
import type {
  UpdateAppointmentFormData,
  UpdateAppointmentRequest,
  AppointmentResponse,
} from "@/shared/validation/appointment.schema";
import { UpdateAppointmentFormSchema } from "@/shared/validation/appointment.schema";

dayjs.locale("vi");

const { Text } = Typography;

type Props = {
  open: boolean;
  confirmLoading?: boolean;
  appointment: AppointmentResponse;
  onCancel: () => void;
  onSubmit: (payload: UpdateAppointmentRequest, appointmentId: string) => void;
};

export default function UpdateAppointmentModal({
  open,
  appointment,
  confirmLoading,
  onCancel,
  onSubmit,
}: Props) {
  const { user: currentUser } = useCurrentUser();
  const isAdmin = currentUser?.role === "admin";

  // Determine timeline for alerts/warnings
  const appointmentDate = dayjs(appointment.appointmentDateTime);
  const today = dayjs().startOf("day");
  const isPast = appointmentDate.isBefore(today);
  const isToday = appointmentDate.isSame(today, "day");

  // Get field-level permissions based on timeline, status, and role
  const {
    canEditCustomer,
    canEditDateTime,
    canEditDuration,
    canEditPrimaryDentist,
    canEditSecondaryDentist,
    canEditClinic,
    canEditStatus,
    canEditNotes,
    canEditCheckInTime,
    canEditCheckOutTime,
  } = appointmentPermissions.getFieldPermissions(currentUser, appointment);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<UpdateAppointmentFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(UpdateAppointmentFormSchema) as any,
    mode: "onBlur",
    defaultValues: {
      clinicId: appointment.clinicId,
      customerId: appointment.customerId,
      primaryDentistId: appointment.primaryDentistId,
      secondaryDentistId: appointment.secondaryDentistId || undefined,
      appointmentDateTime: appointment.appointmentDateTime,
      duration: appointment.duration,
      status: appointment.status,
      notes: appointment.notes || "",
      checkInTime: appointment.checkInTime
        ? dayjs(appointment.checkInTime).format("YYYY-MM-DD HH:mm")
        : undefined,
      checkOutTime: appointment.checkOutTime
        ? dayjs(appointment.checkOutTime).format("YYYY-MM-DD HH:mm")
        : undefined,
    },
  });

  // Watch fields for dependent logic
  const appointmentDateTime = watch("appointmentDateTime");
  const duration = watch("duration") as number;
  const primaryDentistId = watch("primaryDentistId") as string;

  // Customer search with debounce
  const [customerQuery, setCustomerQuery] = React.useState("");
  const [debouncedCustomerQuery, setDebouncedCustomerQuery] =
    React.useState("");

  // Debounce customer search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCustomerQuery(customerQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [customerQuery]);

  const { data: customerOptions = [], isFetching: customerFetching } =
    useCustomersSearch({
      q: debouncedCustomerQuery,
      limit: 20,
    });

  // Combine current customer with search results (ensure current customer always appears)
  const customerSelectOptions = useMemo(() => {
    const currentCustomerOption = {
      label: `${appointment.customer.customerCode || ""} - ${
        appointment.customer.fullName
      }${appointment.customer.phone ? ` (${appointment.customer.phone})` : ""}`,
      value: appointment.customer.id,
    };

    // If no search query, show only current customer
    if (!debouncedCustomerQuery || debouncedCustomerQuery.length < 2) {
      return [currentCustomerOption];
    }

    // Add current customer to search results if not already present
    const searchResults = customerOptions.map((c) => ({
      label: `${c.customerCode || ""} - ${c.fullName}${
        c.phone ? ` (${c.phone})` : ""
      }`,
      value: c.id,
    }));

    const hasCurrentCustomer = searchResults.some(
      (opt) => opt.value === appointment.customer.id
    );

    return hasCurrentCustomer
      ? searchResults
      : [currentCustomerOption, ...searchResults];
  }, [customerOptions, debouncedCustomerQuery, appointment.customer]);

  // Working employees - Show all (no clinic filter)
  const { data: employeesData } = useWorkingEmployees();
  const dentistOptions = useMemo(() => {
    if (!employeesData) return [];
    return employeesData.map((emp) => ({
      label: emp.fullName,
      value: emp.id,
    }));
  }, [employeesData]);

  // Clinics
  const { data: clinicsData } = useClinics();
  const clinicOptions = useMemo(() => {
    if (!clinicsData) return [];
    return clinicsData.map((clinic) => ({
      label: clinic.shortName,
      value: clinic.id,
    }));
  }, [clinicsData]);

  // Dentist availability check (soft warning)
  const shouldCheckAvailability =
    !!appointmentDateTime && !!duration && !!primaryDentistId;
  const { data: availabilityData, isLoading: checkingAvailability } =
    useDentistAvailability(
      shouldCheckAvailability
        ? {
            dentistId: primaryDentistId,
            datetime: appointmentDateTime,
            duration,
            excludeAppointmentId: appointment.id,
          }
        : undefined
    );

  const hasConflicts =
    availabilityData &&
    !availabilityData.available &&
    availabilityData.conflicts &&
    availabilityData.conflicts.length > 0;

  // Memoize defaultValues to prevent infinite loop
  const defaultValues = useMemo(
    () => ({
      clinicId: appointment.clinicId,
      customerId: appointment.customerId,
      primaryDentistId: appointment.primaryDentistId,
      secondaryDentistId: appointment.secondaryDentistId || undefined,
      appointmentDateTime: appointment.appointmentDateTime,
      duration: appointment.duration,
      status: appointment.status,
      notes: appointment.notes || "",
      checkInTime: appointment.checkInTime
        ? dayjs(appointment.checkInTime).format("YYYY-MM-DD HH:mm")
        : undefined,
      checkOutTime: appointment.checkOutTime
        ? dayjs(appointment.checkOutTime).format("YYYY-MM-DD HH:mm")
        : undefined,
    }),
    [appointment]
  );

  // Reset form when modal opens or appointment changes
  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, defaultValues, reset]);

  const handleFormSubmit = (data: UpdateAppointmentFormData) => {
    const payload: UpdateAppointmentRequest = {
      clinicId: data.clinicId,
      customerId: data.customerId,
      primaryDentistId: data.primaryDentistId,
      secondaryDentistId: data.secondaryDentistId,
      appointmentDateTime: new Date(data.appointmentDateTime),
      duration: data.duration,
      notes: data.notes,
    };

    // Only include status if user has permission to edit it
    if (canEditStatus) {
      payload.status = data.status;
    }

    // Only include checkIn/checkOut times if user has permission (Admin only)
    if (canEditCheckInTime) {
      payload.checkInTime = data.checkInTime
        ? new Date(data.checkInTime)
        : null;
    }
    if (canEditCheckOutTime) {
      payload.checkOutTime = data.checkOutTime
        ? new Date(data.checkOutTime)
        : null;
    }

    onSubmit(payload, appointment.id);
  };

  return (
    <Modal
      title={`Cập nhật lịch hẹn - ${appointment.customer.fullName}`}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit(handleFormSubmit)}
      confirmLoading={confirmLoading || isSubmitting}
      width="65%"
      styles={{
        content: { maxHeight: "85vh" },
        body: { maxHeight: "60vh", overflowY: "auto", paddingInline: 16 },
      }}
      destroyOnHidden
      maskClosable={false}
      okText="Cập nhật"
      cancelText="Hủy"
    >
      <Form layout="vertical" requiredMark style={{ marginTop: 16 }}>
        {/* Warning Alerts */}
        {isPast && (
          <Alert
            type="warning"
            message="Lịch hẹn đã qua"
            description={
              isAdmin
                ? "Bạn có thể chỉnh sửa tất cả các trường với quyền Admin."
                : "Lịch hẹn trong quá khứ không thể chỉnh sửa."
            }
            style={{ marginBottom: 16 }}
            showIcon
          />
        )}

        {isToday && !isAdmin && (
          <Alert
            type="info"
            message="Lịch hẹn hôm nay"
            description="Một số trường bị khóa vì lịch hẹn diễn ra trong ngày."
            style={{ marginBottom: 16 }}
            showIcon
          />
        )}

        {/* Row 1: Customer, DateTime, Duration - Matching CreateModal */}
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
                  <Select
                    {...field}
                    showSearch
                    placeholder="Tìm kiếm khách hàng..."
                    filterOption={false}
                    onSearch={setCustomerQuery}
                    disabled={!canEditCustomer}
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
                    disabled={!canEditDateTime}
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
                    disabled={!canEditDuration}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Row 2: Primary Dentist, Secondary Dentist */}
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
                    disabled={!canEditPrimaryDentist}
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
                    disabled={!canEditSecondaryDentist}
                    allowClear
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Row 3: Clinic, Status */}
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
                    disabled={!canEditClinic}
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
                    options={[...APPOINTMENT_STATUS_OPTIONS]}
                    disabled={!canEditStatus}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Row 4: Notes */}
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
                    disabled={!canEditNotes}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Admin Only Section - CheckIn/CheckOut */}
        {(canEditCheckInTime || canEditCheckOutTime) && (
          <>
            <Divider orientation="left">
              <Text type="secondary">Chỉnh sửa nâng cao (Admin)</Text>
            </Divider>

            {/* Row 5: CheckIn, CheckOut */}
            <Row gutter={12}>
              <Col xs={24} lg={12}>
                <Controller
                  name="checkInTime"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Form.Item
                      label="Giờ check-in"
                      validateStatus={fieldState.error ? "error" : ""}
                      help={fieldState.error?.message}
                    >
                      <DatePicker
                        showTime={getAppointmentDateTimePickerConfig()}
                        format="DD/MM/YYYY HH:mm"
                        value={field.value ? dayjs(field.value) : null}
                        onChange={(d) =>
                          field.onChange(
                            d ? d.format("YYYY-MM-DD HH:mm") : null
                          )
                        }
                        locale={viVN}
                        style={{ width: "100%" }}
                        placeholder="Chọn thời gian check-in"
                        allowClear
                      />
                    </Form.Item>
                  )}
                />
              </Col>

              <Col xs={24} lg={12}>
                <Controller
                  name="checkOutTime"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Form.Item
                      label="Giờ check-out"
                      validateStatus={fieldState.error ? "error" : ""}
                      help={fieldState.error?.message}
                    >
                      <DatePicker
                        showTime={getAppointmentDateTimePickerConfig()}
                        format="DD/MM/YYYY HH:mm"
                        value={field.value ? dayjs(field.value) : null}
                        onChange={(d) =>
                          field.onChange(
                            d ? d.format("YYYY-MM-DD HH:mm") : null
                          )
                        }
                        locale={viVN}
                        style={{ width: "100%" }}
                        placeholder="Chọn thời gian check-out"
                        allowClear
                      />
                    </Form.Item>
                  )}
                />
              </Col>
            </Row>

            {/* Row 6: Metadata */}
            <Descriptions
              bordered
              size="small"
              column={2}
              style={{ marginTop: 8 }}
            >
              <Descriptions.Item label="Tạo bởi">
                {appointment.createdBy?.fullName || "System"}
              </Descriptions.Item>
              <Descriptions.Item label="Tạo lúc">
                {dayjs(appointment.createdAt).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật bởi">
                {appointment.updatedBy?.fullName || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật lúc">
                {appointment.updatedAt
                  ? dayjs(appointment.updatedAt).format("DD/MM/YYYY HH:mm")
                  : "—"}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}

        {/* Dentist Availability Warning (Soft) */}
        {hasConflicts && !checkingAvailability && (
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
                  Bạn vẫn có thể tiếp tục cập nhật lịch hẹn.
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
