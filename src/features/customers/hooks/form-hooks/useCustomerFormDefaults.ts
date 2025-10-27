import type {
  CustomerDetailResponse,
  CreateCustomerFormData,
} from "@/shared/validation/customer.schema";

/**
 * Custom hook that generates default form values for Customer form
 * Handles both create and edit modes
 * @param mode - "create" or "edit"
 * @param defaultClinicId - Clinic ID to use as default in create mode
 * @param initialData - Customer data to populate in edit mode
 * @returns Default form values properly formatted for react-hook-form
 */
export function useCustomerFormDefaults(
  mode: "create" | "edit",
  defaultClinicId: string,
  initialData?: CustomerDetailResponse
): CreateCustomerFormData {
  if (mode === "edit" && initialData) {
    // Convert initialData to form format for edit mode
    return {
      fullName: initialData.fullName,
      dob: initialData.dob || "",
      gender: initialData.gender || "",
      phone: initialData.phone,
      email: initialData.email,
      address: initialData.address || "",
      city: initialData.city || "",
      district: initialData.district || "",
      primaryContactRole: initialData.primaryContactRole,
      primaryContactId: initialData.primaryContactId,
      occupation: initialData.occupation,
      source: initialData.source || "",
      sourceNotes: initialData.sourceNotes,
      serviceOfInterest: initialData.serviceOfInterest || "",
      clinicId: initialData.clinicId || "",
    };
  }

  // Default values for create mode
  return {
    fullName: "",
    dob: "",
    gender: "",
    phone: null,
    email: null,
    address: "",
    city: "",
    district: "",
    primaryContactRole: null,
    primaryContactId: null,
    occupation: null,
    source: "",
    sourceNotes: null,
    serviceOfInterest: "",
    clinicId: defaultClinicId || "",
  };
}
