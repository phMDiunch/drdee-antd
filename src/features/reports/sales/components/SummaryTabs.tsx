import React, { useMemo } from "react";
import { Card, Tabs } from "antd";
import type { TabsProps } from "antd";
import type { SummaryTabsData } from "@/shared/validation/sales-report.schema";
import type { TabType } from "../hooks/useSalesDetail";
import SummaryTable from "./SummaryTable";

interface SummaryTabsProps {
  data: SummaryTabsData;
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
            data={data.byDate}
            loading={loading}
            nameColumn={{ title: "Ngày tư vấn", dataIndex: "date", width: 120 }}
            onRowClick={(record) => onRowSelect("daily", record.id)}
          />
        ),
      },
      {
        key: "source",
        label: "Theo nguồn",
        children: (
          <SummaryTable
            data={data.bySource}
            loading={loading}
            nameColumn={{ title: "Nguồn", dataIndex: "source" }}
            onRowClick={(record) => onRowSelect("source", record.id)}
          />
        ),
      },
      {
        key: "service",
        label: "Theo dịch vụ",
        children: (
          <SummaryTable
            data={data.byService}
            loading={loading}
            nameColumn={{ title: "Dịch vụ", dataIndex: "service" }}
            onRowClick={(record) => onRowSelect("service", record.id)}
          />
        ),
      },
      {
        key: "sale",
        label: "Theo sale",
        children: (
          <SummaryTable
            data={data.bySale}
            loading={loading}
            nameColumn={{ title: "Sale", dataIndex: "saleName" }}
            onRowClick={(record) => onRowSelect("sale", record.id)}
          />
        ),
      },
      {
        key: "doctor",
        label: "Theo bác sĩ",
        children: (
          <SummaryTable
            data={data.byDoctor}
            loading={loading}
            nameColumn={{ title: "Bác sĩ", dataIndex: "doctorName" }}
            onRowClick={(record) => onRowSelect("doctor", record.id)}
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
