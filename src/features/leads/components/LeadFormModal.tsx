"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Form,
  Row,
  Col,
  Input,
  Select,
  Typography,
  Button,
  Spin,
} from "antd";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CUSTOMER_SOURCES,
  SERVICES_OF_INTEREST,
  type CustomerSource,
} from "@/features/customers/constants";
import provinces from "@/data/vietnamAdministrativeUnits.json";
import { usePhoneDuplicateCheck } from "@/features/customers";
import { useWorkingEmployees } from "@/features/employees";
import { useCustomerSearch } from "@/features/customers/hooks/useCustomerSearch";
import {
  CreateLeadRequestSchema,
  type CreateLeadRequest,
  type LeadResponse,
} from "@/shared/validation/lead.schema";

type Province = {
  name: string;
  districts: Array<{ name: string }>;
};

type Props = {
  open: boolean;
  confirmLoading?: boolean;
  mode?: "create" | "edit";
  initialData?: LeadResponse;
  onCancel: () => void;
  onSubmit: (payload: CreateLeadRequest, leadId?: string) => void;
};

const { TextArea } = Input;

export default function LeadFormModal({
  open,
  confirmLoading,
  mode = "create",
  initialData,
  onCancel,
  onSubmit,
}: Props) {
  const [custQuery, setCustQuery] = useState("");
  // Get default form values - MEMOIZED
  const defaultValues = useMemo(() => {
    if (mode === "edit" && initialData) {
      return {
        fullName: initialData.fullName,
        phone: initialData.phone || "",
        city: initialData.city || "",
        district: initialData.district || "",
        source: initialData.source || "",
        sourceNotes: initialData.sourceNotes || "",
        serviceOfInterest: initialData.serviceOfInterest || "",
        note: initialData.note || "",
      };
    }

    return {
      fullName: "",
      phone: "",
      city: "",
      district: "",
      source: "",
      sourceNotes: "",
      serviceOfInterest: "",
      note: "",
    };
  }, [mode, initialData]);

  const { control, handleSubmit, setValue, watch, reset } =
    useForm<CreateLeadRequest>({
      resolver: zodResolver(CreateLeadRequestSchema),
      mode: "onBlur",
      reValidateMode: "onChange",
      defaultValues,
    });

  const phone = watch("phone") || "";
  const city = watch("city");
  const sourceValue = watch("source");
  const sourceMeta: CustomerSource | undefined = useMemo(
    () => CUSTOMER_SOURCES.find((s) => s.value === sourceValue),
    [sourceValue]
  );

  // Get districts for selected city
  const districtsData = useMemo(() => {
    const province = (provinces as Province[]).find((p) => p.name === city);
    return province?.districts.map((d) => d.name) || [];
  }, [city]);

  // Load working employees for employee_search source type
  const { data: workingEmployees } = useWorkingEmployees();
  const employeeOptions = useMemo(
    () =>
      workingEmployees?.map((emp) => ({
        label: emp.fullName,
        value: emp.id,
      })) || [],
    [workingEmployees]
  );

  // Customer search for customer_search source type
  const { data: customerSearchResults, isFetching: custFetching } =
    useCustomerSearch({
      q: custQuery,
      limit: 10,
      enabled: custQuery.length >= 2,
    });

  const customerSourceOptions = useMemo(
    () =>
      customerSearchResults?.map((c) => ({
        label: `${c.fullName} — ${c.phone || "Không có SĐT"}`,
        value: c.id,
      })) || [],
    [customerSearchResults]
  );

  // Use phone duplicate check hook
  const { actualPhoneDup } = usePhoneDuplicateCheck({
    phone,
    mode,
    initialData,
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, reset, defaultValues]);

  // Clear district when city changes
  useEffect(() => {
    if (city) {
      const province = (provinces as Province[]).find((p) => p.name === city);
      const currentDistrict = watch("district");
      const districtExists = province?.districts.some(
        (d) => d.name === currentDistrict
      );
      if (!districtExists) {
        setValue("district", "");
      }
    }
  }, [city, setValue, watch]);

  const onValid = (data: CreateLeadRequest) => {
    onSubmit(data, initialData?.id);
  };

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
          {mode === "edit" ? "Cập nhật thông tin Lead" : "Thêm Lead"}
        </div>
      }
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit(onValid)}
      confirmLoading={confirmLoading}
      okButtonProps={{ disabled: !!actualPhoneDup }}
      width="65%"
      styles={{
        content: { maxHeight: "85vh" },
        body: { maxHeight: "60vh", overflowY: "auto", paddingInline: 16 },
      }}
      destroyOnHidden
      maskClosable={false}
    >
      <Form layout="vertical" requiredMark>
        {/* Row 1: Full Name (full width) */}
        <Row gutter={12}>
          <Col xs={24}>
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
                  <Input {...field} placeholder="VD: Nguyễn Văn A" />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Row 2: Phone | City | District */}
        <Row gutter={12}>
          <Col xs={24} lg={8}>
            <Controller
              name="phone"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Số điện thoại"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input {...field} placeholder="VD: 0912345678" />
                  {actualPhoneDup && (
                    <div style={{ marginTop: 4 }}>
                      <Typography.Text
                        type="danger"
                        style={{ display: "block" }}
                      >
                        SĐT đã tồn tại:{" "}
                        {actualPhoneDup.type === "LEAD" ? "LEAD" : "Khách hàng"}{" "}
                        - {actualPhoneDup.fullName} ({actualPhoneDup.phone})
                      </Typography.Text>
                      <Button
                        type="link"
                        size="small"
                        style={{ padding: 0, height: "auto", marginTop: 2 }}
                        href={`/customers/${actualPhoneDup.id}`}
                        target="_blank"
                      >
                        Xem thông tin
                      </Button>
                    </div>
                  )}
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={24} lg={8}>
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
                    placeholder="Chọn tỉnh/thành"
                    showSearch
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
          <Col xs={24} lg={8}>
            <Controller
              name="district"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Quận/Huyện"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    placeholder="Chọn quận/huyện"
                    showSearch
                    options={districtsData.map((d) => ({
                      value: d,
                      label: d,
                    }))}
                    disabled={!city}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Row 3: Service of Interest | Source | Source Notes */}
        <Row gutter={12}>
          <Col xs={24} lg={8}>
            <Controller
              name="serviceOfInterest"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Dịch vụ quan tâm"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    placeholder="Chọn dịch vụ"
                    showSearch
                    allowClear
                    options={SERVICES_OF_INTEREST.map((s) => ({
                      value: s.value,
                      label: s.label,
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
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    placeholder="Chọn nguồn khách"
                    showSearch
                    allowClear
                    options={CUSTOMER_SOURCES.map((s) => ({
                      value: s.value,
                      label: s.label,
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

        {/* Row 4: Note (full width) */}
        <Row gutter={12}>
          <Col xs={24}>
            <Controller
              name="note"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Ghi chú"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <TextArea
                    {...field}
                    value={field.value || ""}
                    placeholder="Ghi chú về lead..."
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
