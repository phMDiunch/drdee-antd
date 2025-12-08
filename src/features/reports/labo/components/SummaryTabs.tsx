import React, { useMemo } from "react";
import { Card, Tabs } from "antd";
import type { TabsProps } from "antd";
import SummaryTable from "./SummaryTable";
import type {
  DailyLaboData,
  SupplierLaboData,
  DoctorLaboData,
  ServiceLaboData,
} from "@/shared/validation/labo-report.schema";

type Tab = "supplier" | "doctor" | "service" | "daily";

type DimensionData =
  | DailyLaboData
  | SupplierLaboData
  | DoctorLaboData
  | ServiceLaboData;

type Props = {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
  data: {
    byDate: DailyLaboData[];
    bySupplier: SupplierLaboData[];
    byDoctor: DoctorLaboData[];
    byService: ServiceLaboData[];
  };
  loading?: boolean;
  onRowClick: (record: DimensionData) => void;
};

export default function SummaryTabs({
  activeTab,
  onChange,
  data,
  loading,
  onRowClick,
}: Props) {
  const items: TabsProps["items"] = useMemo(
    () => [
      {
        key: "daily",
        label: "Theo ngày nhận",
        children: (
          <SummaryTable
            dataSource={data.byDate}
            loading={loading}
            onRowClick={onRowClick}
            dimension="daily"
          />
        ),
      },
      {
        key: "supplier",
        label: "Theo xưởng",
        children: (
          <SummaryTable
            dataSource={data.bySupplier}
            loading={loading}
            onRowClick={onRowClick}
            dimension="supplier"
          />
        ),
      },
      {
        key: "doctor",
        label: "Theo bác sĩ",
        children: (
          <SummaryTable
            dataSource={data.byDoctor}
            loading={loading}
            onRowClick={onRowClick}
            dimension="doctor"
          />
        ),
      },
      {
        key: "service",
        label: "Theo dịch vụ",
        children: (
          <SummaryTable
            dataSource={data.byService}
            loading={loading}
            onRowClick={onRowClick}
            dimension="service"
          />
        ),
      },
    ],
    [data, loading, onRowClick]
  );

  return (
    <Card>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => onChange(key as Tab)}
        items={items}
      />
    </Card>
  );
}
