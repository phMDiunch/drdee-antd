import React, { useMemo } from "react";
import { Card, Tabs } from "antd";
import type { TabsProps } from "antd";
import SummaryTable from "./SummaryTable";
import type {
  RevenueSummaryTabsData,
  DailyRevenueData,
  SourceRevenueData,
  DepartmentRevenueData,
  ServiceGroupRevenueData,
  ServiceRevenueData,
  DoctorRevenueData,
} from "@/shared/validation/revenue-report.schema";
import type { TabType } from "../hooks/useRevenueDetail";

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
          <SummaryTable
            dataSource={data.byDate}
            loading={loading}
            onRowClick={(record: DailyRevenueData) =>
              onRowSelect("daily", record.id)
            }
            dimension="daily"
          />
        ),
      },
      {
        key: "source",
        label: "Theo nguồn",
        children: (
          <SummaryTable
            dataSource={data.bySource}
            loading={loading}
            onRowClick={(record: SourceRevenueData) =>
              onRowSelect("source", record.id)
            }
            dimension="source"
          />
        ),
      },
      {
        key: "department",
        label: "Theo bộ môn",
        children: (
          <SummaryTable
            dataSource={data.byDepartment}
            loading={loading}
            onRowClick={(record: DepartmentRevenueData) =>
              onRowSelect("department", record.id)
            }
            dimension="department"
          />
        ),
      },
      {
        key: "serviceGroup",
        label: "Theo nhóm dịch vụ",
        children: (
          <SummaryTable
            dataSource={data.byServiceGroup}
            loading={loading}
            onRowClick={(record: ServiceGroupRevenueData) =>
              onRowSelect("serviceGroup", record.id)
            }
            dimension="serviceGroup"
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
            onRowClick={(record: ServiceRevenueData) =>
              onRowSelect("service", record.serviceId)
            }
            dimension="service"
          />
        ),
      },
      {
        key: "doctor",
        label: "Theo bác sĩ điều trị",
        children: (
          <SummaryTable
            dataSource={data.byDoctor}
            loading={loading}
            onRowClick={(record: DoctorRevenueData) =>
              onRowSelect("doctor", record.doctorId)
            }
            dimension="doctor"
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
