/**
 * Script: Chuyển đổi Dental Service A sang B
 *
 * Cách sử dụng:
 * npx tsx scripts/migrate-service/migrate-dental-service.ts <serviceA_id> <serviceB_id> [--update-denormalized] [--delete-old]
 *
 * Các options:
 * - --update-denormalized: Cập nhật cả tên, đơn vị, giá trong ConsultedService
 * - --delete-old: Xoá dịch vụ A sau khi chuyển đổi xong
 *
 * Ví dụ:
 * npx tsx scripts/migrate-service/migrate-dental-service.ts abc-123 def-456 --update-denormalized --delete-old
 *
 * Lưu ý:
 * - Script sẽ chuyển tất cả ConsultedService từ dịch vụ A sang dịch vụ B
 * - Nếu dùng --update-denormalized, dữ liệu lịch sử (tên, giá) sẽ bị ghi đè
 * - Nếu không dùng --update-denormalized, chỉ cập nhật dentalServiceId
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface MigrationOptions {
  serviceAId: string;
  serviceBId: string;
  updateDenormalized: boolean;
  deleteOld: boolean;
}

async function parseArgs(): Promise<MigrationOptions> {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("❌ Thiếu tham số!");
    console.error("");
    console.error("Cách dùng:");
    console.error(
      "  npx tsx scripts/migrate-service/migrate-dental-service.ts <serviceA_id> <serviceB_id> [options]"
    );
    console.error("");
    console.error("Options:");
    console.error(
      "  --update-denormalized  Cập nhật tên, đơn vị, giá trong ConsultedService"
    );
    console.error("  --delete-old           Xoá dịch vụ A sau khi chuyển đổi");
    console.error("");
    console.error("Ví dụ:");
    console.error(
      "  npx tsx scripts/migrate-service/migrate-dental-service.ts abc-123 def-456"
    );
    console.error(
      "  npx tsx scripts/migrate-service/migrate-dental-service.ts abc-123 def-456 --update-denormalized"
    );
    console.error(
      "  npx tsx scripts/migrate-service/migrate-dental-service.ts abc-123 def-456 --update-denormalized --delete-old"
    );
    process.exit(1);
  }

  return {
    serviceAId: args[0],
    serviceBId: args[1],
    updateDenormalized: args.includes("--update-denormalized"),
    deleteOld: args.includes("--delete-old"),
  };
}

async function main() {
  const options = await parseArgs();
  const { serviceAId, serviceBId, updateDenormalized, deleteOld } = options;

  console.log("🔍 Bắt đầu quá trình chuyển đổi dịch vụ...\n");
  console.log(`   Dịch vụ A (cũ): ${serviceAId}`);
  console.log(`   Dịch vụ B (mới): ${serviceBId}`);
  console.log(
    `   Update dữ liệu denormalized: ${updateDenormalized ? "CÓ" : "KHÔNG"}`
  );
  console.log(`   Xoá dịch vụ cũ: ${deleteOld ? "CÓ" : "KHÔNG"}\n`);

  // Step 1: Kiểm tra dịch vụ A có tồn tại không
  console.log("📋 Step 1: Kiểm tra dịch vụ A...");
  const serviceA = await prisma.dentalService.findUnique({
    where: { id: serviceAId },
    select: { id: true, name: true, unit: true, price: true },
  });

  if (!serviceA) {
    console.error(`❌ Không tìm thấy dịch vụ A với id: ${serviceAId}`);
    process.exit(1);
  }
  console.log(`   ✅ Tìm thấy dịch vụ A: "${serviceA.name}"`);
  console.log(`      - Đơn vị: ${serviceA.unit}`);
  console.log(`      - Giá: ${serviceA.price.toLocaleString("vi-VN")} VNĐ\n`);

  // Step 2: Kiểm tra dịch vụ B có tồn tại không
  console.log("📋 Step 2: Kiểm tra dịch vụ B...");
  const serviceB = await prisma.dentalService.findUnique({
    where: { id: serviceBId },
    select: { id: true, name: true, unit: true, price: true },
  });

  if (!serviceB) {
    console.error(`❌ Không tìm thấy dịch vụ B với id: ${serviceBId}`);
    process.exit(1);
  }
  console.log(`   ✅ Tìm thấy dịch vụ B: "${serviceB.name}"`);
  console.log(`      - Đơn vị: ${serviceB.unit}`);
  console.log(`      - Giá: ${serviceB.price.toLocaleString("vi-VN")} VNĐ\n`);

  // Step 3: Đếm số lượng ConsultedService sử dụng dịch vụ A
  console.log("📋 Step 3: Đếm số lượng ConsultedService liên quan...");
  const countConsultedServices = await prisma.consultedService.count({
    where: { dentalServiceId: serviceAId },
  });
  console.log(
    `   📊 Có ${countConsultedServices} ConsultedService đang sử dụng dịch vụ A\n`
  );

  if (countConsultedServices === 0) {
    console.log("✅ Không có ConsultedService nào sử dụng dịch vụ A.");

    if (deleteOld) {
      console.log("\n📋 Xoá dịch vụ A...");
      await prisma.dentalService.delete({ where: { id: serviceAId } });
      console.log("   ✅ Đã xoá dịch vụ A thành công!");
    }

    console.log("\n✨ Hoàn tất!");
    return;
  }

  // Step 4: Xác nhận trước khi thực hiện
  console.log("⚠️  Xác nhận:");
  console.log(
    `   - Sẽ chuyển ${countConsultedServices} ConsultedService từ "${serviceA.name}" sang "${serviceB.name}"`
  );
  if (updateDenormalized) {
    console.log(
      `   - Sẽ cập nhật tên, đơn vị, giá trong ConsultedService theo dịch vụ B`
    );
    console.log(`     (Dữ liệu lịch sử sẽ BỊ GHI ĐÈ!)`);
  }
  if (deleteOld) {
    console.log(`   - Sẽ xoá dịch vụ A sau khi hoàn tất`);
  }
  console.log("\n   ⏳ Tiếp tục sau 3 giây...\n");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Step 5: Update ConsultedService
  console.log("📋 Step 4: Cập nhật ConsultedService...");

  if (updateDenormalized) {
    // Update cả dentalServiceId và dữ liệu denormalized
    const result = await prisma.consultedService.updateMany({
      where: { dentalServiceId: serviceAId },
      data: {
        dentalServiceId: serviceBId,
        consultedServiceName: serviceB.name,
        consultedServiceUnit: serviceB.unit,
        price: serviceB.price,
      },
    });
    console.log(
      `   ✅ Đã cập nhật ${result.count} ConsultedService (bao gồm dữ liệu denormalized)\n`
    );
  } else {
    // Chỉ update dentalServiceId, giữ nguyên dữ liệu denormalized
    const result = await prisma.consultedService.updateMany({
      where: { dentalServiceId: serviceAId },
      data: {
        dentalServiceId: serviceBId,
      },
    });
    console.log(
      `   ✅ Đã cập nhật ${result.count} ConsultedService (chỉ dentalServiceId, giữ nguyên lịch sử)\n`
    );
  }

  // Step 6: Xoá dịch vụ A (nếu được yêu cầu)
  if (deleteOld) {
    console.log("📋 Step 5: Xoá dịch vụ A...");

    // Kiểm tra lại xem còn record nào sử dụng dịch vụ A không
    const stillLinked = await prisma.consultedService.count({
      where: { dentalServiceId: serviceAId },
    });

    if (stillLinked > 0) {
      console.error(
        `   ❌ Vẫn còn ${stillLinked} ConsultedService liên kết với dịch vụ A!`
      );
      console.error(`      Không thể xoá dịch vụ A.`);
    } else {
      await prisma.dentalService.delete({
        where: { id: serviceAId },
      });
      console.log(`   ✅ Đã xoá dịch vụ A: "${serviceA.name}"\n`);
    }
  }

  // Summary
  console.log("═══════════════════════════════════════════════════");
  console.log("✨ Hoàn tất quá trình chuyển đổi!");
  console.log("═══════════════════════════════════════════════════");
  console.log(`📊 Tổng kết:`);
  console.log(`   - ConsultedService đã chuyển đổi: ${countConsultedServices}`);
  console.log(
    `   - Dịch vụ cũ (A): "${serviceA.name}" ${
      deleteOld ? "[ĐÃ XOÁ]" : "[VẪN TỒN TẠI]"
    }`
  );
  console.log(`   - Dịch vụ mới (B): "${serviceB.name}"`);
  if (updateDenormalized) {
    console.log(`   - Dữ liệu denormalized: ĐÃ CẬP NHẬT`);
  } else {
    console.log(`   - Dữ liệu denormalized: GIỮ NGUYÊN`);
  }
  console.log("═══════════════════════════════════════════════════\n");
}

main()
  .catch((error) => {
    console.error("\n💥 Lỗi nghiêm trọng:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
