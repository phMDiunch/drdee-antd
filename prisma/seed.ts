// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Seed Clinics
  console.log("Creating clinics...");

  const clinicsData = [
    {
      clinicCode: "450 MK",
      name: "Nha Khoa DR DEE - 450 Minh Khai",
      address: "450 Minh Khai, Hai Bà Trưng, Hà Nội",
      phone: "0335.450.450",
      colorCode: "#0072BC", // xanh đậm
    },
    {
      clinicCode: "143 TĐT",
      name: "Nha Khoa DR DEE - 143 Tôn Đức Thắng",
      address: "143 Tôn Đức Thắng, Đống Đa, Hà Nội",
      phone: "0343.143.143",
      colorCode: "#28B463", // xanh lá
    },
    {
      clinicCode: "153 ĐN",
      name: "Nha Khoa DR DEE - 153 Đà Nẵng",
      address: "153 Đà Nẵng, Ngô Quyền, Hải Phòng",
      phone: "0332.153.153",
      colorCode: "#D68910", // cam vàng
    },
  ];

  // Create clinics
  for (const clinicData of clinicsData) {
    const clinic = await prisma.clinic.upsert({
      where: { name: clinicData.name },
      update: {},
      create: clinicData,
    });
    console.log(`✅ Created/Updated clinic: ${clinic.name}`);
  }

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
