"use client";
import React, { useCallback, useEffect, useMemo } from "react";
import {
  Modal,
  Form,
  Row,
  Col,
  Input,
  Select,
  DatePicker,
  Typography,
  Button,
  Spin,
  Radio,
} from "antd";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import viVN from "antd/es/date-picker/locale/vi_VN";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  SERVICES_OF_INTEREST,
  CUSTOMER_SOURCES,
  PRIMARY_CONTACT_ROLES,
  OCCUPATIONS,
  type CustomerSource,
} from "@/features/customers/constants";
import provinces from "@/data/vietnamAdministrativeUnits.json";
import {
  usePhoneDuplicateCheck,
  useCustomerFormOptions,
} from "@/features/customers";
import { useCurrentUser } from "@/shared/providers/user-provider";

// Import schemas and types
import {
  CreateCustomerFormSchema,
  type CreateCustomerFormData,
  type CreateCustomerRequest,
  type CustomerDetailResponse,
} from "@/shared/validation/customer.schema";

// Define type for provinces data
type Province = {
  name: string;
  districts: Array<{ name: string }>;
};

type Props = {
  open: boolean;
  confirmLoading?: boolean;
  selectedClinicId?: string; // From clinic tabs (admin only)
  mode?: "create" | "edit"; // Mode for create or edit
  initialData?: CustomerDetailResponse; // Initial data for edit mode
  onCancel: () => void;
  onSubmit: (payload: CreateCustomerRequest, customerId?: string) => void;
};

const GENDERS = [
  { label: "Nam", value: "male" },
  { label: "Nữ", value: "female" },
];

dayjs.locale("vi");

export default function CustomerFormModal({
  open,
  selectedClinicId,
  confirmLoading,
  mode = "create",
  initialData,
  onCancel,
  onSubmit,
}: Props) {
  // Get current user from Supabase session
  const { user: currentUser } = useCurrentUser();

  // Determine clinic settings based on user role
  const isAdmin = currentUser?.role === "admin";
  const defaultClinicId = selectedClinicId || currentUser?.clinicId || "";
  const clinicIdDisabled = !isAdmin || mode === "edit"; // Disable for non-admin or in edit mode

  // Get default form values - MEMOIZED to prevent infinite loop in useEffect
  const defaultValues = useMemo(() => {
    if (mode === "edit" && initialData) {
      return {
        fullName: initialData.fullName,
        dob: initialData.dob || "",
        gender: initialData.gender || "",
        phone: initialData.phone,
        email: initialData.email,
        address: initialData.address || "",
        city: initialData.city || "",
        district: initialData.district || "",
        primaryContactRole: initialData.primaryContactRole,
        primaryContactId: initialData.primaryContactId,
        occupation: initialData.occupation,
        source: initialData.source || "",
        sourceNotes: initialData.sourceNotes,
        serviceOfInterest: initialData.serviceOfInterest || "",
        clinicId: initialData.clinicId || "",
      };
    }

    return {
      fullName: "",
      dob: "",
      gender: "",
      phone: null,
      email: null,
      address: "",
      city: "",
      district: "",
      primaryContactRole: null,
      primaryContactId: null,
      occupation: null,
      source: "",
      sourceNotes: null,
      serviceOfInterest: "",
      clinicId: defaultClinicId || "",
    };
  }, [mode, defaultClinicId, initialData]);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<CreateCustomerFormData>({
    resolver: zodResolver(CreateCustomerFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldUnregister: true,
    defaultValues,
  });

  const phone = watch("phone") || "";
  const sourceValue = watch("source");
  const sourceMeta: CustomerSource | undefined = useMemo(
    () => CUSTOMER_SOURCES.find((s) => s.value === sourceValue),
    [sourceValue]
  );

  // Use phone duplicate check hook
  const { actualPhoneDup } = usePhoneDuplicateCheck({
    phone,
    mode,
    initialData,
  });

  // Use form options hook
  const {
    primaryContactOptions,
    employeeOptions,
    customerSourceOptions,
    clinicOptions,
    getDistrictOptions,
    pcQuery,
    setPcQuery,
    custQuery,
    setCustQuery,
    pcFetching,
    custFetching,
    setSelectedPhoneDup,
  } = useCustomerFormOptions({
    mode,
    initialData,
    actualPhoneDup,
  });

  useEffect(() => {
    if (!open) return;
    reset(defaultValues);
    setSelectedPhoneDup(null); // Clear selected phoneDup on modal open
  }, [open, reset, defaultValues, setSelectedPhoneDup]);

  // Handle phone duplicate selection as primary contact
  const handleSelectDuplicateAsContact = useCallback(() => {
    if (actualPhoneDup) {
      setSelectedPhoneDup(actualPhoneDup); // Store actualPhoneDup before clearing phone
      setValue("phone", ""); // Clear phone to avoid duplicate
      setValue("primaryContactId", actualPhoneDup.id);
      // Don't auto-fill primaryContactRole as per requirements
    }
  }, [actualPhoneDup, setValue, setSelectedPhoneDup]);

  const onValid = (formData: CreateCustomerFormData) => {
    // Convert form data to API payload format
    const payload: CreateCustomerRequest = {
      ...formData,
      dob: dayjs(formData.dob, "YYYY-MM-DD").startOf("day").toDate(),
    };

    // Pass customerId if in edit mode
    if (mode === "edit" && initialData) {
      onSubmit(payload, initialData.id);
    } else {
      onSubmit(payload);
    }
  };

  // Derive district options based on selected city
  const citySelected = watch("city");
  const districtOptions = useMemo(
    () => getDistrictOptions(citySelected),
    [citySelected, getDistrictOptions]
  );

  return (
    <Modal
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {mode === "edit"
            ? "Cập nhật thông tin khách hàng"
            : "Thêm khách hàng"}
        </div>
      }
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
        {/* H1 */}
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
                  required
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

        {/* H2 */}
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
                    value={field.value ?? ""}
                    placeholder="VD: 0912345678"
                    maxLength={10}
                    onChange={(e) => {
                      const digits = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);
                      field.onChange(digits);
                    }}
                  />
                  {actualPhoneDup && (
                    <div style={{ marginTop: 4 }}>
                      <Typography.Text
                        type="danger"
                        style={{ display: "block" }}
                      >
                        SĐT đã tồn tại: {actualPhoneDup.customerCode || "—"} -{" "}
                        {actualPhoneDup.fullName}
                      </Typography.Text>
                      <Button
                        type="link"
                        size="small"
                        style={{ padding: 0, height: "auto", marginTop: 2 }}
                        onClick={handleSelectDuplicateAsContact}
                      >
                        Chọn người này làm người liên hệ chính
                      </Button>
                    </div>
                  )}
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
                    // optionLabelProp="label"
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

        {/* H3 */}
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
                    onChange={(v) => {
                      field.onChange(v);
                      setValue("district", "");
                    }}
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
                    disabled={!citySelected}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* H4 */}
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

        {/* H5: 3 cột 1 hàng */}
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
                      setValue("sourceNotes", undefined);
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
      </Form>
    </Modal>
  );
}
