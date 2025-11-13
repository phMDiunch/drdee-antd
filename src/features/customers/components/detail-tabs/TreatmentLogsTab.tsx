// src/features/customers/components/detail-tabs/TreatmentLogsTab.tsx
"use client";

import { TreatmentLogTab } from "@/features/treatment-logs";

type TreatmentLogsTabProps = {
  customerId: string;
};

/**
 * Treatment Logs Tab - Wrapper for TreatmentLogTab
 * Displays treatment logs grouped by appointment (by-date) or by service (by-service)
 */
export default function TreatmentLogsTab({
  customerId,
}: TreatmentLogsTabProps) {
  return <TreatmentLogTab customerId={customerId} />;
}
