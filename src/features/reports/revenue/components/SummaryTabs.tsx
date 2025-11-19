import React, { useMemo } from "react";
import { Card, Tabs } from "antd";
import type { TabsProps } from "antd";
import type {
  RevenueSummaryTabsData,
  DailyRevenueData,
  SourceRevenueData,
  ServiceRevenueData,
  DoctorRevenueData,
} from "@/shared/validation/revenue-report.schema";
import type { TabType } from "../hooks/useRevenueDetail";
import DailyRevenueTable from "./DailyRevenueTable";
import SourceRevenueTable from "./SourceRevenueTable";
import ServiceRevenueTable from "./ServiceRevenueTable";
import DoctorRevenueTable from "./DoctorRevenueTable";

interface SummaryTabsProps {
  data: RevenueSummaryTabsData;
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
        label: "Theo ngày",
        children: (
          <DailyRevenueTable
            data={data.byDate}
            loading={loading}
            onRowClick={(record: DailyRevenueData) =>
              onRowSelect("daily", record.id)
            }
          />
        ),
      },
      {
        key: "source",
        label: "Theo nguồn",
        children: (
          <SourceRevenueTable
            data={data.bySource}
            loading={loading}
            onRowClick={(record: SourceRevenueData) =>
              onRowSelect("source", record.id)
            }
          />
        ),
      },
      {
        key: "service",
        label: "Theo dịch vụ",
        children: (
          <ServiceRevenueTable
            data={data.byService}
            loading={loading}
            onRowClick={(record: ServiceRevenueData) =>
              onRowSelect("service", record.id)
            }
          />
        ),
      },
      {
        key: "doctor",
        label: "Theo bác sĩ điều trị",
        children: (
          <DoctorRevenueTable
            data={data.byDoctor}
            loading={loading}
            onRowClick={(record: DoctorRevenueData) =>
              onRowSelect("doctor", record.id)
            }
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
