import React from "react";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/server/services/auth.service";
import { employeeService } from "@/server/services/employee.service";
import EmployeeEditView from "@/features/employees/views/EmployeeEditView";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EmployeeEditPage({ params }: Props) {
  const { id } = await params;
  const currentUser = await getSessionUser();
  if (!currentUser || currentUser.role?.toLowerCase() !== "admin") {
    redirect("/employees");
  }

  const employee = await employeeService.findById(currentUser, id).catch(() => null);

  if (!employee) {
    notFound();
  }

  return <EmployeeEditView employee={employee} />;
}
