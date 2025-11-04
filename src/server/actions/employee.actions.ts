"use server";

import { getSessionUser } from "@/server/utils/sessionCache";
import { employeeService } from "@/server/services/employee.service";
import type {
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
} from "@/shared/validation/employee.schema";

export async function createEmployeeAction(data: CreateEmployeeRequest) {
  const user = await getSessionUser();
  return employeeService.create(user, data);
}

export async function updateEmployeeAction(
  id: string,
  data: UpdateEmployeeRequest
) {
  const user = await getSessionUser();
  return employeeService.update(user, id, data);
}

export async function deleteEmployeeAction(id: string) {
  const user = await getSessionUser();
  return employeeService.remove(user, id);
}

export async function setEmployeeStatusAction(
  id: string,
  status: "WORKING" | "RESIGNED"
) {
  const user = await getSessionUser();
  return employeeService.setStatus(user, id, status);
}

export async function resendEmployeeInviteAction(id: string) {
  const user = await getSessionUser();
  return employeeService.resendInvite(user, id);
}
