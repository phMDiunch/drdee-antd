import { Card, Space, DatePicker, Select, Button, Typography } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { useCurrentUser } from "@/shared/providers/user-provider";
import { useClinics } from "@/features/clinics";

const { Text } = Typography;

interface ReportFiltersProps {
  filters: {
    month: string;
    clinicId?: string;
  };
  onChange: (filters: Partial<{ month: string; clinicId?: string }>) => void;
  onExport?: () => void;
}

export default function ReportFilters({
  filters,
  onChange,
  onExport,
}: ReportFiltersProps) {
  const { user } = useCurrentUser();
  const isAdmin = user?.role === "admin";

  // Fetch clinics data for admin
  const { data: clinics } = useClinics(false);

  const handleMonthChange = (date: Dayjs | null) => {
    onChange({
      month: date ? date.format("YYYY-MM") : dayjs().format("YYYY-MM"),
    });
  };

  const handleClinicChange = (value: string | undefined) => {
    onChange({ clinicId: value });
  };

  // Build clinic options for select
  const clinicOptions = [
    { value: undefined, label: "Tất cả chi nhánh" },
    ...(clinics?.map((clinic) => ({
      value: clinic.id,
      label: clinic.name,
    })) || []),
  ];

  return (
    <Card variant="borderless" style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <Space size="large" wrap>
          <Space direction="vertical" size={4}>
            <Text type="secondary">Tháng</Text>
            <DatePicker
              picker="month"
              format="MM/YYYY"
              value={filters.month ? dayjs(filters.month, "YYYY-MM") : dayjs()}
              onChange={handleMonthChange}
              allowClear={false}
              style={{ width: 150 }}
            />
          </Space>

          {isAdmin && (
            <Space direction="vertical" size={4}>
              <Text type="secondary">Chi nhánh</Text>
              <Select
                value={filters.clinicId}
                onChange={handleClinicChange}
                allowClear
                placeholder="Tất cả chi nhánh"
                style={{ width: 200 }}
                options={clinicOptions}
              />
            </Space>
          )}
        </Space>

        {onExport && (
          <Button icon={<DownloadOutlined />} onClick={onExport} type="primary">
            Xuất Excel
          </Button>
        )}
      </div>
    </Card>
  );
}
