import React, { useMemo } from "react";
import { Card, Tabs } from "antd";
import type { TabsProps } from "antd";
import SummaryTable from "./SummaryTable";
import type {
  LaboSummaryTabsData,
  DailyLaboData,
  SupplierLaboData,
  DoctorLaboData,
  ServiceLaboData,
} from "@/shared/validation/labo-report.schema";
import type { TabType } from "../hooks/useLaboReportDetail";

interface SummaryTabsProps {
  data: LaboSummaryTabsData;
  loading?: boolean;
  onRowSelect: (tab: TabType, rowId: string) => void;
}

export default function SummaryTabs({
  data,
  loading,
  onRowSelect,
}: SummaryTabsProps) {
  const items: TabsProps["items"] = useMemo(
    () => [
      {
        key: "daily",
        label: "Theo ngày nhận",
        children: (
          <SummaryTable
            dataSource={data.byDate}
            loading={loading}
            onRowClick={(record: DailyLaboData) =>
              onRowSelect("daily", record.id)
            }
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
            onRowClick={(record: SupplierLaboData) =>
              onRowSelect("supplier", record.supplierId)
            }
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
            onRowClick={(record: DoctorLaboData) =>
              onRowSelect("doctor", record.doctorId)
            }
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
            onRowClick={(record: ServiceLaboData) =>
              onRowSelect("service", record.serviceId)
            }
            dimension="service"
          />
        ),
      },
    ],
    [data, loading, onRowSelect]
  );

  return (
    <Card variant="borderless">
      <Tabs defaultActiveKey="daily" items={items} />
    </Card>
  );
}
