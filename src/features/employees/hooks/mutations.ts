// src/features/employees/hooks/mutations.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { useCurrentUser } from "@/shared/providers";
import {
  createEmployeeAction,
  updateEmployeeAction,
  deleteEmployeeAction,
  setEmployeeStatusAction,
  resendEmployeeInviteAction,
} from "@/server/actions/employee.actions";
import { completeProfilePublicApi } from "../api";
import { EMPLOYEE_MESSAGES, EMPLOYEE_QUERY_KEYS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type {
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  CompleteProfileRequest,
} from "@/shared/validation/employee.schema";

/**
 * Create new employee
 * Invalidates: employees list
 */
export function useCreateEmployee() {
  const notify = useNotify();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEmployeeRequest) => createEmployeeAction(data),
    onSuccess: () => {
      notify.success(EMPLOYEE_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (error: unknown) => {
      notify.error(error, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR });
    },
  });
}

/**
 * Update existing employee
 * Invalidates: employee detail + employees list
 * Special: Force reload if editing self to refresh session
 */
export function useUpdateEmployee() {
  const notify = useNotify();
  const qc = useQueryClient();
  const { user: currentUser } = useCurrentUser();

  return useMutation({
    mutationFn: (data: UpdateEmployeeRequest) =>
      updateEmployeeAction(data.id, data),
    onSuccess: (_data, variables) => {
      notify.success(EMPLOYEE_MESSAGES.UPDATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({
        queryKey: EMPLOYEE_QUERY_KEYS.byId(variables.id),
      });

      // ✅ Force reload if editing self to refresh session
      if (currentUser?.employeeId === variables.id) {
        // Use hard reload to ensure session refresh
        setTimeout(() => {
          window.location.reload();
        }, 500); // Small delay to show success message
      }
    },
    onError: (error: unknown) => {
      notify.error(error, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR });
    },
  });
}

/**
 * Delete employee permanently
 * Invalidates: employees list
 */
export function useDeleteEmployee() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (id: string) => deleteEmployeeAction(id),
    onSuccess: () => {
      notify.success(EMPLOYEE_MESSAGES.DELETE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Set employee status (WORKING | RESIGNED)
 * Invalidates: employee detail + employees list
 */
export function useSetEmployeeStatus() {
  const notify = useNotify();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "WORKING" | "RESIGNED";
    }) => setEmployeeStatusAction(id, status),
    onSuccess: (_data, variables) => {
      notify.success(EMPLOYEE_MESSAGES.SET_STATUS_SUCCESS);
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({
        queryKey: EMPLOYEE_QUERY_KEYS.byId(variables.id),
      });
    },
    onError: (error: unknown) => {
      notify.error(error, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR });
    },
  });
}

/**
 * Resend employee invite email
 * No invalidation needed
 */
export function useResendEmployeeInvite() {
  const notify = useNotify();

  return useMutation({
    mutationFn: (id: string) => resendEmployeeInviteAction(id),
    onSuccess: () => {
      notify.success(EMPLOYEE_MESSAGES.INVITE_SUCCESS);
    },
    onError: (error: unknown) => {
      notify.error(error, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR });
    },
  });
}

/**
 * Complete employee profile (public route)
 * Invalidates: employee profile completion data + employees list
 */
export function useCompleteProfilePublic() {
  const notify = useNotify();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CompleteProfileRequest) =>
      completeProfilePublicApi(payload),
    onSuccess: (data) => {
      notify.success(EMPLOYEE_MESSAGES.COMPLETE_PROFILE_SUCCESS);
      qc.invalidateQueries({
        queryKey: [...EMPLOYEE_QUERY_KEYS.byId(data.id), "profile-completion"],
      });
      qc.invalidateQueries({
        queryKey: EMPLOYEE_QUERY_KEYS.list(undefined),
      });
    },
    onError: (error: unknown) => {
      notify.error(error, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR });
    },
  });
}
