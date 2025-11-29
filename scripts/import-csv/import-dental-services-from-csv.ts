/**
 * Script: Import và Update Dental Services từ CSV
 *
 * Cách sử dụng:
 * 1. Export dữ liệu từ Supabase ra file CSV
 * 2. Chỉnh sửa dữ liệu trong file CSV (giữ nguyên cột id)
 * 3. Đặt file CSV vào thư mục scripts/import-csv/ với tên dental-services.csv
 * 4. Chạy: npx tsx scripts/import-csv/import-dental-services-from-csv.ts
 *
 * Lưu ý:
 * - Script sẽ UPDATE các record dựa trên id
 * - Các trường khác sẽ được update theo dữ liệu mới từ CSV
 * - createdAt, createdById sẽ KHÔNG bị thay đổi
 * - updatedAt sẽ tự động cập nhật
 */

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Tên file CSV (đặt trong thư mục scripts/)
const CSV_FILE = "dental-services.csv";

interface CsvRow {
  id: string;
  name: string;
  description?: string;
  serviceGroup?: string;
  department?: string;
  tags?: string;
  unit: string;
  price: string;
  minPrice?: string;
  officialWarranty?: string;
  clinicWarranty?: string;
  origin?: string;
  avgTreatmentMinutes?: string;
  avgTreatmentSessions?: string;
  updatedById: string; // ID của admin/employee thực hiện import
}

async function main() {
  const csvPath = path.join(__dirname, CSV_FILE);

  // Kiểm tra file tồn tại
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Không tìm thấy file: ${csvPath}`);
    console.error(
      `📝 Vui lòng đặt file CSV vào: scripts/import-csv/${CSV_FILE}`
    );
    process.exit(1);
  }

  console.log(`📂 Đọc file: ${csvPath}`);
  const fileContent = fs.readFileSync(csvPath, "utf-8");

  // Parse CSV
  const records: CsvRow[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`📊 Tìm thấy ${records.length} dịch vụ trong file CSV\n`);

  // Xử lý từng record
  let successCount = 0;
  let errorCount = 0;

  for (const [index, row] of records.entries()) {
    try {
      const { id, name, updatedById } = row;

      // Validate required fields
      if (!id || !name || !updatedById) {
        console.error(
          `⚠️  Row ${index + 1}: Thiếu id, name hoặc updatedById - Bỏ qua`
        );
        errorCount++;
        continue;
      }

      // Kiểm tra service có tồn tại không
      const existing = await prisma.dentalService.findUnique({
        where: { id },
        select: { id: true, name: true },
      });

      if (!existing) {
        console.error(
          `❌ Row ${index + 1}: Không tìm thấy dịch vụ với id=${id} - Bỏ qua`
        );
        errorCount++;
        continue;
      }

      // Parse tags (nếu có) - giả sử format: "tag1,tag2,tag3" hoặc JSON array
      let tags: string[] = [];
      if (row.tags) {
        try {
          // Thử parse JSON array trước
          tags = JSON.parse(row.tags);
        } catch {
          // Nếu không phải JSON, split bằng dấu phấy
          tags = row.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        }
      }

      // Prepare update data
      const updateData = {
        name: name.trim(),
        description: row.description?.trim() || null,
        serviceGroup: row.serviceGroup?.trim() || null,
        department: row.department?.trim() || null,
        tags,
        unit: row.unit.trim(),
        price: parseInt(row.price, 10),
        minPrice: row.minPrice ? parseInt(row.minPrice, 10) : null,
        officialWarranty: row.officialWarranty?.trim() || null,
        clinicWarranty: row.clinicWarranty?.trim() || null,
        origin: row.origin?.trim() || null,
        avgTreatmentMinutes: row.avgTreatmentMinutes
          ? parseInt(row.avgTreatmentMinutes, 10)
          : null,
        avgTreatmentSessions: row.avgTreatmentSessions
          ? parseInt(row.avgTreatmentSessions, 10)
          : null,
        updatedById: updatedById.trim(),
        // updatedAt sẽ tự động cập nhật bởi Prisma
      };

      // Update service
      await prisma.dentalService.update({
        where: { id },
        data: updateData,
      });

      console.log(`✅ Row ${index + 1}: Updated "${name}" (id: ${id})`);
      successCount++;
    } catch (error) {
      console.error(`❌ Row ${index + 1}: Lỗi khi update:`, error);
      errorCount++;
    }
  }

  console.log("\n📈 Kết quả:");
  console.log(`   ✅ Thành công: ${successCount}`);
  console.log(`   ❌ Lỗi: ${errorCount}`);
  console.log(`   📊 Tổng: ${records.length}`);
}

main()
  .catch((error) => {
    console.error("💥 Lỗi nghiêm trọng:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
