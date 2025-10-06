# Git Commands - Quy trình làm việc

## 🌿 Tạo và làm việc trên nhánh mới

### Tại máy công ty:

```bash
# Tạo và chuyển sang nhánh mới
git checkout -b <tên_nhánh>

# Lưu công việc dang dở
git add .
git commit -m "WIP: Mô tả công việc đang làm"

# Đẩy nhánh lên GitHub
git push -u origin <tên_nhánh>
```

### Tại máy cá nhân:

```bash
# Kéo nhánh về và chuyển sang
git fetch
git checkout <tên_nhánh>

# Tiếp tục làm việc...
```

## 🔄 Hợp nhất nhánh vào main

### Bước 1: Cập nhật nhánh main

```bash
git checkout main
git pull origin main
```

### Bước 2: Hợp nhất nhánh

**Cách A - Merge thông thường (giữ lịch sử commit):**

```bash
git merge <tên_nhánh>
```

**Cách B - Squash merge (gộp thành 1 commit):**

```bash
git merge --squash <tên_nhánh>
git commit -m "feat: Mô tả tính năng hoàn thành"
```

> **Khuyến nghị:** Dùng `--squash` cho tính năng nhỏ, dùng merge thông thường cho tính năng lớn.

### Bước 3: Đẩy lên GitHub và dọn dẹp

```bash
# Đẩy thay đổi lên main
git push origin main

# Xóa nhánh cục bộ
git branch -d <tên_nhánh>

# Xóa nhánh trên GitHub
# Xóa nhánh trên GitHub
git push origin --delete <tên_nhánh>
```

## 📋 Lệnh Git hữu ích khác

### Kiểm tra trạng thái

```bash
git status                    # Xem file đã thay đổi
git log --oneline -10        # Xem 10 commit gần nhất
git branch -a                # Xem tất cả nhánh
```

### Commit và undo

```bash
git add .                    # Thêm tất cả file
git commit -m "message"      # Commit với message
git commit -F file.txt       # Commit với message từ file

git reset --soft HEAD~1      # Undo commit gần nhất (giữ thay đổi)
git reset --hard HEAD~1      # Undo commit gần nhất (mất thay đổi)
```

### Sync với remote

```bash
git fetch                    # Kéo thông tin từ remote
git pull origin main         # Kéo và merge từ main
git push origin main         # Đẩy lên main
```

---
