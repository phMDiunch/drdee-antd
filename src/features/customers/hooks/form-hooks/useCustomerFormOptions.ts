import { useMemo, useState } from "react";
import type {
  CustomerDetailResponse,
  SearchItem,
} from "@/shared/validation/customer.schema";
import { useClinics } from "@/features/clinics/hooks";
import { useWorkingEmployees } from "@/features/employees/hooks";
import { useCustomersSearch } from "../useCustomerSearch";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import provinces from "@/data/vietnamAdministrativeUnits.json";

type Province = {
  name: string;
  districts: { name: string }[];
};

interface UseCustomerFormOptionsParams {
  mode: "create" | "edit";
  initialData?: CustomerDetailResponse;
  actualPhoneDup: SearchItem | null;
}

/**
 * Custom hook that manages all dropdown options for the Customer form
 * Consolidates logic for:
 * - Primary contact options (with merge logic)
 * - Employee options (with merge logic)
 * - Customer source options (with merge logic)
 * - Clinic options
 * - District options (based on selected city)
 */
export function useCustomerFormOptions({
  mode,
  initialData,
  actualPhoneDup,
}: UseCustomerFormOptionsParams) {
  // Store selected phoneDup to keep it in options after phone is cleared
  const [selectedPhoneDup, setSelectedPhoneDup] =
    useState<typeof actualPhoneDup>(null);

  // Search states + debounced values for primary contact
  const [pcQuery, setPcQuery] = useState("");
  const pcDebouncedQuery = useDebouncedValue(pcQuery, 500);

  // Search states + debounced values for customer source
  const [custQuery, setCustQuery] = useState("");
  const custDebouncedQuery = useDebouncedValue(custQuery, 500);

  // Fetch data for primary contact search
  const { data: pcItems, isFetching: pcFetching } = useCustomersSearch({
    q: pcDebouncedQuery.length >= 2 ? pcDebouncedQuery : "",
    limit: 10,
    requirePhone: true,
  });

  // Merge phoneDup (or selectedPhoneDup) into primary contact options if exists
  // Also merge initialData.primaryContact in edit mode
  const primaryContactOptions = useMemo(() => {
    const items = pcItems ?? [];
    const dupToAdd = actualPhoneDup || selectedPhoneDup;

    // If actualPhoneDup/selectedPhoneDup exists and not already in list, add it to the top
    if (dupToAdd && !items.some((i) => i.id === dupToAdd.id)) {
      items.unshift(dupToAdd);
    }

    // If editing and has primaryContact, ensure it's in options
    if (
      mode === "edit" &&
      initialData?.primaryContact &&
      !items.some((i) => i.id === initialData.primaryContact!.id)
    ) {
      items.unshift({
        id: initialData.primaryContact.id,
        customerCode: "", // primaryContact doesn't have customerCode in response
        fullName: initialData.primaryContact.fullName,
        phone: initialData.primaryContact.phone,
      });
    }

    return items;
  }, [pcItems, actualPhoneDup, selectedPhoneDup, mode, initialData]);

  // Load all working employees for client-side filtering
  const { data: workingEmployees } = useWorkingEmployees();

  // Employee options for client-side filtering
  // Merge initial sourceEmployee if in edit mode
  const employeeOptions = useMemo(() => {
    const options = (workingEmployees ?? []).map((emp) => ({
      label: emp.fullName,
      value: emp.id,
    }));

    // If editing and has sourceEmployee, ensure it's in options
    if (
      mode === "edit" &&
      initialData?.sourceEmployee &&
      !options.some((opt) => opt.value === initialData.sourceEmployee!.id)
    ) {
      options.unshift({
        label: initialData.sourceEmployee.fullName,
        value: initialData.sourceEmployee.id,
      });
    }

    return options;
  }, [workingEmployees, mode, initialData]);

  // Customer search for source notes (global search, no requirePhone)
  const { data: custItems, isFetching: custFetching } = useCustomersSearch({
    q: custDebouncedQuery.length >= 2 ? custDebouncedQuery : "",
    limit: 10,
    requirePhone: false,
  });

  // Customer source options - merge initial sourceCustomer if in edit mode
  const customerSourceOptions = useMemo(() => {
    const options = (custItems ?? []).map((i) => ({
      label: `${i.fullName} — ${i.phone ?? "—"}`,
      value: i.id,
    }));

    // If editing and has sourceCustomer, ensure it's in options
    if (
      mode === "edit" &&
      initialData?.sourceCustomer &&
      !options.some((opt) => opt.value === initialData.sourceCustomer!.id)
    ) {
      options.unshift({
        label: `${initialData.sourceCustomer.fullName} — ${
          initialData.sourceCustomer.phone ?? "—"
        }`,
        value: initialData.sourceCustomer.id,
      });
    }

    return options;
  }, [custItems, mode, initialData]);

  // Clinics for select
  const { data: clinics } = useClinics(false);
  const clinicOptions = useMemo(
    () => (clinics ?? []).map((c) => ({ label: c.clinicCode, value: c.id })),
    [clinics]
  );

  // District options generator (will be used with watchedCity)
  const getDistrictOptions = (citySelected: string) => {
    const p = (provinces as Province[]).find((x) => x.name === citySelected);
    const ds = p?.districts ?? [];
    return ds.map((d) => ({ label: d.name, value: d.name }));
  };

  return {
    // Options
    primaryContactOptions,
    employeeOptions,
    customerSourceOptions,
    clinicOptions,
    getDistrictOptions,

    // Search state setters for controlled inputs
    pcQuery,
    setPcQuery,
    custQuery,
    setCustQuery,

    // Loading states
    pcFetching,
    custFetching,

    // Selected duplicate management
    selectedPhoneDup,
    setSelectedPhoneDup,
  };
}
