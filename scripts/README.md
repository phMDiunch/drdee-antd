# Scripts

Thư mục này chứa các utility scripts để quản lý dữ liệu trong hệ thống.

## 📁 Cấu trúc

### 1. `import-csv/` - Import dữ liệu từ CSV

Chứa script để import/update dữ liệu Dental Services từ file CSV.

**Files:**

- `import-dental-services-from-csv.ts` - Script chính
- `dental-services-example.csv` - File mẫu
- `README.md` - Hướng dẫn chi tiết

**Sử dụng:**

```bash
npx tsx scripts/import-csv/import-dental-services-from-csv.ts
```

[Xem hướng dẫn đầy đủ →](./import-csv/README.md)

---

### 2. `migrate-service/` - Chuyển đổi dịch vụ

Chứa script để chuyển đổi tất cả liên kết từ dịch vụ A sang dịch vụ B.

**Files:**

- `migrate-dental-service.ts` - Script chính
- `README.md` - Hướng dẫn chi tiết

**Sử dụng:**

```bash
# Cơ bản
npx tsx scripts/migrate-service/migrate-dental-service.ts <serviceA_id> <serviceB_id>

# Full migration
npx tsx scripts/migrate-service/migrate-dental-service.ts <serviceA_id> <serviceB_id> --update-denormalized --delete-old
```

[Xem hướng dẫn đầy đủ →](./migrate-service/README.md)

---

## 🛠️ Requirements

Cả 2 script đều cần:

- Node.js 18+
- TypeScript (tsx)
- Prisma Client
- csv-parse (chỉ cho import-csv)

```bash
npm install csv-parse
```

## ⚠️ Lưu ý chung

1. **Backup trước khi chạy**: Luôn backup database trước khi chạy bất kỳ script nào
2. **Test trên dev environment**: Chạy thử trên môi trường dev trước
3. **Kiểm tra kết quả**: Xác minh dữ liệu sau khi chạy script
4. **Production**: Cẩn thận khi chạy trên production, nên chạy vào thời gian ít traffic

## 📞 Support

Nếu gặp vấn đề, xem hướng dẫn chi tiết trong mỗi thư mục hoặc liên hệ team.
