import { employeeRepo } from "@/server/repos/employee.repo";
import { ERR } from "@/server/services/errors";
import type { UserCore } from "@/shared/types/user";
import { mapEmployeeToResponse } from "./_mappers";
import { ensureSelfOrAdmin } from "./_guards";

/**
 * GET /employees
 */
export async function listEmployees(
  currentUser: UserCore | null,
  query: { search?: string }
) {
  if (!currentUser) throw ERR.UNAUTHORIZED();

  const search = query.search?.trim() || undefined;

  const employees = await employeeRepo.list({
    search,
  });

  return employees.map(mapEmployeeToResponse);
}

/**
 * GET /employees/working
 */
export async function listWorkingEmployees(currentUser: UserCore | null) {
  if (!currentUser) throw ERR.UNAUTHORIZED();
  const employees = await employeeRepo.listWorking();
  return employees;
}

/**
 * GET /employees/:id
 */
export async function findEmployeeById(
  currentUser: UserCore | null,
  id: string
) {
  const employee = await employeeRepo.findById(id);
  if (!employee) throw ERR.NOT_FOUND("Employee not found.");
  ensureSelfOrAdmin(currentUser, employee.id);
  return mapEmployeeToResponse(employee);
}

/**
 * GET /public/employees/:id - For profile completion (no auth required)
 */
export async function findEmployeeByIdForProfileCompletion(id: string) {
  const employee = await employeeRepo.findById(id);
  if (!employee) throw ERR.NOT_FOUND("Employee not found.");

  // Only allow access if employee status is PENDING (needs to complete profile)
  if (employee.employeeStatus !== "PENDING") {
    throw ERR.FORBIDDEN("Employee profile completion is not allowed.");
  }

  return mapEmployeeToResponse(employee);
}
