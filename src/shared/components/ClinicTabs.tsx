"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Tabs } from "antd";
import { useClinics } from "@/features/clinics";
import { useCurrentUser } from "@/shared/providers";

type Props = {
  value?: string | null;
  onChange?: (clinicId: string) => void;
};

export default function ClinicTabs({ value, onChange }: Props) {
  const { user: currentUser } = useCurrentUser();
  const { data: clinics, isLoading, error } = useClinics(true);

  // Filter clinics based on user role
  const filteredClinics = useMemo(() => {
    if (!clinics) return [];

    // Admin: Show all clinics
    if (currentUser?.role === "admin") {
      return clinics;
    }

    // Employee: Show only their clinic
    if (currentUser?.clinicId) {
      return clinics.filter((c) => c.id === currentUser.clinicId);
    }

    return [];
  }, [clinics, currentUser?.role, currentUser?.clinicId]);

  const items = useMemo(
    () =>
      filteredClinics?.map((c) => ({ key: c.id, label: c.shortName })) || [],
    [filteredClinics]
  );

  const [active, setActive] = useState<string | undefined>();

  useEffect(() => {
    if (items.length > 0) {
      setActive(value || items[0]?.key);
    }
  }, [value, items]);

  // Handle error state
  if (error) {
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
