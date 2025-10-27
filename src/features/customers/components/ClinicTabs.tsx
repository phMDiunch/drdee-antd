"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Tabs } from "antd";
import { useClinics } from "@/features/clinics/hooks";

type Props = {
  value?: string | null;
  onChange?: (clinicId: string) => void;
};

export default function ClinicTabs({ value, onChange }: Props) {
  const { data: clinics, isLoading, error } = useClinics(true);
  const items = useMemo(
    () => clinics?.map((c) => ({ key: c.id, label: c.clinicCode })) || [],
    [clinics]
  );

  const [active, setActive] = useState<string | undefined>();

  useEffect(() => {
    if (items.length > 0) {
      setActive(value || items[0]?.key);
    }
  }, [value, items]);

  // Handle error state
  if (error) {
    console.error("Error loading clinics:", error);
    return null;
  }

  // Don't render if loading or less than 2 clinics
  if (isLoading || items.length <= 1) return null;

  return (
    <div style={{ marginBottom: 12 }}>
      <Tabs
        activeKey={active}
        onChange={(k) => {
          setActive(k);
          onChange?.(k);
        }}
        items={items}
      />
    </div>
  );
}
