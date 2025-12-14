"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Form,
  Row,
  Col,
  Input,
  Select,
  DatePicker,
  Radio,
  Spin,
} from "antd";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import viVN from "antd/es/date-picker/locale/vi_VN";
import { Controller, useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  SERVICES_OF_INTEREST,
  CUSTOMER_SOURCES,
  PRIMARY_CONTACT_ROLES,
  OCCUPATIONS,
  type CustomerSource,
} from "@/features/customers/constants";
import provinces from "@/data/vietnamAdministrativeUnits.json";
import { useCustomersSearch } from "@/features/customers/hooks/useCustomerSearch";
import { useClinics } from "@/features/clinics";
import { useWorkingEmployees } from "@/features/employees";
import { useCurrentUser } from "@/shared/providers";
import {
  ConvertLeadRequestSchema,
  type ConvertLeadRequest,
} from "@/shared/validation/lead.schema";
import type { LeadResponse } from "@/shared/validation/lead.schema";

// Define type for provinces data
type Province = {
  name: string;
  districts: Array<{ name: string }>;
};

type Props = {
  open: boolean;
  confirmLoading?: boolean;
  lead:
    | (Pick<
        LeadResponse,
        | "id"
        | "phone"
        | "fullName"
        | "city"
        | "source"
        | "sourceEmployee"
        | "sourceCustomer"
      > &
        Partial<
          Pick<
            LeadResponse,
            | "district"
            | "primaryContactId"
            | "primaryContactRole"
            | "serviceOfInterest"
            | "sourceNotes"
          >
        >)
    | null; // Lead data to convert
  onCancel: () => void;
  onSubmit: (payload: ConvertLeadRequest, leadId: string) => void;
};

const GENDERS = [
  { label: "Nam", value: "male" },
  { label: "Nữ", value: "female" },
];

dayjs.locale("vi");

