"use server";

import { getSessionUser } from "@/server/utils/sessionCache";
import { supplierService } from "@/server/services/supplier.service";
import type {
  CreateSupplierRequest,
  UpdateSupplierRequest,
} from "@/shared/validation/supplier.schema";

/**
 * Server Action: Create new supplier
 * Usage: const result = await createSupplierAction(data);
 */
export async function createSupplierAction(data: CreateSupplierRequest) {
  const user = await getSessionUser();
  return await supplierService.create(user, data);
}

/**
 * Server Action: Update existing supplier
 * Usage: const result = await updateSupplierAction(id, data);
 */
export async function updateSupplierAction(
  supplierId: string,
  data: UpdateSupplierRequest
) {
  const user = await getSessionUser();
  return await supplierService.update(user, { ...data, id: supplierId });
}

/**
 * Server Action: Delete supplier (hard delete - permanently remove)
 * Usage: await deleteSupplierAction(id);
 */
export async function deleteSupplierAction(supplierId: string) {
  const user = await getSessionUser();
  return await supplierService.remove(user, supplierId);
}

/**
 * Server Action: Archive supplier (soft delete)
 * Usage: await archiveSupplierAction(id);
 */
export async function archiveSupplierAction(supplierId: string) {
  const user = await getSessionUser();
  return await supplierService.archive(user, supplierId);
}

/**
 * Server Action: Unarchive supplier (restore)
 * Usage: await unarchiveSupplierAction(id);
 */
export async function unarchiveSupplierAction(supplierId: string) {
  const user = await getSessionUser();
  return await supplierService.unarchive(user, supplierId);
}
