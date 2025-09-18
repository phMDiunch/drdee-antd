Tại máy tính công ty:

Tạo và chuyển sang một nhánh mới:
Hãy đặt tên cho nhánh mới sao cho dễ nhớ, ví dụ: chuc-nang-login-dang-do.

Bash

git checkout -b <tên_nhánh_mới>
Ví dụ: git checkout -b fe-login-progress

Thêm và commit các thay đổi:

Bash

git add .
git commit -m "WIP: Lưu công việc dang dở trên tính năng login"
Đẩy nhánh mới lên remote:

Bash

git push -u origin <tên_nhánh_mới>
Tại máy tính cá nhân:

Kéo nhánh mới về máy của bạn:

Bash

git fetch
git checkout <tên_nhánh_mới>
Tiếp tục công việc:
Bây giờ bạn có thể tiếp tục làm việc trên nhánh mới này.

Sau khi hoàn thành code trên nhánh làm dở tại nhà và muốn nhập vào nhánh chính, bạn sẽ thực hiện một quy trình gồm 3 bước chính: cập nhật nhánh chính, nhập nhánh làm dở, và dọn dẹp.

Sau khi hoàn thành code trên nhánh làm dở tại nhà và muốn nhập vào nhánh chính, bạn sẽ thực hiện một quy trình gồm 3 bước chính: cập nhật nhánh chính, nhập nhánh làm dở, và dọn dẹp.

Dưới đây là các câu lệnh Git chi tiết cho bạn:

Bước 1: Chuyển về nhánh chính và cập nhật (tại máy tính cá nhân)

Trước hết, bạn cần đảm bảo nhánh chính (thường là main hoặc master) trên máy tính của bạn đã được đồng bộ với phiên bản mới nhất trên GitHub.

Bash

# 1.1. Chuyển về nhánh chính

git checkout main

# 1.2. Kéo các thay đổi mới nhất từ GitHub

git pull origin main

Bước 2: Nhập nhánh làm dở vào nhánh chính

# 2a Hợp nhất (merge) nhánh làm dở vào nhánh chính

git merge <ten-nhanh-dang-lam>

# 2b.1 Hoặcgộp tất cả các thay đổi từ nhánh DangLamDo vào nhánh main

git merge --squash DangLamDo

# 2b.2 Tạo một commit duy nhất chứa toàn bộ các thay đổi mà bạn đã gộp ở bước trên.

# Tạo commit mới với một tin nhắn rõ ràng

git commit -m "feat: Hoàn thành tính năng đăng nhập và đăng ký"

Sau khi lệnh này hoàn thành, lịch sử của nhánh main sẽ chỉ có một commit mới duy nhất thay vì cả hai commit từ nhánh DangLamDo.

Sự khác biệt chính:
Số lượng commit:

Với git merge --squash: Tất cả các commit trên nhánh DangLamDo (ví dụ: 2 commit) sẽ được gộp lại thành một commit duy nhất trên nhánh main. Lịch sử của main sẽ gọn gàng hơn.

Với git merge thông thường: Cả hai commit từ nhánh DangLamDo sẽ được nhập vào nhánh main và một merge commit sẽ được tạo ra để ghi lại sự hợp nhất. Tổng cộng, nhánh main sẽ có thêm ba commit mới.

Lịch sử Git:

--squash tạo ra một lịch sử tuyến tính, sạch sẽ hơn, lý tưởng cho việc nhập các tính năng nhỏ hoặc fix bug, tránh làm "rối" lịch sử với nhiều commit vụn vặt.

merge thông thường tạo ra một lịch sử có "nhánh rẽ" (branching history). Điều này hữu ích khi bạn muốn giữ lại toàn bộ lịch sử phát triển của một tính năng lớn, bao gồm từng commit nhỏ trong quá trình làm việc.

Bước 3: Đẩy các thay đổi lên GitHub và xóa nhánh làm dở

Sau khi đã merge thành công, bạn cần đẩy các thay đổi lên GitHub và dọn dẹp bằng cách xóa nhánh làm dở trên cả máy tính của bạn và trên GitHub.

Bash

# 3.1. Đẩy các thay đổi đã merge lên nhánh chính trên GitHub

git push origin main

# 3.2. Xóa nhánh làm dở trên máy tính cục bộ

git branch -d <ten-nhanh-dang-lam>

# 3.3. Xóa nhánh làm dở trên GitHub (remote)

git push origin --delete <ten-nhanh-dang-lam>
