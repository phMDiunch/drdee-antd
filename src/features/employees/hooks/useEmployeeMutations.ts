// src/features/employees/hooks/useEmployeeMutations.ts
"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { createEmployeeApi, updateEmployeeApi, setEmployeeStatusApi, resendEmployeeInviteApi } from "../api";
import { type CreateEmployeeRequest, type UpdateEmployeeRequest } from "@/shared/validation/employee.schema";
import { EMPLOYEE_MESSAGES, EMPLOYEE_QUERY_KEYS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { deleteEmployeeApi } from "../api/deleteEmployee";

export function useCreateEmployee() {
  const notify = useNotify();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEmployeeRequest) => createEmployeeApi(payload),
    onSuccess: () => {
      notify.success(EMPLOYEE_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (error: unknown) => {
      notify.error(error, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR });
    },
  });
}

export function useUpdateEmployee() {
  const notify = useNotify();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateEmployeeRequest) => updateEmployeeApi(payload),
    onSuccess: (_data, variables) => {
      notify.success(EMPLOYEE_MESSAGES.UPDATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({ queryKey: EMPLOYEE_QUERY_KEYS.byId(variables.id) });
    },
    onError: (error: unknown) => {
      notify.error(error, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR });
    },
  });
}

export function useSetEmployeeStatus() {
  const notify = useNotify();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "WORKING" | "RESIGNED" }) => setEmployeeStatusApi(id, status),
    onSuccess: (_data, variables) => {
      notify.success(EMPLOYEE_MESSAGES.SET_STATUS_SUCCESS);
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({ queryKey: EMPLOYEE_QUERY_KEYS.byId(variables.id) });
    },
    onError: (error: unknown) => {
      notify.error(error, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR });
    },
  });
}

export function useResendEmployeeInvite() {
  const notify = useNotify();

  return useMutation({
    mutationFn: (id: string) => resendEmployeeInviteApi(id),
    onSuccess: () => {
      notify.success(EMPLOYEE_MESSAGES.INVITE_SUCCESS);
    },
    onError: (error: unknown) => {
      notify.error(error, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR });
    },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (id: string) => deleteEmployeeApi(id),
    onSuccess: () => {
      notify.success(EMPLOYEE_MESSAGES.DELETE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (e: unknown) => notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