export default function ConvertLeadModal({
  open,
  confirmLoading,
  lead,
  onCancel,
  onSubmit,
}: Props) {
  // Get current user from Supabase session
  const { user: currentUser } = useCurrentUser();

  // Determine clinic settings based on user role
  const isAdmin = currentUser?.role === "admin";
  const defaultClinicId = currentUser?.clinicId || "";
  // Admin can change clinicId in convert (customer clinic assignment)
  // Employee can only convert to their own clinic
  const clinicIdDisabled = !isAdmin;

  // Search states
  const [pcQuery, setPcQuery] = useState("");
  const [custQuery, setCustQuery] = useState("");

  // Get default form values from lead data
  const defaultValues = useMemo(() => {
    if (lead) {
      return {
        fullName: lead.fullName || "",
        dob: "",
        gender: "",
        phone: lead.phone || "",
        primaryContactId: lead.primaryContactId || null,
        primaryContactRole: lead.primaryContactRole || null,
        address: "",
        city: lead.city || "",
        district: lead.district || "",
        email: "",
        occupation: null,
        clinicId: defaultClinicId, // Default to user's clinic
        serviceOfInterest: lead.serviceOfInterest || "",
        source: lead.source || "",
        sourceNotes: lead.sourceNotes || null,
        note: "",
      };
    }
    return {
      fullName: "",
      dob: "",
      gender: "",
      phone: "",
      primaryContactId: null,
      primaryContactRole: null,
      address: "",
      city: "",
      district: "",
      email: "",
      occupation: null,
      clinicId: defaultClinicId,
      serviceOfInterest: "",
      source: "",
      sourceNotes: null,
      note: "",
    };
  }, [lead, defaultClinicId]);

  // Initialize react-hook-form
  type FormData = {
    fullName: string;
    dob: string;
    gender: string;
    phone: string;
    primaryContactId: string | null;
    primaryContactRole: string | null;
    address: string;
    city: string;
    district: string;
    email: string | null;
    occupation: string | null;
    clinicId: string;
    serviceOfInterest: string;
    source: string;
    sourceNotes: string | null;
    note: string;
  };

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(
      ConvertLeadRequestSchema
    ) as unknown as Resolver<FormData>,
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues,
  });

  // Reset form when lead changes
  useEffect(() => {
    if (lead) {
      reset(defaultValues);
    }
  }, [lead, defaultValues, reset]);

  // Watch fields
  const cityValue = watch("city");
  const sourceValue = watch("source");
  const sourceMeta: CustomerSource | undefined = useMemo(
    () => CUSTOMER_SOURCES.find((s) => s.value === sourceValue),
    [sourceValue]
  );

  // Get clinic options
  const { data: clinicsData } = useClinics();
  const clinicOptions = useMemo(
    () =>
      clinicsData?.map((clinic: { id: string; clinicCode: string }) => ({
        label: clinic.clinicCode,
        value: clinic.id,
      })) || [],
    [clinicsData]
  );

  // Get primary contact options
  const { data: primaryContactData, isFetching: pcFetching } =
    useCustomersSearch({
      q: pcQuery,
      limit: 10,
      requirePhone: true,
    });

  const primaryContactOptions = useMemo(
    () => primaryContactData || [],
    [primaryContactData]
  );

  // Get employee options for source notes
  const { data: employeesData } = useWorkingEmployees();
  const employeeOptions = useMemo(() => {
    const options = (employeesData ?? []).map((emp) => ({
      label: emp.fullName,
      value: emp.id,
    }));

    // Merge initial sourceEmployee from lead if exists and not in options
    if (
      lead?.sourceEmployee &&
      !options.some((opt) => opt.value === lead.sourceEmployee!.id)
    ) {
      options.unshift({
        label: lead.sourceEmployee.fullName,
        value: lead.sourceEmployee.id,
      });
    }

    return options;
  }, [employeesData, lead]);

  // Get customer options for source notes
  const { data: customerSourceData, isFetching: custFetching } =
    useCustomersSearch({
      q: custQuery,
      limit: 10,
      requirePhone: false,
    });

  const customerSourceOptions = useMemo(() => {
    const options = (customerSourceData ?? []).map((c) => ({
      label: `${c.fullName} — ${c.phone || "—"}`,
      value: c.id,
    }));

    // Merge initial sourceCustomer from lead if exists and not in options
    if (
      lead?.sourceCustomer &&
      !options.some((opt) => opt.value === lead.sourceCustomer!.id)
    ) {
      options.unshift({
        label: `${lead.sourceCustomer.fullName} — ${
          lead.sourceCustomer.phone ?? "—"
        }`,
        value: lead.sourceCustomer.id,
      });
    }

    return options;
  }, [customerSourceData, lead]);

  // Get district options based on selected city
  const districtOptions = useMemo(() => {
    if (!cityValue) return [];
    const province = (provinces as Province[]).find(
      (p) => p.name === cityValue
    );
    return (
      province?.districts.map((d) => ({ label: d.name, value: d.name })) || []
    );
  }, [cityValue]);

  // Handle form submission
  const onValid = useCallback(
    (data: FormData) => {
      if (!lead?.id) return;

      // Transform dob string to Date for backend
      const payload: ConvertLeadRequest = {
        ...data,
        dob: data.dob ? new Date(data.dob) : null,
      };

      onSubmit(payload, lead.id);
    },
    [lead, onSubmit]
  );

  // Get source label
  return (
    <Modal
      title="Chuyển đổi Lead thành Khách hàng"
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
      okText="Chuyển đổi"
      cancelText="Hủy"
    >
      <Form layout="vertical" requiredMark>
        {/* H1: Họ và tên | Ngày sinh | Giới tính */}
        <Row gutter={12}>
          <Col xs={24} lg={12}>
            <Controller
              name="fullName"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Họ và tên"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    maxLength={200}
                    placeholder="VD: Nguyễn Văn A"
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={12} lg={6}>
            <Controller
              name="dob"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Ngày sinh"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <DatePicker
                    value={field.value ? dayjs(field.value) : undefined}
                    onChange={(d) =>
                      field.onChange(d ? d.format("YYYY-MM-DD") : "")
                    }
                    format="DD/MM/YYYY"
                    locale={viVN}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={12} lg={6}>
            <Controller
              name="gender"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Giới tính"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Radio.Group {...field} options={GENDERS} />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* H2: Số điện thoại | Người liên hệ chính | Người liên hệ là */}
        <Row gutter={12}>
          <Col xs={24} lg={8}>
            <Controller
              name="phone"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Số điện thoại"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    placeholder="VD: 0912345678"
                    maxLength={10}
                    disabled
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={24} lg={8}>
            <Controller
              name="primaryContactId"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Người liên hệ chính"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    showSearch
                    allowClear
                    onSearch={(v) => setPcQuery(v)}
                    filterOption={false}
                    options={primaryContactOptions.map((i) => ({
                      label: `${i.fullName} — ${i.phone}`,
                      value: i.id,
                    }))}
                    placeholder="Nhập tên hoặc SĐT để tìm (ít nhất 2 ký tự)"
                    notFoundContent={
                      pcFetching ? (
                        <Spin size="small" />
                      ) : pcQuery.length >= 2 ? (
                        "Không tìm thấy khách hàng"
                      ) : pcQuery.length > 0 ? (
                        "Nhập ít nhất 2 ký tự"
                      ) : (
                        "Nhập để tìm kiếm"
                      )
                    }
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={24} lg={8}>
            <Controller
              name="primaryContactRole"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Người liên hệ là"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    allowClear
                    showSearch
                    placeholder="Chọn vai trò"
                    options={PRIMARY_CONTACT_ROLES}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* H3: Địa chỉ | Tỉnh/Thành phố | Quận/Huyện */}
        <Row gutter={12}>
          <Col xs={24} lg={12}>
            <Controller
              name="address"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Địa chỉ"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input {...field} />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={12} lg={6}>
            <Controller
              name="city"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Tỉnh/Thành phố"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    showSearch
                    placeholder="Chọn tỉnh/thành"
                    options={(provinces as Province[]).map((p) => ({
                      label: p.name,
                      value: p.name,
                    }))}
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={12} lg={6}>
            <Controller
              name="district"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Quận/Huyện"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    showSearch
                    placeholder="Chọn quận/huyện"
                    options={districtOptions}
                    disabled={!cityValue}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* H4: Email | Nghề nghiệp | Chi nhánh */}
        <Row gutter={12}>
          <Col xs={24} lg={8}>
            <Controller
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Email"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="email"
                    placeholder="VD: email@domain.com"
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={24} lg={8}>
            <Controller
              name="occupation"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Nghề nghiệp"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    value={field.value ? [field.value] : []}
                    onChange={(val) => field.onChange(val[0] || null)}
                    mode="tags"
                    maxCount={1}
                    showSearch
                    placeholder="Chọn hoặc nhập nghề nghiệp"
                    options={OCCUPATIONS.map((occ) => ({
                      label: occ,
                      value: occ,
                    }))}
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
                    showSearch
                    placeholder="Chọn chi nhánh"
                    options={clinicOptions}
                    disabled={!!clinicIdDisabled}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* H5: Dịch vụ quan tâm | Nguồn khách | Ghi chú nguồn */}
        <Row gutter={12}>
          <Col xs={24} lg={8}>
            <Controller
              name="serviceOfInterest"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Dịch vụ quan tâm"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    showSearch
                    placeholder="Chọn dịch vụ"
                    options={SERVICES_OF_INTEREST.map((s) => ({
                      label: s.label,
                      value: s.value,
                    }))}
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={24} lg={8}>
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
                    }))}
                    onChange={(v) => {
                      field.onChange(v);
                      setValue("sourceNotes", null);
                    }}
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={24} lg={8}>
            {sourceMeta && sourceMeta.noteType !== "none" && (
              <>
                {sourceMeta.noteType === "employee_search" ? (
                  <Controller
                    name="sourceNotes"
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
                    name="sourceNotes"
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
                    name="sourceNotes"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="Ghi chú nguồn"
                        required={sourceMeta.noteType === "text_input_required"}
                        validateStatus={fieldState.error ? "error" : ""}
                        help={fieldState.error?.message}
                      >
                        <Input
                          {...field}
                          value={field.value ?? ""}
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

        {/* H6: Ghi chú */}
        <Row gutter={12}>
          <Col span={24}>
            <Controller
              name="note"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Ghi chú"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input.TextArea
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Nhập ghi chú (nếu cần)"
                    rows={3}
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
