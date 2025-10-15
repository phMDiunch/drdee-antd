// src/server/services/employee.service.ts
import {
  findEmployeeById,
  findEmployeeByIdForProfileCompletion,
  listEmployees,
  listWorkingEmployees,
} from "./employee/getEmployee";
import {
  completeEmployeeProfilePublic,
  createEmployee,
  resendEmployeeInvite,
} from "./employee/createEmployee";
import { setEmployeeStatus, updateEmployee } from "./employee/updateEmployee";
import { removeEmployee } from "./employee/deleteEmployee";

export const employeeService = {
  list: listEmployees,
  listWorking: listWorkingEmployees,
  findById: findEmployeeById,
  findByIdForProfileCompletion: findEmployeeByIdForProfileCompletion,
  create: createEmployee,
  completeProfilePublic: completeEmployeeProfilePublic,
  resendInvite: resendEmployeeInvite,
  update: updateEmployee,
  setStatus: setEmployeeStatus,
  remove: removeEmployee,
};
